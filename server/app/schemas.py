from pydantic import BaseModel
from datetime import date

class LoginData(BaseModel):
    email: str
    password: str

class RegisterData(BaseModel):
    email: str
    password: str
    full_name: str
    phone: str
    gender: str
    birth_year: date
    facebook: str
    province: str
    school: str
