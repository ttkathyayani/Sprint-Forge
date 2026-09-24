import logging
from datetime import datetime, timezone
from db import db
import auth

PID = "proj-whatsapp-chat"
OWNER_EMAIL = "manager@sprintai.com"

# Team members with realistic availability (non-100%)
DEVELOPERS = [
    {
        "id": "dev-kathyayani",
        "project_id": PID,
        "name": "Kathyayani",
        "role": "Full Stack Developer",
        "skills": ["React", "React Native", "TypeScript", "Node.js", "WebSockets", "Push Notifications"],
        "experience_years": 5,
        "weekly_hours": 40,
        "availability_pct": 90,  # 90% availability
        "capacity_points": 20,   # 18 effective pts
        "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?crop=entropy&cs=srgb&fm=jpg&w=200&q=80",
        "created_at": "2026-07-20T08:00:00Z"
    },
    {
        "id": "dev-thirumla",
        "project_id": PID,
        "name": "Thirumla",
        "role": "Backend Developer",
        "skills": ["Python", "FastAPI", "PostgreSQL", "Redis", "WebSockets", "Cryptography", "Kafka"],
        "experience_years": 6,
        "weekly_hours": 40,
        "availability_pct": 85,  # 85% availability
        "capacity_points": 20,   # 17 effective pts
        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?crop=entropy&cs=srgb&fm=jpg&w=200&q=80",
        "created_at": "2026-07-20T08:00:00Z"
    },
    {
        "id": "dev-deekshitha",
        "project_id": PID,
        "name": "Deekshitha",
        "role": "Frontend Developer",
        "skills": ["React", "Redux", "Tailwind CSS", "JavaScript", "HTML5", "UI Components", "Jest"],
        "experience_years": 4,
        "weekly_hours": 40,
        "availability_pct": 95,  # 95% availability
        "capacity_points": 20,   # 19 effective pts
        "avatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?crop=entropy&cs=srgb&fm=jpg&w=200&q=80",
        "created_at": "2026-07-20T08:00:00Z"
    },
    {
        "id": "dev-pujitha",
        "project_id": PID,
        "name": "Pujitha",
        "role": "UI/UX Designer",
        "skills": ["Figma", "Design Systems", "Prototyping", "User Research", "Wireframing", "A11y"],
        "experience_years": 5,
        "weekly_hours": 40,
        "availability_pct": 80,  # 80% availability
        "capacity_points": 20,   # 16 effective pts
        "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?crop=entropy&cs=srgb&fm=jpg&w=200&q=80",
        "created_at": "2026-07-20T08:00:00Z"
    },
    {
        "id": "dev-sai",
        "project_id": PID,
        "name": "Sai",
        "role": "QA / Testing Engineer",
        "skills": ["Cypress", "Appium", "Selenium", "Postman", "Load Testing", "Automation", "CI/CD"],
        "experience_years": 4,
        "weekly_hours": 40,
        "availability_pct": 90,  # 90% availability
        "capacity_points": 20,   # 18 effective pts
        "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=srgb&fm=jpg&w=200&q=80",
        "created_at": "2026-07-20T08:00:00Z"
    }
]

# Atomic SRS Requirements
REQUIREMENTS = [
    {"id": "req-01", "project_id": PID, "source": "SRS-ChatApp-v2.1.pdf", "text": "The application shall allow new users to register an account using their mobile number or verified email address.", "created_at": "2026-07-20T08:30:00Z"},
    {"id": "req-02", "project_id": PID, "source": "SRS-ChatApp-v2.1.pdf", "text": "Registered users shall securely log in using salted credentials and receive JWT access/refresh session tokens.", "created_at": "2026-07-20T08:30:00Z"},
    {"id": "req-03", "project_id": PID, "source": "SRS-ChatApp-v2.1.pdf", "text": "Users shall be able to configure their profile display name, avatar picture, and status tagline.", "created_at": "2026-07-20T08:30:00Z"},
    {"id": "req-04", "project_id": PID, "source": "SRS-ChatApp-v2.1.pdf", "text": "The platform must provide real-time one-to-one messaging over persistent WebSockets with sub-50ms transit.", "created_at": "2026-07-20T08:30:00Z"},
    {"id": "req-05", "project_id": PID, "source": "SRS-ChatApp-v2.1.pdf", "text": "The system shall display three-tier message status receipts: sent (single tick), delivered (double tick), and read (blue tick).", "created_at": "2026-07-20T08:30:00Z"},
    {"id": "req-06", "project_id": PID, "source": "SRS-ChatApp-v2.1.pdf", "text": "The client shall reflect real-time online/offline presence tracking and broadcast last-seen timestamps.", "created_at": "2026-07-20T08:30:00Z"},
    {"id": "req-07", "project_id": PID, "source": "SRS-ChatApp-v2.1.pdf", "text": "Users shall be able to create group conversations with multiple participants and shared broadcast messaging.", "created_at": "2026-07-20T08:30:00Z"},
    {"id": "req-08", "project_id": PID, "source": "SRS-ChatApp-v2.1.pdf", "text": "Group creators and admins shall have privileges to add or remove members and assign group administrators.", "created_at": "2026-07-20T08:30:00Z"},
    {"id": "req-09", "project_id": PID, "source": "SRS-ChatApp-v2.1.pdf", "text": "Users shall be able to send compressed images with inline preview thumbnails and full-resolution viewing.", "created_at": "2026-07-20T08:30:00Z"},
    {"id": "req-10", "project_id": PID, "source": "SRS-ChatApp-v2.1.pdf", "text": "The system shall permit sharing documents and binary files up to 50MB with checksum validation.", "created_at": "2026-07-20T08:30:00Z"},
    {"id": "req-11", "project_id": PID, "source": "SRS-ChatApp-v2.1.pdf", "text": "The application shall deliver push notifications for incoming messages when the client is in background or inactive.", "created_at": "2026-07-20T08:30:00Z"},
    {"id": "req-12", "project_id": PID, "source": "SRS-ChatApp-v2.1.pdf", "text": "Users shall be able to execute instant full-text search queries across their entire historical conversation archive.", "created_at": "2026-07-20T08:30:00Z"},
    {"id": "req-13", "project_id": PID, "source": "SRS-ChatApp-v2.1.pdf", "text": "The client shall support audio waveform recording and playback for voice notes.", "created_at": "2026-07-20T08:30:00Z"},
    {"id": "req-14", "project_id": PID, "source": "SRS-ChatApp-v2.1.pdf", "text": "All chat messages shall implement cryptographic end-to-end encryption key ratchets.", "created_at": "2026-07-20T08:30:00Z"},
    {"id": "req-15", "project_id": PID, "source": "SRS-ChatApp-v2.1.pdf", "text": "The user interface shall comply with WCAG 2.1 AA accessibility guidelines and offer light/dark themes.", "created_at": "2026-07-20T08:30:00Z"}
]

# Epics
EPICS = [
    {
        "id": "epic-01", "project_id": PID, "type": "epic", "key": "EP-01",
        "title": "Identity, Authentication & Profile Management",
        "description": "User registration, phone/email validation, JWT credentials, and customizable profile avatars and status messages.",
        "priority": "High", "story_points": 11, "expert_points": 11, "skills": ["Node.js", "Python", "FastAPI", "React Native"],
        "acceptance_criteria": ["Seamless signup and login flows", "Profile updates synced in real-time"],
        "dependencies": [], "parent": None, "status": "approved", "ai_confidence": 0.96,
        "sprint_id": None, "assignee_id": None, "board_status": None, "created_at": "2026-07-20T09:00:00Z"
    },
    {
        "id": "epic-02", "project_id": PID, "type": "epic", "key": "EP-02",
        "title": "Real-Time 1-to-1 Messaging Core",
        "description": "Persistent WebSocket message transport, delivery receipt pipeline, presence tracking, and end-to-end encryption.",
        "priority": "Critical", "story_points": 24, "expert_points": 24, "skills": ["WebSockets", "Python", "Redis", "PostgreSQL"],
        "acceptance_criteria": ["Sub-50ms latency", "Read receipt updates", "Double-ratchet encryption active"],
        "dependencies": [], "parent": None, "status": "approved", "ai_confidence": 0.98,
        "sprint_id": None, "assignee_id": None, "board_status": None, "created_at": "2026-07-20T09:00:00Z"
    },
    {
        "id": "epic-03", "project_id": PID, "type": "epic", "key": "EP-03",
        "title": "Group Conversations & Rich Media Sharing",
        "description": "Multi-party group rooms, administrative member management, compressed image transfer, audio voice notes, and file attachments.",
        "priority": "High", "story_points": 28, "expert_points": 28, "skills": ["React", "Redux", "FastAPI", "UI Components"],
        "acceptance_criteria": ["Groups up to 256 members", "Media uploads with progress indicators"],
        "dependencies": [], "parent": None, "status": "approved", "ai_confidence": 0.95,
        "sprint_id": None, "assignee_id": None, "board_status": None, "created_at": "2026-07-20T09:00:00Z"
    },
    {
        "id": "epic-04", "project_id": PID, "type": "epic", "key": "EP-04",
        "title": "Notifications, Search & Platform Resilience",
        "description": "APNs/FCM push notification pipeline, full-text history search, automated QA regression test harness, and WCAG accessibility.",
        "priority": "High", "story_points": 23, "expert_points": 23, "skills": ["Push Notifications", "Jest", "Cypress", "A11y"],
        "acceptance_criteria": ["Background push delivered under 2s", "Stress testing up to 10k concurrent users"],
        "dependencies": [], "parent": None, "status": "approved", "ai_confidence": 0.94,
        "sprint_id": None, "assignee_id": None, "board_status": None, "created_at": "2026-07-20T09:00:00Z"
    }
]

# User Stories specified by user + supplemental stories to reach 17 realistic items
STORIES = [
    # US-001 — User Registration
    {
        "id": "us-001", "project_id": PID, "type": "story", "key": "US-001",
        "title": "User Registration",
        "description": "As a new user, I want to create an account using my mobile number/email so that I can use the chatting application.",
        "priority": "High", "story_points": 5, "expert_points": 5,
        "skills": ["React Native", "Node.js", "TypeScript"],
        "acceptance_criteria": [
            "Validate phone number and email formatting",
            "Send 6-digit OTP code with 10-minute expiry",
            "Securely store user credentials with salted hashing"
        ],
        "dependencies": [], "parent": "epic-01", "status": "approved", "ai_confidence": 0.96,
        "sprint_id": "sprint-1-completed", "assignee_id": "dev-kathyayani", "assignee_name": "Kathyayani", "board_status": "done",
        "created_at": "2026-07-21T09:00:00Z"
    },
    # US-002 — User Login
    {
        "id": "us-002", "project_id": PID, "type": "story", "key": "US-002",
        "title": "User Login",
        "description": "As a registered user, I want to securely log in so that I can access my conversations.",
        "priority": "High", "story_points": 3, "expert_points": 3,
        "skills": ["Python", "FastAPI", "PostgreSQL", "JWT"],
        "acceptance_criteria": [
            "Verify password against bcrypt salted hash",
            "Generate short-lived JWT access token and secure refresh cookie",
            "Provide rate limiting to protect against brute-force attacks"
        ],
        "dependencies": ["us-001"], "parent": "epic-01", "status": "approved", "ai_confidence": 0.97,
        "sprint_id": "sprint-1-completed", "assignee_id": "dev-thirumla", "assignee_name": "Thirumla", "board_status": "done",
        "created_at": "2026-07-21T09:30:00Z"
    },
    # US-003 — User Profile
    {
        "id": "us-003", "project_id": PID, "type": "story", "key": "US-003",
        "title": "User Profile",
        "description": "As a user, I want to create and edit my profile picture, name and status so that other users can identify me.",
        "priority": "Medium", "story_points": 3, "expert_points": 3,
        "skills": ["Figma", "Design Systems", "UI Components"],
        "acceptance_criteria": [
            "Support profile avatar upload, cropping and circular preview",
            "Editable display name with character validation",
            "Custom status message with 140 character limit"
        ],
        "dependencies": ["us-002"], "parent": "epic-01", "status": "approved", "ai_confidence": 0.94,
        "sprint_id": "sprint-1-completed", "assignee_id": "dev-pujitha", "assignee_name": "Pujitha", "board_status": "done",
        "created_at": "2026-07-21T10:00:00Z"
    },
    # US-004 — One-to-One Chat
    {
        "id": "us-004", "project_id": PID, "type": "story", "key": "US-004",
        "title": "One-to-One Chat",
        "description": "As a user, I want to send messages to another user so that I can communicate privately.",
        "priority": "Critical", "story_points": 8, "expert_points": 8,
        "skills": ["WebSockets", "Python", "Redis", "PostgreSQL"],
        "acceptance_criteria": [
            "Establish full-duplex WebSocket channel between peers",
            "Store and persist conversation history chronologically",
            "Offline message buffering with auto-flush on reconnection"
        ],
        "dependencies": ["us-002"], "parent": "epic-02", "status": "approved", "ai_confidence": 0.98,
        "sprint_id": "sprint-2-completed", "assignee_id": "dev-thirumla", "assignee_name": "Thirumla", "board_status": "done",
        "created_at": "2026-08-07T09:00:00Z"
    },
    # US-005 — Message Delivery Status (Sprint 4: In Progress)
    {
        "id": "us-005", "project_id": PID, "type": "story", "key": "US-005",
        "title": "Message Delivery Status",
        "description": "As a user, I want to see sent, delivered and read indicators so that I know whether my message was received.",
        "priority": "High", "story_points": 5, "expert_points": 5,
        "skills": ["WebSockets", "FastAPI", "Redis"],
        "acceptance_criteria": [
            "Display single tick when server receives message",
            "Display double grey ticks when recipient device receives message payload",
            "Display double blue ticks when conversation window is viewed by recipient"
        ],
        "dependencies": ["us-004"], "parent": "epic-02", "status": "approved", "ai_confidence": 0.95,
        "sprint_id": "sprint-4-active", "assignee_id": "dev-thirumla", "assignee_name": "Thirumla", "board_status": "in-progress",
        "created_at": "2026-09-17T09:00:00Z"
    },
    # US-006 — Online / Offline Status (Sprint 4: In Progress)
    {
        "id": "us-006", "project_id": PID, "type": "story", "key": "US-006",
        "title": "Online / Offline Status",
        "description": "As a user, I want to see whether another user is online so that I know when they are available to chat.",
        "priority": "Medium", "story_points": 5, "expert_points": 5,
        "skills": ["React Native", "WebSockets", "TypeScript"],
        "acceptance_criteria": [
            "Client sends ping heartbeat every 30 seconds",
            "Display green indicator when user has an active WebSocket session",
            "Show formatted 'Last seen at HH:MM' timestamp when disconnected"
        ],
        "dependencies": ["us-004"], "parent": "epic-02", "status": "approved", "ai_confidence": 0.93,
        "sprint_id": "sprint-4-active", "assignee_id": "dev-kathyayani", "assignee_name": "Kathyayani", "board_status": "in-progress",
        "created_at": "2026-09-17T09:15:00Z"
    },
    # US-007 — Group Chat
    {
        "id": "us-007", "project_id": PID, "type": "story", "key": "US-007",
        "title": "Group Chat",
        "description": "As a user, I want to create a group conversation so that I can communicate with multiple people.",
        "priority": "High", "story_points": 8, "expert_points": 8,
        "skills": ["React", "Redux", "UI Components", "JavaScript"],
        "acceptance_criteria": [
            "Modal to select multiple contacts and create a named group",
            "Group message fan-out distribution to all active members",
            "Display sender name and color badge above group chat bubbles"
        ],
        "dependencies": ["us-004"], "parent": "epic-03", "status": "approved", "ai_confidence": 0.97,
        "sprint_id": "sprint-3-completed", "assignee_id": "dev-deekshitha", "assignee_name": "Deekshitha", "board_status": "done",
        "created_at": "2026-08-21T09:00:00Z"
    },
    # US-008 — Add / Remove Group Members
    {
        "id": "us-008", "project_id": PID, "type": "story", "key": "US-008",
        "title": "Add / Remove Group Members",
        "description": "As a group administrator, I want to add or remove members so that I can manage my group.",
        "priority": "Medium", "story_points": 5, "expert_points": 5,
        "skills": ["React", "Redux", "Tailwind CSS"],
        "acceptance_criteria": [
            "Admin badge indicators in group participants list",
            "Search and add contact to existing group dialog",
            "Remove member action with confirmation modal and broadcast alert"
        ],
        "dependencies": ["us-007"], "parent": "epic-03", "status": "approved", "ai_confidence": 0.94,
        "sprint_id": "sprint-3-completed", "assignee_id": "dev-deekshitha", "assignee_name": "Deekshitha", "board_status": "done",
        "created_at": "2026-08-21T09:30:00Z"
    },
    # US-009 — Image Sharing (Sprint 4: In Progress / Active Sprint item)
    {
        "id": "us-009", "project_id": PID, "type": "story", "key": "US-009",
        "title": "Image Sharing",
        "description": "As a user, I want to send images in a chat so that I can share photos with others.",
        "priority": "High", "story_points": 5, "expert_points": 5,
        "skills": ["React Native", "Node.js", "TypeScript"],
        "acceptance_criteria": [
            "Client-side image compression with WebP format support",
            "Inline image preview with rounded corners and download badge",
            "Full-screen lightbox viewer with pinch-to-zoom"
        ],
        "dependencies": ["us-004"], "parent": "epic-03", "status": "approved", "ai_confidence": 0.95,
        "sprint_id": "sprint-4-active", "assignee_id": "dev-kathyayani", "assignee_name": "Kathyayani", "board_status": "done",
        "created_at": "2026-09-17T09:30:00Z"
    },
    # US-010 — File Sharing (Sprint 4: To Do)
    {
        "id": "us-010", "project_id": PID, "type": "story", "key": "US-010",
        "title": "File Sharing",
        "description": "As a user, I want to share documents and files so that I can send useful information through chat.",
        "priority": "Medium", "story_points": 5, "expert_points": 5,
        "skills": ["FastAPI", "Python", "PostgreSQL"],
        "acceptance_criteria": [
            "Support PDF, DOCX, ZIP and XLS files up to 50MB",
            "File extension icon badge and human-readable file size display",
            "Chunked upload handler with resumable progress bar"
        ],
        "dependencies": ["us-004"], "parent": "epic-03", "status": "approved", "ai_confidence": 0.92,
        "sprint_id": "sprint-4-active", "assignee_id": "dev-thirumla", "assignee_name": "Thirumla", "board_status": "todo",
        "created_at": "2026-09-17T09:45:00Z"
    },
    # US-011 — Push Notifications (Sprint 4: In Progress / Active Sprint item)
    {
        "id": "us-011", "project_id": PID, "type": "story", "key": "US-011",
        "title": "Push Notifications",
        "description": "As a user, I want to receive notifications for new messages so that I don't miss conversations.",
        "priority": "High", "story_points": 5, "expert_points": 5,
        "skills": ["Push Notifications", "TypeScript", "Node.js"],
        "acceptance_criteria": [
            "Integrate Firebase Cloud Messaging (FCM) and Apple Push Notification Service (APNs)",
            "Display sender name, avatar and message preview in notification banner",
            "Tap notification routes directly into the corresponding chat room"
        ],
        "dependencies": ["us-004"], "parent": "epic-04", "status": "approved", "ai_confidence": 0.96,
        "sprint_id": "sprint-4-active", "assignee_id": "dev-kathyayani", "assignee_name": "Kathyayani", "board_status": "done",
        "created_at": "2026-09-17T10:00:00Z"
    },
    # US-012 — Message Search (To Do)
    {
        "id": "us-012", "project_id": PID, "type": "story", "key": "US-012",
        "title": "Message Search",
        "description": "As a user, I want to search my previous messages so that I can quickly find important information.",
        "priority": "Medium", "story_points": 5, "expert_points": 5,
        "skills": ["React", "JavaScript", "UI Components"],
        "acceptance_criteria": [
            "Search bar with debounced query triggering full-text search",
            "Highlight matching search keywords in yellow/pastel pill",
            "Click search result jumps and scrolls directly to that message in history"
        ],
        "dependencies": ["us-004"], "parent": "epic-04", "status": "approved", "ai_confidence": 0.93,
        "sprint_id": None, "assignee_id": "dev-deekshitha", "assignee_name": "Deekshitha", "board_status": "todo",
        "created_at": "2026-09-17T10:15:00Z"
    },
    # US-013 — Voice Message Recording & Playback
    {
        "id": "us-013", "project_id": PID, "type": "story", "key": "US-013",
        "title": "Voice Message Recording & Playback",
        "description": "As a user, I want to record and send voice messages so that I can communicate quickly without typing.",
        "priority": "High", "story_points": 5, "expert_points": 5,
        "skills": ["FastAPI", "Python", "WebSockets"],
        "acceptance_criteria": [
            "Hold-to-record mic button with audio duration timer",
            "Opus audio stream compression",
            "Interactive audio player with visual scrubber waveform"
        ],
        "dependencies": ["us-004"], "parent": "epic-03", "status": "approved", "ai_confidence": 0.94,
        "sprint_id": "sprint-3-completed", "assignee_id": "dev-thirumla", "assignee_name": "Thirumla", "board_status": "done",
        "created_at": "2026-08-21T10:00:00Z"
    },
    # US-014 — End-to-End Encryption Key Exchange
    {
        "id": "us-014", "project_id": PID, "type": "story", "key": "US-014",
        "title": "End-to-End Encryption Key Exchange",
        "description": "As a security-conscious user, I want my chats end-to-end encrypted so that only the sender and recipient can read the messages.",
        "priority": "Critical", "story_points": 8, "expert_points": 8,
        "skills": ["Cryptography", "Python", "FastAPI"],
        "acceptance_criteria": [
            "Client identity key pair generation using Curve25519",
            "Double-ratchet session initialization per conversation",
            "Encrypted message payload transport with zero-knowledge server storage"
        ],
        "dependencies": ["us-002"], "parent": "epic-02", "status": "approved", "ai_confidence": 0.99,
        "sprint_id": "sprint-1-completed", "assignee_id": "dev-thirumla", "assignee_name": "Thirumla", "board_status": "done",
        "created_at": "2026-07-21T10:30:00Z"
    },
    # US-015 — Real-time Typing Indicator
    {
        "id": "us-015", "project_id": PID, "type": "story", "key": "US-015",
        "title": "Real-time Typing Indicator",
        "description": "As a chatting user, I want to see when the other person is typing so that I know a response is incoming.",
        "priority": "Low", "story_points": 3, "expert_points": 3,
        "skills": ["React", "UI Components", "Tailwind CSS"],
        "acceptance_criteria": [
            "Emit typing start event when user keys into chat box",
            "Auto-cancel typing status after 3 seconds of inactivity",
            "Animated three-dot typing indicator in conversation header/footer"
        ],
        "dependencies": ["us-004"], "parent": "epic-02", "status": "approved", "ai_confidence": 0.92,
        "sprint_id": "sprint-2-completed", "assignee_id": "dev-deekshitha", "assignee_name": "Deekshitha", "board_status": "done",
        "created_at": "2026-08-07T10:00:00Z"
    },
    # US-016 — Cross-Platform Automated QA & Stress Testing (Sprint 4: Done)
    {
        "id": "us-016", "project_id": PID, "type": "story", "key": "US-016",
        "title": "Cross-Platform Automated QA & Stress Testing",
        "description": "As a QA engineer, I want automated regression and load test suites across Android, iOS and Web clients to prevent breaking messaging features.",
        "priority": "High", "story_points": 5, "expert_points": 5,
        "skills": ["Cypress", "Load Testing", "Automation", "CI/CD"],
        "acceptance_criteria": [
            "Simulate 5,000 concurrent WebSocket clients with zero dropped packets",
            "Automated test coverage exceeding 85% on critical paths",
            "Execution pipeline integrated into GitHub Actions CI"
        ],
        "dependencies": ["us-004", "us-005"], "parent": "epic-04", "status": "approved", "ai_confidence": 0.95,
        "sprint_id": "sprint-4-active", "assignee_id": "dev-sai", "assignee_name": "Sai", "board_status": "done",
        "created_at": "2026-09-17T10:30:00Z"
    },
    # US-017 — Modern Pastel Theme & Accessibility Styling (Sprint 4: Done)
    {
        "id": "us-017", "project_id": PID, "type": "story", "key": "US-017",
        "title": "Modern Pastel Theme & Accessibility Styling",
        "description": "As a user, I want a clean pastel/dark mode theme with accessible typography and clear message bubble hierarchy.",
        "priority": "Medium", "story_points": 3, "expert_points": 3,
        "skills": ["Figma", "Design Systems", "A11y"],
        "acceptance_criteria": [
            "WCAG 2.1 AA color contrast compliance across all themes",
            "Fluid responsive layout for mobile and desktop screens",
            "Custom pastel theme tokens (pista green, dusky sky, oat beige, lilac)"
        ],
        "dependencies": ["us-003"], "parent": "epic-04", "status": "approved", "ai_confidence": 0.94,
        "sprint_id": "sprint-4-active", "assignee_id": "dev-pujitha", "assignee_name": "Pujitha", "board_status": "done",
        "created_at": "2026-09-17T11:00:00Z"
    }
]

# Historical and active sprints
SPRINTS = [
    {
        "id": "sprint-1-completed",
        "project_id": PID,
        "name": "Sprint 1",
        "goal": "Project foundation and authentication",
        "status": "completed",
        "duration_weeks": 2,
        "planned_points": 21,
        "completed_points": 21,
        "start_date": "2026-07-23",
        "end_date": "2026-08-06",
        "capacity": 21.0,
        "created_at": "2026-07-23T09:00:00Z"
    },
    {
        "id": "sprint-2-completed",
        "project_id": PID,
        "name": "Sprint 2",
        "goal": "Core messaging functionality",
        "status": "completed",
        "duration_weeks": 2,
        "planned_points": 26,
        "completed_points": 23,
        "start_date": "2026-08-07",
        "end_date": "2026-08-20",
        "capacity": 26.0,
        "created_at": "2026-08-07T09:00:00Z"
    },
    {
        "id": "sprint-3-completed",
        "project_id": PID,
        "name": "Sprint 3",
        "goal": "Group chat and media sharing",
        "status": "completed",
        "duration_weeks": 2,
        "planned_points": 29,
        "completed_points": 25,
        "start_date": "2026-08-21",
        "end_date": "2026-09-03",
        "capacity": 29.0,
        "created_at": "2026-08-21T09:00:00Z"
    },
    {
        "id": "sprint-4-active",
        "project_id": PID,
        "name": "Sprint 4",
        "goal": "Notifications, message status, testing and performance improvements",
        "status": "active",
        "duration_weeks": 2,
        "planned_points": 30,
        "completed_points": 18,  # Exactly 18 completed pts (in 17–20 range)
        "in_progress_points": 7,  # 7 pts in progress
        "todo_points": 5,         # 5 pts to do
        "start_date": "2026-09-17",
        "end_date": "2026-10-01",
        "current_day": 7,
        "total_days": 14,
        "day_progress": "Day 7 of 14 (50% elapsed)",
        "capacity": 30.0,
        "plan": {
            "strategy": "optimized",
            "capacity": 30.0,
            "selected_points": 30,
            "pool_size": 6,
            "assignments": [
                {
                    "item_id": "us-011",
                    "title": "Push Notifications (FCM / APNs Gateway Worker)",
                    "type": "story",
                    "story_points": 5,
                    "priority": "High",
                    "skills": ["Push Notifications", "TypeScript"],
                    "dependencies": ["us-004"],
                    "developer_id": "dev-kathyayani",
                    "developer_name": "Kathyayani",
                    "skill_score": 1.0,
                    "board_status": "done"
                },
                {
                    "item_id": "us-009",
                    "title": "Image Sharing (Client Compression & CDN Upload)",
                    "type": "story",
                    "story_points": 5,
                    "priority": "High",
                    "skills": ["React Native", "TypeScript"],
                    "dependencies": ["us-004"],
                    "developer_id": "dev-kathyayani",
                    "developer_name": "Kathyayani",
                    "skill_score": 1.0,
                    "board_status": "done"
                },
                {
                    "item_id": "us-016",
                    "title": "Cross-Platform Automated QA & Stress Testing",
                    "type": "story",
                    "story_points": 5,
                    "priority": "High",
                    "skills": ["Cypress", "Load Testing", "CI/CD"],
                    "dependencies": ["us-004"],
                    "developer_id": "dev-sai",
                    "developer_name": "Sai",
                    "skill_score": 1.0,
                    "board_status": "done"
                },
                {
                    "item_id": "us-017",
                    "title": "Modern Pastel Theme & Accessibility Styling",
                    "type": "story",
                    "story_points": 3,
                    "priority": "Medium",
                    "skills": ["Figma", "Design Systems", "A11y"],
                    "dependencies": ["us-003"],
                    "developer_id": "dev-pujitha",
                    "developer_name": "Pujitha",
                    "skill_score": 1.0,
                    "board_status": "done"
                },
                {
                    "item_id": "us-005",
                    "title": "Message Delivery Status (Single / Double / Read Blue Ticks)",
                    "type": "story",
                    "story_points": 5,
                    "priority": "High",
                    "skills": ["WebSockets", "FastAPI", "Redis"],
                    "dependencies": ["us-004"],
                    "developer_id": "dev-thirumla",
                    "developer_name": "Thirumla",
                    "skill_score": 1.0,
                    "board_status": "in-progress"
                },
                {
                    "item_id": "us-006",
                    "title": "Online / Offline Status (Heartbeat Presence Tracker)",
                    "type": "story",
                    "story_points": 2,
                    "priority": "Medium",
                    "skills": ["React Native", "WebSockets"],
                    "dependencies": ["us-004"],
                    "developer_id": "dev-deekshitha",
                    "developer_name": "Deekshitha",
                    "skill_score": 1.0,
                    "board_status": "in-progress"
                },
                {
                    "item_id": "us-010",
                    "title": "File Sharing (Chunked Document Upload up to 50MB)",
                    "type": "story",
                    "story_points": 5,
                    "priority": "Medium",
                    "skills": ["FastAPI", "Python"],
                    "dependencies": ["us-004"],
                    "developer_id": "dev-thirumla",
                    "developer_name": "Thirumla",
                    "skill_score": 1.0,
                    "board_status": "todo"
                }
            ],
            "dev_loads": [
                {"developer_id": "dev-kathyayani", "name": "Kathyayani", "capacity": 18.0, "load": 10.0, "utilization": 55.6, "overloaded": False},
                {"developer_id": "dev-thirumla", "name": "Thirumla", "capacity": 17.0, "load": 10.0, "utilization": 58.8, "overloaded": False},
                {"developer_id": "dev-deekshitha", "name": "Deekshitha", "capacity": 19.0, "load": 2.0, "utilization": 10.5, "overloaded": False},
                {"developer_id": "dev-pujitha", "name": "Pujitha", "capacity": 16.0, "load": 3.0, "utilization": 18.8, "overloaded": False},
                {"developer_id": "dev-sai", "name": "Sai", "capacity": 18.0, "load": 5.0, "utilization": 27.8, "overloaded": False}
            ],
            "unscheduled": []
        },
        "metrics": {
            "capacity_utilization": 94.2,
            "workload_balance": 92.5,
            "skill_match": 98.0,
            "priority_satisfaction": 96.0,
            "dependency_satisfaction": 100.0,
            "overload_rate": 0.0,
            "tasks_scheduled": 7
        },
        "created_at": "2026-09-17T09:00:00Z"
    }
]


async def seed_chat_project():
    """Seed the realistic WhatsApp chatting application project if not present."""
    logging.info("Checking for Chatting Application seed project...")
    manager = await db.users.find_one({"email": OWNER_EMAIL})
    owner_id = manager["id"] if manager else "admin-default-id"

    project_doc = {
        "id": PID,
        "owner_id": owner_id,
        "name": "Chatting Application – Like WhatsApp",
        "description": (
            "A real-time chatting application inspired by modern messaging platforms such as WhatsApp. "
            "The application supports user registration, one-to-one messaging, group chats, media sharing, "
            "notifications, online/offline status, message delivery/read status, and basic profile management."
        ),
        "project_type": "Software / Mobile & Web Application",
        "methodology": "Agile Scrum",
        "sprint_duration_weeks": 2,
        "sprint_length_days": 14,
        "current_sprint": "Sprint 4",
        "project_status": "Active / In Progress",
        "ground_truth_count": 20,
        "created_at": "2026-07-20T08:00:00Z",
    }

    # Upsert project
    await db.projects.delete_one({"id": PID})
    await db.projects.insert_one(project_doc)

    # Upsert developers
    await db.developers.delete_many({"project_id": PID})
    for dev in DEVELOPERS:
        await db.developers.insert_one(dict(dev))

    # Upsert requirements
    await db.requirements.delete_many({"project_id": PID})
    for req in REQUIREMENTS:
        await db.requirements.insert_one(dict(req))

    # Upsert backlog (epics and stories)
    await db.backlog.delete_many({"project_id": PID})
    for ep in EPICS:
        await db.backlog.insert_one(dict(ep))
    for st in STORIES:
        await db.backlog.insert_one(dict(st))

    # Upsert sprints
    await db.sprints.delete_many({"project_id": PID})
    for sp in SPRINTS:
        await db.sprints.insert_one(dict(sp))

    logging.info(
        "Successfully seeded Chatting Application – Like WhatsApp with 5 developers, "
        "15 requirements, 4 epics, 17 user stories, and 4 sequential sprints!"
    )
