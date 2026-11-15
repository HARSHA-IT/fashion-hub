
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


# ==========================================
# USER MODEL
# ==========================================

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="customer", nullable=False)


# ==========================================
# PRODUCT MODEL
# ==========================================

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(180), nullable=False)
    category = Column(String(30), nullable=False)
    description = Column(Text, default="")
    price = Column(Float, nullable=False)
    image_url = Column(String(700), default="")
    stock = Column(Integer, default=0)


# ==========================================
# ORDER MODEL
# ==========================================

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String(120), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(30), nullable=False)
    address = Column(Text, nullable=False)
    status = Column(String(30), default="Received")
    total = Column(Float, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # One order can contain multiple items
    items = relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan"
    )


# ==========================================
# ORDER ITEM MODEL
# ==========================================

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)

    order_id = Column(
        Integer,
        ForeignKey("orders.id"),
        nullable=False
    )

    # Store a snapshot of the purchased product
    product_id = Column(Integer, nullable=True)
    product_name = Column(String(180), nullable=False)
    unit_price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)

    # Connect item to its order
    order = relationship(
        "Order",
        back_populates="items"
    )
