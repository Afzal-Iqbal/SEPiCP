import os
import re
import json
import hashlib
from pathlib import Path

try:
    import pymupdf as fitz
except ImportError:
    try:
        import fitz
    except ImportError:
        fitz = None

from dotenv import load_dotenv
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")
load_dotenv()

DEFAULT_DB_PATH = os.environ.get("CHROMA_DB_PATH", str(BASE_DIR / "chroma_db"))
DEFAULT_CACHE_FILE = os.environ.get("INDEXED_FILES_CACHE", str(BASE_DIR / "indexed_files.json"))

def get_embeddings():
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("Neither GEMINI_API_KEY nor GOOGLE_API_KEY environment variable is set.")
    return GoogleGenerativeAIEmbeddings(
        model="gemini-embedding-001",
        google_api_key=api_key
    )

SECTION_PATTERNS = {
    "abstract": re.compile(r"^\s*(abstract)\b", re.IGNORECASE),
    "introduction": re.compile(r"^\s*(1\.?\s*introduction|background)\b", re.IGNORECASE),
    "methods": re.compile(r"^\s*(\d\.?\s*methods|methodology|materials and methods)\b", re.IGNORECASE),
    "results": re.compile(r"^\s*(\d\.?\s*results|findings)\b", re.IGNORECASE),
    "discussion": re.compile(r"^\s*(\d\.?\s*discussion)\b", re.IGNORECASE),
    "conclusion": re.compile(r"^\s*(\d\.?\s*conclusion|concluding remarks)\b", re.IGNORECASE),
    "purpose": re.compile(r"^\s*(purpose|aims|objectives)\b", re.IGNORECASE),
}

def detect_section(line_text, current_section):
    clean_line = line_text.strip()
    for sec_name, pattern in SECTION_PATTERNS.items():
        if pattern.search(clean_line):
            return sec_name
    return current_section

def extract_pdf_documents(pdf_path, chunk_min=800, chunk_max=1200, overlap=150):
    if fitz is None:
        raise ImportError("PyMuPDF (fitz) is not installed. Run `pip install pymupdf`.")
    
    paper_title = os.path.basename(pdf_path)
    documents = []
    current_section = "general"

    try:
        doc = fitz.open(pdf_path)
    except Exception as e:
        print(f"Error opening {pdf_path}: {e}")
        return documents

    for page_idx, page in enumerate(doc):
        page_num = page_idx + 1
        text = page.get_text("text") or ""
        page_text = ""
        for line in text.split("\n"):
            current_section = detect_section(line, current_section)
            page_text += line + "\n"

        start = 0
        text_length = len(page_text)
        if text_length == 0:
            continue

        while start < text_length:
            end = start + chunk_max
            chunk_str = page_text[start:end].strip()
            if len(chunk_str) >= chunk_min or end >= text_length:
                if chunk_str:
                    documents.append(Document(
                        page_content=chunk_str,
                        metadata={
                            "paper_title": paper_title,
                            "page_number": page_num,
                            "section": current_section,
                        }
                    ))
                start += (chunk_max - overlap)
            else:
                start += chunk_min

    doc.close()
    return documents

def hash_file(filepath):
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(8192):
            hasher.update(chunk)
    return hasher.hexdigest()

def ingest_corpus(pdf_dir, db_path=DEFAULT_DB_PATH, cache_file=DEFAULT_CACHE_FILE):
    pdf_dir = pdf_dir.strip("'\"")
    pdf_dir = os.path.abspath(pdf_dir)
    if not os.path.exists(pdf_dir):
        print(f"Directory '{pdf_dir}' does not exist. Creating it.")
        os.makedirs(pdf_dir, exist_ok=True)
        return None

    embeddings = get_embeddings()
    try:
        vectorstore = Chroma(
            collection_name="academic_papers",
            embedding_function=embeddings,
            persist_directory=db_path
        )
    except Exception as e:
        print(f"Warning: Corrupt or invalid ChromaDB index detected ({e}). Resetting database folder...")
        import shutil
        if os.path.exists(db_path):
            shutil.rmtree(db_path, ignore_errors=True)
        if os.path.exists(cache_file):
            os.remove(cache_file)
        vectorstore = Chroma(
            collection_name="academic_papers",
            embedding_function=embeddings,
            persist_directory=db_path
        )

    indexed_hashes = {}
    if os.path.exists(cache_file):
        try:
            with open(cache_file, "r") as f:
                indexed_hashes = json.load(f)
        except Exception:
            indexed_hashes = {}

    pdf_files = [os.path.join(pdf_dir, f) for f in os.listdir(pdf_dir) if f.lower().endswith(".pdf")]
    print(f"Found {len(pdf_files)} PDF files in {pdf_dir}.")

    new_documents = []
    for pdf_path in pdf_files:
        filename = os.path.basename(pdf_path)
        file_hash = hash_file(pdf_path)
        if indexed_hashes.get(filename) == file_hash:
            continue
        print(f"Processing: {filename}")
        extracted = extract_pdf_documents(pdf_path)
        new_documents.extend(extracted)
        indexed_hashes[filename] = file_hash

    if not new_documents:
        print("All files already indexed.")
        return vectorstore

    print(f"Embedding {len(new_documents)} new chunks...")
    batch_size = 100
    total_batches = (len(new_documents) - 1) // batch_size + 1
    for i in range(0, len(new_documents), batch_size):
        batch = new_documents[i:i + batch_size]
        current_batch = i // batch_size + 1
        print(f"  Embedding batch {current_batch}/{total_batches} ({len(batch)} chunks)...")
        
        for attempt in range(5):
            try:
                vectorstore.add_documents(batch)
                break
            except Exception as e:
                if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                    print(f"    Rate limit reached. Waiting 20 seconds before retry (Attempt {attempt+1}/5)...")
                    import time
                    time.sleep(20)
                else:
                    raise e
        import time
        time.sleep(2)

    with open(cache_file, "w") as f:
        json.dump(indexed_hashes, f, indent=2)

    print("Ingestion complete.")
    return vectorstore

if __name__ == "__main__":
    import sys
    default_folder = str(BASE_DIR.parent / "All paper") if (BASE_DIR.parent / "All paper").exists() else str(BASE_DIR / "papers")
    pdf_folder = sys.argv[1] if len(sys.argv) > 1 else default_folder
    ingest_corpus(pdf_folder)
