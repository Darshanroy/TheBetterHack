import urllib.parse
from typing import TypedDict, Annotated, List, Optional, Dict
from uuid import uuid4 # To generate session IDs for example
import os

# Flask imports
from flask import Flask, request, jsonify

# Langchain/LangGraph core components (even if not compiling the full graph)
from langgraph.graph.message import add_messages # We'll use this helper
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, BaseMessage
from langchain_groq import ChatGroq

# --- Environment Variable for API Key (Recommended) ---
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "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") # Replace if needed
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY environment variable not set.")

# ─────────────────────────────────────────
# 1. Conversation state (remains the same)
# ─────────────────────────────────────────
class AgentState(TypedDict, total=False):
    messages: Annotated[List[BaseMessage], add_messages]
    intent: str
    product_data: dict
    await_key: Optional[str]
    done: bool
    summary: str
    url: str
    base_url: str

# ─────────────────────────────────────────
# 2. Groq Client (remains the same)
# ─────────────────────────────────────────
llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    api_key=GROQ_API_KEY,
    temperature=0
)

# ─────────────────────────────────────────
# 3. Intent Classification Logic (Separated for direct use)
# ─────────────────────────────────────────
PRODUCT_BASE_URL = "https://example.com/post-product"
POST_BASE_URL = "https://example.com/post-existing-product"

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

# ─────────────────────────────────────────
# 4. Question lists (remains the same)
# ─────────────────────────────────────────
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

# ─────────────────────────────────────────
# 5. Helper: summarizer LLM call (remains the same)
# ─────────────────────────────────────────
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

# ─────────────────────────────────────────
# 6. Helper: URL Generator (remains the same)
# ─────────────────────────────────────────
def generate_url(base_url: str, data: dict) -> str:
    """Generates a URL with query parameters from a dictionary."""
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
    # Ensure trailing '?' if no params generated but base_url didn't have one
    return url_prefix + params if params else (url_prefix if url_prefix.endswith('?') else url_prefix + '?')


# ─────────────────────────────────────────
# 7. Core Form Logic (Slightly adapted for direct use)
# ─────────────────────────────────────────
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

# ─────────────────────────────────────────
# 8. Flask Application Setup
# ─────────────────────────────────────────

app = Flask(__name__)

# In-memory storage for conversation states. Replace with Redis/DB for production.
conversation_states: Dict[str, AgentState] = {}

@app.route('/start_form/<session_id>', methods=['POST'])
def start_form(session_id):
    """
    Starts a new form process based on the user's initial message.
    Determines intent, asks the first question.
    """
    print(f"\n--- Request received: /start_form/{session_id} ---")
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400
    data = request.get_json()
    user_message = data.get('message')
    if not user_message:
        return jsonify({"error": "Missing 'message' in request body"}), 400

    print(f"User's initial message: {user_message}")

    # 1. Determine Intent and Base URL
    intent, base_url = determine_intent_and_base_url(user_message)

    # 2. Initialize State
    initial_human_message = HumanMessage(content=user_message)
    # Add an initial AI message confirming intent (optional but good UX)
    initial_ai_message = AIMessage(content=f"Okay, starting the '{intent}' process.")
    current_state = AgentState(
        messages=[initial_human_message, initial_ai_message], # Start history
        intent=intent,
        base_url=base_url,
        product_data={},
        await_key=None, # Will be set by run_form_step
        done=False,
        summary=None,
        url=generate_url(base_url, {}) # Initial URL is just base + '?'
    )

    # 3. Run the first step of the form logic to get the first question
    # Since no await_key is set, it won't try to save, just ask the first q.
    updated_state = run_form_step(current_state)

    # 4. Store the state
    conversation_states[session_id] = updated_state
    print(f"State stored for session {session_id}. Awaiting key: {updated_state.get('await_key')}")


    # 5. Return the first question and current URL
    last_ai_message = ""
    if updated_state.get("messages") and isinstance(updated_state["messages"][-1], AIMessage):
        last_ai_message = updated_state["messages"][-1].content

    return jsonify({
        "session_id": session_id,
        "ai_message": last_ai_message, # Should be the first question
        "current_url": updated_state.get("url"),
        "is_done": updated_state.get("done", False)
    })

@app.route('/submit_answer/<session_id>', methods=['POST'])
def submit_answer(session_id):
    """
    Submits an answer to the currently awaited question.
    Saves the answer, asks the next question, or finalizes.
    """
    print(f"\n--- Request received: /submit_answer/{session_id} ---")
    if session_id not in conversation_states:
        return jsonify({"error": "Session not found. Use /start_form first."}), 404

    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400
    data = request.get_json()
    user_answer = data.get('answer')
    if user_answer is None: # Allow empty strings, but key must exist
        return jsonify({"error": "Missing 'answer' in request body"}), 400

    print(f"User's answer: {user_answer}")

    # 1. Retrieve current state
    current_state = conversation_states[session_id]

    # 2. Check if already done
    if current_state.get("done"):
        print("Process already marked as done.")
        # Return last known state info
        last_ai_message = ""
        if current_state.get("messages") and isinstance(current_state["messages"][-1], AIMessage):
            last_ai_message = current_state["messages"][-1].content
        return jsonify({
            "session_id": session_id,
            "ai_message": f"(Process already complete) {last_ai_message}",
            "current_url": current_state.get("url"),
            "is_done": True
        })

    # 3. Add user's answer to message history
    current_state["messages"] = add_messages(current_state.get("messages", []), [HumanMessage(content=user_answer)])

    # 4. Run the form step logic
    # This will use the await_key set in the *previous* step to save the answer,
    # then determine the next question/final summary.
    updated_state = run_form_step(current_state)

    # 5. Store updated state
    conversation_states[session_id] = updated_state
    print(f"State updated for session {session_id}. Awaiting key: {updated_state.get('await_key')}, Done: {updated_state.get('done')}")

    # 6. Return the next question/summary and URL
    last_ai_message = ""
    if updated_state.get("messages") and isinstance(updated_state["messages"][-1], AIMessage):
        last_ai_message = updated_state["messages"][-1].content

    return jsonify({
        "session_id": session_id,
        "ai_message": last_ai_message, # Next question or final summary
        "current_url": updated_state.get("url"),
        "is_done": updated_state.get("done", False)
    })


@app.route('/clear_state/<session_id>', methods=['GET'])
def clear_session_state(session_id):
    """Utility endpoint to clear the state for a specific session."""
    if session_id in conversation_states:
        del conversation_states[session_id]
        print(f"Cleared state for session: {session_id}")
        return jsonify({"message": f"State cleared for session {session_id}"}), 200
    else:
        return jsonify({"error": "Session not found"}), 404

@app.route('/get_state/<session_id>', methods=['GET'])
def get_session_state(session_id):
    """Utility endpoint to view the current state for a session (for debugging)."""
    if session_id in conversation_states:
        # Convert BaseMessages to strings for JSON serialization if needed
        state_copy = conversation_states[session_id].copy()
        if "messages" in state_copy:
             state_copy["messages"] = [msg.to_json() for msg in state_copy["messages"]] # Or just extract content
        return jsonify(state_copy), 200
    else:
        return jsonify({"error": "Session not found"}), 404

# ─────────────────────────────────────────
# 9. Run Flask App
# ─────────────────────────────────────────
if __name__ == "__main__":
    print("Starting Flask server...")
    example_session_id = str(uuid4())
    print("\n=== Example Usage (using curl) ===")
    print(f"Use this session ID: {example_session_id}")
    print("\n1. Start 'product' flow with initial request:")
    print(f'curl -X POST "http://127.0.0.1:5000/start_form/{example_session_id}" -H "Content-Type: application/json" -d \'{{"message": "I want to add my corn harvest"}}\'')
    print("\n   -> Server should respond with the first question (Product Name).")
    print("\n2. Submit the answer for the first question:")
    print(f'curl -X POST "http://127.0.0.1:5000/submit_answer/{example_session_id}" -H "Content-Type: application/json" -d \'{{"answer": "Sweet Corn"}}\'')
    print("\n   -> Server should respond with the second question (Category).")
    print("\n3. Submit the answer for the second question:")
    print(f'curl -X POST "http://127.0.0.1:5000/submit_answer/{example_session_id}" -H "Content-Type: application/json" -d \'{{"answer": "Vegetable"}}\'')
    print("\n   -> Server should respond with the third question (Description).")
    print("\n(Continue submitting answers using the /submit_answer endpoint...)")
    print("\nTo view the current state (for debugging):")
    print(f'curl -X GET "http://127.0.0.1:5000/get_state/{example_session_id}"')
    print("\nTo clear the state for this session:")
    print(f'curl -X GET "http://127.0.0.1:5000/clear_state/{example_session_id}"')
    print("\n====================================\n")
    app.run(debug=True, host="127.0.0.1", port=5000) # debug=True reloads on changes