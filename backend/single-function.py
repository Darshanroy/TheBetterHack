import urllib.parse
from typing import TypedDict, Annotated, List, Optional, Tuple
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, BaseMessage
from langchain_groq import ChatGroq
import os
from copy import deepcopy # To avoid modifying input state directly

# --- Environment Variable for API Key (Recommended) ---
# Ensure you have GROQ_API_KEY set in your environment,
# or replace the default fallback value.
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "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") # Replace if needed fallback

# ─────────────────────────────────────────
# 1. Conversation state (Unchanged)
# ─────────────────────────────────────────
class AgentState(TypedDict, total=False):
    messages: List[BaseMessage] # Use simple list for easier manual updates
    intent: str
    product_data: dict
    await_key: Optional[str] # Key we are waiting for an answer to
    done: bool
    summary: str
    url: str # Stores the *latest* generated URL (base or progress or final)
    base_url: str # Stores the base URL determined by intent

# ─────────────────────────────────────────
# 2. One Groq client for everything (Unchanged)
# ─────────────────────────────────────────
llm = ChatGroq(
    model="llama-3.3-70b-versatile", # Using 3.1 as 3.3 might not be available/stable
    api_key=GROQ_API_KEY,
    temperature=0
)

# ─────────────────────────────────────────
# 3. Constants and Field Definitions (Extracted)
# ─────────────────────────────────────────
PRODUCT_BASE_URL = "/app/add/product"
POST_BASE_URL = "/app/add/post"

product_fields = [
    ("name",              "What is the product name?"),
    ("category",                 "Which category does it belong to?"),
    ("description","Briefly describe the crop."),
    ("price",             "Price per kg (numbers only)."),
    ("quantity",  "Total quantity produced (numbers only)."),
    ("unit",  "units in")

]

post_fields = [
    ("productId",  "Which existing product do you want to post?"),
    ("content",          "What caption would you like to use?"),
    # ("AdditionalMessage","Any additional message? (or 'none')")
]

# ─────────────────────────────────────────
# 4. Helper: summarizer LLM call (Unchanged)
# ─────────────────────────────────────────
def summarize(intent: str, data: dict) -> str:
    print(f"--> Generating summary for intent '{intent}'...")
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
    try:
        summary_text = llm.invoke(prompt).content.strip()
        print(f"--> Summary generated.")
        return summary_text
    except Exception as e:
        print(f"Error during summary generation: {e}")
        return "[Error generating summary]"

# ─────────────────────────────────────────
# 5. Helper: URL Generator (Unchanged)
# ─────────────────────────────────────────
def generate_url(base_url: str, data: dict) -> str:
    """Generates a URL with query parameters from a dictionary."""
    url_prefix = base_url
    query_params = []
    for k, v in data.items():
        if v is not None and str(v).strip(): # Ensure value exists and is not empty string
             # Replace underscore with hyphen for URL key, handle None/empty values
            url_key = urllib.parse.quote_plus(k.replace('_', '-'))
            url_value = urllib.parse.quote_plus(str(v))
            query_params.append(f"{url_key}={url_value}")

    if query_params:
        return f"{url_prefix}?{'&'.join(query_params)}"
    else:
        # Return base URL with '?' only if it doesn't already have one
        return url_prefix if url_prefix.endswith('?') else url_prefix + '?'


# ─────────────────────────────────────────
# 6. The Consolidated Processing Function
# ─────────────────────────────────────────
def process_input_and_generate_url(
    user_input: str,
    current_state: AgentState
) -> Tuple[AgentState, str, str, Optional[str]]:
    """
    Processes user input, updates state, generates URL and AI response.

    Args:
        user_input: The latest text input from the user.
        current_state: The current state of the conversation (AgentState).

    Returns:
        A tuple containing:
        - updated_state: The new state after processing the input.
        - response_message: The AI's response message content.
        - url: The latest generated URL (base, progress, or final).
        - placeholder_name: The key of the next expected input,
                           'SUMMARY' if finished, or None.
    """
    print(f"\n--- Processing Input: '{user_input}' ---")
    # --- State Initialization and Update ---
    # Create a deep copy to avoid modifying the original state dict
    state = deepcopy(current_state)

    # Initialize required fields if they don't exist (e.g., first call)
    if "messages" not in state:
        state["messages"] = []
    if "product_data" not in state:
        state["product_data"] = {}

    # Add the new user message to the history
    state["messages"].append(HumanMessage(content=user_input))

    # Reset 'done' flag if starting a new interaction after completion
    if state.get("done"):
        print("--> Resetting state for new request (detected done=True)")
        state = AgentState(messages=state["messages"]) # Keep history, clear rest

    # --- Local variables ---
    ai_response_content: str = ""
    placeholder_name: Optional[str] = None
    generated_url: str = state.get("url", "") # Carry over previous URL initially

    # --- Intent Classification (if needed) ---
    if not state.get("intent"):
        print("--> Classifying intent...")
        intent_prompt = """
You are an intent classifier for an agricultural marketplace app.
Analyze the user message and classify it as exactly ONE of these intents:

1. "product" - When the user wants to add or create a new product listing
   Examples:
   - "I want to add a new product"
   - "I need to list my wheat crop for sale"
   - "Let me create a product entry for my rice harvest"

2. "post" - When the user wants to create a social post using an existing product
   Examples:
   - "I want to post about my existing product"
   - "I need to advertise the cotton I already listed"
   - "Help me create a post for my listed mangoes"

Return ONLY the word "product" or "post" without any additional text.
"""
        try:
            response = llm.invoke([
                SystemMessage(content=intent_prompt),
                HumanMessage(content=user_input) # Classify based on the *current* input
            ])
            intent = response.content.strip().lower().split()[0] if response.content else ""

            if intent not in ("product", "post"):
                print(f"Warning: Intent '{intent}' not recognized, defaulting to 'product'")
                intent = "product"

            base_url = PRODUCT_BASE_URL if intent == "product" else POST_BASE_URL
            initial_url = base_url + "?" # URL to show initially

            print(f"--> Intent classified as: {intent}")
            print(f"--> Base URL identified: {initial_url}")

            # Update state *after* classification
            state["intent"] = intent
            state["base_url"] = base_url
            state["url"] = initial_url
            state["product_data"] = {} # Reset data for new intent
            state["await_key"] = None
            state["done"] = False
            state["summary"] = None

            # Don't add a separate base URL message, proceed directly to first question
            # generated_url = initial_url # Set generated_url for this turn
            # placeholder_name = None # No specific data awaited yet

        except Exception as e:
            print(f"Error during intent classification: {e}")
            ai_response_content = "Sorry, I couldn't understand your request due to an error. Please try again."
            state["messages"].append(AIMessage(content=ai_response_content))
            return state, ai_response_content, state.get("base_url", "") + "?", None # Return safe defaults

    # --- Form Processing (Runs if intent is now set) ---
    if state.get("intent"):
        intent = state["intent"]
        fields = product_fields if intent == "product" else post_fields
        base_url = state["base_url"]
        data = state["product_data"] # Use the data from the current state

        # --- Check if the current input is an answer to a previous question ---
        key_to_save = state.get("await_key")
        if key_to_save:
            # Assume user_input is the answer to the awaited key
            print(f"--> Saving answer for '{key_to_save}': '{user_input}'")
            data[key_to_save] = user_input.strip()
            state["await_key"] = None # Clear the await key after saving

        # --- Determine next step: Ask next question OR finalize ---
        next_key_to_ask = None
        question_to_ask = None
        for key, q in fields:
            if key not in data: # Find the first key *not* present in data
                next_key_to_ask = key
                question_to_ask = q
                break # Stop at the first unanswered question

        # --- Generate URL based on current data ---
        # This happens *after* potentially saving an answer
        generated_url = generate_url(base_url, data)
        state["url"] = generated_url # Update URL in state

        if next_key_to_ask and question_to_ask:
            # --- Ask the next question ---
            print(f"--> Asking next question for key: '{next_key_to_ask}'")
            msg_content = (
                f"{question_to_ask}\n(please type your answer)\n\n"
                f"Current progress URL: {generated_url}"
            )
            ai_response_content = msg_content
            state["await_key"] = next_key_to_ask # Set key we are waiting for
            state["done"] = False
            placeholder_name = next_key_to_ask
            print(f"--> State: done=False, awaiting='{next_key_to_ask}'")

        else:
            # --- All questions answered → Finalize ---
            if not state.get("done"): # Only finalize once
                print("--> All questions answered. Finalizing.")
                summary_text = summarize(intent, data)
                state["summary"] = summary_text
                # URL already calculated as generated_url with all data

                msg_content = (f"All questions answered! Here is a concise summary:\n\n{summary_text}\n\n"
                               f"Final submission link:\n{generated_url}")
                ai_response_content = msg_content
                state["await_key"] = None # No longer waiting
                state["done"] = True
                placeholder_name = "SUMMARY"
                print(f"--> State: done=True, summary generated.")
            else:
                # If already done, just provide a reminder
                print("--> Already finalized. Reminding user.")
                ai_response_content = ("Looks like we've already completed that request. "
                                       f"The final summary was:\n\n{state['summary']}\n\n"
                                       f"Final URL:\n{generated_url}\n\n"
                                       "You can start a new request or type 'quit'.")
                placeholder_name = "SUMMARY" # Keep indicating it's done

        # Add the AI response message to history
        if ai_response_content:
            state["messages"].append(AIMessage(content=ai_response_content))

    # --- Return the results ---
    print(f"--- Returning State: await='{state.get('await_key')}', done='{state.get('done')}', url='{generated_url}' ---")
    return state, ai_response_content, generated_url, placeholder_name

# ─────────────────────────────────────────
# 7. Interactive Demo using the single function
# ─────────────────────────────────────────
if __name__ == "__main__":
    print("\n=== Agricultural Marketplace Agent (Single Function Version) ===")
    print("Type 'quit' or 'exit' to end.")
    print("Example commands: 'Add new product', 'Post about my listed wheat'")
    print("================================================================")

    # Initialize conversation state
    conversation_state: AgentState = AgentState(messages=[], product_data={}, done=False)

    while True:
        user_input = input("You: ")
        if user_input.lower() in ["quit", "exit"]:
            print("Exiting chat.")
            break

        if not user_input.strip():
            continue

        try:
            # Call the processing function
            updated_state, ai_message, current_url, next_placeholder = process_input_and_generate_url(
                user_input,
                conversation_state
            )

            # Update the state for the next iteration
            conversation_state = updated_state

            # Print AI response
            print("----------------------")
            print(f"AI:\n{ai_message}")
            # print(f"(Debug URL: {current_url})") # Optional: always show URL
            # print(f"(Debug Placeholder: {next_placeholder})") # Optional: show placeholder
            print("----------------------")

            # Optional: Print full state for debugging
            # print("\nDebug - Current State:", conversation_state)

            # Handle completion message
            if conversation_state.get("done"):
                print("\n--- Process Complete ---")
                print("You can start a new request or type 'quit'.")
                # State is automatically reset on the next input if 'done' is True

        except Exception as e:
            print(f"\n--- An unexpected error occurred ---")
            import traceback
            traceback.print_exc()
            print("State at error:", conversation_state)
            print("There was an error. Please try again or type 'quit' to exit.")
            # Attempt to reset state partially to allow recovery
            conversation_state['await_key'] = None
            conversation_state['done'] = False