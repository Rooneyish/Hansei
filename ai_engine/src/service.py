import threading
import asyncio
from transformers import TextIteratorStreamer
from qdrant_client.http import models as rest
import torch

EMOTION_TO_MUSIC_MAP = {
    "admiration": "hopeful",
    "amusement": "happy",
    "anger": "calm",
    "annoyance": "calm",
    "approval": "happy",
    "caring": "peaceful",
    "confusion": "focused",
    "curiosity": "focused",
    "desire": "peaceful",
    "disappointment": "reflective",
    "disapproval": "reflective",
    "disgust": "calm",
    "embarrassment": "peaceful",
    "excitement": "happy",
    "fear": "calm",
    "gratitude": "grateful",
    "grief": "reflective",
    "joy": "happy",
    "love": "peaceful",
    "nervousness": "calm",
    "optimism": "hopeful",
    "pride": "happy",
    "realization": "reflective",
    "relief": "peaceful",
    "remorse": "reflective",
    "sadness": "reflective",
    "surprise": "focused",
    "neutral": "neutral",
}

SYSTEM_TEMPLATE = """
<|im_start|>system
You are 'Hansei', a supportive friend inspired by the Japanese philosophy of self-reflection.
Your goal is to help the user manage their emotions in the moment using the provided 'CBT Context'.

IMPORTANT RULES:
1. GREETINGS: If the user says 'Hi', 'Hello', or 'Hey', ONLY say hello back warmly. Do NOT give CBT advice or use the context.
2. IDENTITY & CONTEXT: The provided 'CBT Context' is a REFERENCE LIBRARY of examples, not the user's life.
    - NEVER assume the user has a husband, boyfriend, or specific job unless they mention it first.
    - Use the 'CBT Context' only for the TYPE of advice or the exercise it suggests.
    - If the context mentions "your husband" but the user is talking about "work," ignore the "husband" part and only use the "work" logic.
    - If the user just stated a belief or a feeling, do NOT ask "does that resonate?" or "how does that feel?" They just told you! Instead, acknowledge it as a fact (e.g., "That perfectionism is a heavy burden to carry").
    - If the user says they are "going to" do something, wish them luck and tell them you're here when they get back. Do NOT ask them how it felt yet, as they haven't done it!
3. ROLE-PLAY: Speak ONLY as Hansei. Never continue the conversation as 'Assistant', 'Human', or 'User'.
4. NO DOCTOR TALK: Avoid clinical jargon. Instead of "Catastrophizing," say "expecting the worst." Avoid "I recommend."
5. BREVITY: Keep your response to ONE paragraph and under 4 sentences.

HOW TO USE THE CONTEXT:
- If the Context is empty or irrelevant, just have a normal friendly chat focusing on the user's words.
- SUPPORT ADVICE: Translate professional tips into warm, friendly suggestions.
- CBT EXERCISE PLAN: Pick ONE small step to try together.
- CORE BELIEFS: Gently ask if a specific belief (like 'feeling unlovable') resonates with them.

ENDING THE CHAT:
- Normally, end with a gentle question (e.g., "How does that sound to you?").
- If the user says "Bye", "Thanks", or "I'm done", just wish them well without a question.<|im_end|>

<|im_start|>user
Context: {context}
History: {history}
Message: {question}<|im_end|>
<|im_start|>assistant
Hansei:"""

CBT_LAB_PROMPT = """
<|im_start|>system
You are 'Hansei', a supportive friend. Analyze the journal for a 'Cognitive Distortion' based on the technique: {technique}.

If you find a distortion:
1. DISTORTION: Name the mistake.
2. THOUGHT: Summarize the negative thought.
3. REFRAME: A warm, friend-like opening question that reframes the situation. 
   Example: "I noticed you're feeling like a 'failure' because of that bug. Do you think that one moment really defines your whole talent?"

If no distortion is found, return DISTORTION: None.

Context: {cbt_plan}
<|im_end|>
<|im_start|>user
Journal Entry: {journal_text}
<|im_end|>
<|im_start|>assistant
"""


def get_relevant_docs(question: str, vectorstore):
    ignore_list = ["hi", "hello", "hey", "howdy"]
    if any(greet in question.lower().strip() for greet in ignore_list):
        return "None (Casual Greeting)"
    try:
        results = vectorstore.similarity_search_with_score(
            f"search_query: {question}", k=2
        )
        relevant_chunks = [
            res[0].page_content.replace("search_document: ", "")
            for res in results
            if res[1] > 0.55
        ]

        if relevant_chunks:
            return "\n\n".join(relevant_chunks)

        return "Focus on mindfulness, accepting the present state without judgment, and observing thoughts like clouds passing. "
    except Exception:
        return "Observe the current moment with kindness."


def get_music_recommendation(
    journal_text: str, predicted_emotion: str, music_vectorstore
):
    if not music_vectorstore:
        return None
    try:
        music_tag = EMOTION_TO_MUSIC_MAP.get(predicted_emotion, "reflective")
        emotion_filter = rest.Filter(
            must=[
                rest.FieldCondition(
                    key="metadata.mood_tags", match=rest.MatchAny(any=[music_tag])
                )
            ]
        )
        query = f"search_query: {journal_text}"
        results = music_vectorstore.similarity_search(query, k=1, filter=emotion_filter)
        if not results:
            results = music_vectorstore.similarity_search(query, k=1)
        if results:
            meta = results[0].metadata
            return {
                "database_id": meta.get("database_id"),
                "title": meta.get("title"),
                "artist": meta.get("artist"),
                "reasoning": f"This track resonates with your feeling of {predicted_emotion}.",
            }
    except Exception:
        return None
    return None


def get_cbt_lab_analysis(
    journal_text: str, cbt_vectorstore, qwen_model, qwen_tokenizer, device
):
    if not cbt_vectorstore:
        return None

    try:
        results = cbt_vectorstore.similarity_search(
            f"search_query: {journal_text}", k=1
        )

        if not results:
            return {
                "distortion": "Reflection",
                "thought": "None detected",
                "reframe": "Keep reflecting on your journey.",
            }

        meta = results[0].metadata
        technique = meta.get("technique", "Cognitive Reframing")
        cbt_plan = meta.get("cbt_plan", "Standard CBT protocol")

        full_prompt = CBT_LAB_PROMPT.format(
            technique=technique, cbt_plan=cbt_plan, journal_text=journal_text
        )

        inputs = qwen_tokenizer([full_prompt], return_tensors="pt").to(device)
        with torch.no_grad():
            outputs = qwen_model.generate(**inputs, max_new_tokens=150, temperature=0.3)

        response = (
            qwen_tokenizer.decode(outputs[0], skip_special_tokens=True)
            .split("assistant")[-1]
            .strip()
        )

        analysis = {"distortion": "None", "starter": "", "reframe": ""}
        for line in response.split("\n"):
            if "DISTORTION:" in line.upper():
                analysis["distortion"] = line.split(":", 1)[1].strip()
            if "STARTER:" in line.upper():
                analysis["starter"] = line.split(":", 1)[1].strip()
            if "REFRAME" in line.upper():
                analysis["reframe"] = line.split(":", 1)[1].strip()

        if analysis["reframe"] == "" and len(response) > 10:
            analysis["reframe"] = response

        return analysis
    except Exception as e:
        print(f"CBT Lab Error: {e}")
        return None


async def generate_stream(
    message: str, history_str: str, context: str, qwen_model, qwen_tokenizer, device
):
    full_prompt = SYSTEM_TEMPLATE.format(
        context=context, history=history_str, question=message
    )
    inputs = qwen_tokenizer([full_prompt], return_tensors="pt").to(device)
    streamer = TextIteratorStreamer(
        qwen_tokenizer, skip_prompt=True, skip_special_tokens=True
    )

    generation_kwargs = dict(
        **inputs,
        streamer=streamer,
        max_new_tokens=200,
        temperature=0.7,
        do_sample=True,
        repetition_penalty=1.1,
        eos_token_id=qwen_tokenizer.eos_token_id,
    )

    thread = threading.Thread(target=qwen_model.generate, kwargs=generation_kwargs)
    thread.start()

    for new_text in streamer:
        yield new_text
        await asyncio.sleep(0.01)
