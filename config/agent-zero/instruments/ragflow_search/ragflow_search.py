#!/usr/bin/env python3
"""RAGFlow Search — search VZOR knowledge bases via RAGFlow API."""

import argparse
import json
import sys
import os

try:
    import requests
except ImportError:
    os.system("/opt/venv-a0/bin/pip install requests -q")
    import requests

RAGFLOW_API = "http://172.17.0.1:9380"
API_KEY = "ragflow-c36bd6a4202fcfefaed61f8e9df5456e"
HEADERS = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}


def list_kb(args):
    r = requests.get(f"{RAGFLOW_API}/api/v1/datasets", headers=HEADERS, timeout=10)
    data = r.json()
    if data.get("code") != 0:
        print(f"Error: {data.get('message')}")
        return
    datasets = data.get("data", [])
    if not datasets:
        print("No knowledge bases found. Upload documents via RAGFlow web UI: http://95.174.95.209:8088")
        return
    print(f"{'Name':<30} {'Docs':>5} {'Size':>10} {'ID'}")
    print("-" * 80)
    for ds in datasets:
        name = ds.get("name", "?")
        doc_count = ds.get("document_count", 0)
        chunk_count = ds.get("chunk_count", 0)
        ds_id = ds.get("id", "?")
        print(f"{name:<30} {doc_count:>5} {chunk_count:>8}ch {ds_id}")
    print(f"\nTotal: {len(datasets)} knowledge base(s)")


def info_kb(args):
    r = requests.get(f"{RAGFLOW_API}/api/v1/datasets", headers=HEADERS, params={"name": args.kb}, timeout=10)
    data = r.json()
    datasets = data.get("data", [])
    if not datasets:
        print(f"Knowledge base '{args.kb}' not found.")
        return
    ds = datasets[0]
    print(f"Name: {ds['name']}")
    print(f"ID: {ds['id']}")
    print(f"Documents: {ds.get('document_count', 0)}")
    print(f"Chunks: {ds.get('chunk_count', 0)}")
    print(f"Embedding model: {ds.get('embedding_model', 'default')}")
    print(f"Parser: {ds.get('chunk_method', 'default')}")
    # List documents
    r2 = requests.get(f"{RAGFLOW_API}/api/v1/datasets/{ds['id']}/documents", headers=HEADERS, timeout=10)
    docs = r2.json().get("data", [])
    if docs:
        print(f"\nDocuments:")
        for d in docs:
            status = d.get("run", "unknown")
            print(f"  - {d.get('name', '?')} [{status}] {d.get('chunk_count', 0)} chunks")


def search(args):
    # Get all dataset IDs (or filter by name)
    r = requests.get(f"{RAGFLOW_API}/api/v1/datasets", headers=HEADERS, timeout=10)
    data = r.json()
    datasets = data.get("data", [])
    if not datasets:
        print("No knowledge bases found. Upload documents first via http://95.174.95.209:8088")
        return

    ds_ids = []
    if args.kb:
        for ds in datasets:
            if args.kb.lower() in ds["name"].lower():
                ds_ids.append(ds["id"])
        if not ds_ids:
            print(f"Knowledge base '{args.kb}' not found.")
            return
    else:
        ds_ids = [ds["id"] for ds in datasets]

    # Search via retrieval API
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

    print(f"Results for: \"{args.query}\" ({len(chunks)} found)\n")
    for i, ch in enumerate(chunks, 1):
        score = ch.get("similarity", 0)
        doc_name = ch.get("document_keyword", ch.get("document_name", "?"))
        kb_name = ch.get("dataset_name", "?")
        content = ch.get("content", "").strip()
        print(f"--- Result {i} (score: {score:.3f}) ---")
        print(f"Source: {doc_name} | KB: {kb_name}")
        print(content[:1000])
        print()


def main():
    parser = argparse.ArgumentParser(description="RAGFlow Knowledge Base Search")
    sub = parser.add_subparsers(dest="command")

    p_search = sub.add_parser("search", help="Search knowledge bases")
    p_search.add_argument("query", help="Search query")
    p_search.add_argument("--kb", help="Knowledge base name filter")
    p_search.add_argument("--top", type=int, default=5, help="Number of results")

    p_list = sub.add_parser("list", help="List knowledge bases")

    p_info = sub.add_parser("info", help="Knowledge base details")
    p_info.add_argument("--kb", required=True, help="Knowledge base name")

    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        sys.exit(1)

    {"search": search, "list": list_kb, "info": info_kb}[args.command](args)


if __name__ == "__main__":
    main()
