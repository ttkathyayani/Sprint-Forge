import io
import json
import uuid

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

async def generate_backlog(srs_text: str) -> dict:
    # Dummy mock response since AI logic is removed
    return {
        "requirements": ["Mock Requirement 1"],
        "epics": [{"key": "E1", "title": "Setup", "description": "Initial Setup"}],
        "stories": [{"key": "S1", "epic": "E1", "title": "Create Repository", "description": "Init repo", "priority": "High", "story_points": 3, "skills": ["Git"], "acceptance_criteria": ["Repo exists"], "depends_on": []}],
        "tasks": [{"key": "T1", "story": "S1", "title": "Run git init", "description": "Initialize empty repo", "priority": "High", "story_points": 1, "skills": ["Git"], "depends_on": []}]
    }
