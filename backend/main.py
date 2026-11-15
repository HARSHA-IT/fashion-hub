
import os
import uuid

from datetime import datetime, timedelta
from typing import Optional

from dotenv import load_dotenv

from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    UploadFile,
    File
)

from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from passlib.context import CryptContext

from database import Base, engine, get_db
from models import User, Product, Order, OrderItem
from schemas import RegisterInput, LoginInput, OrderInput


# ==================================================
# CONFIGURATION
# ==================================================

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Fashion Hub API", version="3.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("SECRET_KEY", "dev-only-change-this-secret")
ALGORITHM = "HS256"

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "").strip().lower()

security = HTTPBearer()


# ==================================================
# IMAGE STORAGE CONFIGURATION
# ==================================================

UPLOAD_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "uploads"
)

os.makedirs(UPLOAD_DIR, exist_ok=True)


# ==================================================
# INPUT MODELS
# ==================================================

class ProductInput(BaseModel):
    name: str = Field(min_length=2, max_length=180)
    category: str = Field(min_length=2, max_length=30)
    description: str = ""
    price: float = Field(gt=0)
    image_url: str = ""
    stock: int = Field(default=0, ge=0)


class OrderStatusInput(BaseModel):
    status: str


# ==================================================
# AUTHENTICATION
# ==================================================

def token_for(user):
    payload = {
        "sub": str(user.id),
        "role": user.role,
        "exp": datetime.utcnow() + timedelta(hours=8)
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    try:
        payload = jwt.decode(
            credentials.credentials,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication token"
            )

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    user = db.query(User).filter(
        User.id == int(user_id)
    ).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return user


def admin_required(user: User = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )

    return user


# ==================================================
# HOME
# ==================================================

@app.get("/")
def home():
    return {
        "message": "Fashion Hub API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "ok"
    }


# ==================================================
# REGISTER
# ==================================================

@app.post("/auth/register")
def register(
    data: RegisterInput,
    db: Session = Depends(get_db)
):
    email = str(data.email).lower().strip()

    existing_user = db.query(User).filter(
        User.email == email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="Email already registered"
        )

    user = User(
        name=data.name,
        email=email,
        password_hash=pwd.hash(data.password),
        role="customer"
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "message": "Account created successfully",
        "user_id": user.id
    }


# ==================================================
# LOGIN
# ==================================================

@app.post("/auth/login")
def login(
    data: LoginInput,
    db: Session = Depends(get_db)
):
    email = str(data.email).lower().strip()

    user = db.query(User).filter(
        User.email == email
    ).first()

    if not user or not pwd.verify(
        data.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password"
        )

    if ADMIN_EMAIL and user.email.lower() == ADMIN_EMAIL:
        if user.role != "admin":
            user.role = "admin"
            db.commit()
            db.refresh(user)

    return {
        "access_token": token_for(user),
        "token_type": "bearer",
        "role": user.role,
        "email": user.email,
        "name": user.name
    }


# ==================================================
# PUBLIC PRODUCTS API
# ==================================================

@app.get("/products")
def list_products(
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Product)

    if category:
        query = query.filter(
            Product.category.ilike(category)
        )

    return query.order_by(
        Product.id.desc()
    ).all()


# ==================================================
# CUSTOMER CHECKOUT
# LOGIN REQUIRED
# ==================================================

@app.post("/orders")
def create_order(
    data: OrderInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not data.items:
        raise HTTPException(
            status_code=400,
            detail="Order must contain at least one item"
        )

    total = 0
    products_to_update = []

    for item in data.items:

        if item.quantity <= 0:
            raise HTTPException(
                status_code=400,
                detail="Quantity must be greater than zero"
            )

        product = db.query(Product).filter(
            Product.id == item.product_id
        ).first()

        if not product:
            raise HTTPException(
                status_code=404,
                detail=f"Product {item.product_id} was not found"
            )

        if product.stock < item.quantity:
            raise HTTPException(
                status_code=409,
                detail=f"Insufficient stock for {product.name}"
            )

        total += product.price * item.quantity

        products_to_update.append(
            (product, item.quantity)
        )

    try:
        order = Order(
            customer_name=current_user.name,
            email=current_user.email,
            phone=data.phone,
            address=data.address,
            total=round(total, 2)
        )

        db.add(order)
        db.flush()

        for product, quantity in products_to_update:

            order_item = OrderItem(
                order_id=order.id,
                product_id=product.id,
                product_name=product.name,
                unit_price=product.price,
                quantity=quantity
            )

            db.add(order_item)

            product.stock -= quantity

        db.commit()
        db.refresh(order)

    except Exception:
        db.rollback()
        raise

    return {
        "message": "Order placed successfully",
        "order_id": order.id,
        "status": order.status,
        "total": order.total
    }


# ==================================================
# CUSTOMER VIEW MY ORDERS
# LOGIN REQUIRED
# ==================================================

@app.get("/my-orders")
def my_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    orders = db.query(Order).filter(
        Order.email == current_user.email
    ).order_by(
        Order.created_at.desc()
    ).all()

    result = []

    for order in orders:

        order_items = []

        for item in order.items:
            order_items.append({
                "id": item.id,
                "product_id": item.product_id,
                "product_name": item.product_name,
                "unit_price": item.unit_price,
                "quantity": item.quantity,
                "subtotal": round(
                    item.unit_price * item.quantity,
                    2
                )
            })

        result.append({
            "id": order.id,
            "customer_name": order.customer_name,
            "email": order.email,
            "phone": order.phone,
            "address": order.address,
            "status": order.status,
            "total": order.total,
            "created_at": order.created_at,
            "items": order_items
        })

    return result


# ==================================================
# ADMIN DASHBOARD STATISTICS
# ==================================================

@app.get("/admin/stats")
def admin_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(admin_required)
):
    total_products = db.query(Product).count()
    total_orders = db.query(Order).count()

    total_customers = db.query(User).filter(
        User.role == "customer"
    ).count()

    total_sales = sum(
        float(order.total or 0)
        for order in db.query(Order).all()
    )

    return {
        "total_products": total_products,
        "total_orders": total_orders,
        "total_customers": total_customers,
        "total_sales": round(total_sales, 2)
    }


# ==================================================
# ADMIN IMAGE UPLOAD
# ADMIN LOGIN REQUIRED
# ==================================================

@app.post("/admin/upload-image")
async def upload_product_image(
    file: UploadFile = File(...),
    admin: User = Depends(admin_required)
):
    allowed_types = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp"
    }

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG and WEBP images are allowed."
        )

    image_data = await file.read()

    if not image_data:
        raise HTTPException(
            status_code=400,
            detail="Please select an image."
        )

    if len(image_data) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Image size must be 5 MB or less."
        )

    extension = allowed_types[file.content_type]

    filename = f"{uuid.uuid4().hex}{extension}"

    file_path = os.path.join(
        UPLOAD_DIR,
        filename
    )

    try:
        with open(file_path, "wb") as image_file:
            image_file.write(image_data)

    except OSError:
        raise HTTPException(
            status_code=500,
            detail="Could not save the uploaded image."
        )

    return {
        "message": "Image uploaded successfully",
        "image_url": f"/uploads/{filename}"
    }


# ==================================================
# ADMIN VIEW PRODUCTS
# ==================================================

@app.get("/admin/products")
def admin_products(
    db: Session = Depends(get_db),
    admin: User = Depends(admin_required)
):
    return db.query(Product).order_by(
        Product.id.desc()
    ).all()


# ==================================================
# ADMIN ADD PRODUCT
# ==================================================

@app.post("/admin/products")
def add_product(
    data: ProductInput,
    db: Session = Depends(get_db),
    admin: User = Depends(admin_required)
):
    product = Product(
        name=data.name,
        category=data.category,
        description=data.description,
        price=data.price,
        image_url=data.image_url,
        stock=data.stock
    )

    db.add(product)
    db.commit()
    db.refresh(product)

    return {
        "message": "Product added successfully",
        "product": product
    }


# ==================================================
# ADMIN UPDATE PRODUCT
# ==================================================

@app.put("/admin/products/{product_id}")
def update_product(
    product_id: int,
    data: ProductInput,
    db: Session = Depends(get_db),
    admin: User = Depends(admin_required)
):
    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    product.name = data.name
    product.category = data.category
    product.description = data.description
    product.price = data.price
    product.image_url = data.image_url
    product.stock = data.stock

    db.commit()
    db.refresh(product)

    return {
        "message": "Product updated successfully",
        "product": product
    }


# ==================================================
# ADMIN DELETE PRODUCT
# ==================================================

@app.delete("/admin/products/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(admin_required)
):
    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    db.delete(product)
    db.commit()

    return {
        "message": "Product deleted successfully"
    }


# ==================================================
# ADMIN VIEW ORDERS WITH PRODUCT DETAILS
# ==================================================

@app.get("/admin/orders")
def admin_orders(
    db: Session = Depends(get_db),
    admin: User = Depends(admin_required)
):
    orders = db.query(Order).order_by(
        Order.created_at.desc()
    ).all()

    result = []

    for order in orders:

        order_items = []

        for item in order.items:
            order_items.append({
                "id": item.id,
                "product_id": item.product_id,
                "product_name": item.product_name,
                "unit_price": item.unit_price,
                "quantity": item.quantity,
                "subtotal": round(
                    item.unit_price * item.quantity,
                    2
                )
            })

        result.append({
            "id": order.id,
            "customer_name": order.customer_name,
            "email": order.email,
            "phone": order.phone,
            "address": order.address,
            "status": order.status,
            "total": order.total,
            "created_at": order.created_at,
            "items": order_items
        })

    return result


# ==================================================
# ADMIN UPDATE ORDER STATUS
# ==================================================

@app.patch("/admin/orders/{order_id}/status")
def update_order_status(
    order_id: int,
    data: OrderStatusInput,
    db: Session = Depends(get_db),
    admin: User = Depends(admin_required)
):
    allowed_statuses = [
        "Received",
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled"
    ]

    if data.status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid order status"
        )

    order = db.query(Order).filter(
        Order.id == order_id
    ).first()

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    order.status = data.status

    db.commit()
    db.refresh(order)

    return {
        "message": "Order status updated successfully",
        "order_id": order.id,
        "status": order.status
    }


# ==================================================
# SERVE UPLOADED PRODUCT IMAGES
# ==================================================

app.mount(
    "/uploads",
    StaticFiles(directory=UPLOAD_DIR),
    name="uploads"
)
