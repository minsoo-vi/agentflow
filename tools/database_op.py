import sys
import json
import os

# 간단한 파일 기반 데이터베이스 시뮬레이션
DB_FILE = "/tmp/database.json"

def load_db():
    if not os.path.exists(DB_FILE):
        return {}
    with open(DB_FILE, "r") as f:
        return json.load(f)

def save_db(db):
    with open(DB_FILE, "w") as f:
        json.dump(db, f)

def read(collection):
    db = load_db()
    return db.get(collection, [])

def write(collection, data):
    db = load_db()
    if collection not in db:
        db[collection] = []
    db[collection].append(data)
    save_db(db)
    return data

if __name__ == "__main__":
    op = sys.argv[1]
    collection = sys.argv[2]
    
    if op == "read":
        print(json.dumps(read(collection)))
    elif op == "write":
        data = json.loads(sys.argv[3])
        print(json.dumps(write(collection, data)))
