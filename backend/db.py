import os
from types import SimpleNamespace

# Simple in‑memory async stub for collections used in the app
class _AsyncStubCollection:
    def __init__(self):
        self._data = {}

    async def find_one(self, filter: dict, *_, **__):
        # Return first matching item or None
        for item in self._data.values():
            if all(item.get(k) == v for k, v in filter.items()):
                return item
        return None

    async def insert_one(self, document: dict, *_, **__):
        self._data[document.get("id")] = document
        return None

    async def create_index(self, *_, **__):
        return None

    async def find(self, filter: dict = None, *_, **__):
        class _Cursor:
            def __init__(self, data):
                self._data = data
            def sort(self, *_, **__):
                return self
            async def to_list(self, limit: int = 0):
                return list(self._data.values())[:limit] if limit else list(self._data.values())
        filtered = {k: v for k, v in self._data.items() if not filter or all(v.get(fk) == fv for fk, fv in filter.items())}
        return _Cursor(filtered)

    async def insert_many(self, documents: list, *_, **__):
        for doc in documents:
            await self.insert_one(doc)
        return None

    async def update_one(self, filter: dict, update: dict, *_, **__):
        doc = await self.find_one(filter)
        if doc:
            for k, v in update.get("$set", {}).items():
                doc[k] = v
        class _Result:
            modified_count = 1 if doc else 0
        return _Result()

    async def delete_many(self, filter: dict, *_, **__):
        to_delete = [k for k, v in self._data.items() if all(v.get(fk) == fv for fk, fv in filter.items())]
        for k in to_delete:
            del self._data[k]
        class _Result:
            deleted_count = len(to_delete)
        return _Result()

    async def delete_one(self, filter: dict, *_, **__):
        doc = await self.find_one(filter)
        if doc:
            del self._data[doc["id"]]
        return None

    async def update_many(self, filter: dict, update: dict, *_, **__):
        matched = []
        for doc in self._data.values():
            if all(doc.get(k) == v for k, v in filter.items()):
                for uk, uv in update.get("$set", {}).items():
                    doc[uk] = uv
                matched.append(doc)
        class _Result:
            modified_count = len(matched)
        return _Result()

    async def count_documents(self, filter: dict = None, *_, **__):
        if not filter:
            return len(self._data)
        return sum(1 for v in self._data.values() if all(v.get(k) == val for k, val in filter.items()))

# Create stub db with required collections
db = SimpleNamespace(
    users=_AsyncStubCollection(),
    projects=_AsyncStubCollection(),
    srs_jobs=_AsyncStubCollection(),
    requirements=_AsyncStubCollection(),
    backlog=_AsyncStubCollection(),
    developers=_AsyncStubCollection(),
    sprints=_AsyncStubCollection(),
)

async def ensure_job_indexes():
    # No indexes needed for stub
    return None

