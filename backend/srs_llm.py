import io
import re
import os
import json
import uuid
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)


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


def _extract_requirements(srs_text: str) -> List[str]:
    raw_lines = [l.strip() for l in srs_text.splitlines() if l.strip()]
    statements = []

    modal_pattern = re.compile(
        r"\b(shall|must|should|will|can|allow|allows|provide|provides|enable|enables|support|supports|require|requires|manage|manages|create|creates|generate|generates|process|processes|display|displays|track|tracks|system)\b",
        re.IGNORECASE,
    )

    for line in raw_lines:
        # Ignore headings or very short lines
        if len(line) < 15 or line.startswith(("#", "===", "---")):
            continue

        # Strip bullet points or numbered markers: e.g. "1. ", "1.1 ", "- ", "* ", "REQ-01: "
        cleaned = re.sub(
            r"^(\d+(\.\d+)*[:.)]?|[-*•>]|REQ(-\d+)?:?|FR(-\d+)?:?)\s*",
            "",
            line,
            flags=re.IGNORECASE,
        ).strip()
        if len(cleaned) < 15:
            continue

        # If line contains multiple sentences with modal verbs, split them
        sentences = re.split(r"(?<=[.!?])\s+(?=[A-Z])", cleaned)
        for s in sentences:
            s_clean = s.strip()
            if len(s_clean) >= 15 and (modal_pattern.search(s_clean) or len(statements) < 3):
                statements.append(s_clean)

    # Deduplicate while preserving order
    seen = set()
    deduped = []
    for s in statements:
        norm = s.lower()
        if norm not in seen:
            seen.add(norm)
            deduped.append(s)

    if not deduped:
        # Fallback to any non-empty lines
        deduped = [l for l in raw_lines if len(l) >= 15][:10]

    return deduped


def _categorize(text: str) -> str:
    t = text.lower()
    if any(k in t for k in ["auth", "login", "logout", "password", "jwt", "token", "register", "security", "credential"]):
        return "Authentication & Security"
    if any(k in t for k in ["user", "profile", "account", "invite", "member", "role", "permission", "team"]):
        return "User & Team Management"
    if any(k in t for k in ["upload", "file", "document", "srs", "pdf", "docx", "import", "export", "download"]):
        return "Document & File Processing"
    if any(k in t for k in ["generate", "backlog", "epic", "story", "task", "plan", "capacity", "schedule", "replan", "algorithm"]):
        return "Agile Planning Engine"
    if any(k in t for k in ["board", "kanban", "card", "column", "drag", "progress", "to do", "done"]):
        return "Kanban & Sprint Execution"
    if any(k in t for k in ["notification", "alert", "email", "message", "real-time", "chat"]):
        return "Notifications & Alerts"
    if any(k in t for k in ["report", "analytic", "metric", "dashboard", "precision", "recall", "f1", "chart"]):
        return "Analytics & Insights"
    if any(k in t for k in ["payment", "invoice", "checkout", "cart", "billing", "order"]):
        return "Billing & Payments"
    if any(k in t for k in ["api", "database", "store", "persist", "data", "model", "schema"]):
        return "Data Architecture"
    return "Core Business Features"


def _infer_skills(text: str) -> List[str]:
    t = text.lower()
    skills = []
    if any(k in t for k in ["auth", "jwt", "login", "password", "security"]):
        skills.extend(["python", "fastapi"])
    if any(k in t for k in ["upload", "pdf", "docx", "file", "extract"]):
        skills.extend(["python", "pypdf"])
    if any(k in t for k in ["board", "kanban", "dashboard", "ui", "view", "interface", "display"]):
        skills.extend(["react", "css"])
    if any(k in t for k in ["data", "store", "persist", "database", "mongo"]):
        skills.extend(["mongodb", "python"])
    if any(k in t for k in ["plan", "capacity", "algorithm", "metric", "replan", "calculate"]):
        skills.extend(["python", "fastapi"])
    if any(k in t for k in ["real-time", "notification", "email"]):
        skills.extend(["react", "typescript"])

    if not skills:
        skills = ["python", "react"]
    return list(dict.fromkeys(skills))


def _clean_title(text: str) -> str:
    cleaned = re.sub(
        r"^(the system (shall|must|should|will|can)|users? (shall|must|should|will|can)|managers? (shall|must|should|will|can)|it (shall|must|should|will|can)|application (shall|must|should|will|can))\s+",
        "",
        text,
        flags=re.IGNORECASE,
    ).strip()
    words = cleaned.split()
    if len(words) > 7:
        cleaned = " ".join(words[:7])
    return cleaned.rstrip(".,;").capitalize()


def _extract_backlog_heuristically(srs_text: str) -> dict:
    reqs = _extract_requirements(srs_text)
    if not reqs:
        reqs = ["System shall provide automated project setup and management."]

    # Group requirements by category
    categorized: Dict[str, List[str]] = {}
    for r in reqs:
        cat = _categorize(r)
        categorized.setdefault(cat, []).append(r)

    epics = []
    stories = []
    tasks = []

    epic_key_map = {}
    for idx, (cat_name, cat_reqs) in enumerate(categorized.items(), start=1):
        e_key = f"E{idx}"
        epic_key_map[cat_name] = e_key
        epics.append({
            "key": e_key,
            "title": cat_name,
            "description": f"Encompasses all {cat_name.lower()} capabilities defined in the SRS specification."
        })

    story_counter = 1
    task_counter = 1
    prev_story_key = None

    for cat_name, cat_reqs in categorized.items():
        e_key = epic_key_map[cat_name]
        for req in cat_reqs:
            s_key = f"S{story_counter}"
            title = _clean_title(req)
            skills = _infer_skills(req)

            if any(k in cat_name for k in ["Authentication", "Security", "Data"]):
                priority = "Critical" if story_counter <= 2 else "High"
            elif any(k in cat_name for k in ["Core", "Planning"]):
                priority = "High"
            elif any(k in cat_name for k in ["Analytics", "Notifications"]):
                priority = "Medium"
            else:
                priority = "Medium"

            length = len(req)
            points = 2 if length < 50 else (3 if length < 100 else 5)
            depends_on = [prev_story_key] if (prev_story_key and story_counter % 3 != 1) else []

            stories.append({
                "key": s_key,
                "epic": e_key,
                "title": title,
                "description": f"As a user, I need the system to {req[0].lower() + req[1:] if len(req) > 1 else req} to satisfy project requirements.",
                "priority": priority,
                "story_points": points,
                "skills": skills,
                "acceptance_criteria": [
                    f"Verified: {req}",
                    "Implementation satisfies unit test coverage and API contracts.",
                    "User interface reflects real-time status transitions."
                ],
                "depends_on": depends_on
            })

            # Task 1: Backend implementation
            t1_key = f"T{task_counter}"
            tasks.append({
                "key": t1_key,
                "story": s_key,
                "title": f"Backend API & Logic: {title}",
                "description": f"Develop server endpoints, data validation, and logic for {title}.",
                "priority": priority,
                "story_points": max(1, points // 2),
                "skills": [s for s in skills if s in ["python", "fastapi", "mongodb", "pypdf"]] or ["python"],
                "depends_on": []
            })
            task_counter += 1

            # Task 2: Frontend implementation if UI involved
            if any(s in skills for s in ["react", "css", "typescript"]) or "ui" in req.lower() or "board" in req.lower():
                t2_key = f"T{task_counter}"
                tasks.append({
                    "key": t2_key,
                    "story": s_key,
                    "title": f"Frontend UI & Integration: {title}",
                    "description": f"Implement user interface components and connect to backend APIs for {title}.",
                    "priority": priority,
                    "story_points": max(1, points - (points // 2)),
                    "skills": [s for s in skills if s in ["react", "css", "typescript"]] or ["react"],
                    "depends_on": [t1_key]
                })
                task_counter += 1

            prev_story_key = s_key
            story_counter += 1

    return {
        "requirements": reqs,
        "epics": epics,
        "stories": stories,
        "tasks": tasks
    }


async def generate_backlog(srs_text: str) -> dict:
    """
    Generate an Agile backlog from SRS text.
    If an OpenAI key is present, attempts AI extraction with strict JSON parsing;
    otherwise falls back to an intelligent heuristic NLP extractor.
    """
    openai_key = os.environ.get("OPENAI_API_KEY")
    if openai_key:
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=openai_key)
            prompt = (
                "You are an expert Agile coach. Transform this SRS into an Agile backlog.\n"
                "Return ONLY valid JSON matching this structure:\n"
                "{\n"
                '  "requirements": ["req1", "req2"],\n'
                '  "epics": [{"key": "E1", "title": "...", "description": "..."}],\n'
                '  "stories": [{"key": "S1", "epic": "E1", "title": "...", "description": "...", "priority": "High", "story_points": 3, "skills": ["python"], "acceptance_criteria": ["..."], "depends_on": []}],\n'
                '  "tasks": [{"key": "T1", "story": "S1", "title": "...", "description": "...", "priority": "High", "story_points": 2, "skills": ["python"], "depends_on": []}]\n'
                "}\n\n"
                f"SRS Text:\n{srs_text[:8000]}"
            )
            response = await client.chat.completions.create(
                model=os.environ.get("OPENAI_MODEL", "gpt-4o-mini"),
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                response_format={"type": "json_object"}
            )
            content = response.choices[0].message.content
            parsed = json.loads(content)
            if parsed.get("requirements") and (parsed.get("stories") or parsed.get("tasks")):
                return parsed
        except Exception as e:
            logger.warning(f"OpenAI backlog generation failed: {e}. Falling back to heuristic parser.")

    return _extract_backlog_heuristically(srs_text)
