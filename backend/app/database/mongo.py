import motor.motor_asyncio
from app.config.settings import settings
import logging
import json
import os
import uuid
from datetime import datetime
logger = logging.getLogger("rag_pipeline")
class MockCursor:
    def __init__(self, docs):
        self.docs = docs
    def sort(self, key, direction=-1):
        reverse = (direction == -1)
        def get_key(doc):
            val = doc.get(key)
            if val is None:
                return datetime.min if isinstance(val, datetime) else ""
            return val
        try:
            self.docs.sort(key=get_key, reverse=reverse)
        except Exception:
            pass
        return self
    async def to_list(self, length=None):
        if length is not None:
            return self.docs[:length]
        return self.docs
class MockCollection:
    def __init__(self, directory, name):
        self.file_path = os.path.join(directory, f"{name}.json")
        self.data = []
        self._load()
    def _load(self):
        if os.path.exists(self.file_path):
            try:
                with open(self.file_path, "r", encoding="utf-8") as f:
                    self.data = json.load(f)
                    for doc in self.data:
                        for k, v in list(doc.items()):
                            if isinstance(v, str) and v.endswith("Z") and "T" in v:
                                try:
                                    clean_v = v.replace("Z", "+00:00")
                                    doc[k] = datetime.fromisoformat(clean_v)
                                except ValueError:
                                    pass
            except Exception as e:
                logger.error(f"Error loading mock table {self.file_path}: {e}")
                self.data = []
        else:
            self.data = []
    def _save(self):
        serializable_data = []
        for doc in self.data:
            ser_doc = {}
            for k, v in doc.items():
                if isinstance(v, datetime):
                    ser_doc[k] = v.isoformat().replace("+00:00", "Z")
                else:
                    ser_doc[k] = v
            serializable_data.append(ser_doc)
        try:
            with open(self.file_path, "w", encoding="utf-8") as f:
                json.dump(serializable_data, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving mock table {self.file_path}: {e}")
    async def create_index(self, *args, **kwargs):
        pass
    async def find_one(self, filter_query):
        self._load()
        for doc in self.data:
            if self._match(doc, filter_query):
                return doc
        return None
    async def insert_one(self, document):
        self._load()
        if "_id" not in document:
            document["_id"] = str(uuid.uuid4())
        doc_copy = dict(document)
        self.data.append(doc_copy)
        self._save()
        class InsertResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
        return InsertResult(doc_copy["_id"])
    async def update_one(self, filter_query, update_query):
        self._load()
        matched_doc = None
        for doc in self.data:
            if self._match(doc, filter_query):
                matched_doc = doc
                break
        if not matched_doc:
            return
        if "$set" in update_query:
            for k, v in update_query["$set"].items():
                matched_doc[k] = v
        if "$push" in update_query:
            for k, v in update_query["$push"].items():
                if k not in matched_doc:
                    matched_doc[k] = []
                if isinstance(matched_doc[k], list):
                    matched_doc[k].append(v)
        self._save()
    async def delete_one(self, filter_query):
        self._load()
        new_data = []
        deleted = False
        for doc in self.data:
            if not deleted and self._match(doc, filter_query):
                deleted = True
                continue
            new_data.append(doc)
        self.data = new_data
        self._save()
    def find(self, filter_query=None):
        self._load()
        matched_docs = [doc for doc in self.data if self._match(doc, filter_query)]
        return MockCursor(matched_docs)
    def _match(self, doc, query):
        if not query:
            return True
        for k, v in query.items():
            if k == "$or" and isinstance(v, list):
                return any(self._match(doc, sub_q) for sub_q in v)
            actual_val = doc.get(k)
            if isinstance(v, dict):
                for op, op_val in v.items():
                    if op == "$in" and isinstance(op_val, list):
                        if actual_val not in op_val:
                            return False
            else:
                if actual_val != v:
                    return False
        return True
class MockDatabase:
    def __init__(self, directory):
        self.directory = directory
        os.makedirs(self.directory, exist_ok=True)
        self._collections = {}
    def __getitem__(self, name):
        if name not in self._collections:
            self._collections[name] = MockCollection(self.directory, name)
        return self._collections[name]
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
        logger.warning("Falling back to local JSON-based mock database for seamless operations.")
        db.client = "mock_client"
        db.db = MockDatabase("local_db")
async def close_mongo_connection():
    logger.info("Closing MongoDB connection...")
    if db.client and hasattr(db.client, "close"):
        db.client.close()
    logger.info("MongoDB connection closed!")