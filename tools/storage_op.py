import sys
import json
import os

STORAGE_DIR = "/tmp/storage"

def save_file(path, content):
    if not os.path.exists(STORAGE_DIR):
        os.makedirs(STORAGE_DIR)
    
    file_name = f"data_{os.urandom(4).hex()}.json"
    full_path = os.path.join(STORAGE_DIR, file_name)
    
    with open(full_path, "w") as f:
        json.dump({"path": path, "content": content}, f)
        
    return file_name

if __name__ == "__main__":
    path = sys.argv[1]
    content = sys.argv[2]
    print(save_file(path, content))
