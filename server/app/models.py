# server/app/models.py
from sqlalchemy import Column, Integer, String, Date, DateTime
from app.database import Base
from datetime import datetime


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(128), nullable=False)

    full_name = Column(String(100))
    phone = Column(String(20))
    gender = Column(String(10))
    birth_year = Column(Date)  # DATE

    facebook = Column(String(100))
    province = Column(String(100))
    school = Column(String(100))

    # ẢNH ĐẠI DIỆN – lưu đường dẫn + mime (bền, dễ scale)
    avatar_mime = Column(String(50), nullable=True)      # vd: "image/png"
    avatar_path = Column(String(255), nullable=True)     # vd: "/data/avatars/1-abc123.png"

    
    # ↓↓↓ Thêm 2 cột cho reset password
    reset_token = Column(String(128), nullable=True, index=True)
    reset_expires = Column(DateTime, nullable=True)