from pydantic import BaseModel, EmailStr, Field
from typing import List

class RegisterInput(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8)

class LoginInput(BaseModel):
    email: EmailStr
    password: str

class OrderItemInput(BaseModel):
    product_id: int
    quantity: int = Field(ge=1, le=20)
    size: str = "M"

class OrderInput(BaseModel):
    customer_name: str
    email: EmailStr
    phone: str
    address: str
    items: List[OrderItemInput]
