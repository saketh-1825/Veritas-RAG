import motor.motor_asyncio
from app.config.settings import settings
import logging
import json
import os
import uuid
from datetime import datetime
logger = logging.getLogger("rag_pipeline")

class Database:
    client: motor.motor_asyncio.AsyncIOMotorClient = None
    db = None
db = Database()
def get_db():
    return db.db
import certifi
async def connect_to_mongo():
    logger.info("Connecting to MongoDB...")
    try:
        db.client = motor.motor_asyncio.AsyncIOMotorClient(
            settings.MONGODB_URL,
            serverSelectionTimeoutMS=10000,
            connectTimeoutMS=10000,
            socketTimeoutMS=10000,
            tlsCAFile=certifi.where()
        )
        await db.client.admin.command('ping')
        db.db = db.client[settings.DATABASE_NAME]
        logger.info("Connected to MongoDB!")
        await db.db["users"].create_index("email", unique=True)
        await db.db["users"].create_index("username", unique=True)
        await db.db["documents"].create_index("filename")
        await db.db["evaluations"].create_index("document_id")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise
    
async def close_mongo_connection():
    logger.info("Closing MongoDB connection...")
    if db.client and hasattr(db.client, "close"):
        db.client.close()
    logger.info("MongoDB connection closed!")