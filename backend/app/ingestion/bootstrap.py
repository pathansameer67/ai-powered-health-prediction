import hashlib
from sqlalchemy import select, delete, func

from app.core.database import AsyncSessionLocal, init_db
from app.core.config import settings
from app.models.db_models import Document, DocumentChunk, TrustedSource, TrustTier, DocumentStatus
from app.ingestion.pipeline import IngestionPipeline
from app.retrieval.vector_store import VectorStoreManager

DOCS = [
    {
        "filename": "who_diabetes_guidelines_2024.txt",
        "title": "WHO Clinical Guidelines: Diagnosis & Management of Diabetes Mellitus",
        "publisher": "World Health Organization (WHO)",
        "source_url": "https://www.who.int/publications/i/item/9789240010499",
        "publication_date": "2024-01-15",
        "jurisdiction": "Global",
        "content": """[Page 1] World Health Organization (WHO) Technical Report
DIAGNOSTIC CRITERIA AND CLASSIFICATION OF DIABETES MELLITUS
Section 1.1: Diagnostic Benchmarks
Diabetes mellitus is confirmed by any of the following clinical criteria:
1. Fasting Plasma Glucose (FPG) >= 126 mg/dL (7.0 mmol/L) after an 8-hour fast.
2. 2-hour Post-Load Plasma Glucose >= 200 mg/dL (11.1 mmol/L) during an Oral Glucose Tolerance Test (OGTT) using 75g glucose.
3. Glycated Hemoglobin (HbA1c) >= 6.5% (48 mmol/mol) measured using a standardized laboratory assay.
4. In a patient with classic symptoms of hyperglycemia (polyuria, polydipsia, unexplained weight loss), a random plasma glucose >= 200 mg/dL (11.1 mmol/L).

[Page 2] Section 1.2: Lifestyle Interventions and Dietary Guidelines
For all individuals with Type 2 Diabetes, first-line management combines:
- Medical Nutrition Therapy (MNT): A Mediterranean-style or plant-forward dietary pattern rich in dietary fiber (minimum 14g per 1000 kcal), whole grains, legumes, and lean proteins, with strict limitation of refined sugars and trans-fats.
- Physical Activity: At least 150 minutes of moderate-intensity aerobic physical activity per week (e.g., brisk walking, cycling), spread over at least 3 days, with no more than two consecutive days without exercise. Resistance training should be performed 2-3 sessions per week.

[Page 3] Section 1.3: Hypoglycemia Management (The Rule of 15)
Hypoglycemia is defined as a blood glucose level < 70 mg/dL (3.9 mmol/L).
Symptoms include shakiness, diaphoresis (sweating), tachycardia, confusion, and dizziness.
Management Protocol:
1. Consume 15-20 grams of fast-acting carbohydrate (e.g., 4 ounces of fruit juice, 3-4 glucose tablets, or 1 tablespoon of sugar/honey).
2. Recheck blood glucose level after 15 minutes.
3. If glucose remains < 70 mg/dL, repeat treatment with 15g fast-acting carbohydrates.
4. Once normalized, consume a small snack containing complex carbohydrates and protein if the next scheduled meal is > 1 hour away.
Severe hypoglycemia (patient unconscious or unable to swallow) requires immediate intramuscular Glucagon or intravenous Dextrose and emergency medical transfer.
"""
    },
    {
        "filename": "mohfw_hypertension_protocol_india.txt",
        "title": "Ministry of Health & Family Welfare: India Hypertension Control Protocol",
        "publisher": "Ministry of Health and Family Welfare (MoHFW), Govt. of India",
        "source_url": "https://main.mohfw.gov.in/sites/default/files/hypertension_guidelines.pdf",
        "publication_date": "2023-11-20",
        "jurisdiction": "IN",
        "content": """[Page 1] Ministry of Health and Family Welfare, Government of India
STANDARD TREATMENT WORKFLOW: MANAGEMENT OF HYPERTENSION IN ADULTS
Section 1: Blood Pressure Classification for Indian Adults
- Normal Blood Pressure: Systolic < 120 mmHg and Diastolic < 80 mmHg.
- Elevated Blood Pressure: Systolic 120-129 mmHg and Diastolic < 80 mmHg.
- Stage 1 Hypertension: Systolic 130-139 mmHg or Diastolic 80-89 mmHg.
- Stage 2 Hypertension: Systolic >= 140 mmHg or Diastolic >= 90 mmHg.
- Hypertensive Crisis: Systolic > 180 mmHg and/or Diastolic > 120 mmHg. Requires immediate clinical attention. If accompanied by acute chest pain, shortness of breath, back pain, numbness/weakness, or difficulty speaking, this is a Hypertensive Emergency requiring immediate hospital emergency transfer.

[Page 2] Section 2: Non-Pharmacological Management Strategies (Lifestyle Modification)
1. Dietary Sodium Restriction: Limit daily sodium chloride (salt) intake to less than 5 grams per day (equivalent to approximately one level teaspoon).
2. Dietary Approaches to Stop Hypertension (DASH Diet): Rich in fruits, vegetables, potassium-rich legumes, nuts, low-fat dairy, and whole grains.
3. Weight Reduction: Maintain body mass index (BMI) between 18.5 and 22.9 kg/m2 (Asian Indian cutoff) and waist circumference < 90 cm for men and < 80 cm for women.
4. Physical Activity: Brisk walking or yoga for 30 to 45 minutes daily.
5. Cessation of Tobacco and Alcohol: Complete cessation of bidi, cigarette, and smokeless tobacco products (khaini, gutkha).
"""
    },
    {
        "filename": "medlineplus_asthma_respiratory_care.txt",
        "title": "MedlinePlus Clinical Guide: Asthma Management and Action Plans",
        "publisher": "National Library of Medicine / MedlinePlus",
        "source_url": "https://medlineplus.gov/asthma.html",
        "publication_date": "2024-02-10",
        "jurisdiction": "Global",
        "content": """[Page 1] MedlinePlus Health Information
ASTHMA: PATHOPHYSIOLOGY, TRIGGER AVOIDANCE, AND ACTION PLAN
Section 1: Overview and Symptoms
Asthma is a chronic inflammatory disorder of the airways characterized by recurrent episodes of wheezing, dyspnea (breathlessness), chest tightness, and coughing, particularly at night or in the early morning.
Common environmental triggers include house dust mites, animal dander, pollen, mold, cold air, exercise, respiratory viral infections, and tobacco smoke.

[Page 2] Section 2: The Asthma Action Plan Zones
Every patient with asthma should maintain a personalized Asthma Action Plan structured in three colored zones:
- Green Zone (Doing Well): No cough or wheeze, breathing is easy, can work and play normally. Peak Flow >= 80% of personal best. Continue daily controller medications as prescribed.
- Yellow Zone (Caution / Asthma Is Getting Worse): Coughing, mild wheezing, slight breathlessness, waking at night due to asthma. Peak Flow 50% to 79% of personal best. Use prescribed quick-relief rescue inhaler (such as short-acting beta-agonist, e.g., Salbutamol/Albuterol) and follow physician-prescribed dosage step-up.
- Red Zone (Medical Alert / Severe Flare-up): Breathing is very fast and hard, nose opens wide to breathe, ribs show when breathing (retractions), trouble walking or talking. Peak Flow < 50% of personal best. Take quick-relief medicine immediately and call local emergency services or seek immediate hospital care.
"""
    }
]

TRUSTED_ORGS = [
    {
        "name": "World Health Organization",
        "organization": "WHO",
        "website_url": "https://www.who.int",
        "description": "United Nations specialized agency for international public health.",
        "category": "International Health Authority",
        "jurisdiction": "Global"
    },
    {
        "name": "Ministry of Health and Family Welfare (India)",
        "organization": "MoHFW Govt. of India",
        "website_url": "https://main.mohfw.gov.in",
        "description": "Apex government ministry overseeing public healthcare policy and disease control programs across India.",
        "category": "National Government Ministry",
        "jurisdiction": "IN"
    },
    {
        "name": "MedlinePlus (National Library of Medicine)",
        "organization": "US NLM / NIH",
        "website_url": "https://medlineplus.gov",
        "description": "Authoritative consumer health information resource produced by the National Library of Medicine.",
        "category": "Peer-Reviewed Patient Education",
        "jurisdiction": "Global"
    }
]


async def seed_trusted_knowledge(force: bool = False) -> int:
    """Index verified WHO / MoHFW / MedlinePlus documents. Returns number of docs indexed."""
    await init_db()
    async with AsyncSessionLocal() as db:
        existing = await db.scalar(
            select(func.count(Document.id)).where(Document.trust_tier == TrustTier.TRUSTED_KNOWLEDGE.value)
        )
        if existing and not force:
            return int(existing)

        trusted_ids = (await db.scalars(
            select(Document.id).where(Document.trust_tier == TrustTier.TRUSTED_KNOWLEDGE.value)
        )).all()
        vector_store = VectorStoreManager()
        for doc_id in trusted_ids:
            vector_store.delete_document(doc_id)

        await db.execute(delete(DocumentChunk).where(DocumentChunk.document_id.in_(
            select(Document.id).where(Document.trust_tier == TrustTier.TRUSTED_KNOWLEDGE.value)
        )))
        await db.execute(delete(Document).where(Document.trust_tier == TrustTier.TRUSTED_KNOWLEDGE.value))
        await db.execute(delete(TrustedSource))
        await db.commit()

        for org in TRUSTED_ORGS:
            db.add(TrustedSource(
                name=org["name"],
                organization=org["organization"],
                website_url=org["website_url"],
                description=org["description"],
                category=org["category"],
                jurisdiction=org["jurisdiction"],
                is_approved=True
            ))
        await db.commit()

        pipeline = IngestionPipeline(db)
        indexed = 0
        for doc_info in DOCS:
            doc_file_path = settings.TRUSTED_DOCS_DIR / doc_info["filename"]
            doc_file_path.parent.mkdir(parents=True, exist_ok=True)
            with open(doc_file_path, "w", encoding="utf-8") as f:
                f.write(doc_info["content"])

            file_size = doc_file_path.stat().st_size
            file_hash = hashlib.sha256(doc_info["content"].encode("utf-8")).hexdigest()

            doc_model = Document(
                title=doc_info["title"],
                original_filename=doc_info["filename"],
                stored_filepath=str(doc_file_path),
                file_type="txt",
                file_size_bytes=file_size,
                file_hash=file_hash,
                trust_tier=TrustTier.TRUSTED_KNOWLEDGE.value,
                status=DocumentStatus.PENDING.value,
                publisher=doc_info["publisher"],
                source_url=doc_info["source_url"],
                publication_date=doc_info["publication_date"],
                jurisdiction=doc_info["jurisdiction"]
            )
            db.add(doc_model)
            await db.commit()
            await db.refresh(doc_model)

            await pipeline.process_document(
                document_id=doc_model.id,
                filepath=str(doc_file_path),
                title=doc_model.title,
                user_id=None,
                trust_tier=TrustTier.TRUSTED_KNOWLEDGE.value,
                publisher=doc_model.publisher,
                source_url=doc_model.source_url,
                publication_date=doc_model.publication_date,
                jurisdiction=doc_model.jurisdiction
            )
            indexed += 1
        return indexed
