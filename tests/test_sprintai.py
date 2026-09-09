"""Backend integration tests for AI Sprint Planning Assistant."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://capacity-planner-47.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

MANAGER_EMAIL = "manager@sprintai.com"
MANAGER_PASSWORD = "Manager@123"

SAMPLE_SRS = """The system shall allow users to register accounts with email and password.
Users must be able to log in securely using JWT authentication.
Managers can create projects and invite team members via email.
The application must support real-time notifications for task assignments.
Users shall be able to upload SRS documents in PDF or DOCX format.
The system must generate an Agile backlog with epics, user stories and tasks.
Managers should be able to approve, edit or reject AI-generated backlog items.
The application must provide sprint capacity planning with skill matching.
Users must see a Kanban sprint board with To Do, In Progress and Done columns.
Dashboards must display analytics including precision, recall and F1 metrics."""


@pytest.fixture(scope="session")
def auth():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": MANAGER_EMAIL, "password": MANAGER_PASSWORD}, timeout=30)
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    tok = r.json()["token"]
    s.headers.update({"Authorization": f"Bearer {tok}", "Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def project(auth):
    r = auth.post(f"{API}/projects", json={"name": "TEST_SprintAI", "description": "Automated test project", "sprint_length_days": 14}, timeout=30)
    assert r.status_code == 200, r.text
    p = r.json()
    yield p
    auth.delete(f"{API}/projects/{p['id']}", timeout=30)


# ---------- Auth ----------
class TestAuth:
    def test_login_success(self):
        r = requests.post(f"{API}/auth/login", json={"email": MANAGER_EMAIL, "password": MANAGER_PASSWORD}, timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["email"] == MANAGER_EMAIL
        assert d["token"]

    def test_login_bad(self):
        r = requests.post(f"{API}/auth/login", json={"email": MANAGER_EMAIL, "password": "wrong"}, timeout=30)
        assert r.status_code == 401

    def test_me_unauth(self):
        r = requests.get(f"{API}/auth/me", timeout=30)
        assert r.status_code == 401

    def test_register_and_me(self):
        email = f"test_user_{int(time.time())}@example.com"
        r = requests.post(f"{API}/auth/register", json={"name": "Test", "email": email, "password": "TestPass123"}, timeout=30)
        assert r.status_code == 200, r.text
        tok = r.json()["token"]
        r2 = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {tok}"}, timeout=30)
        assert r2.status_code == 200
        assert r2.json()["email"] == email


# ---------- Projects & full pipeline ----------
class TestPipeline:
    def test_create_and_list_project(self, auth, project):
        r = auth.get(f"{API}/projects", timeout=30)
        assert r.status_code == 200
        assert any(p["id"] == project["id"] for p in r.json())

    def test_srs_generation_creates_backlog(self, auth, project):
        # Real LLM call - long timeout. NOTE: Public CDN (Cloudflare) times out at ~60s
        # and returns 502 even though backend completes successfully in ~90-110s.
        # We tolerate a 502 here if the backend eventually persists the data.
        r = auth.post(f"{API}/projects/{project['id']}/srs/text", json={"text": SAMPLE_SRS}, timeout=180)
        if r.status_code == 502:
            # Wait for background completion and check DB state
            time.sleep(60)
            reqs2 = auth.get(f"{API}/projects/{project['id']}/requirements", timeout=30).json()
            assert len(reqs2) > 0, "CDN 502 AND no data persisted - LLM truly failed"
            pytest.skip("CDN 502 timeout but backend persisted data (Cloudflare 60s edge timeout on long LLM call)")
        assert r.status_code == 200, r.text
        summary = r.json()
        assert summary["requirements"] > 0
        assert (summary["stories"] + summary["tasks"]) > 0
        # verify persistence
        reqs = auth.get(f"{API}/projects/{project['id']}/requirements", timeout=30).json()
        assert len(reqs) == summary["requirements"]
        backlog = auth.get(f"{API}/projects/{project['id']}/backlog", timeout=30).json()
        assert len(backlog) >= summary["stories"] + summary["tasks"]

    def test_approve_all(self, auth, project):
        r = auth.post(f"{API}/projects/{project['id']}/backlog/approve-all", timeout=30)
        assert r.status_code == 200
        assert "approved" in r.json()

    def test_edit_backlog_item(self, auth, project):
        backlog = auth.get(f"{API}/projects/{project['id']}/backlog", timeout=30).json()
        task = next((b for b in backlog if b["type"] in ("task", "story")), None)
        assert task is not None
        r = auth.patch(f"{API}/backlog/{task['id']}", json={"priority": "High", "expert_points": 8}, timeout=30)
        assert r.status_code == 200
        assert r.json()["priority"] == "High"
        assert r.json()["expert_points"] == 8

    def test_add_developers(self, auth, project):
        for name, skills in [("Alice", ["python", "fastapi"]), ("Bob", ["react", "css"]),
                             ("Carol", ["mongodb", "python"]), ("Dan", ["react", "typescript"])]:
            r = auth.post(f"{API}/projects/{project['id']}/developers",
                          json={"name": name, "skills": skills, "capacity_points": 20, "availability_pct": 100}, timeout=30)
            assert r.status_code == 200
        devs = auth.get(f"{API}/projects/{project['id']}/developers", timeout=30).json()
        assert len(devs) >= 4

    def test_generate_plan(self, auth, project):
        r = auth.post(f"{API}/projects/{project['id']}/plan", timeout=60)
        assert r.status_code == 200, r.text
        sprint = r.json()
        assert sprint["plan"]["assignments"]
        m = sprint["metrics"]
        for k in ["capacity_utilization", "workload_balance", "skill_match", "priority_satisfaction",
                  "dependency_satisfaction", "overload_rate"]:
            assert k in m, f"missing metric {k}"

    def test_move_board(self, auth, project):
        sprint = auth.get(f"{API}/projects/{project['id']}/sprint", timeout=30).json()
        assert sprint
        item_id = sprint["plan"]["assignments"][0]["item_id"]
        r = auth.patch(f"{API}/backlog/{item_id}/board", json={"board_status": "in_progress"}, timeout=30)
        assert r.status_code == 200

    def test_replan_developer_unavailable(self, auth, project):
        devs = auth.get(f"{API}/projects/{project['id']}/developers", timeout=30).json()
        r = auth.post(f"{API}/projects/{project['id']}/replan",
                      json={"event": "developer_unavailable", "developer_id": devs[0]["id"], "apply": False}, timeout=60)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "replanning_time_ms" in d
        assert "before" in d and "after" in d

    def test_evaluation(self, auth, project):
        r = auth.get(f"{API}/projects/{project['id']}/evaluation", timeout=60)
        assert r.status_code == 200
        d = r.json()
        assert "srs" in d and "story_points" in d and "planners" in d
        assert set(d["planners"].keys()) == {"Random", "Rule-based", "AI-Optimized"}

    def test_update_ground_truth(self, auth, project):
        r = auth.patch(f"{API}/projects/{project['id']}", json={"ground_truth_count": 12}, timeout=30)
        assert r.status_code == 200
        ev = auth.get(f"{API}/projects/{project['id']}/evaluation", timeout=30).json()
        assert ev["srs"]["ground_truth"] == 12
