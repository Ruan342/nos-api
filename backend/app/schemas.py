from typing import Literal

from pydantic import BaseModel, EmailStr, field_validator

from app.security import validate_password_strength


class SignupNoivo(BaseModel):
    email: EmailStr
    password: str
    full_name: str

    @field_validator("password")
    @classmethod
    def check_password(cls, v: str) -> str:
        validate_password_strength(v)
        return v


class SignupFornecedor(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    business_name: str

    @field_validator("password")
    @classmethod
    def check_password(cls, v: str) -> str:
        validate_password_strength(v)
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    role: Literal["noivo", "fornecedor"]


class UserOut(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    role: str

    @field_validator("id", "role", mode="before")
    @classmethod
    def stringify(cls, v: object) -> str:
        return v.value if hasattr(v, "value") else str(v)

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    user: UserOut
    access_token: str
    token_type: str = "bearer"


class ForgotPasswordCheckRequest(BaseModel):
    email: EmailStr


class ForgotPasswordCheckResponse(BaseModel):
    exists: bool


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    new_password: str

    @field_validator("new_password")
    @classmethod
    def check_password(cls, v: str) -> str:
        validate_password_strength(v)
        return v


class MessageResponse(BaseModel):
    message: str
