from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============ MODELS ============

class Subject(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    credits: int
    color: str = "#6366f1"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class SubjectCreate(BaseModel):
    name: str
    credits: int
    color: Optional[str] = "#6366f1"

class Chapter(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    subject_id: str
    name: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ChapterCreate(BaseModel):
    subject_id: str
    name: str

class Task(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    subject_id: str
    chapter_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    task_type: str  # "assignment", "test", "project"
    deadline: Optional[str] = None
    status: str = "pending"  # "pending", "in_progress", "completed"
    marks: Optional[float] = None
    max_marks: Optional[float] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TaskCreate(BaseModel):
    subject_id: str
    chapter_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    task_type: str
    deadline: Optional[str] = None
    marks: Optional[float] = None
    max_marks: Optional[float] = None

class TaskUpdate(BaseModel):
    status: Optional[str] = None
    marks: Optional[float] = None
    max_marks: Optional[float] = None

class FocusSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    subject_id: Optional[str] = None
    duration_minutes: int
    date: str = Field(default_factory=lambda: datetime.now(timezone.utc).date().isoformat())
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class FocusSessionCreate(BaseModel):
    subject_id: Optional[str] = None
    duration_minutes: int
    date: Optional[str] = None

class GPARecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    semester: str
    subject_id: str
    grade: str
    credits: int
    grade_point: float
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class GPARecordCreate(BaseModel):
    semester: str
    subject_id: str
    grade: str
    credits: int
    grade_point: float

class CurrentStatus(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "user_status"
    total_credits: int = 86
    completed_credits: int = 86
    current_cgpa: float = 7.67
    target_cgpa: float = 9.0
    current_semester_goal: float = 9.0
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class CurrentStatusUpdate(BaseModel):
    total_credits: Optional[int] = None
    completed_credits: Optional[int] = None
    current_cgpa: Optional[float] = None
    target_cgpa: Optional[float] = None
    current_semester_goal: Optional[float] = None

class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    role: str  # "user" or "assistant"
    content: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ChatRequest(BaseModel):
    message: str

class GPACalculation(BaseModel):
    required_gpa: float
    remaining_credits: int
    predicted_current_gpa: Optional[float] = None

# ============ ENDPOINTS ============

# Subjects
@api_router.post("/subjects", response_model=Subject)
async def create_subject(input: SubjectCreate):
    subject = Subject(**input.model_dump())
    doc = subject.model_dump()
    await db.subjects.insert_one(doc)
    return subject

@api_router.get("/subjects", response_model=List[Subject])
async def get_subjects():
    subjects = await db.subjects.find({}, {"_id": 0}).to_list(1000)
    return subjects

@api_router.delete("/subjects/{subject_id}")
async def delete_subject(subject_id: str):
    await db.subjects.delete_one({"id": subject_id})
    await db.chapters.delete_many({"subject_id": subject_id})
    await db.tasks.delete_many({"subject_id": subject_id})
    return {"message": "Subject deleted"}

# Chapters
@api_router.post("/chapters", response_model=Chapter)
async def create_chapter(input: ChapterCreate):
    chapter = Chapter(**input.model_dump())
    doc = chapter.model_dump()
    await db.chapters.insert_one(doc)
    return chapter

@api_router.get("/chapters/{subject_id}", response_model=List[Chapter])
async def get_chapters(subject_id: str):
    chapters = await db.chapters.find({"subject_id": subject_id}, {"_id": 0}).to_list(1000)
    return chapters

# Tasks
@api_router.post("/tasks", response_model=Task)
async def create_task(input: TaskCreate):
    task = Task(**input.model_dump())
    doc = task.model_dump()
    await db.tasks.insert_one(doc)
    return task

@api_router.get("/tasks", response_model=List[Task])
async def get_tasks():
    tasks = await db.tasks.find({}, {"_id": 0}).to_list(1000)
    return tasks

@api_router.patch("/tasks/{task_id}", response_model=Task)
async def update_task(task_id: str, input: TaskUpdate):
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    if update_data:
        await db.tasks.update_one({"id": task_id}, {"$set": update_data})
    task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return Task(**task)

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    await db.tasks.delete_one({"id": task_id})
    return {"message": "Task deleted"}

# Focus Sessions
@api_router.post("/focus-sessions", response_model=FocusSession)
async def create_focus_session(input: FocusSessionCreate):
    session_data = input.model_dump()
    if session_data.get('date') is None:
        session_data['date'] = datetime.now(timezone.utc).date().isoformat()
    session = FocusSession(**session_data)
    doc = session.model_dump()
    await db.focus_sessions.insert_one(doc)
    return session

@api_router.get("/focus-sessions", response_model=List[FocusSession])
async def get_focus_sessions():
    sessions = await db.focus_sessions.find({}, {"_id": 0}).to_list(1000)
    return sessions

# GPA Records
@api_router.post("/gpa-records", response_model=GPARecord)
async def create_gpa_record(input: GPARecordCreate):
    record = GPARecord(**input.model_dump())
    doc = record.model_dump()
    await db.gpa_records.insert_one(doc)
    return record

@api_router.get("/gpa-records", response_model=List[GPARecord])
async def get_gpa_records():
    records = await db.gpa_records.find({}, {"_id": 0}).to_list(1000)
    return records

# Current Status
@api_router.get("/status", response_model=CurrentStatus)
async def get_status():
    status = await db.status.find_one({"id": "user_status"}, {"_id": 0})
    if not status:
        default_status = CurrentStatus()
        await db.status.insert_one(default_status.model_dump())
        return default_status
    return CurrentStatus(**status)

@api_router.patch("/status", response_model=CurrentStatus)
async def update_status(input: CurrentStatusUpdate):
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    if update_data:
        update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
        await db.status.update_one(
            {"id": "user_status"},
            {"$set": update_data},
            upsert=True
        )
    status = await db.status.find_one({"id": "user_status"}, {"_id": 0})
    return CurrentStatus(**status)

# GPA Calculator
@api_router.post("/gpa/calculate", response_model=GPACalculation)
async def calculate_required_gpa(status: CurrentStatusUpdate):
    # Get current status
    current_status = await db.status.find_one({"id": "user_status"}, {"_id": 0})
    if current_status:
        current_cgpa = status.current_cgpa or current_status.get('current_cgpa', 7.67)
        completed_credits = status.completed_credits or current_status.get('completed_credits', 86)
        target_cgpa = status.target_cgpa or current_status.get('target_cgpa', 9.0)
        total_credits = status.total_credits or current_status.get('total_credits', 86)
    else:
        current_cgpa = status.current_cgpa or 7.67
        completed_credits = status.completed_credits or 86
        target_cgpa = status.target_cgpa or 9.0
        total_credits = status.total_credits or 86
    
    remaining_credits = total_credits - completed_credits
    
    if remaining_credits <= 0:
        return GPACalculation(required_gpa=0, remaining_credits=0)
    
    # Formula: Required GPA = ((Target CGPA × Total Credits) - (Current CGPA × Completed Credits)) / Remaining Credits
    required_gpa = ((target_cgpa * total_credits) - (current_cgpa * completed_credits)) / remaining_credits
    
    # Predict current semester GPA based on tasks
    tasks = await db.tasks.find({"status": "completed", "marks": {"$ne": None}}, {"_id": 0}).to_list(1000)
    if tasks:
        total_percentage = sum([(t['marks'] / t['max_marks']) * 100 for t in tasks if t.get('max_marks', 0) > 0])
        avg_percentage = total_percentage / len(tasks)
        predicted_gpa = (avg_percentage / 10) if avg_percentage <= 100 else 10.0
    else:
        predicted_gpa = None
    
    return GPACalculation(
        required_gpa=round(required_gpa, 2),
        remaining_credits=remaining_credits,
        predicted_current_gpa=round(predicted_gpa, 2) if predicted_gpa else None
    )

# Analytics
@api_router.get("/analytics/dashboard")
async def get_dashboard_analytics():
    # Get all data
    tasks = await db.tasks.find({}, {"_id": 0}).to_list(1000)
    focus_sessions = await db.focus_sessions.find({}, {"_id": 0}).to_list(1000)
    subjects = await db.subjects.find({}, {"_id": 0}).to_list(1000)
    
    # Calculate metrics
    total_tasks = len(tasks)
    completed_tasks = len([t for t in tasks if t['status'] == 'completed'])
    completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
    
    # Weekly study hours
    from datetime import timedelta
    today = datetime.now(timezone.utc).date()
    week_ago = today - timedelta(days=7)
    weekly_sessions = [s for s in focus_sessions if s['date'] >= week_ago.isoformat()]
    weekly_hours = sum([s['duration_minutes'] for s in weekly_sessions]) / 60
    
    # Subject-wise performance
    subject_performance = []
    for subject in subjects:
        subject_tasks = [t for t in tasks if t['subject_id'] == subject['id'] and t['status'] == 'completed' and t.get('marks') is not None]
        if subject_tasks:
            avg_percentage = sum([(t['marks'] / t['max_marks']) * 100 for t in subject_tasks if t.get('max_marks', 0) > 0]) / len(subject_tasks)
            subject_performance.append({
                'subject': subject['name'],
                'score': round(avg_percentage, 2)
            })
    
    # Focus streak (consecutive days with sessions)
    dates_with_sessions = sorted(set([s['date'] for s in focus_sessions]), reverse=True)
    streak = 0
    for i, date_str in enumerate(dates_with_sessions):
        if i == 0:
            streak = 1
        else:
            prev_date = datetime.fromisoformat(dates_with_sessions[i-1]).date()
            curr_date = datetime.fromisoformat(date_str).date()
            if (prev_date - curr_date).days == 1:
                streak += 1
            else:
                break
    
    return {
        "completion_rate": round(completion_rate, 2),
        "weekly_study_hours": round(weekly_hours, 2),
        "focus_streak": streak,
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "subject_performance": subject_performance
    }

# Chat
@api_router.post("/chat", response_model=ChatMessage)
async def chat_with_ai(request: ChatRequest):
    # Save user message
    user_msg = ChatMessage(role="user", content=request.message)
    await db.chat_messages.insert_one(user_msg.model_dump())
    
    # Get context data
    status = await db.status.find_one({"id": "user_status"}, {"_id": 0})
    tasks = await db.tasks.find({}, {"_id": 0}).to_list(100)
    focus_sessions = await db.focus_sessions.find({}, {"_id": 0}).to_list(100)
    subjects = await db.subjects.find({}, {"_id": 0}).to_list(100)
    
    # Build context
    context = f"""
You are an AI academic coach for a B.Tech CSE (Data Science) student.

Current Academic Status:
- Current CGPA: {status.get('current_cgpa', 7.67) if status else 7.67}
- Completed Credits: {status.get('completed_credits', 86) if status else 86}
- Target CGPA: {status.get('target_cgpa', 9.0) if status else 9.0}
- Semester Goal: {status.get('current_semester_goal', 9.0) if status else 9.0}

Recent Tasks: {len(tasks)} tasks, {len([t for t in tasks if t['status'] == 'completed'])} completed
Study Sessions: {len(focus_sessions)} focus sessions logged
Subjects: {len(subjects)} active subjects

Provide supportive, motivational, and data-driven academic coaching. Suggest study schedules, analyze performance, and give actionable advice.
"""
    
    # Call Claude
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    chat = LlmChat(
        api_key=api_key,
        session_id="gpa_coach_session",
        system_message=context
    ).with_model("anthropic", "claude-3-7-sonnet-20250219")
    
    user_message = UserMessage(text=request.message)
    response_text = await chat.send_message(user_message)
    
    # Save assistant message
    assistant_msg = ChatMessage(role="assistant", content=response_text)
    await db.chat_messages.insert_one(assistant_msg.model_dump())
    
    return assistant_msg

@api_router.get("/chat/history", response_model=List[ChatMessage])
async def get_chat_history():
    messages = await db.chat_messages.find({}, {"_id": 0}).sort("created_at", 1).to_list(1000)
    return messages

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()