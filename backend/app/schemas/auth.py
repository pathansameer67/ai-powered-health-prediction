from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

class UserRegisterRequest(BaseModel):
    email: str = Field(..., min_length=3, description="User email address")
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None

class UserLoginRequest(BaseModel):
    email: str = Field(..., min_length=3)
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    full_name: Optional[str] = None
    is_admin: bool = False

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    full_name: Optional[str] = None
    is_admin: bool
    is_active: bool
    created_at: datetime
