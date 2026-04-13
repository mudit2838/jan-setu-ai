import re

class Preprocessor:
    def __init__(self):
        # Hinglish/Hindi Semantic Mapping to help the English-based Vectorizer
        self.hinglish_map = {
            "pani": "water", "paani": "water", "nall": "tap", "pipeline": "pipe",
            "bijli": "electricity", "current": "power", "taar": "wire", "andhera": "blackout",
            "sadak": "road", "sadke": "roads", "sadako": "roads", "gaddha": "pothole", "gaddhe": "potholes",
            "kachra": "garbage", "gandagi": "sanitation", "kuradan": "dustbin", "safai": "cleanliness",
            "aspataal": "hospital", "aspatal": "hospital", "dawakhana": "clinic", "bimari": "health",
            "shiksha": "education", "vidyalaya": "school", "shikshak": "teacher", "padhai": "education",
            "vahan": "transport", "bus": "transport", "metro": "transport", "yatyat": "traffic",
            "police": "police", "thana": "station", "chori": "theft", "shuraksha": "safety", "khoon": "blood"
        }

    def clean_text(self, text: str) -> str:
        """Strip noise, normalize, and semantic-map Hinglish keywords."""
        if not text:
            return ""

        # Remove URLs
        text = re.sub(r'http\S+|www\S+|https\S+', '', text, flags=re.MULTILINE)
        
        # Remove phone numbers (Indian formats)
        text = re.sub(r'\+?\d{10,12}', '', text)

        # Handle Hinglish: Replace Romanized Hindi with English semantic equivalents
        # This allows an English Vectorizer to understand Hinglish intent
        words = text.split()
        normalized_words = []
        for word in words:
            clean_word = re.sub(r'[^a-zA-Z0-9\u0900-\u097F]', '', word).lower()
            if clean_word in self.hinglish_map:
                normalized_words.append(self.hinglish_map[clean_word])
            else:
                normalized_words.append(clean_word)
        
        text = " ".join(normalized_words)

        # Standard Cleaning: Remove special chars except basic punctuation and Devanagari
        # Note: We keep Devanagari (\u0900-\u097F) for Keyword Fallback usage
        text = re.sub(r'[^\w\s\u0900-\u097F]', ' ', text)
        
        # Normalize whitespace
        text = " ".join(text.split())

        return text

# Singleton instance
preprocessor = Preprocessor()
