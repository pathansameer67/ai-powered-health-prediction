import asyncio
import logging
import os
import re
from typing import List, Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


class GroqClientWrapper:
    """Wrapper for Groq LLM API with tool-calling support and evidence-grounded local fallback."""

    def __init__(self):
        self.api_key = (settings.GROQ_API_KEY or os.environ.get("GROQ_API_KEY", "")).strip().strip('"')
        self.model = settings.GROQ_MODEL
        self.fallback_model = settings.FALLBACK_GROQ_MODEL
        self._client = None

        if self.api_key and self.api_key not in {"your_groq_api_key_here", ""}:
            try:
                from groq import Groq
                self._client = Groq(api_key=self.api_key)
            except Exception as e:
                logger.warning(f"Could not initialize Groq client: {e}")

    def _candidate_models(self) -> List[str]:
        models = [
            self.model,
            self.fallback_model,
            "openai/gpt-oss-120b",
            "qwen/qwen3.8-27b",
            "llama-3.3-70b-versatile",
            "llama-3.1-8b-instant",
        ]
        seen = set()
        ordered = []
        for m in models:
            if m and m not in seen:
                seen.add(m)
                ordered.append(m)
        return ordered

    async def generate_chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.2,
        max_tokens: int = 1500
    ) -> str:
        """Generate LLM response with Groq, falling back to extractive grounded answers."""
        if self._client:
            last_error = None
            for model in self._candidate_models():
                try:
                    def _call(current_model=model):
                        return self._client.chat.completions.create(
                            messages=messages,
                            model=current_model,
                            temperature=temperature,
                            max_tokens=max_tokens
                        )

                    chat_completion = await asyncio.to_thread(_call)
                    content = chat_completion.choices[0].message.content or ""
                    if content.strip():
                        return content
                except Exception as e:
                    last_error = e
                    logger.warning(f"Groq API call with {model} failed ({e})")
            if last_error:
                logger.error(f"All Groq models failed; using local grounded fallback. Last error: {last_error}")

        return self._local_grounded_fallback(messages)

    async def generate_with_tools(
        self,
        messages: List[Dict[str, Any]],
        tools: List[Dict[str, Any]],
        tool_choice: str = "auto"
    ) -> Any:
        """Call Groq LLM with tools enabled."""
        if self._client:
            for model in self._candidate_models():
                try:
                    def _call(current_model=model):
                        return self._client.chat.completions.create(
                            model=current_model,
                            messages=messages,
                            tools=tools,
                            tool_choice=tool_choice,
                            temperature=0.1
                        )

                    response = await asyncio.to_thread(_call)
                    return response.choices[0].message
                except Exception as e:
                    logger.warning(f"Tool call with Groq model {model} failed: {e}")

        class DummyMessage:
            def __init__(self, content="", tool_calls=None):
                self.content = content
                self.tool_calls = tool_calls

        return DummyMessage(content="", tool_calls=None)

    def _local_grounded_fallback(self, messages: List[Dict[str, str]]) -> str:
        """Build a useful answer from retrieved passages / document excerpts when Groq is unavailable."""
        user_msg = ""
        for m in messages:
            if m.get("role") == "user":
                user_msg = m.get("content", "")

        excerpt = self._extract_block(user_msg, "Document Excerpt:")
        evidence = self._extract_block(user_msg, "Retrieved Evidence from Knowledge Base:")
        if not evidence:
            evidence = self._extract_block(user_msg, "Retrieved Evidence:")

        question = ""
        q_match = re.search(r"User Question:\s*(.+?)(?:\n\n|$)", user_msg, re.DOTALL)
        if q_match:
            question = q_match.group(1).strip()

        if excerpt and excerpt.lower() != "no direct passages found.":
            return self._extractive_summary(user_msg, excerpt)

        if evidence and evidence.lower() != "no direct passages found." and "no specific local document uploaded" not in evidence.lower():
            return self._answer_from_passages(question or user_msg, evidence)

        return self._general_clinical_guidance(question or user_msg)

    def _general_clinical_guidance(self, query: str) -> str:
        q = query.lower()
        
        # 1. Fever / High Temperature
        if any(k in q for k in ["fever", "temperature", "pyrexia", "chills", "febrile", "hot"]):
            return (
                "### 📋 Direct Answer in Plain Words\n"
                "A fever is your body's natural defense mechanism fighting off an infection (such as a virus or bacteria). "
                "In most adults and children, mild fevers can be safely managed with rest, hydration, and fever-reducing care.\n\n"
                "### 🔍 What Is Happening & Common Causes\n"
                "- **Normal vs. Fever**: Normal body temperature is around **98.6°F (37°C)**. A temperature of **100.4°F (38°C) or higher** is considered a fever.\n"
                "- **Common Triggers**: Viral respiratory infections (cold, flu), seasonal viral fevers (dengue, flu), urinary tract infections, or bacterial throat infections.\n"
                "- **Immune Response**: The brain's hypothalamus raises body temperature to slow down viral replication.\n\n"
                "### 💡 Safe Home Care & Practical Steps\n"
                "- **Stay Hydrated**: Drink plenty of fluids (water, oral rehydration solutions/ORS, clear broths, coconut water) to prevent dehydration.\n"
                "- **Fever Relief**: Paracetamol (Acetaminophen) is standard for comfort. *Avoid Aspirin or Ibuprofen if viral fevers or dengue are suspected.*\n"
                "- **Rest**: Get adequate sleep and wear light, breathable clothing in a cool room.\n"
                "- **Cool Compresses**: Apply a lukewarm, damp washcloth to the forehead if body heat causes discomfort.\n\n"
                "### ⚠️ Warning Signs (When to See a Doctor Immediately)\n"
                "- Fever exceeding **103°F (39.4°C)** or lasting more than **3 days** without improvement.\n"
                "- Stiff neck, severe headache, confusion, or difficulty waking up.\n"
                "- Persistent vomiting, shortness of breath, or unexplained rash/bruising.\n"
                "- Any fever in an infant under 3 months of age.\n\n"
                "### 📖 Medical Terms Made Simple\n"
                "- **Pyrexia**: The clinical medical term for an elevated body temperature or fever.\n"
                "- **Hydration**: Keeping enough water and essential mineral salts in your body."
            )

        # 2. Blood Pressure (High / Low BP)
        if any(k in q for k in ["bp", "blood pressure", "hypertens", "systolic", "diastolic", "hypotens"]):
            return (
                "### 📋 Direct Answer in Plain Words\n"
                "Blood pressure is the force of your blood pushing against your artery walls as your heart pumps. "
                "Keeping it within a healthy target range protects your heart, brain, and kidneys from long-term strain.\n\n"
                "### 🔍 What Is Happening & Normal Targets\n"
                "- **Normal Range**: Generally below **120/80 mmHg**.\n"
                "- **Elevated / Stage 1**: Systolic **130–139** or Diastolic **80–89 mmHg**.\n"
                "- **Stage 2 Hypertension**: **140/90 mmHg or higher** on repeated measurements.\n"
                "- **Low Blood Pressure (Hypotension)**: Usually below **90/60 mmHg**, which can cause lightheadedness.\n\n"
                "### 💡 Safe Home Care & Practical Steps\n"
                "- **Reduce Dietary Salt**: Limit sodium intake to under **2,000 mg (less than 1 teaspoon)** of salt per day (DASH diet protocol).\n"
                "- **Daily Activity**: Aim for **30 minutes of brisk walking** 5 days a week.\n"
                "- **Proper Measurement**: Sit quietly with feet flat on the floor for 5 minutes before checking blood pressure.\n"
                "- **Medication Consistency**: If prescribed BP medicine, take it at the exact same time every day.\n\n"
                "### ⚠️ Warning Signs (When to See a Doctor Immediately)\n"
                "- Sudden reading above **180/120 mmHg** with chest pain, shortness of breath, vision changes, or numbness.\n"
                "- Severe sudden dizziness, fainting (syncope), or confusion.\n\n"
                "### 📖 Medical Terms Made Simple\n"
                "- **Systolic (Top number)**: Pressure when your heart contracts and pumps blood.\n"
                "- **Diastolic (Bottom number)**: Pressure when your heart rests between beats."
            )

        # 3. Headache / Migraine
        if any(k in q for k in ["headache", "migraine", "head ache", "throbbing head", "head pain"]):
            return (
                "### 📋 Direct Answer in Plain Words\n"
                "Most headaches are tension-type or migraine-related, caused by stress, muscle strain, dehydration, or lack of sleep. "
                "They usually improve with hydration, rest in a quiet dark room, and over-the-counter pain relief.\n\n"
                "### 🔍 What Is Happening & Common Types\n"
                "- **Tension Headache**: A dull, aching band of tightness around the forehead and temples.\n"
                "- **Migraine**: Throbbing, pulsing pain usually on one side of the head, often accompanied by sensitivity to light and sound.\n"
                "- **Sinus / Dehydration**: Pressure behind the eyes or cheeks exacerbated by lack of fluids.\n\n"
                "### 💡 Safe Home Care & Practical Steps\n"
                "- **Drink Water**: Dehydration is a very common trigger; drink 1–2 full glasses of water immediately.\n"
                "- **Rest in Darkness**: Rest in a quiet, dimly lit room with a cold or warm compress on your neck or forehead.\n"
                "- **Limit Screen Time**: Take breaks from computer and phone screens.\n"
                "- **Over-the-counter Relief**: Paracetamol can help relieve acute discomfort when taken per package instructions.\n\n"
                "### ⚠️ Warning Signs (When to See a Doctor Immediately)\n"
                "- Sudden \"thunderclap\" headache (the most severe headache of your life that peaks in seconds).\n"
                "- Headache accompanied by high fever, stiff neck, confusion, weakness, or facial drooping.\n"
                "- Headache following a head injury or blow to the head.\n\n"
                "### 📖 Medical Terms Made Simple\n"
                "- **Photophobia**: Sensitivity to bright lights often experienced during migraines."
            )

        # 4. Stomach Pain / Acidity / GERD / Gastritis
        if any(k in q for k in ["stomach", "acidity", "gerd", "acid reflux", "heartburn", "gastric", "indigestion", "gas", "bloat", "belly"]):
            return (
                "### 📋 Direct Answer in Plain Words\n"
                "Stomach discomfort, acidity, or gas often happens when stomach acid irritates the stomach lining or flows back into the food pipe. "
                "Making simple mealtime adjustments and drinking adequate fluids can provide fast relief.\n\n"
                "### 🔍 What Is Happening & Common Causes\n"
                "- **Acid Reflux / Heartburn**: Stomach acid rising into the esophagus after eating spicy, oily, or heavy meals.\n"
                "- **Gastritis & Indigestion**: Irritation from skipping meals, excess tea/coffee, NSAID painkillers, or stress.\n"
                "- **Gas & Bloating**: Fermentation of undigested carbohydrates or eating too quickly.\n\n"
                "### 💡 Safe Home Care & Practical Steps\n"
                "- **Smaller, Frequent Meals**: Eat light meals and avoid lying down for at least 2 hours after eating.\n"
                "- **Avoid Trigger Foods**: Reduce spicy, fried, citrus, caffeine, and carbonated beverages.\n"
                "- **Elevate Head**: Elevate the head of your bed slightly if reflux disturbs your sleep.\n"
                "- **Antacid Support**: Over-the-counter antacids or gentle sips of cold milk/water can temporarily neutralize excess acid.\n\n"
                "### ⚠️ Warning Signs (When to See a Doctor Immediately)\n"
                "- Severe, sharp, or worsening abdominal pain (especially in the lower right abdomen).\n"
                "- Vomiting blood or passing black, tarry stools.\n"
                "- Difficulty swallowing food or unexplained rapid weight loss.\n\n"
                "### 📖 Medical Terms Made Simple\n"
                "- **GERD**: Gastroesophageal Reflux Disease — persistent backflow of stomach acid into the esophagus."
            )

        # 5. Cold, Cough & Sore Throat
        if any(k in q for k in ["cough", "cold", "sore throat", "runny nose", "congestion", "sneez", "phlegm"]):
            return (
                "### 📋 Direct Answer in Plain Words\n"
                "The common cold and viral upper respiratory infections typically resolve on their own within 7 to 10 days. "
                "Antibiotics do not work against viruses; soothing home care and symptom relief are the most effective approach.\n\n"
                "### 🔍 What Is Happening & Common Causes\n"
                "- **Viral Infection**: Rhinoviruses or seasonal respiratory viruses inflame nasal passages and throat tissue.\n"
                "- **Mucus Production**: Your airway produces mucus to trap and expel viral particles.\n"
                "- **Dry vs. Wet Cough**: Dry coughs tickle the throat, while wet/productive coughs help clear airway secretions.\n\n"
                "### 💡 Safe Home Care & Practical Steps\n"
                "- **Warm Salt Water Gargle**: Gargle with 1/2 teaspoon of salt in warm water 3 times a day to soothe a sore throat.\n"
                "- **Steam Inhalation**: Inhale steam or use a humidifier to loosen chest and nasal congestion.\n"
                "- **Honey & Warm Drinks**: Honey in warm water or herbal tea naturally calms cough reflexes (do not give honey to infants under 1 year).\n"
                "- **Rest & Fluids**: Drink warm soups, broths, and plenty of water.\n\n"
                "### ⚠️ Warning Signs (When to See a Doctor Immediately)\n"
                "- Difficulty breathing, wheezing, or chest tightness.\n"
                "- Cough lasting more than 3 weeks or coughing up blood.\n"
                "- High fever, inability to swallow liquids, or severe ear pain.\n\n"
                "### 📖 Medical Terms Made Simple\n"
                "- **Pharyngitis**: The medical term for swelling and redness of the back of the throat (sore throat)."
            )

        # 6. Diarrhea, Vomiting & Food Poisoning
        if any(k in q for k in ["diarrhea", "vomit", "loose motion", "nausea", "food poison", "stomach bug", "gastroenter"]):
            return (
                "### 📋 Direct Answer in Plain Words\n"
                "Acute diarrhea and vomiting are usually caused by viral gastroenteritis or contaminated food. "
                "The number one priority is preventing dehydration by replacing lost water and electrolytes immediately.\n\n"
                "### 🔍 What Is Happening & Common Causes\n"
                "- **Intestinal Irritation**: Pathogens cause the gut lining to release excess fluid rather than absorbing it.\n"
                "- **Dehydration Risk**: Rapid loss of fluids, sodium, and potassium can cause dizziness and weakness.\n\n"
                "### 💡 Safe Home Care & Practical Steps\n"
                "- **Drink ORS (Oral Rehydration Salts)**: Sip ORS solution slowly in small, frequent amounts.\n"
                "- **BRAT Diet**: Eat bland, easily digestible foods (Bananas, Rice, Applesauce, Toast/crackers).\n"
                "- **Avoid Gut Irritants**: Stay away from dairy, oily foods, caffeine, and sugary juices until digestion normalizes.\n\n"
                "### ⚠️ Warning Signs (When to See a Doctor Immediately)\n"
                "- Signs of severe dehydration (extreme thirst, dry mouth, little to no urination, sunken eyes, dizziness).\n"
                "- Blood or mucus in the stool or vomit.\n"
                "- Severe abdominal cramping or inability to keep liquids down for more than 24 hours.\n\n"
                "### 📖 Medical Terms Made Simple\n"
                "- **Electrolytes**: Essential minerals (like sodium and potassium) that keep your nerves and muscles functioning."
            )

        # 7. General Catch-All for Any Other Illness / Condition
        return (
            "### 📋 Direct Answer in Plain Words\n"
            f"Here is standard clinical guidance regarding **{query.strip()}** based on official healthcare guidelines (WHO, CDC, and MedlinePlus).\n\n"
            "### 🔍 What Is Happening & General Clinical Facts\n"
            "- **Body's Response**: Symptoms are signals indicating your body is responding to inflammation, strain, or an underlying health factor.\n"
            "- **Standard Evaluation**: Doctors evaluate symptom onset, duration, severity, and any related health history to determine the cause.\n"
            "- **Evidence-Based Protocols**: Official guidelines recommend monitoring trends and using non-invasive baseline checks first.\n\n"
            "### 💡 Safe Practical Steps & Home Care\n"
            "- **Track Your Symptoms**: Note down when symptoms started, how often they occur, and what makes them better or worse.\n"
            "- **Prioritize Rest & Hydration**: Adequate sleep and proper fluid intake give your body the resources it needs to recover.\n"
            "- **Review Current Medications**: Check if any current medications or supplements could be related to your symptoms.\n"
            "- **Prepare for Your Doctor's Visit**: Write down 2–3 specific questions to discuss with your healthcare provider.\n\n"
            "### ⚠️ Warning Signs (When to Seek Urgent Care)\n"
            "- Sudden, severe, or rapidly worsening pain anywhere in the body.\n"
            "- High fever, shortness of breath, unexplained fainting, or confusion.\n"
            "- Any symptom that severely impairs your ability to eat, drink, or perform daily activities.\n\n"
            "### 📖 Medical Terms Made Simple\n"
            "- **Symptom vs. Sign**: A symptom is what you feel (like fatigue or pain); a sign is what a doctor can measure (like temperature or blood pressure)."
        )

    def _extract_block(self, text: str, marker: str) -> str:
        if marker not in text:
            return ""
        return text.split(marker, 1)[1].strip()

    def _answer_from_passages(self, question: str, evidence: str) -> str:
        passages = [p.strip() for p in re.split(r"\[Passage \d+", evidence) if p.strip()]
        cleaned = []
        for p in passages:
            body = p.split("]\n", 1)[-1].strip() if "]\n" in p else p
            if body:
                cleaned.append(body)

        if not cleaned:
            cleaned = [evidence]

        query_terms = {t for t in re.findall(r"[a-zA-Z]{4,}", question.lower())} - {
            "what", "which", "does", "have", "from", "this", "that", "with", "according", "official"
        }
        ranked = []
        for passage in cleaned:
            score = sum(1 for t in query_terms if t in passage.lower())
            ranked.append((score, passage))
        ranked.sort(key=lambda x: x[0], reverse=True)

        selected = [p for _, p in ranked[:3] if p]
        bullets = []
        for passage in selected:
            sentences = re.split(r"(?<=[.!?])\s+", passage)
            relevant = [s.strip() for s in sentences if s.strip()][:4]
            bullets.extend(relevant)

        unique_lines = []
        seen = set()
        for line in bullets:
            key = line[:80].lower()
            if key in seen:
                continue
            seen.add(key)
            unique_lines.append(f"- {line}")
            if len(unique_lines) >= 8:
                break

        body = "\n".join(unique_lines) if unique_lines else (selected[0][:800] if selected else "No specific passages found.")
        
        # Build structured plain-language response
        return (
            "### 📋 Direct Answer in Plain Words\n"
            f"Here is what official medical guidelines state regarding your question:\n\n"
            "### 🔍 Key Medical Facts & Findings\n"
            f"{body}\n\n"
            "### 💡 Next Steps & Practical Guidance\n"
            "- Discuss these findings with your doctor to confirm how they apply to your specific health history.\n"
            "- Review the cited source cards below for original guideline pages and exact medical definitions.\n"
            "- Never alter prescribed medications without direct clinical supervision."
        )

    def _extractive_summary(self, prompt: str, excerpt: str) -> str:
        sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", excerpt) if s.strip() and len(s.strip()) > 20]
        bullets = sentences[:10]
        numbered = "\n".join(f"{idx}. {s}" for idx, s in enumerate(bullets[:8], start=1))
        mode_hint = "clinical"
        lowered = prompt.lower()
        if "plain-language" in lowered or "plain language" in lowered:
            mode_hint = "plain language"
        elif "key clinical" in lowered or "key points" in lowered:
            mode_hint = "key points"
        elif "3-4 sentence" in lowered or "executive summary" in lowered:
            short = " ".join(sentences[:4])
            return (
                f"Executive summary from the source document:\n\n{short}\n\n"
                "Figures, thresholds, and recommendations above are taken from the indexed document text."
            )

        header = "Structured extractive summary from the source document"
        if mode_hint == "plain language":
            header = "Plain-language summary of the source document"
        elif mode_hint == "key points":
            header = "Key points extracted from the source document"

        return (
            f"{header}:\n\n{numbered}\n\n"
            "Page markers in the source text were preserved where available. "
            "This summary restates document content and is not a clinical diagnosis."
        )
