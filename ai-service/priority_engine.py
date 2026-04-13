import re

# Rule-based priority system using Trigger Scans
class PriorityEngine:
    def __init__(self):
        # Trigger lists: Higher severity wins
        self.triggers = {
            "CRITICAL": {
                "keywords": ["fire", "flood", "death", "epidemic", "accident", "emergency", "blast", "aag", "marna", "haadsa", "bhadakna", "shor", "curfew"],
                "reason": "Immediate threat to life or property detected."
            },
            "HIGH": {
                "keywords": ["disease", "electric hazard", "dog bite", "unsafe structure", "exposed wire", "transformer blast", "open sewage", "leakage", "hospital", "doctor"],
                "reason": "Potential health or safety hazard detected."
            },
            "MEDIUM": {
                "keywords": ["repeated", "unresolved", "no response", "wait", "pichle", "baar baar", "shikayat", "not working", "kharab", "dhheela"],
                "reason": "Recurring or persistent issue detected."
            }
        }
        
        # Dept-dependent defaults if no triggers match
        self.dept_defaults = {
            "Health": "HIGH",
            "Public Safety": "HIGH",
            "Electricity": "MEDIUM",
            "Water Supply": "MEDIUM",
            "Sanitation": "LOW",
            "Roads & Infrastructure": "MEDIUM",
            "Education": "LOW",
            "Transport": "LOW",
            "General Administration": "LOW"
        }

    def determine_priority(self, text: str, department: str):
        text_lower = text.lower()
        
        # 1. Scan for Highest Severity first (CRITICAL -> HIGH -> MEDIUM)
        for level in ["CRITICAL", "HIGH", "MEDIUM"]:
            if any(word in text_lower for word in self.triggers[level]["keywords"]):
                return {
                    "priority_level": level,
                    "reason": self.triggers[level]["reason"]
                }
        
        # 2. Default to Dept-level severity if no trigger hits
        default_lvl = self.dept_defaults.get(department, "LOW")
        return {
            "priority_level": default_lvl,
            "reason": f"Standard priority assigned for {department} department."
        }

# Singleton instance
priority_engine = PriorityEngine()
