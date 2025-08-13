from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import router
from app.database import Base, engine
from app import models  # ensure models loaded

app = FastAPI()
app.include_router(router)

# tạo bảng nếu chưa có
Base.metadata.create_all(bind=engine)

# CORS (giữ như bạn cấu hình)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # khi deploy nhớ hạn chế domain hoặc ["http://localhost:3000"] nếu frontend chạy cổng 3000
    allow_methods=["*"],
    allow_headers=["*"],
)