from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from pydantic import BaseModel, Field, constr, EmailStr
from datetime import datetime, timedelta
import jwt
import os
import secrets

from app.database import SessionLocal
from app.models import User
from app.schemas import LoginData, RegisterData

router = APIRouter()

# ================== JWT config ==================
SECRET_KEY = "CHANGE_ME_TO_A_RANDOM_SECRET"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ================== Avatar storage ==================
AVATAR_DIR = "/data/avatars"
os.makedirs(AVATAR_DIR, exist_ok=True)

# ================== DB session ==================
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ================== JWT helpers ==================
def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str | None = payload.get("sub")
        if not email:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

# ================== Schemas for profile/password ==================
class UpdateProfile(BaseModel):
    # Dùng Field để đặt ràng buộc, tránh lỗi Pylance với constr(...)
    full_name: str | None = Field(default=None, min_length=1)
    phone: str | None = None
    gender: str | None = None
    birth_year: str | None = None
    facebook: str | None = None
    province: str | None = None
    school: str | None = None

class ChangePassword(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=6)

# ================== Routes ==================
@router.get("/")
def read_root():
    return {"message": "hello from backend!"}

@router.post("/login")
def login(data: LoginData, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not pwd_context.verify(data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sai email hoặc mật khẩu")
    access_token = create_access_token({"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register")
def register(data: RegisterData, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email đã tồn tại")

    hashed_pw = pwd_context.hash(data.password)
    new_user = User(
        email=data.email,
        hashed_password=hashed_pw,
        full_name=data.full_name,
        phone=data.phone,
        gender=data.gender,
        birth_year=data.birth_year,
        facebook=data.facebook,
        province=data.province,
        school=data.school,
    )
    db.add(new_user)
    db.commit()
    return {"message": "Tạo tài khoản thành công"}

def _serialize_user(u: User) -> dict:
    return {
        "full_name": u.full_name,
        "email": u.email,
        "phone": u.phone,
        "gender": u.gender,
        "birth_year": u.birth_year,
        "facebook": u.facebook,
        "province": u.province,
        "school": u.school,
        "has_avatar": bool(u.avatar_path),
    }

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return _serialize_user(current_user)

# ======= Update profile =======
@router.put("/me")
def update_me(
    data: UpdateProfile,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    fields = ["full_name", "phone", "gender", "birth_year", "facebook", "province", "school"]
    for f in fields:
        v = getattr(data, f)
        if v is not None:
            setattr(current_user, f, v)

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return _serialize_user(current_user)

# ======= Change password =======
@router.post("/me/password")
def change_password(
    data: ChangePassword,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not pwd_context.verify(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Mật khẩu hiện tại không đúng")

    current_user.hashed_password = pwd_context.hash(data.new_password)
    db.add(current_user)
    db.commit()
    return {"message": "Đổi mật khẩu thành công"}

# ------------------ Avatar helpers ------------------
def _ext_from_mime(mime: str) -> str:
    if mime == "image/png":
        return ".png"
    if mime in ("image/jpg", "image/jpeg"):
        return ".jpg"
    if mime == "image/webp":
        return ".webp"
    return ""

# ------------------ Avatar APIs ------------------
@router.get("/me/avatar")
def get_avatar(current_user: User = Depends(get_current_user)):
    if not current_user.avatar_path or not os.path.exists(current_user.avatar_path):
        raise HTTPException(status_code=404, detail="Chưa có ảnh đại diện")
    headers = {"Cache-Control": "public, max-age=3600"}
    return FileResponse(
        current_user.avatar_path,
        media_type=current_user.avatar_mime or "application/octet-stream",
        headers=headers,
    )

@router.post("/me/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File không phải ảnh")

    data = await file.read()
    if len(data) > 2 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Ảnh quá lớn (tối đa 2MB)")

    ext = _ext_from_mime(file.content_type)
    if not ext:
        raise HTTPException(status_code=400, detail="Định dạng ảnh không hỗ trợ (png, jpg, webp)")

    rnd = secrets.token_hex(6)
    filename = f"{current_user.id}-{rnd}{ext}"
    path = os.path.join(AVATAR_DIR, filename)

    if current_user.avatar_path and os.path.exists(current_user.avatar_path):
        try:
            os.remove(current_user.avatar_path)
        except Exception:
            pass

    with open(path, "wb") as f:
        f.write(data)

    current_user.avatar_path = path
    current_user.avatar_mime = file.content_type
    db.add(current_user)
    db.commit()
    return {"message": "Cập nhật ảnh đại diện thành công"}


# ở đầu file đã có: from pydantic import BaseModel, Field
class DeleteAccount(BaseModel):
    current_password: str = Field(..., min_length=1)

@router.delete("/me")
def delete_me(
    data: DeleteAccount,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # xác thực mật khẩu hiện tại
    if not pwd_context.verify(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Mật khẩu hiện tại không đúng")

    # xóa avatar file nếu có
    if current_user.avatar_path and os.path.exists(current_user.avatar_path):
        try:
            os.remove(current_user.avatar_path)
        except Exception:
            pass

    # TODO: nếu có bảng liên quan (bài đăng, bình luận...), cấu hình
    # relationship(cascade="all, delete-orphan") ở models hoặc xóa thủ công tại đây.

    db.delete(current_user)
    db.commit()
    return {"message": "Đã xóa tài khoản"}

RESET_EXPIRE_MINUTES = 15

class ForgotPasswordReq(BaseModel):
    email: EmailStr

class ResetPasswordReq(BaseModel):
    token: constr(min_length=20)
    new_password: constr(min_length=6)

@router.post("/password/forgot")
def forgot_password(
    data: ForgotPasswordReq,
    db: Session = Depends(get_db),
):
    # Không tiết lộ email có tồn tại hay không → always 200
    user = db.query(User).filter(User.email == data.email.lower()).first()
    if user:
        token = secrets.token_urlsafe(32)  # ~43 ký tự
        user.reset_token = token
        user.reset_expires = datetime.utcnow() + timedelta(minutes=RESET_EXPIRE_MINUTES)
        db.add(user); db.commit()

        # TODO: Gửi email thật ở đây (SMTP). Trong DEV trả link để tiện test:
        dev_link = f"http://localhost:3000/reset?token={token}"
        return {
            "message": "Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.",
            "dev_reset_link": dev_link,
            "expires_in_minutes": RESET_EXPIRE_MINUTES,
        }

    return {
        "message": "Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.",
        "expires_in_minutes": RESET_EXPIRE_MINUTES,
    }

@router.post("/password/reset")
def reset_password(
    data: ResetPasswordReq,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.reset_token == data.token).first()
    if not user or not user.reset_expires or user.reset_expires < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Mã đặt lại không hợp lệ hoặc đã hết hạn")

    # Đổi mật khẩu
    user.hashed_password = pwd_context.hash(data.new_password)
    user.reset_token = None
    user.reset_expires = None
    db.add(user)
    db.commit()
    return {"message": "Đặt lại mật khẩu thành công"}