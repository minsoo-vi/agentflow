import sys
import json
import os

# Simple file-based vector store simulation
DB_FILE = "/tmp/rag_db.json"

def load_db():
    if os.path.exists(DB_FILE):
        with open(DB_FILE, "r") as f:
            return json.load(f)
    return {"documents": [], "vectors": []}

def save_db(db):
    with open(DB_FILE, "w") as f:
        json.dump(db, f)

def ingest(text):
    db = load_db()
    db["documents"].append(text)
    save_db(db)
    return {"status": "success", "message": "Document ingested", "explanation": f"텍스트 '{text[:20]}...'를 문서 저장소에 성공적으로 가져왔습니다."}

def chunk(text, chunk_size=100):
    chunks = [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]
    return {"chunks": chunks, "explanation": f"문서를 {len(chunks)}개의 청크로 분할했습니다."}

def embed(text):
    # Simple simulation of embedding
    embedding = [len(text) * 0.1, len(text) * 0.2]
    return {"embedding": embedding, "explanation": f"텍스트를 {len(embedding)}차원 벡터로 임베딩했습니다."}

def retrieve(query):
    db = load_db()
    # Simple simulation of retrieval
    if not db["documents"]:
        return {"context": "No documents found", "explanation": "검색할 문서가 없습니다."}
    return {"context": db["documents"][0], "explanation": f"쿼리 '{query}'에 대해 가장 유사한 문서를 검색했습니다."}

if __name__ == "__main__":
    action = sys.argv[1]
    text = sys.argv[2] if len(sys.argv) > 2 else ""
    
    if action == "ingest":
        print(json.dumps(ingest(text)))
    elif action == "chunk":
        print(json.dumps(chunk(text)))
    elif action == "embed":
        print(json.dumps(embed(text)))
    elif action == "retrieve":
        print(json.dumps(retrieve(text)))
