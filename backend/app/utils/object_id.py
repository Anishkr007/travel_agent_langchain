from typing import Annotated
from bson import ObjectId
from pydantic import BeforeValidator

PyObjectId = Annotated[str, BeforeValidator(str)]

def doc_to_json(doc: dict) -> dict:
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc
