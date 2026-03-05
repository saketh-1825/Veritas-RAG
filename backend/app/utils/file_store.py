import os
import hashlib
from fastapi import UploadFile
from app.database.mongo import get_db
import motor.motor_asyncio
from bson import ObjectId
class FileStore:
    def __init__(self):
        pass
    def _get_bucket(self):
        db = get_db()
        if hasattr(db, "_collections"):
            return None
        return motor.motor_asyncio.AsyncIOMotorGridFSBucket(db)
    async def compute_checksum(self, file: UploadFile) -> str:
        await file.seek(0)
        sha256_hash = hashlib.sha256()
        while chunk := await file.read(4096):
            sha256_hash.update(chunk)
        await file.seek(0)
        return sha256_hash.hexdigest()
    async def save_file(self, file: UploadFile, custom_filename: str = None) -> str:
        filename = custom_filename or file.filename
        filename = os.path.basename(filename)
        bucket = self._get_bucket()
        if not bucket:
            os.makedirs("./uploads", exist_ok=True)
            path = os.path.join("./uploads", filename)
            await file.seek(0)
            with open(path, "wb") as f:
                while content := await file.read(1024 * 1024):
                    f.write(content)
            return path
        await file.seek(0)
        grid_in = bucket.open_upload_stream(filename)
        while content := await file.read(1024 * 1024):
            await grid_in.write(content)
        await grid_in.close()
        return str(grid_in._id)
    async def get_file_to_temp(self, file_id_or_path: str, temp_download_path: str) -> str:
        bucket = self._get_bucket()
        if not bucket:
            return file_id_or_path
        try:
            grid_out = await bucket.open_download_stream(ObjectId(file_id_or_path))
            with open(temp_download_path, "wb") as f:
                while chunk := await grid_out.readchunk():
                    f.write(chunk)
            return temp_download_path
        except Exception:
            if os.path.exists(file_id_or_path):
                return file_id_or_path
            raise
    async def delete_file(self, file_id_or_path: str) -> bool:
        bucket = self._get_bucket()
        if not bucket:
            try:
                if os.path.exists(file_id_or_path):
                    os.remove(file_id_or_path)
                    return True
            except:
                pass
            return False
        try:
            await bucket.delete(ObjectId(file_id_or_path))
            return True
        except Exception:
            try:
                if os.path.exists(file_id_or_path):
                    os.remove(file_id_or_path)
                    return True
            except:
                pass
            return False