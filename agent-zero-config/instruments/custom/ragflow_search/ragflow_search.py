#!/opt/venv/bin/python3
"""RAGFlow Search — search VZOR knowledge bases via RAGFlow API."""

import argparse
import json
import sys
import os

try:
    import requests
except ImportError:
    os.system("/opt/venv/bin/pip install requests -q")
    import requests

RAGFLOW_API = "http://172.17.0.1:9380"
API_KEY = "ragflow-c36bd6a4202fcfefaed61f8e9df5456e"
HEADERS = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}

# Knowledge base short codes → IDs
KB_MAP = {
    "ЭС": "8a26d27c0c1011f1a70a7ecd752f3782",
    "ВК": "8a3e6e640c1011f1920e7ecd752f3782",
    "ОВиК": "8a52fa860c1011f1989c7ecd752f3782",
    "ПБ": "8a673f060c1011f186b67ecd752f3782",
    "ГС": "8a7b00340c1011f195977ecd752f3782",
    "АР": "8a8ee0550c1011f1964e7ecd752f3782",
    "ОДИ": "8aa2b06e0c1011f1ae857ecd752f3782",
    "СС": "8ab6419a0c1011f1b2c57ecd752f3782",
    "ТУ": "8ac948f20c1011f197657ecd752f3782",
    "Общее": "8adda8a20c1011f1ab1e7ecd752f3782",
}

# Reverse map: ID → short code
KB_ID_TO_NAME = {v: k for k, v in KB_MAP.items()}
ALL_KB_IDS = list(KB_MAP.values())


def resolve_kb_ids(kb_filter):
    """Resolve KB filter to list of dataset IDs."""
    if not kb_filter:
        return ALL_KB_IDS
    # Try exact short code first
    if kb_filter.upper() in {k.upper() for k in KB_MAP}:
        for k, v in KB_MAP.items():
            if k.upper() == kb_filter.upper():
                return [v]
    # Try substring match on full names via API
    r = requests.get(f"{RAGFLOW_API}/api/v1/datasets", headers=HEADERS, timeout=10)
    data = r.json()
    datasets = data.get("data", [])
    ids = []
    for ds in datasets:
        if kb_filter.lower() in ds["name"].lower():
            ids.append(ds["id"])
    return ids


def list_kb(args):
    r = requests.get(f"{RAGFLOW_API}/api/v1/datasets", headers=HEADERS, timeout=10)
    data = r.json()
    if data.get("code") != 0:
        print(f"Error: {data.get('message')}")
        return
    datasets = data.get("data", [])
    if not datasets:
        print("No knowledge bases found.")
        return
    print(f"{'Code':<8} {'Name':<45} {'Docs':>5} {'Chunks':>8}")
    print("-" * 72)
    total_chunks = 0
    for ds in datasets:
        name = ds.get("name", "?")
        doc_count = ds.get("document_count", 0)
        chunk_count = ds.get("chunk_count", 0)
        ds_id = ds.get("id", "?")
        code = KB_ID_TO_NAME.get(ds_id, "?")
        print(f"{code:<8} {name:<45} {doc_count:>5} {chunk_count:>8}")
        total_chunks += chunk_count
    print(f"\nTotal: {len(datasets)} KB(s), {total_chunks} chunks")


def info_kb(args):
    r = requests.get(f"{RAGFLOW_API}/api/v1/datasets", headers=HEADERS, params={"name": args.kb}, timeout=10)
    data = r.json()
    datasets = data.get("data", [])
    if not datasets:
        print(f"Knowledge base '{args.kb}' not found.")
        return
    ds = datasets[0]
    code = KB_ID_TO_NAME.get(ds["id"], "?")
    print(f"Name: {ds['name']} ({code})")
    print(f"ID: {ds['id']}")
    print(f"Documents: {ds.get('document_count', 0)}")
    print(f"Chunks: {ds.get('chunk_count', 0)}")
    print(f"Embedding: {ds.get('embedding_model', 'default')}")
    r2 = requests.get(f"{RAGFLOW_API}/api/v1/datasets/{ds['id']}/documents", headers=HEADERS, timeout=10)
    docs = r2.json().get("data", [])
    if docs:
        print(f"\nDocuments:")
        for d in docs:
            status = d.get("run", "unknown")
            print(f"  - {d.get('name', '?')} [{status}] {d.get('chunk_count', 0)} chunks")


def search(args):
    ds_ids = resolve_kb_ids(args.kb)
    if not ds_ids:
        print(f"Knowledge base '{args.kb}' not found. Use 'list' to see available KBs.")
        return

    payload = {
        "question": args.query,
        "dataset_ids": ds_ids,
        "similarity_threshold": 0.2,
        "vector_similarity_weight": 0.3,
        "top_k": args.top or 5,
    }
    r = requests.post(f"{RAGFLOW_API}/api/v1/retrieval", headers=HEADERS, json=payload, timeout=30)
    result = r.json()

    if result.get("code") != 0:
        print(f"Error: {result.get('message')}")
        return

    chunks = result.get("data", {}).get("chunks", [])
    if not chunks:
        print(f"No results for: {args.query}")
        return

    # Build ID→name map from datasets
    kb_names = {}
    try:
        r2 = requests.get(f"{RAGFLOW_API}/api/v1/datasets", headers=HEADERS, timeout=5)
        for ds in r2.json().get("data", []):
            kb_names[ds["id"]] = KB_ID_TO_NAME.get(ds["id"], ds.get("name", "?"))
    except Exception:
        pass

    print(f"Results for: \"{args.query}\" ({len(chunks)} found)\n")
    for i, ch in enumerate(chunks[:args.top or 5], 1):
        score = ch.get("similarity", 0)
        doc_name = ch.get("document_keyword", ch.get("document_name", "?"))
        ds_id = ch.get("dataset_id", "")
        kb_label = kb_names.get(ds_id, ch.get("dataset_name", "?"))
        content = ch.get("content", "").strip()
        # Trim to reasonable length
        if len(content) > 800:
            content = content[:800] + "..."
        print(f"--- Result {i} (score: {score:.3f}, KB: {kb_label}) ---")
        print(f"Source: {doc_name}")
        print(content)
        print()


def main():
    parser = argparse.ArgumentParser(description="RAGFlow Knowledge Base Search")
    sub = parser.add_subparsers(dest="command")

    p_search = sub.add_parser("search", help="Search knowledge bases")
    p_search.add_argument("query", help="Search query")
    p_search.add_argument("--kb", help="KB filter: short code (ЭС, ПБ, ОВиК...) or name substring")
    p_search.add_argument("--top", type=int, default=5, help="Number of results (default: 5)")

    p_list = sub.add_parser("list", help="List all knowledge bases")

    p_info = sub.add_parser("info", help="Knowledge base details")
    p_info.add_argument("--kb", required=True, help="KB name or code")

    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        sys.exit(1)

    {"search": search, "list": list_kb, "info": info_kb}[args.command](args)


if __name__ == "__main__":
    main()
