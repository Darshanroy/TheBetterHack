import fastapi
from fastapi import APIRouter, FastAPI, HTTPException, Body # Import Body for request body modeling
import logging
import asyncio
import base64
import binascii # For Base64 error handling
import json
import time
import uuid
import os
import urllib.parse
from typing import Dict, Optional, TypedDict, Annotated, List

# Langchain/LangGraph related imports
from langgraph.graph.message import add_messages
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, BaseMessage
from langchain_groq import ChatGroq
from pydantic import BaseModel, Field # For request/response models

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Environment Variables ---
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "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") # Replace or set env var
# SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")

if not GROQ_API_KEY or GROQ_API_KEY == "YOUR_GROQ_API_KEY":
    logger.warning("GROQ_API_KEY not found or default used. LLM calls will likely fail.")

# --- Agent State Definition ---
# (Remains the same)
class AgentState(TypedDict, total=False):
    messages: Annotated[List[BaseMessage], add_messages]
    intent: str
    product_data: dict
    await_key: Optional[str]
    done: bool
    summary: str
    url: str
    base_url: str
    detected_language_code: Optional[str]

# --- Global State Management (Keyed by Session ID) ---
conversation_states: Dict[str, AgentState] = {}

# --- Groq LLM Client ---
# (Remains the same)
llm = ChatGroq(
    model="llama3-70b-8192",
    api_key=GROQ_API_KEY,
    temperature=0
)

# --- Agent Configuration & Helpers ---
# (Remain the same)
PRODUCT_BASE_URL = "https://example.com/post-product"
POST_BASE_URL = "https://example.com/post-existing-product"

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

def generate_url(base_url: str, data: dict) -> str:
    # (Remains the same)
    if not base_url: return ""
    url_prefix = base_url
    if data and not url_prefix.endswith('?'):
        url_prefix += '?'
    elif not data and not url_prefix.endswith('?'):
         url_prefix += '?'
    params = "&".join(
        f"{urllib.parse.quote_plus(k.replace('_','-'))}="
        f"{urllib.parse.quote_plus(str(v))}" for k, v in data.items() if v
    )
    return url_prefix + params if params else (url_prefix if url_prefix.endswith('?') else url_prefix + '?')

# --- Core Agent Logic (Async) ---
# (determine_intent_and_base_url, summarize, run_form_step remain the same async functions)
async def determine_intent_and_base_url(user_message_content: str) -> tuple[str, str]:
    logger.info("--> Classifying intent...")
    prompt = """
You are an intent classifier for an agricultural marketplace app.
Analyze the user message and classify it as exactly ONE of these intents: "product" or "post".
Return ONLY the word "product" or "post".
"""
    try:
        response = await llm.ainvoke([
            SystemMessage(content=prompt),
            HumanMessage(content=user_message_content)
        ])
        intent = response.content.strip().lower().split()[0] if response.content else ""
    except Exception as e:
        logger.error(f"Error invoking LLM for intent classification: {e}", exc_info=True)
        intent = "product"
    if intent not in ("product", "post"):
        logger.warning(f"Intent '{intent}' not recognized, defaulting to 'product'")
        intent = "product"
    base_url = PRODUCT_BASE_URL if intent == "product" else POST_BASE_URL
    logger.info(f"--> Intent classified as: {intent}, Base URL: {base_url}")
    return intent, base_url

async def summarize(intent: str, data: dict) -> str:
    logger.info(f"--> Generating summary for intent '{intent}'...")
    try:
        if intent == "product":
            prompt_content = (
                "You are a marketplace assistant. Using the details below, write a short, compelling product listing (max 60 words).\n"
                f"Details: {json.dumps(data)}"
            )
        else:
            prompt_content = (
                "You are a social‑media assistant. Combine the details below into a catchy post caption (max 40 words).\n"
                f"Details: {json.dumps(data)}"
            )
        response = await llm.ainvoke([SystemMessage(content=prompt_content)])
        summary = response.content.strip()
        logger.info(f"--> Summary generated.")
        return summary
    except Exception as e:
        logger.error(f"Error invoking LLM for summary: {e}", exc_info=True)
        return "[Error generating summary]"

async def run_form_step(state: AgentState) -> AgentState:
    intent = state.get("intent")
    if not intent:
        logger.error("Intent missing in run_form_step state.")
        state["messages"] = add_messages(state.get("messages", []), [AIMessage(content="Internal error: Could not determine task type.")])
        state["done"] = True
        return state

    fields = product_fields if intent == "product" else post_fields
    base_url = state.get("base_url", "")
    data = state.get("product_data", {})
    new_messages = []

    logger.info(f"--> Running form step for intent: {intent}")

    key_to_save = state.get("await_key")
    if key_to_save and state.get("messages") and isinstance(state["messages"][-1], HumanMessage):
        last_user_message = state["messages"][-1].content.strip()
        logger.info(f"--> Saving answer for '{key_to_save}': '{last_user_message}'")
        data[key_to_save] = last_user_message

    current_await_key = None
    next_key_to_ask = None
    question_to_ask = None
    for key, q in fields:
        if key not in data:
            next_key_to_ask = key
            question_to_ask = q
            break

    current_url = generate_url(base_url, data)
    summary_text = state.get("summary")

    if next_key_to_ask and question_to_ask:
        logger.info(f"--> Asking next question for key: '{next_key_to_ask}'")
        msg_content = f"{question_to_ask}\n(Please provide your answer)"
        new_messages.append(AIMessage(content=msg_content))
        current_await_key = next_key_to_ask
        is_done = False
    else:
        logger.info("--> All questions answered. Finalizing.")
        summary_text = await summarize(intent, data)
        msg_content = (f"All questions answered! Here is a summary:\n\n{summary_text}\n\n"
                       f"Submission link (example):\n{current_url}")
        new_messages.append(AIMessage(content=msg_content))
        current_await_key = None
        is_done = True

    state["product_data"] = data
    state["await_key"] = current_await_key
    state["done"] = is_done
    state["url"] = current_url
    state["summary"] = summary_text
    state["messages"] = add_messages(state.get("messages", []), new_messages)

    return state

# --- Placeholder Functions (Simulating External APIs) ---
# (Remain the same async functions)
async def placeholder_speech_to_text(audio_bytes: bytes, client_id: str) -> tuple[Optional[str], Optional[str]]:
    # Simulate processing time and language detection
    lang_code = "en-IN" # Default or simulate detection (e.g., random.choice(["en-IN", "hi-IN"]))
    transcription = f"Dummy transcription in {lang_code} for session {client_id}" # Use session_id instead of client_id
    logger.info(f"[Placeholder STT] Result: lang={lang_code}, text='{transcription}'")
    await asyncio.sleep(0.5)
    return transcription, lang_code

async def placeholder_translate(text: str, source_lang: str, target_lang: str) -> Optional[str]:
    if source_lang == target_lang:
        return text
    logger.info(f"[Placeholder Translate] Translating '{text[:50]}...' from {source_lang} to {target_lang}")
    await asyncio.sleep(0.3)
    return f"Translated '{text}' to {target_lang}"

async def placeholder_text_to_speech(text: str, lang_code: str) -> Optional[str]:
    logger.info(f"[Placeholder TTS] Generating audio in '{lang_code}' for text: '{text[:50]}...'")
    await asyncio.sleep(0.6)
    dummy_wav_content = b"RIFF\x00\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x80>\x00\x00\x00\xfa\x00\x00\x02\x00\x10\x00data\x00\x00\x00\x00"
    dummy_base64 = base64.b64encode(dummy_wav_content).decode('utf-8')
    return dummy_base64

# --- Pydantic Models for Request/Response ---
class InteractionRequest(BaseModel):
    text: Optional[str] = None
    # Expect audio as Base64 encoded string
    audio_base64: Optional[str] = Field(None, alias="bytes") # Accept "bytes" field name for compatibility

    # Ensure at least one input is provided (can be done via validator if needed)

class InteractionResponse(BaseModel):
    session_id: str
    text: str                         # Agent's response text (in user's language)
    audio_base64: Optional[str] = None # Agent's response audio (Base64)
    is_done: bool                     # Is the form filling complete?
    current_url: Optional[str] = None # Current URL reflecting gathered data
    status: str = "success"           # Overall status ("success", "error")
    error_message: Optional[str] = None # Error details if status is "error"
    processing_time: float

# --- FastAPI Router & HTTP Endpoints ---
router = APIRouter()

@router.post("/start_session", response_model=Dict[str, str])
async def start_new_session():
    """Starts a new conversation and returns a unique session ID."""
    session_id = str(uuid.uuid4())
    # Initialize an empty state for this session
    conversation_states[session_id] = AgentState(messages=[], product_data={}, done=False)
    logger.info(f"Started new session: {session_id}")
    return {"session_id": session_id}


@router.post("/interact/{session_id}", response_model=InteractionResponse)
async def interact(session_id: str, request: InteractionRequest):
    """Handles a user interaction turn (text or audio) for a given session."""
    start_time = time.time()
    logger.info(f"Interaction received for session: {session_id}")

    # --- 0. Retrieve or Handle Session State ---
    if session_id not in conversation_states:
        logger.error(f"Session ID not found: {session_id}")
        # Option 1: Raise error
        raise HTTPException(status_code=404, detail=f"Session not found: {session_id}. Use /start_session first.")
        # Option 2: Implicitly create (less explicit, might hide errors)
        # conversation_states[session_id] = AgentState(messages=[], product_data={}, done=False)
        # logger.info(f"Implicitly created state for session: {session_id}")

    current_state = conversation_states[session_id]

    # Check if the process for this session is already marked as done
    if current_state.get("done", False):
        logger.warning(f"Interaction attempt on completed session: {session_id}")
        # Return the final state info without reprocessing
        return InteractionResponse(
            session_id=session_id,
            text=f"(Process already complete) {current_state.get('summary', 'Summary not available.')}",
            audio_base64=None, # Or potentially regenerate TTS for summary?
            is_done=True,
            current_url=current_state.get('url'),
            status="complete",
            processing_time=round(time.time() - start_time, 2)
        )


    agent_response_text = None
    user_input_for_agent = None
    original_user_text = None
    detected_language_code = current_state.get("detected_language_code", "en-IN") # Use previous or default
    final_text_for_client = None
    audio_output_base64 = None

    # --- 1. Process Input ---
    if request.text:
        original_user_text = request.text
        logger.info(f"Received TEXT for session {session_id}: '{original_user_text[:100]}...'")
        # Assume English for now, or add language detection/translation
        user_input_for_agent = original_user_text
        # detected_language_code remains as set above

    elif request.audio_base64:
        logger.info(f"Received AUDIO (Base64) for session {session_id}: {len(request.audio_base64)} chars")
        try:
            audio_bytes = base64.b64decode(request.audio_base64)
            logger.info(f"Decoded Base64 to {len(audio_bytes)} audio bytes")
        except (binascii.Error, ValueError) as decode_error:
            logger.error(f"Base64 decoding failed for {session_id}: {decode_error}")
            raise HTTPException(status_code=400, detail="Invalid audio_base64 data provided.")

        # 1a. STT
        stt_transcription, stt_lang_code = await placeholder_speech_to_text(audio_bytes, session_id) # Pass session_id for context
        if not stt_transcription or not stt_lang_code:
            logger.error(f"STT failed for {session_id}")
            # Return an error response within the model structure
            return InteractionResponse(
                session_id=session_id, text="Could not understand audio.", is_done=False, status="error",
                error_message="STT failed.", processing_time=round(time.time() - start_time, 2)
            )
        original_user_text = stt_transcription
        detected_language_code = stt_lang_code
        current_state["detected_language_code"] = detected_language_code # Store detected lang

        # 1b. Translate to English for Agent
        if detected_language_code != "en-IN":
            logger.info(f"Translating input from {detected_language_code} for {session_id}")
            user_input_for_agent = await placeholder_translate(original_user_text, detected_language_code, "en-IN")
            if not user_input_for_agent:
                 logger.error(f"Input translation failed for {session_id}")
                 return InteractionResponse(
                     session_id=session_id, text="Could not translate your message.", is_done=False, status="error",
                     error_message="Input translation failed.", processing_time=round(time.time() - start_time, 2)
                 )
            logger.info(f"Translated input for agent: '{user_input_for_agent[:100]}...'")
        else:
            user_input_for_agent = original_user_text # Already English

    else:
        logger.warning(f"No text or audio provided for session {session_id}")
        raise HTTPException(status_code=400, detail="No 'text' or 'audio_base64' provided in request.")

    if not user_input_for_agent: # Should be caught earlier, but double-check
         logger.error(f"No valid input processed for agent for session {session_id}")
         return InteractionResponse(
             session_id=session_id, text="Failed to process input.", is_done=False, status="error",
             error_message="Internal input processing error.", processing_time=round(time.time() - start_time, 2)
         )

    # --- 2. Run Agent Logic ---
    logger.info(f"Running agent logic for session {session_id}")
    try:
        # Determine intent on first interaction for this session
        if not current_state.get("intent"):
            intent, base_url = await determine_intent_and_base_url(user_input_for_agent)
            initial_human_message = HumanMessage(content=user_input_for_agent)
            current_state.update({
                "messages": [initial_human_message], "intent": intent, "base_url": base_url,
                "product_data": {}, "await_key": None, "done": False, "summary": None,
                "url": generate_url(base_url, {})
                # Keeps detected_language_code if set from audio
            })
            logger.info(f"Intent determined ({intent}). Running first form step for {session_id}.")
            updated_state = await run_form_step(current_state)
        else:
            # Process subsequent answers
            current_state["messages"] = add_messages(current_state.get("messages", []), [HumanMessage(content=user_input_for_agent)])
            logger.info(f"Running next form step for {session_id}.")
            updated_state = await run_form_step(current_state)

        # Store the updated state back (crucial!)
        conversation_states[session_id] = updated_state

        # Extract the latest AI message (agent's response in English)
        if updated_state.get("messages") and isinstance(updated_state["messages"][-1], AIMessage):
            agent_response_text = updated_state["messages"][-1].content
            logger.info(f"Agent response (English): '{agent_response_text[:100]}...'")
        else:
            logger.error(f"No AIMessage found in updated state for {session_id}")
            agent_response_text = "Sorry, an internal error occurred." # Default error

    except Exception as agent_error:
        logger.error(f"Error during agent processing for {session_id}: {agent_error}", exc_info=True)
        # Return error response
        return InteractionResponse(
            session_id=session_id, text="An error occurred processing your request.", is_done=False, status="error",
            error_message=str(agent_error), processing_time=round(time.time() - start_time, 2)
        )

    # --- 3. Prepare Response for Client ---
    final_text_for_client = agent_response_text # Default to English

    # 3a. Translate back if necessary
    if detected_language_code != "en-IN":
        logger.info(f"Translating response to {detected_language_code} for {session_id}")
        translated_response = await placeholder_translate(agent_response_text, "en-IN", detected_language_code)
        if translated_response:
            final_text_for_client = translated_response
            logger.info(f"Translated response for client: '{final_text_for_client[:100]}...'")
        else:
            logger.warning(f"Output translation failed for {session_id}, sending English text.")
            # Keep final_text_for_client as English

    # 3b. TTS
    logger.info(f"Generating TTS for session {session_id}")
    audio_output_base64 = await placeholder_text_to_speech(final_text_for_client, detected_language_code)
    if not audio_output_base64:
        logger.warning(f"TTS failed for {session_id}. Response will lack audio.")


    # --- 4. Construct and Return Final Response ---
    response = InteractionResponse(
        session_id=session_id,
        text=final_text_for_client,
        audio_base64=audio_output_base64,
        is_done=updated_state.get("done", False),
        current_url=updated_state.get("url"),
        status="success" if agent_response_text else "error", # Mark error if agent failed silently
        error_message="Agent did not produce a response." if not agent_response_text and updated_state.get("status") != "error" else None,
        processing_time=round(time.time() - start_time, 2)
    )
    logger.info(f"Sending response for session {session_id}, status: {response.status}, done: {response.is_done}")
    return response


# --- Session Management Endpoints ---
@router.delete("/clear_session/{session_id}", status_code=204) # Use DELETE for clearing
async def clear_session_state(session_id: str):
    """Deletes the state for a specific session."""
    if session_id in conversation_states:
        del conversation_states[session_id]
        logger.info(f"Cleared state for session: {session_id}")
        return # Return No Content on successful deletion
    else:
        raise HTTPException(status_code=404, detail="Session not found")

@router.get("/get_session_state/{session_id}") # Keep GET for retrieving state
async def get_session_state_debug(session_id: str):
    """Utility endpoint to view the current state for a session (debugging)."""
    if session_id in conversation_states:
        state_copy = conversation_states[session_id].copy()
        # Convert BaseMessages for JSON compatibility
        if "messages" in state_copy and state_copy["messages"]:
            # Use .dict() method for Pydantic models or adapt if custom BaseMessage serialization needed
            try:
                 state_copy["messages"] = [msg.dict() for msg in state_copy["messages"]]
            except AttributeError:
                 # Fallback if messages are not Pydantic models - just show content
                 state_copy["messages"] = [{"type": type(msg).__name__, "content": getattr(msg, 'content', str(msg))} for msg in state_copy["messages"]]
        return state_copy
    else:
        raise HTTPException(status_code=404, detail="Session not found")

# --- FastAPI App Setup ---
app = FastAPI(title="HTTP Agent Server")

# Include the HTTP router
app.include_router(router)

@app.get("/")
async def read_root():
    return {"message": "HTTP agent server is running. Use /start_session and /interact/{session_id}"}

# --- Run with Uvicorn ---
# uvicorn main:app --reload --port 8000