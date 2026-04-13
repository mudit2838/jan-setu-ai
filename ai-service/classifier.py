import spacy
import os
import re

# Lazy Loading Strategy to keep startup fast and EC2 lightweight
class HybridClassifier:
    def __init__(self):
        self.nlp = None
        self.is_spacy_loaded = False
        self.spacy_model_name = "en_core_web_md"

        # 8 Departments with English, Hindi, and Hinglish variants
        self.keywords = {
            "Sanitation": ["garbage", "trash", "waste", "clean", "sweep", "dustbin", "kuradan", "kachra", "safai", "gandagi", "कूड़ा", "सफाई", "गंदगी", "sewage", "drainage", "overflow", "stinking", "malba", "naali"],
            "Water Supply": ["water", "leak", "pipe", "drain", "sewage", "supply", "pani", "nal", "tanki", "paani", "पानी", "नल", "leakage", "handpump", "tap", "shortage", "dirty water", "jal bharao"],
            "Electricity": ["electricity", "power", "light", "wire", "voltage", "blackout", "transformer", "bijli", "current", "taar", "andhera", "बिजली", "करंट", "load shedding", "fault", "pole", "fused", "voltage issue"],
            "Roads & Infrastructure": ["road", "pothole", "street", "highway", "asphalt", "signal", "traffic", "sadak", "gaddha", "pul", "सड़क", "गड्ढा", "bridge", "flyover", "broken road", "footpath", "divider", "pavement"],
            "Health": ["health", "hospital", "clinic", "disease", "mosquito", "fever", "hygiene", "aspataal", "bimari", "machar", "dawakhana", "अस्पताल", "बीमारी", "doctor", "medicine", "dengue", "malaria", "emergency"],
            "Education": ["school", "education", "teacher", "student", "college", "classroom", "shiksha", "vidyalaya", "shikshak", "padhai", "स्कूल", "शिक्षा", "books", "scholarship", "fees", "midday meal", "bench", "blackboard"],
            "Transport": ["transport", "bus", "train", "metro", "vehicle", "fare", "yatyat", "vahan", "kirayan", "बस", "वाहन", "route", "conductor", "driver", "stops", "ticket", "timings", "commute", "overcrowding"],
            "Public Safety": ["police", "crime", "safety", "theft", "harass", "fight", "security", "chori", "shuraksha", "thana", "पुलिस", "चोरी", "assault", "robbery", "threatening", "incident", "emergency", "surveillance", "night patrol"]
        }

        # Semantic Department Descriptions for Vector Matching
        self.dept_descriptions = {
            "Sanitation": "Waste management and cleanliness problems like garbage dumping or dirty surroundings.",
            "Water Supply": "Issues related to water shortage, leaking pipes, or poor water quality.",
            "Electricity": "Electrical faults, power cuts, fused streetlights, and dangerous wires.",
            "Roads & Infrastructure": "Potholes, broken roads, and street layout problems.",
            "Health": "Medical emergencies, hospital conditions, and public health threats.",
            "Education": "Problems in schools, colleges, or with educational resources.",
            "Transport": "Public transportation issues like buses, trains, and traffic management.",
            "Public Safety": "Crime, law and order, police related matters and personal security."
        }

    def _lazy_load_spacy(self):
        """Attempts to load spaCy model only when needed."""
        if self.nlp is None:
            try:
                self.nlp = spacy.load(self.spacy_model_name)
                self.is_spacy_loaded = True
                print("⚡ [ML SERVICE] spaCy loaded successfully.")
            except Exception as e:
                print(f"⚠️ [ML SERVICE] spaCy model '{self.spacy_model_name}' not found. Falling back to Keyword Matching only.")
                self.is_spacy_loaded = False
                self.nlp = None

    def _get_keyword_score(self, text: str):
        """Count keyword occurrences across all departments."""
        text_lower = text.lower()
        scores = {dept: 0 for dept in self.keywords.keys()}
        
        for dept, words in self.keywords.items():
            for word in words:
                if word in text_lower:
                    scores[dept] += 1
        
        # Format: (best_dept, count)
        best_dept = max(scores, key=scores.get)
        max_count = scores[best_dept]
        
        # Calculate confidence: Normalizing count (e.g., 3+ hits is strong)
        confidence = min(max_count / 3.0, 1.0)
        
        return best_dept, confidence, max_count

    def classify(self, text: str):
        """Apply Hybrid Classification (Vector + Keyword Fallback)."""
        self._lazy_load_spacy()
        
        method_used = "keyword"
        final_dept = "General Administration"
        confidence = 0.0
        low_confidence = False

        # --- STEP 1: KEYWORD ANALYSIS (FAST & ROBUST FOR MULTILINGUAL) ---
        kw_dept, kw_conf, kw_count = self._get_keyword_score(text)
        
        # --- STEP 2: SPACY VECTOR ANALYSIS (SEMANTIC & INTELLIGENT) ---
        if self.is_spacy_loaded:
            doc = self.nlp(text)
            vector_scores = {}
            for dept, desc in self.dept_descriptions.items():
                desc_doc = self.nlp(desc)
                vector_scores[dept] = doc.similarity(desc_doc)
            
            vec_dept = max(vector_scores, key=vector_scores.get)
            vec_conf = vector_scores[vec_dept]

            # HYBRID DECISION ENGINE (V2.1 - Keyword Priority)
            # 1. If multiple keywords match, trust keywords first (Highly reliable for domain terms)
            if kw_count >= 2:
                final_dept = kw_dept
                confidence = max(kw_conf, 0.85) # High confidence for multi-keyword hits
                method_used = "keyword-assured"
            # 2. If spaCy is very confident, use spaCy
            elif vec_conf > 0.65:
                final_dept = vec_dept
                confidence = vec_conf
                method_used = "spacy"
            # 3. Fallback to keyword if at least one hit exists
            elif kw_count >= 1:
                final_dept = kw_dept
                confidence = max(kw_conf, 0.70)
                method_used = "keyword-signal"
            # 4. Final semantic fallback
            else:
                final_dept = vec_dept
                confidence = vec_conf
                method_used = "spacy-semantic"
                if vec_conf < 0.40:
                    low_confidence = True
        else:
            # Keyword-Only Fallback Mode
            final_dept = kw_dept
            confidence = kw_conf
            method_used = "fallback-keyword"
            if kw_count == 0:
                low_confidence = True
                final_dept = "General Administration"

        # Final flag if confidence is below threshold
        if confidence < 0.35:
            low_confidence = True

        return {
            "department": final_dept,
            "confidence_score": round(float(confidence), 2),
            "method_used": method_used,
            "low_confidence": low_confidence
        }

# Singleton instance
classifier = HybridClassifier()
