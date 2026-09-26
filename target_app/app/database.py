"""
target_app/app/database.py
==========================
SQLite database setup with SQLAlchemy (async).
Tables: users, products, comments, orders.
Includes seed data populated at startup.
"""

import os
import hashlib
import logging
from datetime import datetime

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey
)
from sqlalchemy.sql import func, text

logger = logging.getLogger("target_app.database")

DB_PATH = os.environ.get("TARGET_DB_PATH", "/tmp/target_lab.db")
DATABASE_URL = f"sqlite+aiosqlite:///{DB_PATH}"

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()


# ─────────────────────────────────────────────────────────────
#  ORM Models
# ─────────────────────────────────────────────────────────────

class LabUser(Base):
    __tablename__ = "lab_users"
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(64), unique=True, nullable=False, index=True)
    email = Column(String(128), unique=True, nullable=False)
    # Intentionally plaintext for the vulnerable app
    password = Column(String(256), nullable=False)
    role = Column(String(32), nullable=False, default="user")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(128), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    category = Column(String(64), nullable=False)
    stock = Column(Integer, default=0)


class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    author = Column(String(64), nullable=False)
    # Stored raw — intentional XSS vulnerability
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("lab_users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    total_price = Column(Float, nullable=False)
    status = Column(String(32), nullable=False, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    # Intentionally includes sensitive data for IDOR demonstration
    shipping_address = Column(Text, nullable=True)
    payment_ref = Column(String(64), nullable=True)


# ─────────────────────────────────────────────────────────────
#  Session dependency
# ─────────────────────────────────────────────────────────────

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


# ─────────────────────────────────────────────────────────────
#  Seed data
# ─────────────────────────────────────────────────────────────

SEED_USERS = [
    {
        "username": "admin",
        "email": "admin@lab.local",
        "password": "Admin1234",      # plaintext — intentional vulnerability
        "role": "admin",
    },
    {
        "username": "testuser",
        "email": "testuser@lab.local",
        "password": "password123",    # plaintext — intentional vulnerability
        "role": "user",
    },
]

SEED_PRODUCTS = [
    {
        "name": "Widget Alpha",
        "description": "A high-quality widget for general purposes.",
        "price": 29.99,
        "category": "widgets",
        "stock": 100,
    },
    {
        "name": "Gadget Beta",
        "description": "An advanced gadget with many features.",
        "price": 149.50,
        "category": "gadgets",
        "stock": 45,
    },
    {
        "name": "Component Gamma",
        "description": "Essential component for integration testing.",
        "price": 9.99,
        "category": "components",
        "stock": 250,
    },
]

SEED_ORDERS = [
    {"user_id": 1, "product_id": 1, "quantity": 2, "total_price": 59.98,
     "status": "completed", "shipping_address": "123 Admin St, Labville",
     "payment_ref": "PAY-0001-ADM"},
    {"user_id": 1, "product_id": 2, "quantity": 1, "total_price": 149.50,
     "status": "pending", "shipping_address": "123 Admin St, Labville",
     "payment_ref": "PAY-0002-ADM"},
    {"user_id": 2, "product_id": 1, "quantity": 1, "total_price": 29.99,
     "status": "completed", "shipping_address": "456 User Ave, Testtown",
     "payment_ref": "PAY-0003-TST"},
    {"user_id": 2, "product_id": 3, "quantity": 5, "total_price": 49.95,
     "status": "shipped", "shipping_address": "456 User Ave, Testtown",
     "payment_ref": "PAY-0004-TST"},
    {"user_id": 1, "product_id": 3, "quantity": 10, "total_price": 99.90,
     "status": "pending", "shipping_address": "789 Lab Blvd, Dev City",
     "payment_ref": "PAY-0005-ADM"},
]


async def seed_data() -> None:
    """
    Idempotent seed function.  Checks if data already exists before inserting.
    """
    async with AsyncSessionLocal() as session:
        # Check if already seeded
        result = await session.execute(text("SELECT COUNT(*) FROM lab_users"))
        count = result.scalar()
        if count and count > 0:
            logger.info("Database already seeded — skipping.")
            return

        # Insert users
        for user_data in SEED_USERS:
            user = LabUser(**user_data)
            session.add(user)
        await session.flush()

        # Insert products
        for prod_data in SEED_PRODUCTS:
            product = Product(**prod_data)
            session.add(product)
        await session.flush()

        # Insert orders
        for order_data in SEED_ORDERS:
            order = Order(**order_data)
            session.add(order)

        await session.commit()
        logger.info("Database seeded with %d users, %d products, %d orders.",
                    len(SEED_USERS), len(SEED_PRODUCTS), len(SEED_ORDERS))
