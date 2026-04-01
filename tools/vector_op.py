import sys
import json
import os

# 파일 기반 벡터 저장소 시뮬레이션
DB_FILE = "/tmp/database.json"

def load_db():
    if not os.path.exists(DB_FILE):
        return {}
    with open(DB_FILE, "r") as f:
        return json.load(f)

def search_vector(query):
    db = load_db()
    all_data = []
    for coll in db:
        all_data.extend(db[coll])
    
    keywords = query.lower().split(' ')
    matches = []
    for item in all_data:
        item_str = json.dumps(item).lower()
        if any(k in item_str for k in keywords):
            matches.append(item)
            
    return matches[:3]

if __name__ == "__main__":
    query = sys.argv[1]
    results = search_vector(query)
    print(json.dumps(results))
