import time
import uuid
import asyncio
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Response, UploadFile, File
from pydantic import BaseModel, EmailStr, Field

from db import db
import auth
import planner
import srs_llm

api_router = APIRouter(prefix="/api")


def now_iso():
    return datetime.now(timezone.utc).isoformat()


async def get_project(pid: str, user: dict) -> dict:
    project = await db.projects.find_one({"id": pid, "owner_id": user["id"]}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


# ---------- Auth ----------
class RegisterBody(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)


class LoginBody(BaseModel):
    email: EmailStr
    password: str


@api_router.post("/auth/register")
async def register(body: RegisterBody, response: Response):
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    user = {"id": str(uuid.uuid4()), "email": email, "name": body.name,
            "password_hash": auth.hash_password(body.password), "role": "manager",
            "created_at": now_iso()}
    await db.users.insert_one(user)
    access = auth.create_access_token(user["id"], email)
    auth.set_auth_cookies(response, access, auth.create_refresh_token(user["id"]))
    return {"id": user["id"], "email": email, "name": body.name, "role": "manager", "token": access}


@api_router.post("/auth/login")
async def login(body: LoginBody, response: Response):
    user = await db.users.find_one({"email": body.email.lower()})
    if not user or not auth.verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    access = auth.create_access_token(user["id"], user["email"])
    auth.set_auth_cookies(response, access, auth.create_refresh_token(user["id"]))
    return {"id": user["id"], "email": user["email"], "name": user["name"],
            "role": user["role"], "token": access}


@api_router.post("/auth/logout")
async def logout(response: Response, user: dict = Depends(auth.get_current_user)):
    auth.clear_auth_cookies(response)
    return {"ok": True}


@api_router.get("/auth/me")
async def me(user: dict = Depends(auth.get_current_user)):
    return user


# ---------- Projects ----------
class ProjectBody(BaseModel):
    name: str
    description: str = ""
    sprint_length_days: int = 14


@api_router.get("/projects")
async def list_projects(user: dict = Depends(auth.get_current_user)):
    projects = await db.projects.find({"owner_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    for p in projects:
        p["backlog_count"] = await db.backlog.count_documents({"project_id": p["id"]})
        p["team_count"] = await db.developers.count_documents({"project_id": p["id"]})
    return projects


@api_router.post("/projects")
async def create_project(body: ProjectBody, user: dict = Depends(auth.get_current_user)):
    project = {"id": str(uuid.uuid4()), "owner_id": user["id"], "name": body.name,
               "description": body.description, "sprint_length_days": body.sprint_length_days,
               "ground_truth_count": 0, "created_at": now_iso()}
    await db.projects.insert_one(project)
    project.pop("_id", None)
    return project


@api_router.get("/projects/{pid}")
async def get_project_detail(pid: str, user: dict = Depends(auth.get_current_user)):
    return await get_project(pid, user)


@api_router.delete("/projects/{pid}")
async def delete_project(pid: str, user: dict = Depends(auth.get_current_user)):
    await get_project(pid, user)
    for col in [db.projects, db.backlog, db.requirements, db.developers, db.sprints]:
        await col.delete_many({"project_id": pid} if col is not db.projects else {"id": pid})
    return {"ok": True}


class GroundTruthBody(BaseModel):
    ground_truth_count: int


@api_router.patch("/projects/{pid}")
async def update_project(pid: str, body: GroundTruthBody, user: dict = Depends(auth.get_current_user)):
    await get_project(pid, user)
    await db.projects.update_one({"id": pid}, {"$set": {"ground_truth_count": body.ground_truth_count}})
    return {"ok": True}


# ---------- SRS / Backlog generation ----------
async def _store_generated(pid: str, srs_text: str, source: str, result: dict):
    reqs = result.get("requirements", [])
    req_docs = [{"id": str(uuid.uuid4()), "project_id": pid, "text": r, "source": source,
                 "created_at": now_iso()} for r in reqs]
    if req_docs:
        await db.requirements.insert_many(req_docs)

    key_map = {}
    for e in result.get("epics", []):
        key_map[e.get("key")] = str(uuid.uuid4())
    for s in result.get("stories", []):
        key_map[s.get("key")] = str(uuid.uuid4())
    for t in result.get("tasks", []):
        key_map[t.get("key")] = str(uuid.uuid4())

    docs = []

    def base(item, itype, status):
        skills = item.get("skills", []) or []
        sp = item.get("story_points", 0) or 0
        return {
            "id": key_map.get(item.get("key"), str(uuid.uuid4())),
            "project_id": pid, "type": itype, "key": item.get("key"),
            "title": item.get("title", "Untitled"), "description": item.get("description", ""),
            "priority": item.get("priority", "Medium"), "story_points": sp, "expert_points": sp,
            "skills": skills, "acceptance_criteria": item.get("acceptance_criteria", []),
            "dependencies": [key_map[d] for d in item.get("depends_on", []) if d in key_map],
            "parent": key_map.get(item.get("epic") or item.get("story")),
            "status": status, "ai_confidence": round(min(0.99, 0.72 + len(skills) * 0.05), 2),
            "sprint_id": None, "assignee_id": None, "board_status": None,
            "created_at": now_iso(),
        }

    for e in result.get("epics", []):
        docs.append(base(e, "epic", "approved"))
    for s in result.get("stories", []):
        docs.append(base(s, "story", "proposed"))
    for t in result.get("tasks", []):
        docs.append(base(t, "task", "proposed"))
    if docs:
        await db.backlog.insert_many(docs)
    return {"requirements": len(req_docs), "epics": len(result.get("epics", [])),
            "stories": len(result.get("stories", [])), "tasks": len(result.get("tasks", []))}


class SrsTextBody(BaseModel):
    text: str


async def _run_srs_job(pid: str, text: str, source: str, job_id: str):
    try:
        result = await srs_llm.generate_backlog(text)
        summary = await _store_generated(pid, text, source, result)
        await db.srs_jobs.update_one({"id": job_id}, {"$set": {"status": "done", "summary": summary}})
    except Exception as e:
        await db.srs_jobs.update_one({"id": job_id}, {"$set": {"status": "error", "error": str(e)}})


async def _launch_job(pid: str, text: str, source: str) -> dict:
    job = {"id": str(uuid.uuid4()), "project_id": pid, "status": "processing",
           "source": source, "created_at": now_iso()}
    await db.srs_jobs.insert_one(job)
    asyncio.create_task(_run_srs_job(pid, text, source, job["id"]))
    return {"job_id": job["id"], "status": "processing"}


@api_router.post("/projects/{pid}/srs/text")
async def srs_from_text(pid: str, body: SrsTextBody, user: dict = Depends(auth.get_current_user)):
    await get_project(pid, user)
    if len(body.text.strip()) < 20:
        raise HTTPException(status_code=400, detail="Please provide more requirement text")
    return await _launch_job(pid, body.text, "pasted-text")


@api_router.post("/projects/{pid}/srs/upload")
async def srs_from_file(pid: str, file: UploadFile = File(...), user: dict = Depends(auth.get_current_user)):
    await get_project(pid, user)
    content = await file.read()
    text = srs_llm.extract_text(file.filename, content)
    if len(text.strip()) < 20:
        raise HTTPException(status_code=400, detail="Could not extract readable text from file")
    return await _launch_job(pid, text, file.filename)


@api_router.get("/projects/{pid}/srs/jobs/{job_id}")
async def srs_job_status(pid: str, job_id: str, user: dict = Depends(auth.get_current_user)):
    await get_project(pid, user)
    job = await db.srs_jobs.find_one({"id": job_id, "project_id": pid}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@api_router.get("/projects/{pid}/requirements")
async def list_requirements(pid: str, user: dict = Depends(auth.get_current_user)):
    await get_project(pid, user)
    return await db.requirements.find({"project_id": pid}, {"_id": 0}).to_list(1000)


# ---------- Backlog ----------
@api_router.get("/projects/{pid}/backlog")
async def list_backlog(pid: str, user: dict = Depends(auth.get_current_user)):
    await get_project(pid, user)
    return await db.backlog.find({"project_id": pid}, {"_id": 0}).sort("created_at", 1).to_list(2000)


class BacklogBody(BaseModel):
    type: str = "task"
    title: str
    description: str = ""
    priority: str = "Medium"
    story_points: int = 3
    skills: List[str] = []
    acceptance_criteria: List[str] = []
    dependencies: List[str] = []


@api_router.post("/projects/{pid}/backlog")
async def add_backlog(pid: str, body: BacklogBody, user: dict = Depends(auth.get_current_user)):
    await get_project(pid, user)
    doc = {"id": str(uuid.uuid4()), "project_id": pid, "key": None, "parent": None,
           "status": "approved", "ai_confidence": None, "expert_points": body.story_points,
           "sprint_id": None, "assignee_id": None, "board_status": None,
           "created_at": now_iso(), **body.model_dump()}
    await db.backlog.insert_one(doc)
    doc.pop("_id", None)
    return doc


class BacklogUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    story_points: Optional[int] = None
    expert_points: Optional[int] = None
    skills: Optional[List[str]] = None
    acceptance_criteria: Optional[List[str]] = None
    dependencies: Optional[List[str]] = None
    status: Optional[str] = None


@api_router.patch("/backlog/{item_id}")
async def update_backlog(item_id: str, body: BacklogUpdate, user: dict = Depends(auth.get_current_user)):
    item = await db.backlog.find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    await get_project(item["project_id"], user)
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if updates:
        await db.backlog.update_one({"id": item_id}, {"$set": updates})
    return await db.backlog.find_one({"id": item_id}, {"_id": 0})


@api_router.delete("/backlog/{item_id}")
async def delete_backlog(item_id: str, user: dict = Depends(auth.get_current_user)):
    item = await db.backlog.find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    await get_project(item["project_id"], user)
    await db.backlog.delete_one({"id": item_id})
    return {"ok": True}


@api_router.post("/projects/{pid}/backlog/approve-all")
async def approve_all(pid: str, user: dict = Depends(auth.get_current_user)):
    await get_project(pid, user)
    res = await db.backlog.update_many({"project_id": pid, "status": "proposed"},
                                       {"$set": {"status": "approved"}})
    return {"approved": res.modified_count}


class BoardBody(BaseModel):
    board_status: str


@api_router.patch("/backlog/{item_id}/board")
async def move_board(item_id: str, body: BoardBody, user: dict = Depends(auth.get_current_user)):
    item = await db.backlog.find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    await get_project(item["project_id"], user)
    await db.backlog.update_one({"id": item_id}, {"$set": {"board_status": body.board_status}})
    return {"ok": True}


# ---------- Team ----------
class DeveloperBody(BaseModel):
    name: str
    role: str = "Engineer"
    skills: List[str] = []
    experience_years: int = 3
    availability_pct: int = 100
    capacity_points: int = 20
    avatar: str = ""


@api_router.get("/projects/{pid}/developers")
async def list_developers(pid: str, user: dict = Depends(auth.get_current_user)):
    await get_project(pid, user)
    return await db.developers.find({"project_id": pid}, {"_id": 0}).sort("created_at", 1).to_list(200)


@api_router.post("/projects/{pid}/developers")
async def add_developer(pid: str, body: DeveloperBody, user: dict = Depends(auth.get_current_user)):
    await get_project(pid, user)
    doc = {"id": str(uuid.uuid4()), "project_id": pid, "created_at": now_iso(), **body.model_dump()}
    await db.developers.insert_one(doc)
    doc.pop("_id", None)
    return doc


class DeveloperUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    skills: Optional[List[str]] = None
    experience_years: Optional[int] = None
    availability_pct: Optional[int] = None
    capacity_points: Optional[int] = None


@api_router.patch("/developers/{did}")
async def update_developer(did: str, body: DeveloperUpdate, user: dict = Depends(auth.get_current_user)):
    dev = await db.developers.find_one({"id": did})
    if not dev:
        raise HTTPException(status_code=404, detail="Developer not found")
    await get_project(dev["project_id"], user)
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if updates:
        await db.developers.update_one({"id": did}, {"$set": updates})
    return await db.developers.find_one({"id": did}, {"_id": 0})


@api_router.delete("/developers/{did}")
async def delete_developer(did: str, user: dict = Depends(auth.get_current_user)):
    dev = await db.developers.find_one({"id": did})
    if not dev:
        raise HTTPException(status_code=404, detail="Developer not found")
    await get_project(dev["project_id"], user)
    await db.developers.delete_one({"id": did})
    return {"ok": True}


# ---------- Sprint planning ----------
async def _load_pool_and_devs(pid: str):
    items = await db.backlog.find({"project_id": pid}, {"_id": 0}).to_list(2000)
    devs = await db.developers.find({"project_id": pid}, {"_id": 0}).to_list(200)
    return items, devs


@api_router.post("/projects/{pid}/plan")
async def create_plan(pid: str, user: dict = Depends(auth.get_current_user)):
    await get_project(pid, user)
    items, devs = await _load_pool_and_devs(pid)
    if not devs:
        raise HTTPException(status_code=400, detail="Add developers to the team before planning")
    plan = planner.build_plan(items, devs, strategy="optimized")
    if not plan["assignments"]:
        raise HTTPException(status_code=400, detail="No approved tasks/stories available to plan")
    metrics = planner.plan_metrics(plan, items)
    sprint = {"id": str(uuid.uuid4()), "project_id": pid, "name": "Sprint 1",
              "capacity": plan["capacity"], "plan": plan, "metrics": metrics,
              "status": "active", "created_at": now_iso()}
    await db.sprints.delete_many({"project_id": pid})
    await db.sprints.insert_one(sprint)

    await db.backlog.update_many({"project_id": pid},
                                 {"$set": {"sprint_id": None, "assignee_id": None, "board_status": None}})
    for a in plan["assignments"]:
        await db.backlog.update_one({"id": a["item_id"]}, {"$set": {
            "sprint_id": sprint["id"], "assignee_id": a["developer_id"], "board_status": "todo"}})
    sprint.pop("_id", None)
    return sprint


@api_router.get("/projects/{pid}/sprint")
async def get_sprint(pid: str, user: dict = Depends(auth.get_current_user)):
    await get_project(pid, user)
    sprint = await db.sprints.find_one({"project_id": pid, "status": "active"}, {"_id": 0})
    if not sprint:
        return None
    items = await db.backlog.find({"project_id": pid, "sprint_id": sprint["id"]}, {"_id": 0}).to_list(2000)
    board = {i["id"]: i.get("board_status", "todo") for i in items}
    for a in sprint["plan"]["assignments"]:
        a["board_status"] = board.get(a["item_id"], a.get("board_status", "todo"))
    return sprint


# ---------- Dynamic replanning ----------
class ReplanBody(BaseModel):
    event: str
    developer_id: Optional[str] = None
    item_id: Optional[str] = None
    actual_points: Optional[int] = None
    title: Optional[str] = None
    priority: Optional[str] = "High"
    story_points: Optional[int] = 5
    skills: Optional[List[str]] = []
    apply: bool = False


@api_router.post("/projects/{pid}/replan")
async def replan(pid: str, body: ReplanBody, user: dict = Depends(auth.get_current_user)):
    await get_project(pid, user)
    items, devs = await _load_pool_and_devs(pid)
    before = planner.build_plan(items, devs, strategy="optimized")

    mod_items = [dict(i) for i in items]
    mod_devs = [dict(d) for d in devs]
    note = ""

    if body.event == "developer_unavailable":
        if not body.developer_id:
            raise HTTPException(status_code=400, detail="Select a developer to mark unavailable")
        mod_devs = [d for d in mod_devs if d["id"] != body.developer_id]
        note = "Developer removed from sprint; tasks redistributed to remaining team."
    elif body.event == "new_requirement":
        mod_items.append({"id": str(uuid.uuid4()), "type": "task", "status": "approved",
                          "title": body.title or "Urgent requirement", "priority": body.priority or "High",
                          "story_points": body.story_points or 5, "skills": body.skills or [],
                          "dependencies": [], "project_id": pid})
        note = "New high-priority requirement injected; lower-priority work may be deferred."
    elif body.event == "task_delay":
        if not body.item_id:
            raise HTTPException(status_code=400, detail="Select a task that is delayed")
        for i in mod_items:
            if i["id"] == body.item_id:
                i["story_points"] = body.actual_points or i.get("story_points", 0)
        note = "Task effort increased; remaining capacity recalculated."
    elif body.event == "task_blocked":
        if not body.item_id:
            raise HTTPException(status_code=400, detail="Select a task that is blocked")
        for i in mod_items:
            if i["id"] == body.item_id:
                i["status"] = "blocked"
        note = "Blocked task deferred; alternative work pulled into the sprint."
    else:
        raise HTTPException(status_code=400, detail="Unknown event")

    t0 = time.perf_counter()
    after = planner.build_plan(mod_items, mod_devs, strategy="optimized")
    elapsed = round((time.perf_counter() - t0) * 1000, 2)

    result = {
        "event": body.event, "note": note, "replanning_time_ms": elapsed,
        "before": before, "after": after,
        "before_metrics": planner.plan_metrics(before, items),
        "after_metrics": planner.plan_metrics(after, mod_items),
    }

    if body.apply:
        metrics = result["after_metrics"]
        sprint = {"id": str(uuid.uuid4()), "project_id": pid, "name": "Sprint 1 (revised)",
                  "capacity": after["capacity"], "plan": after, "metrics": metrics,
                  "status": "active", "created_at": now_iso()}
        await db.sprints.delete_many({"project_id": pid})
        await db.sprints.insert_one(sprint)
        await db.backlog.update_many({"project_id": pid},
                                     {"$set": {"sprint_id": None, "assignee_id": None, "board_status": None}})
        for a in after["assignments"]:
            await db.backlog.update_one({"id": a["item_id"]}, {"$set": {
                "sprint_id": sprint["id"], "assignee_id": a["developer_id"], "board_status": "todo"}})
    return result


# ---------- Evaluation ----------
@api_router.get("/projects/{pid}/evaluation")
async def evaluation(pid: str, user: dict = Depends(auth.get_current_user)):
    project = await get_project(pid, user)
    items, devs = await _load_pool_and_devs(pid)
    reqs = await db.requirements.find({"project_id": pid}, {"_id": 0}).to_list(2000)

    methods = {}
    if devs:
        for name, strat in [("Random", "random"), ("Rule-based", "rule"), ("AI-Optimized", "optimized")]:
            plan = planner.build_plan(items, devs, strategy=strat)
            methods[name] = planner.plan_metrics(plan, items)

    extracted = len(reqs)
    unique = len({r["text"].strip().lower() for r in reqs})
    duplicates = extracted - unique
    gt = project.get("ground_truth_count") or extracted
    correct = min(unique, gt) if gt else 0
    precision = round(correct / extracted, 3) if extracted else 0
    recall = round(correct / gt, 3) if gt else 0
    f1 = round(2 * precision * recall / (precision + recall), 3) if (precision + recall) else 0

    tasks = [i for i in items if i.get("type") in ("task", "story")]
    diffs = [abs((i.get("story_points", 0) or 0) - (i.get("expert_points", i.get("story_points", 0)) or 0))
             for i in tasks]
    mae = round(sum(diffs) / len(diffs), 2) if diffs else 0
    point_pairs = [{"title": i["title"], "ai": i.get("story_points", 0),
                    "expert": i.get("expert_points", i.get("story_points", 0))} for i in tasks[:12]]

    return {
        "srs": {"extracted": extracted, "unique": unique, "duplicates": duplicates,
                "duplicate_rate": round(duplicates / extracted * 100, 1) if extracted else 0,
                "ground_truth": gt, "precision": precision, "recall": recall, "f1": f1,
                "coverage": round(recall * 100, 1)},
        "story_points": {"mae": mae, "pairs": point_pairs, "count": len(diffs)},
        "planners": methods,
    }
