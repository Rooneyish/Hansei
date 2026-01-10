# src/utils.py
import re

# Replace this list with the exact 27 emotions from your GoEmotions dataset
EMOTIONS = [
    "admiration", "amusement", "anger", "annoyance", "approval", "caring", 
    "confusion", "curiosity", "desire", "disappointment", "disapproval", 
    "disgust", "embarrassment", "excitement", "fear", "gratitude", "grief", 
    "joy", "love", "nervousness", "optimism", "pride", "realization", 
    "relief", "remorse", "sadness", "surprise"
]

def clean_text(text):
    text = str(text).lower()
    text = re.sub(r'\[.*?\]', '', text) # Remove [NAME] etc.
    text = re.sub(r'http\S+', '', text) # Remove URLs
    return ' '.join(text.split())

def get_mood_details(emotion):
    """Maps the detected emotion to an emoji and a category for the UI"""
    mood_map = {
        "joy": "😊", "gratitude": "🙏", "anger": "😠", "sadness": "😢", 
        "fear": "😨", "love": "❤️", "admiration": "🤩", "remorse": "😔",
        "optimism": "🌅", "surprise": "😮", "annoyance": "😑"
    }
    emoji = mood_map.get(emotion, "✨")
    return emoji