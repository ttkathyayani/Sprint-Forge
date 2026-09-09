import os
import io
import json
import uuid

from emergentintegrations.llm.chat import LlmChat, UserMessage

SYSTEM_PROMPT = """You are an expert Agile business analyst and technical lead.
You convert Software Requirements Specification (SRS) text into a structured Agile backlog.

Return ONLY valid JSON (no markdown fences) with this exact shape:
{
  "requirements": ["atomic requirement statement", ...],
  "epics": [{"key": "E1", "title": "...", "description": "..."}],
  "stories": [{"key": "S1", "epic": "E1", "title": "...", "description": "...",
               "priority": "Critical|High|Medium|Low", "story_points": 1-13,
               "skills": ["Python", "FastAPI"], "acceptance_criteria": ["..."],
               "depends_on": ["S0"]}],
  "tasks": [{"key": "T1", "story": "S1", "title": "...", "description": "...",
             "priority": "Critical|High|Medium|Low", "story_points": 1-8,
             "skills": ["..."], "depends_on": ["T0"]}]
}

Rules:
- Extract every distinct requirement as an atomic statement.
- story_points use a Fibonacci-like scale (1,2,3,5,8,13).
- Model realistic technical dependencies (e.g. database before API before UI).
- Keep skills concrete (languages, frameworks, tools).
- Prioritise foundational/security work higher."""


def extract_text(filename: str, content: bytes) -> str:
    name = (filename or "").lower()
    if name.endswith(".pdf"):
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(content))
        return "\n".join((p.extract_text() or "") for p in reader.pages)
    if name.endswith(".docx"):
        import docx
        doc = docx.Document(io.BytesIO(content))
        return "\n".join(p.text for p in doc.paragraphs)
    return content.decode("utf-8", errors="ignore")


def _clean_json(raw: str) -> str:
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("```", 2)[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return raw.strip().strip("`").strip()


async def generate_backlog(srs_text: str) -> dict:
    chat = LlmChat(
        api_key=os.environ["EMERGENT_LLM_KEY"],
        session_id=f"srs-{uuid.uuid4()}",
        system_message=SYSTEM_PROMPT,
    ).with_model("anthropic", "claude-sonnet-4-6")

    prompt = f"Transform this SRS into an Agile backlog. SRS:\n\n{srs_text[:12000]}"
    resp = await chat.send_message(UserMessage(text=prompt))
    text = resp if isinstance(resp, str) else getattr(resp, "content", str(resp))
    return json.loads(_clean_json(text))
