import urllib.parse
from typing import TypedDict, Annotated, List, Optional
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, BaseMessage
from langchain_groq import ChatGroq
import os

# --- Environment Variable for API Key (Recommended) ---
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "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") # Replace if needed

# ─────────────────────────────────────────
# 1. Conversation state
# ─────────────────────────────────────────
class AgentState(TypedDict, total=False):
    messages: Annotated[List[BaseMessage], add_messages]
    intent: str
    product_data: dict
    await_key: Optional[str] # Key we are waiting for an answer to
    next_question_message: Optional[AIMessage] # Store the next question temporarily
    done: bool
    summary: str
    url: str # Stores the *latest* generated URL (base or progress)
    base_url: str # Stores the base URL determined by intent

# ─────────────────────────────────────────
# 2. One Groq client for everything
# ─────────────────────────────────────────
llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    api_key=GROQ_API_KEY,
    temperature=0
)

# ─────────────────────────────────────────
# 3. MODIFIED Intent classifier + Base URL Returner
# ─────────────────────────────────────────
PRODUCT_BASE_URL = "https://example.com/post-product"
POST_BASE_URL = "https://example.com/post-existing-product"

def classify_intent_and_return_base_url(state: AgentState):
    # Skip if intent already classified
    if state.get("intent"):
        print("--> Skipping intent classification (already done)")
        # If we are re-entering but intent exists, don't add the base URL message again
        return {}

    print("--> Classifying intent...")
    user_message = state["messages"][-1] # Classify based on the latest message
    prompt = """
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
    response = llm.invoke([
        SystemMessage(content=prompt),
        user_message
    ])
    intent = response.content.strip().lower().split()[0] if response.content else ""

    if intent not in ("product", "post"):
        print(f"Warning: Intent '{intent}' not recognized, defaulting to 'product'")
        intent = "product"

    # Determine base URL based on intent
    base_url = PRODUCT_BASE_URL if intent == "product" else POST_BASE_URL
    base_url_with_q = base_url + "?" # Add query marker for clarity

    print(f"--> Intent classified as: {intent}")
    print(f"--> Base URL identified: {base_url_with_q}")

    # Add the initial message containing *only* the base URL
    initial_message = AIMessage(content=f"Okay, I understand you want to '{intent}'. The base URL for this action is:\n{base_url_with_q}")

    return {
        "intent": intent,
        "base_url": base_url, # Store base URL without '?' for later use
        "messages": [initial_message], # Add the base URL message
        "url": base_url_with_q, # Set initial URL state
        "product_data": {}, # Ensure product data is initialized/reset here
        "await_key": None, # Ensure await_key is reset
        "done": False,
         "summary": None,
    }

# ─────────────────────────────────────────
# 4. Question lists
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
# 5. Helper: summarizer LLM call (Unchanged)
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
    summary = llm.invoke(prompt).content.strip()
    print(f"--> Summary generated.")
    return summary

# ─────────────────────────────────────────
# 6. Helper: URL Generator (Unchanged)
# ─────────────────────────────────────────
def generate_url(base_url: str, data: dict) -> str:
    """Generates a URL with query parameters from a dictionary."""
    # Ensure base_url ends with '?' if needed and data exists
    url_prefix = base_url
    if data and not url_prefix.endswith('?'):
        url_prefix += '?'
    elif not data and not url_prefix.endswith('?'):
         url_prefix += '?' # Ensure even empty URL has '?' if base didn't

    params = "&".join(
        f"{urllib.parse.quote_plus(k.replace('_','-'))}="
        f"{urllib.parse.quote_plus(str(v))}" for k, v in data.items() if v
    )
    return url_prefix + params if data else url_prefix # Avoid trailing '?' if no params generated

# ─────────────────────────────────────────
# 7. MODIFIED Generic form runner - Asks First Question or Processes Answer
# ─────────────────────────────────────────
def run_form(state: AgentState):
    intent = state["intent"]
    fields = product_fields if intent == "product" else post_fields
    base_url = state["base_url"] # Get base URL from state
    data = state.get("product_data", {})
    messages_to_add = []

    print(f"--> Running form for intent: {intent}")

    # --- Check if we need to save an answer ---
    key_to_save = state.get("await_key")
    # Only save if await_key is set AND the last message is from the user
    if key_to_save and isinstance(state["messages"][-1], HumanMessage):
        last_user_message = state["messages"][-1].content.strip()
        print(f"--> Saving answer for '{key_to_save}': '{last_user_message}'")
        data[key_to_save] = last_user_message
    # Clear await_key regardless of whether we saved (prevents resaving)
    # It will be set again if we ask another question.
    current_await_key = None

    # --- Determine next step: Ask next question OR finalize ---
    next_key_to_ask = None
    question_to_ask = None
    for key, q in fields:
        if key not in data: # Find the first key *not* present in data
            next_key_to_ask = key
            question_to_ask = q
            break # Stop at the first unanswered question

    current_url = generate_url(base_url, data) # Generate URL based on *current* data

    if next_key_to_ask and question_to_ask:
        print(f"--> Asking next question for key: '{next_key_to_ask}'")
        msg_content = (
            f"{question_to_ask}\n(please type your answer)\n\n"
            f"Current progress URL: {current_url}"
        )
        messages_to_add.append(AIMessage(content=msg_content))
        current_await_key = next_key_to_ask # Set key we are waiting for
        is_done = False
        summary_text = state.get("summary") # Keep existing summary if any
    else:
        # --- All questions answered → Finalize ---
        print("--> All questions answered. Finalizing.")
        summary_text = summarize(intent, data)
        # URL already calculated as current_url with all data
        msg_content = (f"All questions answered! Here is a concise summary:\n\n{summary_text}\n\n"
                       f"Final submission link:\n{current_url}")
        messages_to_add.append(AIMessage(content=msg_content))
        current_await_key = None # No longer waiting
        is_done = True

    return {
        "product_data": data,
        "await_key": current_await_key,
        "done": is_done,
        "url": current_url, # Store current URL in state
        "summary": summary_text, # Store summary if generated
        "messages": messages_to_add # Add the new AI message
    }


# Node wrappers remain simple calls to run_form
def product_form(state):
    print("--> Entering product_form node")
    return run_form(state)
def post_form(state):
    print("--> Entering post_form node")
    return run_form(state)

# ─────────────────────────────────────────
# 8. LangGraph wiring
# ─────────────────────────────────────────
workflow = StateGraph(AgentState)

# Node 1: Classify intent and return base URL message
workflow.add_node("classify_intent", classify_intent_and_return_base_url)

# Node 2 & 3: Form runners (ask questions / finalize)
workflow.add_node("product_form", product_form)
workflow.add_node("post_form",    post_form)

# Start at classification
workflow.set_entry_point("classify_intent")

# Edge 1: After classification, go to the correct form
workflow.add_conditional_edges(
    "classify_intent",
    lambda s: s["intent"],
    {"product": "product_form", "post": "post_form"}
)

# Edge 2: Loop within forms or end
def continue_form_loop(state: AgentState) -> str:
    """Determines if the form needs more input or should end."""
    if state.get("done"):
        print("--> Form loop condition: Done=True, routing to END")
        return END # End the graph if 'done' is True
    elif state.get("await_key"):
         # If we are waiting for an answer, stay in the graph but wait for human input
         # The graph technically ends the current run here, expecting next invoke with user input
         print(f"--> Form loop condition: await_key='{state['await_key']}', waiting for user input (Implicit END for this run)")
         # NOTE: LangGraph implicitly handles this. We don't loop back immediately.
         # The next app.invoke() call with the user's answer will restart the flow,
         # hit the appropriate form node again, and the logic inside run_form() will save the answer.
         # We return END here to signify the *current invocation* is finished.
         return END
    else:
       # This case should ideally not be reached if logic is correct (either done or await_key is set)
       # But as a fallback, route to end.
        print("--> Form loop condition: No await_key and not done. Fallback to END.")
        return END


# Add edges from form nodes based on 'done' state or if waiting for input
# If not done, the current invocation ends, waiting for the user's reply.
# The next invocation will trigger the same form node again.
workflow.add_conditional_edges("product_form", continue_form_loop)
workflow.add_conditional_edges("post_form", continue_form_loop)


app = workflow.compile()

# Optional visualization
# try:
#     app.get_graph().print_ascii()
# except ImportError:
#     pass

# ─────────────────────────────────────────
# 9. Interactive demo
# ─────────────────────────────────────────
if __name__ == "__main__":
    print("\n=== Agricultural Marketplace Agent ===")
    print("Type 'quit' or 'exit' to end.")
    print("===================================")

    # Initialize state
    # Need to start with an empty list that add_messages can work with
    current_state = AgentState(messages=[])

    while True:
        user_input = input("You: ")
        if user_input.lower() in ["quit", "exit"]:
            print("Exiting chat.")
            break

        # Add user message to the list for the *next* invocation
        # Use add_messages correctly by passing the existing list and the new message
        updated_messages = add_messages(current_state.get("messages", []), [HumanMessage(content=user_input)])
        current_state["messages"] = updated_messages


        print("\n--- Agent thinking ---")
        try:
            # Invoke the graph. It will run until it needs input or finishes.
            response_state = app.invoke(current_state, {"recursion_limit": 10})

            # Update the state for the next iteration
            current_state = response_state

            # Print the *last* message added by the agent in this turn
            if current_state.get("messages"):
                ai_message = current_state["messages"][-1]
                # Ensure we only print AI messages here
                if isinstance(ai_message, AIMessage):
                    print("----------------------")
                    print(f"AI:\n{ai_message.content}")
                    print("----------------------")
                    # print("\nDebug - Current State:", current_state) # Uncomment for full state debugging

            # Check if the process is marked as done
            if current_state.get("done"):
                print("\n--- Process Complete ---")
                print("You can start a new request or type 'quit'.")
                # Reset state for a potentially new request *except* messages
                # Keep messages for conversation history view, but clear task-specific state
                current_state = AgentState(
                    messages=current_state.get("messages", []), # Keep history
                    intent=None,
                    product_data=None,
                    await_key=None,
                    done=False,
                    summary=None,
                    url=None,
                    base_url=None
                 )


        except Exception as e:
            print(f"\n--- Error encountered ---")
            print(e)
            import traceback
            traceback.print_exc() # Print detailed traceback for debugging
            # Optionally print state upon error
            print("State at error:", current_state)
            print("An error occurred. Please try again or type 'quit' to exit.")
            # Reset potentially problematic state keys
            current_state['await_key'] = None
            current_state['done'] = False # Ensure not stuck in done state
            # break # Or continue allowing user to try again