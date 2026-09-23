import os
import uuid
from types import SimpleNamespace


def _matches(item: dict, filter_dict: dict) -> bool:
    if not filter_dict:
        return True
    for k, v in filter_dict.items():
        val = item.get(k)
        if isinstance(v, dict):
            for op, target in v.items():
                if op == "$lt" and not (val is not None and val < target):
                    return False
                elif op == "$lte" and not (val is not None and val <= target):
                    return False
                elif op == "$gt" and not (val is not None and val > target):
                    return False
                elif op == "$gte" and not (val is not None and val >= target):
                    return False
                elif op == "$ne" and not (val != target):
                    return False
                elif op == "$in" and not (val in target):
                    return False
        elif val != v:
            return False
    return True


# Simple in‑memory async stub for collections used in the app
class _AsyncStubCollection:
    def __init__(self):
        self._data = {}

    async def find_one(self, filter: dict, *_, **__):
        # Return first matching item or None
        for item in self._data.values():
            if _matches(item, filter):
                return dict(item)
        return None

    async def insert_one(self, document: dict, *_, **__):
        doc_id = document.get("id") or str(uuid.uuid4())
        document["id"] = doc_id
        self._data[doc_id] = document
        return None

    async def create_index(self, *_, **__):
        return None

    def find(self, filter: dict = None, *_, **__):
        class _Cursor:
            def __init__(self, data):
                self._items = [dict(v) for v in data]

            def sort(self, key, direction=1):
                reverse = (direction == -1)
                self._items.sort(key=lambda x: str(x.get(key, "")), reverse=reverse)
                return self

            async def to_list(self, limit: int = 0):
                return self._items[:limit] if limit else list(self._items)

            def __await__(self):
                return self.to_list().__await__()

        matched = [v for v in self._data.values() if _matches(v, filter)]
        return _Cursor(matched)


    async def insert_many(self, documents: list, *_, **__):
        for doc in documents:
            await self.insert_one(doc)
        return None

    async def update_one(self, filter: dict, update: dict, *_, **__):
        for doc in self._data.values():
            if _matches(doc, filter):
                for k, v in update.get("$set", {}).items():
                    doc[k] = v
                class _Result:
                    modified_count = 1
                return _Result()
        class _ZeroResult:
            modified_count = 0
        return _ZeroResult()

    async def delete_many(self, filter: dict, *_, **__):
        to_delete = [k for k, v in self._data.items() if _matches(v, filter)]
        for k in to_delete:
            self._data.pop(k, None)
        class _Result:
            deleted_count = len(to_delete)
        return _Result()

    async def delete_one(self, filter: dict, *_, **__):
        for k, v in list(self._data.items()):
            if _matches(v, filter):
                self._data.pop(k, None)
                break
        return None

    async def update_many(self, filter: dict, update: dict, *_, **__):
        matched = []
        for doc in self._data.values():
            if _matches(doc, filter):
                for uk, uv in update.get("$set", {}).items():
                    doc[uk] = uv
                matched.append(doc)
        class _Result:
            modified_count = len(matched)
        return _Result()

    async def count_documents(self, filter: dict = None, *_, **__):
        if not filter:
            return len(self._data)
        return sum(1 for v in self._data.values() if _matches(v, filter))

# Create stub db with required collections (providing both projects and project alias)
_projects_coll = _AsyncStubCollection()

db = SimpleNamespace(
    users=_AsyncStubCollection(),
    projects=_projects_coll,
    project=_projects_coll,
    srs_jobs=_AsyncStubCollection(),
    requirements=_AsyncStubCollection(),
    backlog=_AsyncStubCollection(),
    developers=_AsyncStubCollection(),
    sprints=_AsyncStubCollection(),
)

async def ensure_job_indexes():
    # No indexes needed for stub
    return None


