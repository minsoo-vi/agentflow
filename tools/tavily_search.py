import os
import sys
from tavily import TavilyClient

def search(query):
    api_key = os.environ.get("TAVILY_API_KEY")
    if not api_key:
        return "Error: TAVILY_API_KEY not set"
    
    tavily = TavilyClient(api_key=api_key)
    response = tavily.search(query=query, search_depth="advanced")
    return response

if __name__ == "__main__":
    query = sys.argv[1] if len(sys.argv) > 1 else "AI agents"
    print(search(query))
