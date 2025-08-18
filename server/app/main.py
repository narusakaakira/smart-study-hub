from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import router
from app.database import Base, engine
from app import models  # ensure models loaded

app = FastAPI()
app.include_router(router)

# tạo bảng nếu chưa có
Base.metadata.create_all(bind=engine)

origins = [
    "http://localhost:3000", 
    "http://127.0.0.1:3000",
]

# CORS (giữ như bạn cấu hình)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)