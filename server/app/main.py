# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from app.api import router
# from app.database import Base, engine  # Đường dẫn đúng theo project của bạn
# from app import models                 # Đảm bảo models đã được import (rất quan trọng!)

# app = FastAPI()
# app.include_router(router)

# #  Dòng này sẽ tạo bảng users nếu chưa có
# Base.metadata.create_all(bind=engine)
# # Cho phép tất cả frontend gọi API (hoặc chỉnh đúng host nếu muốn bảo mật hơn)
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     # allow_origins=["*"],   # hoặc ["http://localhost:3000"] nếu frontend chạy cổng 3000
#     # allow_credentials=True # bật lên khi có domain chính thức
#     allow_methods=["*"],  # hoặc ["POST", "GET", "OPTIONS"]
#     allow_headers=["*"],
# )


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
    allow_origins=["*"],          # khi deploy nhớ hạn chế domain
    allow_methods=["*"],
    allow_headers=["*"],
)