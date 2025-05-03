from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import List, Dict, Optional, Any
import logging
import torch
import tempfile
import os
import io
import magic
from pydub import AudioSegment
from dotenv import load_dotenv
from transformers import pipeline, AutoProcessor, AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig, AutoModel, AutoModelForSpeechSeq2Seq

import soundfile as sf
import librosa
import numpy as np
import asyncio
import base64
import json
import requests
import time
import random
import uuid
from transformers import WhisperProcessor, WhisperForConditionalGeneration
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, BaseMessage
from langgraph.graph.message import add_messages
from langchain_groq import ChatGroq

from ..database import DBManager

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Load environment variables (for API keys)
load_dotenv() # Searches for .env file in current dir or parent dirs

# Get Sarvam API key
SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")
if not SARVAM_API_KEY:
    logger.error("SARVAM_API_KEY not found in environment variables. API functionality will not work.")

# Determine device for pipelines
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
TORCH_DTYPE = torch.bfloat16 if DEVICE == "cuda" and torch.cuda.is_available() and hasattr(torch, 'bfloat16') else torch.float16 # Use bfloat16 if available on CUDA
DEFAULT_SAMPLING_RATE = 16000 # From Shuka example

# Sarvam API endpoints
SARVAM_STT_API_URL = "https://api.sarvam.ai/speech-to-text-translate"
SARVAM_TTS_API_URL = "https://api.sarvam.ai/text-to-speech"
SARVAM_TRANSLATE_API_URL = "https://api.sarvam.ai/translate"

# Create database manager
db_manager = DBManager()

# Ensure audio directory exists
audio_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "audio_files")
os.makedirs(audio_dir, exist_ok=True)

# Constants from flask-converter
PRODUCT_BASE_URL = "https://example.com/post-product"
POST_BASE_URL = "https://example.com/post-existing-product"

# Form fields
product_fields = [
    ("ProductName",              "What is the product name?"),
    ("Category",                 "Which category does it belong to?"),
    ("Description_about_the_crop","Briefly describe the crop."),
    ("Price_per_kg",             "Price per kg (numbers only)."),
    ("Total_quantity_produced",  "Total quantity produced (numbers only).")
]
post_fields = [
    ("ExistingProduct",  "Which existing product do you want to post?"),
    ("Caption",          "What caption would you like to use?"),
    ("AdditionalMessage","Any additional message? (or 'none')")
]

# Agent state definition
class AgentState(TypedDict, total=False):
    messages: Annotated[List[BaseMessage], add_messages]
    intent: str
    product_data: dict
    await_key: Optional[str]
    done: bool
    summary: str
    url: str
    base_url: str

# Reintroduce ConnectionManager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.user_sessions: Dict[str, str] = {}  # Map client_id to session_id

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        logger.info(f"Client {client_id} connected. Total clients: {len(self.active_connections)}")

        # Create or get session for this client - use async version to avoid blocking
        session_id, _ = await db_manager.get_or_create_session_async(client_id)
        self.user_sessions[client_id] = session_id
        logger.debug(f"Client {client_id} using session {session_id}")

    def disconnect(self, client_id: str):
         if client_id in self.active_connections:
            del self.active_connections[client_id]
            if client_id in self.user_sessions:
                del self.user_sessions[client_id]
            logger.info(f"Client {client_id} disconnected. Total clients: {len(self.active_connections)}")

    async def send_personal_message(self, message: str | bytes, client_id: str):
        if client_id in self.active_connections:
            websocket = self.active_connections[client_id]
            if isinstance(message, str):
                await websocket.send_text(message)
            elif isinstance(message, bytes):
                await websocket.send_bytes(message)
            # Reduce log verbosity for potentially large messages like audio
            log_preview = message[:100] + "..." if isinstance(message, str) and len(message) > 100 else message

    async def broadcast(self, message: str):
        for client_id in self.active_connections:
            await self.active_connections[client_id].send_text(message)
        logger.info(f"Broadcasted: {message[:10]}...")
        
    def get_session_id(self, client_id: str) -> Optional[str]:
        """Get the session ID for a client."""
        return self.user_sessions.get(client_id)
    
    def set_session_id(self, client_id: str, session_id: str):
        """Set the session ID for a client."""
        self.user_sessions[client_id] = session_id

manager = ConnectionManager()

# Router using the manager
router = APIRouter()

async def sarvam_speech_to_text(audio_bytes, client_id: str, session_id: str, prompt="") -> str | None:
    """Convert speech to text using Sarvam.ai API and save audio file"""
    if not SARVAM_API_KEY:
        logger.error("SARVAM_API_KEY not available. Cannot process speech to text.")
        return None
    
    try:
        # Generate a unique filename using user_id, session_id and timestamp
        timestamp = int(time.time())
        audio_filename = f"{client_id}_{session_id}_{timestamp}.wav"
        audio_path = os.path.join(audio_dir, audio_filename)
        
        # Save the audio file
        with open(audio_path, 'wb') as f:
            f.write(audio_bytes)
        
        logger.debug(f"Saved audio file to {audio_path}")
        
        # Prepare API request
        payload = {
            'model': 'saaras:v2',
            'prompt': prompt,
            'with_diarization': False
        }
        
        files = [
            ('file', (audio_filename, open(audio_path, 'rb'), 'audio/wav'))
        ]
        
        headers = {
            'api-subscription-key': SARVAM_API_KEY
        }
        
        # Make API request
        response = await asyncio.to_thread(
            requests.request,
            "POST", 
            SARVAM_STT_API_URL, 
            headers=headers, 
            data=payload, 
            files=files
        )
        
        if response.status_code == 200:
            result = response.json()
            logger.debug(f"Sarvam STT API response: {result}")
            transcription = result.get('transcript', '')
            detected_language_code = result.get('language_code', '')
            # Return both the transcription and the audio filename for storage
            return transcription, audio_filename, detected_language_code
        else:
            logger.error(f"Sarvam STT API error: {response.status_code} - {response.text}")
            return None, audio_filename, None
            
    except Exception as e:
        logger.error(f"Error in Sarvam speech-to-text API: {e}", exc_info=True)
        return None, None, None

async def call_english_agent_api(text_input, session_history):
    """
    Call English agent API with the complete conversation history.
    This would be implemented based on the specific agent API details.
    """
    # TODO: Replace with actual English agent API call
    # For now, we'll just echo back the input as a simple response
    try:
        # This is a placeholder - replace with actual API call
        # Here we would pass the entire session_history to the API
        logger.debug(f"Calling English agent API with history of {len(session_history)} messages")
        
        # Just a simple response for now that acknowledges the history
        if len(session_history) > 1:
            previous_exchanges = len(session_history) // 2
            response = f"This is response #{previous_exchanges+1} to: {text_input}"
        else:
            response = f"This is my first response to: {text_input}"
            
        return response
    except Exception as e:
        logger.error(f"Error calling English agent API: {e}", exc_info=True)
        return None

async def sarvam_text_to_speech(text, target_lang_code="en-IN") -> str | None:
    """Convert text to speech using Sarvam.ai API"""
    if not SARVAM_API_KEY:
        logger.error("SARVAM_API_KEY not available. Cannot process text to speech.")
        return None
    
    try:
        logger.debug(f"Starting Sarvam.ai text-to-speech API call for {len(text)} characters...")
        
        # Prepare API request
        payload = {
            "inputs": [text],
            "target_language_code": target_lang_code,
            "speech_sample_rate": 8000,
            "enable_preprocessing": True,
            "model": "bulbul:v2"
        }
        
        headers = {
            "Content-Type": "application/json",
            "api-subscription-key": SARVAM_API_KEY
        }
        
        # Make API request
        response = await asyncio.to_thread(
            requests.request,
            "POST", 
            SARVAM_TTS_API_URL, 
            json=payload, 
            headers=headers
        )
        
        if response.status_code == 200:
            result = response.json()
            logger.debug(f"Sarvam TTS API call successful to language={target_lang_code}")
            
            # Extract audio data
            if "audios" in result:
                audio_base64 = result["audios"][0]
                return audio_base64
            else:
                logger.error(f"Unexpected TTS response format: {result}")
                return None
        else:
            logger.error(f"Sarvam TTS API error: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        logger.error(f"Error in Sarvam text-to-speech API: {e}", exc_info=True)
        return None

async def sarvam_translate(text, source_language_code="en-IN", target_language_code="kn-IN") -> str | None:
    """Translate text using Sarvam.ai API"""
    if not SARVAM_API_KEY:
        logger.error("SARVAM_API_KEY not available. Cannot translate text.")
        return text  # Return original text if API key not available
    
    try:
        logger.debug(f"Starting Sarvam.ai translation API call for {len(text)} characters from {source_language_code} to {target_language_code}")
        
        # Prepare API request
        payload = {
            "input": text,
            "source_language_code": source_language_code,
            "target_language_code": target_language_code,
            "speaker_gender": "Female",
            "mode": "formal",
            "model": "mayura:v1",
            "enable_preprocessing": False,
            "output_script": "spoken-form-in-native",
            "numerals_format": "native"
        }
        
        headers = {
            "Content-Type": "application/json",
            "api-subscription-key": SARVAM_API_KEY
        }
        
        # Make API request
        response = await asyncio.to_thread(
            requests.request,
            "POST", 
            SARVAM_TRANSLATE_API_URL, 
            json=payload, 
            headers=headers
        )
        
        if response.status_code == 200:
            result = response.json()
            logger.debug(f"Sarvam Translation API call successful")
            
            # Extract translated text
            translated_text = result.get("translated_text")
            if translated_text:
                return translated_text
            else:
                logger.error(f"Unexpected translation response format: {result}")
                return text  # Return original text on unexpected response format
        else:
            logger.error(f"Sarvam Translation API error: {response.status_code} - {response.text}")
            return text  # Return original text on API error
            
    except Exception as e:
        logger.error(f"Error in Sarvam translation API: {e}", exc_info=True)
        return text  # Return original text on exception

@router.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket, client_id)

    try:
        while True:
            data = await websocket.receive()
            response_text = None
            user_message = None  # The message to store in the database
            session_id = manager.get_session_id(client_id)
            
            # Timestamp when message was received
            received_timestamp = int(time.time())

            target_language_code = "en-IN"
            
            # Check if data contains language parameter
            if isinstance(data, dict) and "language" in data:
                target_language_code = data["language"]
            elif "text" in data and isinstance(data["text"], dict) and "language" in data["text"]:
                target_language_code = data["text"]["language"]
            elif "bytes" in data and isinstance(data["bytes"], dict) and "language" in data["bytes"]:
                target_language_code = data["bytes"]["language"]
                
            logger.debug(f"Using target language code: {target_language_code}")
            
            if not session_id:
                logger.error(f"No session ID for client {client_id}")
                await manager.send_personal_message(json.dumps({"status": "error", "message": "Session not found"}), client_id)
                continue

            if not SARVAM_API_KEY:
                logger.error("SARVAM_API_KEY not available. Cannot process request.")
                await manager.send_personal_message(json.dumps({"status": "error", "message": "AI processing service unavailable."}), client_id)
                continue

            # Get session history for context - use async version to avoid blocking
            session_history = await db_manager.get_session_history_for_llm_async(session_id)
            logger.debug(f"Retrieved history for session {session_id}: {len(session_history)} messages")

            if "text" in data:
                text_data = data["text"]
                logger.debug(f"Received text from {client_id}: {text_data}")
                await manager.send_personal_message(json.dumps({"status": "processing_text", "message": "Processing text request..."}), client_id)

                # For text input, STT is skipped
                stt_completed_timestamp = received_timestamp
                
                # Store user message in database with timestamps in the background
                db_manager.add_user_message_background(
                    session_id, 
                    text_data, 
                    received_at=received_timestamp,
                    stt_completed_at=stt_completed_timestamp
                )
                user_message = text_data
                
                # Call English agent API with the text and session history
                await manager.send_personal_message(json.dumps({"status": "processing_llm", "message": "Thinking..."}), client_id)
                response_text = await call_english_agent_api(text_data, session_history)
                # Timestamp when LLM completed
                llm_completed_timestamp = int(time.time())

            elif "bytes" in data:
                bytes_data = data["bytes"]
                logger.debug(f"Received audio bytes from {client_id}: {len(bytes_data)} bytes")
                await manager.send_personal_message(json.dumps({"status": "processing_audio", "message": "Processing audio..."}), client_id)

                try:
                    # Convert audio format if needed
                    def prepare_audio_data():
                        try:
                            audio_file = io.BytesIO(bytes_data)
                            file_type = magic.from_buffer(bytes_data[:1024])  # Check first 1KB
                            
                            # Handle WebM/Matroska format specifically
                            if 'WebM' in file_type or 'Matroska' in file_type:
                                # Convert using pydub
                                audio = AudioSegment.from_file(audio_file, format="webm")
                                audio = audio.set_frame_rate(DEFAULT_SAMPLING_RATE).set_channels(1)
                                
                                # Convert to WAV format
                                output_buffer = io.BytesIO()
                                audio.export(output_buffer, format="wav")
                                output_buffer.seek(0)
                                return output_buffer.read()
                            
                            # If already in WAV format, return as is
                            return bytes_data
                            
                        except Exception as e:
                            logger.error(f"Error preparing audio: {e}", exc_info=True)
                            raise ValueError(f"Audio preparation failed: {e}")

                    # Prepare audio data for API
                    prepared_audio = await asyncio.to_thread(prepare_audio_data)

                    # Send status update: Processing speech to text
                    await manager.send_personal_message(json.dumps({"status": "processing_stt", "message": "Converting speech to text..."}), client_id)

                    # Call Sarvam STT API and get transcription and audio filename
                    transcribed_text, audio_filename, detected_language_code = await sarvam_speech_to_text(prepared_audio, client_id, session_id)
                    
                    # Timestamp when STT completed
                    stt_completed_timestamp = int(time.time())
                    
                    if not transcribed_text:
                        logger.error(f"Speech-to-text conversion failed for client {client_id}")
                        await manager.send_personal_message(json.dumps({
                            "status": "error",
                            "message": "Failed to convert speech to text."
                        }), client_id)
                        continue
                        
                    logger.debug(f"Transcribed text: {transcribed_text}")

                    # Store user message with audio file reference in the background
                    db_manager.add_user_message_background(
                        session_id, 
                        transcribed_text,
                        audio_file=audio_filename,
                        transcription=transcribed_text,
                        received_at=received_timestamp,
                        stt_completed_at=stt_completed_timestamp
                    )
                    user_message = transcribed_text

                    # Send status update: Processing with LLM
                    await manager.send_personal_message(json.dumps({"status": "processing_llm", "message": "Thinking..."}), client_id)
                    
                    # Call English agent API with the transcribed text and session history
                    response_text = await call_english_agent_api(transcribed_text, session_history)
                    # Timestamp when LLM completed
                    llm_completed_timestamp = int(time.time())

                except Exception as e:
                    logger.error(f"Error processing audio for {client_id}: {e}", exc_info=True)
                    await manager.send_personal_message(json.dumps({"status": "error", "message": f"Error processing audio: {e}"}), client_id)
                    continue # Skip to next message

            # Process assistant response
            if response_text:
                # Store original English response
                original_response_text = response_text
                
                # Translate if needed (detected_language_code exists and is not English)
                translation_start_timestamp = None
                translation_completed_timestamp = None
                
                if detected_language_code and detected_language_code != "en-IN":
                    translation_start_timestamp = int(time.time())
                    await manager.send_personal_message(json.dumps({"status": "processing_translation", "message": "Translating response..."}), client_id)
                    translated_text = await sarvam_translate(response_text, "en-IN", detected_language_code)
                    translation_completed_timestamp = int(time.time())
                    if translated_text:
                        response_text = translated_text
                        logger.debug(f"Translated response from English to {detected_language_code}")
                
                # Determine the target language for TTS
                tts_language_code = detected_language_code if detected_language_code else target_language_code
                
                # TTS using Sarvam API
                await manager.send_personal_message(json.dumps({"status": "processing_tts", "message": "Generating audio response..."}), client_id)
                audio_output_base64 = await sarvam_text_to_speech(response_text, target_lang_code=tts_language_code)
                
                # Timestamp when TTS completed
                tts_completed_timestamp = int(time.time())

                # Add assistant response to database with timestamps in the background
                db_manager.add_assistant_message_background(
                    session_id, 
                    original_response_text,  # Store original English response
                    llm_completed_at=llm_completed_timestamp,
                    tts_completed_at=tts_completed_timestamp
                )

                if audio_output_base64:
                    # Calculate and log performance metrics
                    stt_duration = stt_completed_timestamp - received_timestamp if stt_completed_timestamp and received_timestamp else 0
                    llm_duration = llm_completed_timestamp - stt_completed_timestamp if llm_completed_timestamp and stt_completed_timestamp else 0
                    translation_duration = translation_completed_timestamp - translation_start_timestamp if translation_completed_timestamp and translation_start_timestamp else 0
                    tts_duration = tts_completed_timestamp - (translation_completed_timestamp or llm_completed_timestamp) if tts_completed_timestamp else 0
                    total_duration = tts_completed_timestamp - received_timestamp if tts_completed_timestamp and received_timestamp else 0
                    
                    logger.info(f"Performance metrics for {client_id}: STT: {stt_duration}s, LLM: {llm_duration}s, Translation: {translation_duration}s, TTS: {tts_duration}s, Total: {total_duration}s")
                    
                    response_payload = {
                        "status": "response_ready",
                        "text": response_text,
                        "audio_base64": audio_output_base64,
                        "performance": {
                            "stt_duration": stt_duration,
                            "llm_duration": llm_duration,
                            "translation_duration": translation_duration,
                            "tts_duration": tts_duration,
                            "total_duration": total_duration
                        }
                    }
                    await manager.send_personal_message(json.dumps(response_payload), client_id)
                else:
                    logger.error(f"TTS generation failed for client {client_id}.")
                    await manager.send_personal_message(json.dumps({
                        "status": "error",
                        "message": "Audio generation failed. Displaying text response.",
                        "text": response_text,
                        "performance": {
                            "stt_duration": stt_duration,
                            "llm_duration": llm_duration,
                            "translation_duration": translation_duration,
                            "total_duration": llm_completed_timestamp - received_timestamp if llm_completed_timestamp and received_timestamp else 0
                        }
                    }), client_id)
            else:
                # API failed to return text
                error_message = "AI failed to generate a response."
                logger.error(f"API Error for {client_id}: {error_message}")
                await manager.send_personal_message(json.dumps({"status": "error", "message": error_message}), client_id)

    except WebSocketDisconnect:
        logger.debug(f"WebSocket disconnected for client {client_id}. Cleaning up resources.")
        manager.disconnect(client_id)
    except Exception as e:
        logger.error(f"Error in WebSocket endpoint for client {client_id}: {e}", exc_info=True)
        # Clean up and disconnect on general errors too
        manager.disconnect(client_id)

# Session management routes
@router.post("/sessions/new")
async def create_new_session(user_id: str):
    """Create a new chat session for a user."""
    try:
        session_id, _ = await db_manager.create_session_async(user_id)
        return {"status": "success", "session_id": session_id}
    except Exception as e:
        logger.error(f"Error creating new session: {e}", exc_info=True)
        return {"status": "error", "message": str(e)}

@router.get("/sessions/list")
async def list_sessions(user_id: str):
    """List all sessions for a user."""
    try:
        sessions = await db_manager.get_all_sessions_async(user_id)
        return {"status": "success", "sessions": sessions}
    except Exception as e:
        logger.error(f"Error listing sessions: {e}", exc_info=True)
        return {"status": "error", "message": str(e)}

@router.post("/sessions/switch")
async def switch_session(user_id: str, session_id: str):
    """Switch the active session for a user."""
    try:
        success = await db_manager.switch_session_async(user_id, session_id)
        if success:
            # Update the session ID in the connection manager for any active connections
            for client_id, ws in manager.active_connections.items():
                if client_id == user_id:
                    manager.set_session_id(client_id, session_id)
            
            return {"status": "success", "message": f"Switched to session {session_id}"}
        else:
            return {"status": "error", "message": "Failed to switch session"}
    except Exception as e:
        logger.error(f"Error switching session: {e}", exc_info=True)
        return {"status": "error", "message": str(e)}

@router.get("/sessions/{session_id}/history")
async def get_session_history(session_id: str):
    """Get the message history for a session."""
    try:
        messages = await db_manager.get_session_messages_async(session_id)
        return {"status": "success", "messages": messages}
    except Exception as e:
        logger.error(f"Error retrieving session history: {e}", exc_info=True)
        return {"status": "error", "message": str(e)}

def get_websocket_router():
    return router 

# Intent determination logic
def determine_intent_and_base_url(user_message_content: str) -> tuple[str, str]:
    """
    Classifies intent and returns the intent string and base URL.
    """
    print("--> Classifying intent...")
    prompt = """
You are an intent classifier for an agricultural marketplace app.
Analyze the user message and classify it as exactly ONE of these intents: "product" or "post".
Return ONLY the word "product" or "post".
"""
    try:
        response = llm.invoke([
            SystemMessage(content=prompt),
            HumanMessage(content=user_message_content)
        ])
        intent = response.content.strip().lower().split()[0] if response.content else ""
    except Exception as e:
        print(f"Error invoking LLM for intent classification: {e}")
        intent = "product" # Default on LLM error

    if intent not in ("product", "post"):
        print(f"Warning: Intent '{intent}' not recognized (from msg: '{user_message_content[:50]}...'), defaulting to 'product'")
        intent = "product"

    base_url = PRODUCT_BASE_URL if intent == "product" else POST_BASE_URL
    print(f"--> Intent classified as: {intent}, Base URL: {base_url}")
    return intent, base_url

# Form step logic
def run_form_step(state: AgentState) -> AgentState:
    """
    Processes the current state: saves the last answer (if any)
    and determines the next question or finalizes.
    Returns the updated state.
    """
    intent = state.get("intent")
    if not intent:
        print("Error: Intent missing in run_form_step state.")
        state["messages"] = add_messages(state.get("messages", []), [AIMessage(content="Internal error: Could not determine task type.")])
        state["done"] = True # Mark as done to prevent further processing
        return state

    fields = product_fields if intent == "product" else post_fields
    base_url = state.get("base_url", "")
    data = state.get("product_data", {})
    new_messages = [] # Messages to add in this step

    print(f"--> Running form step for intent: {intent}")

    # --- Save previous answer if applicable ---
    key_to_save = state.get("await_key")
    # Check if the *last* message is human and await_key was set *before* this call
    if key_to_save and state.get("messages") and isinstance(state["messages"][-1], HumanMessage):
        last_user_message = state["messages"][-1].content.strip()
        print(f"--> Saving answer for '{key_to_save}': '{last_user_message}'")
        data[key_to_save] = last_user_message
    # We will determine the *next* await_key below
    current_await_key = None

    # --- Determine next step: Ask next question OR finalize ---
    next_key_to_ask = None
    question_to_ask = None
    for key, q in fields:
        if key not in data: # Find the first key *not* present in data
            next_key_to_ask = key
            question_to_ask = q
            break

    current_url = generate_url(base_url, data) # URL reflecting current data

    if next_key_to_ask and question_to_ask:
        print(f"--> Asking next question for key: '{next_key_to_ask}'")
        msg_content = (
            f"{question_to_ask}\n(please type your answer)\n\n"
            f"Current progress URL: {current_url}"
        )
        new_messages.append(AIMessage(content=msg_content))
        current_await_key = next_key_to_ask # Set key we are waiting for
        is_done = False
        summary_text = state.get("summary") # Preserve summary if it existed
    else:
        # --- All questions answered → Finalize ---
        print("--> All questions answered. Finalizing.")
        summary_text = summarize(intent, data)
        msg_content = (f"All questions answered! Here is a concise summary:\n\n{summary_text}\n\n"
                       f"Final submission link:\n{current_url}")
        new_messages.append(AIMessage(content=msg_content))
        current_await_key = None # No longer waiting
        is_done = True

    # Update state dictionary directly
    state["product_data"] = data
    state["await_key"] = current_await_key
    state["done"] = is_done
    state["url"] = current_url
    state["summary"] = summary_text
    # Add the new AI messages to the history
    state["messages"] = add_messages(state.get("messages", []), new_messages)

    return state

# Helper: summarizer LLM call
def summarize(intent: str, data: dict) -> str:
    print(f"--> Generating summary for intent '{intent}'...")
    try:
        if intent == "product":
            prompt = (
                "You are a marketplace assistant. Using the details below, "
                "write a short, compelling product listing (max 60 words).\n"
                f"Details: {data}"
            )
        else: # 'post' intent
            prompt = (
                "You are a social‑media assistant. Combine the details below "
                "into a catchy post caption (max 40 words).\n"
                f"Details: {data}"
            )
        summary = llm.invoke(prompt).content.strip()
        print(f"--> Summary generated.")
        return summary
    except Exception as e:
        print(f"Error invoking LLM for summary: {e}")
        return "[Error generating summary]" 