import os

import uvicorn
from fastapi import FastAPI, Depends, HTTPException, status  # remove Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from models import User, Poll, PollOption, Vote, Comment
from database import SessionLocal, engine
from typing import List

app = FastAPI()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://pollen-flame.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

pwd_context = CryptContext(schemes=["bcrypt_sha256"], deprecated="auto")

SECRET_KEY = os.getenv("SECRET_KEY", "devsecret123")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class PollOptionCreate(BaseModel):
    text: str

class PollCreate(BaseModel):
    question: str
    options: List[PollOptionCreate]

class VoteCreate(BaseModel):
    option_id: int

class CommentCreate(BaseModel):
    text: str

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

# Update create_user to store email
def create_user(db, user: UserCreate):
    hashed_password = pwd_context.hash(user.password)
    db_user = User(username=user.username, email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    return {"message": "Account created successfully"}

# Keep only ONE register route
@app.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    if get_user_by_username(db, username=user.username):
        raise HTTPException(status_code=400, detail="Username already taken")
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    return create_user(db=db, user=user)

def authenticate_user(username: str, password: str, db: Session):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return False
    if not pwd_context.verify(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if  expires_delta:
        expire=datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@app.post("/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(form_data.username, form_data.password, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": user.username}, expires_delta=access_token_expires)

    return {"access_token": access_token, "token_type": "bearer"}

def verify_token(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=403, detail="Invalid token")
        return payload
    except JWTError:
        raise HTTPException(status_code=403, detail="Invalid token")

@app.get("/verify-token/{token}")
async def verify_user_token(token: str):
    verify_token(token=token)
    return {"message": "Token is valid"}

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = db.query(User).filter(User.username == username).first()
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.post("/polls", status_code=201)
def create_poll(poll: PollCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if len(poll.options) < 2:
        raise HTTPException(status_code=400, detail="A poll must have at least 2 options")
    db_poll = Poll(question=poll.question, creator_id=current_user.id)
    db.add(db_poll)
    db.flush()
    for opt in poll.options:
        db.add(PollOption(text=opt.text, poll_id=db_poll.id))
    db.commit()
    db.refresh(db_poll)
    return {"id": db_poll.id, "message": "Poll created"}

@app.get("/polls")
def get_polls(
    page: int = 1,
    page_size: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    total = db.query(Poll).count()
    polls = (
        db.query(Poll)
        .order_by(Poll.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    result = []
    for poll in polls:
        user_vote = db.query(Vote).join(PollOption).filter(
            PollOption.poll_id == poll.id,
            Vote.user_id == current_user.id
        ).first()
        options = []
        for opt in poll.options:
            vote_count = db.query(Vote).filter(Vote.option_id == opt.id).count()
            options.append({"id": opt.id, "text": opt.text, "votes": vote_count})
        result.append({
            "id": poll.id,
            "question": poll.question,
            "creator": poll.creator.username,
            "options": options,
            "voted_option_id": user_vote.option_id if user_vote else None,
            "created_at": poll.created_at.isoformat() if poll.created_at else None,
        })
    return {
        "polls": result,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": -(-total // page_size),  # ceiling division
    }

@app.post("/polls/{poll_id}/vote")
def vote_on_poll(poll_id: int, vote: VoteCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    option = db.query(PollOption).filter(PollOption.id == vote.option_id, PollOption.poll_id == poll_id).first()
    if not option:
        raise HTTPException(status_code=404, detail="Option not found")
    existing_vote = db.query(Vote).join(PollOption).filter(
        PollOption.poll_id == poll_id,
        Vote.user_id == current_user.id
    ).first()
    if existing_vote:
        raise HTTPException(status_code=400, detail="You have already voted on this poll")
    db.add(Vote(user_id=current_user.id, option_id=vote.option_id))
    db.commit()
    return {"message": "Vote recorded"}

# Delete a poll (owner only)
@app.delete("/polls/{poll_id}")
def delete_poll(poll_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    poll = db.query(Poll).filter(Poll.id == poll_id).first()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    if poll.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your poll")
    db.delete(poll)
    db.commit()
    return {"message": "Poll deleted"}

# Post a comment
@app.post("/polls/{poll_id}/comments", status_code=201)
def add_comment(poll_id: int, comment: CommentCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    poll = db.query(Poll).filter(Poll.id == poll_id).first()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    db_comment = Comment(text=comment.text, user_id=current_user.id, poll_id=poll_id)
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return {"id": db_comment.id, "text": db_comment.text, "author": current_user.username}

# Get comments for a poll
@app.get("/polls/{poll_id}/comments")
def get_comments(poll_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    comments = db.query(Comment).filter(Comment.poll_id == poll_id).all()
    return [
        {
            "id": c.id,
            "text": c.text,
            "author": c.author.username,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        }
        for c in comments
    ]
