---
title: "Vector Databases"
day: 6
concept: "The professional warehouse for embeddings: storage, filtering, and retrieval"
chapter: 1
chapterTitle: "Foundations"
---

# Day 6: Vector Databases (FAISS, Chroma, Pinecone, pgvector)

> **30-Day RAG Course, Week 1: Foundations**
> **Date:** Oct 4, 2026 | **Estimated time:** 3-4 hours
> **Prerequisites:** [Day 3: RAG Architecture](./day03_rag_architecture.md), [Day 4: Text Embeddings](./day04_text_embeddings.md), [Day 5: Similarity Metrics](./day05_similarity_metrics.md)

## 📌 Cheat Sheet (1-Minute Revision)

| Concept | Remember this | 
 | ----- | ----- | 
| **Vector DB** | Stores **vectors + text + metadata** and finds nearest neighbors **fast**, with **filters**, **persistence**, and **CRUD**. | 
| **Record** | `id` + `vector` + `document text` + `metadata` (source, date, department, access level...). | 
| **Four families** | **Library** (FAISS) • **Vector DB** (Chroma, Qdrant, Weaviate, Milvus, Pinecone) • **DB extension** (pgvector, MongoDB Atlas, Redis) • **Search engine** (Elasticsearch/OpenSearch). | 
| **FAISS** | Blazing-fast **in-memory library**. Stores vectors only: **you** manage the text, metadata, and filtering. | 
| **Chroma** | Easiest **open-source DB** for prototyping. Embedded or client-server, metadata `where` filters. | 
| **pgvector** | Vectors **inside PostgreSQL**: SQL filters and joins, ACID, backups, and security you already have. | 
| **Pinecone** | **Fully managed** serverless cloud DB, with namespaces, filters, and hybrid search. Zero ops, but your data sits in their cloud. | 
| **Filtering** | **Pre-filter** (filter, then search) keeps K results. **Post-filter** (search, then filter) can return **fewer than K**. | 
| **Updates** | Use **deterministic IDs** (`doc_id#chunk_n`). On a doc change → **delete by `doc_id`**, then re-add. | 
| **Pick one** | Learning → Chroma/FAISS. Already on Postgres → pgvector. No-ops cloud → Pinecone/managed Qdrant. Massive scale → Milvus/Qdrant/Weaviate. | 

## 🎯 Learning Objectives

By the end of today, you should be able to:

1. Explain what a vector database adds beyond "a numpy array of embeddings".
2. Distinguish **vector libraries**, **vector databases**, **DB extensions**, and **search engines**.
3. Use **FAISS** (index, search, save/load, ID mapping) and understand its limits.
4. Use **Chroma** (persistent collections, cosine metric, `where` filters, upsert, delete).
5. Use **pgvector** (SQL schema, HNSW index, filtered similarity queries) and **Pinecone** (serverless index, namespaces, filters).
6. Explain **pre-filtering vs post-filtering** and why post-filtering can silently return too few results.
7. Design an **update/delete strategy** for changing documents.
8. Plug a real vector store into your **Day 3 pipeline** via a common interface.

## 📅 Suggested Schedule

| Time | Activity | 
 | ----- | ----- | 
| 0:00 - 0:30 | Section 1-3: What a vector DB is; families; anatomy of a record | 
| 0:30 - 1:10 | Section 4-5: Core capabilities; the four tools in depth | 
| 1:10 - 1:40 | Section 6-8: Comparison, choosing, filtering, production concerns | 
| 1:40 - 3:30 | Section 9: Hands-on (FAISS, Chroma, adapters, benchmark; optional pgvector/Pinecone) | 
| 3:30 - 4:00 | Exercises and quiz | 

## 1. What is a Vector Database?

> 💡 **Intuition:** On Day 5 you searched 100,000 vectors with one line of numpy (`corpus @ query`). So why do vector databases exist at all? Because a numpy array is like **a pile of index cards on your desk**: fast to scan while it's small, but it vanishes when you close the laptop, can't be shared with your colleagues, can't answer "only cards from 2026", can't update a single card without rebuilding the pile, and becomes painfully slow at 100 million cards. A vector database is the **professional warehouse** for those cards: it keeps them safe on disk, indexes them for fast lookup at any scale, lets you filter by labels, supports adding/updating/deleting individual cards, and serves many users at once. The core math (similarity search) is exactly what you learned on Day 5; everything else is **engineering around it**.

> A **vector database** stores embeddings alongside their source text and metadata, and provides fast **similarity search** plus the usual database features (persistence, CRUD, filtering, scaling, access control).

### What a vector DB adds beyond a numpy array

| Need | numpy array | Vector DB | 
 | ----- | ----- | ----- | 
| Similarity search | ✅ Brute force | ✅ Brute force **and ANN indexes** (HNSW, IVF) for millions+ | 
| Persistence | ❌ Lost on restart (unless you save files manually) | ✅ Durable storage | 
| Metadata filtering | ❌ DIY | ✅ `where year = 2026 AND dept = 'loans'` | 
| Add / update / delete single items | ⚠️ Awkward | ✅ Upsert, delete by ID or filter | 
| Store text + metadata with vectors | ❌ Separate structures | ✅ One record | 
| Concurrency (many users) | ❌ | ✅ | 
| Scale beyond RAM | ❌ | ✅ Disk-based indexes, sharding | 
| Security / multi-tenancy | ❌ | ✅ Namespaces, RBAC, row-level security | 
| Hybrid search (keywords + vectors) | ❌ | ✅ In many DBs | 

## 2. The Four Families

> 💡 **Intuition:** "Vector database" is used loosely for four quite different kinds of tools. Think **engine vs car vs car-with-a-tow-hitch vs truck**. **FAISS** is an *engine*: extremely powerful, but you build the rest of the car (storage, metadata, API) yourself. **Chroma, Qdrant, Pinecone** are *cars* built around that engine: purpose-made for vectors. **pgvector** is a *tow hitch on the car you already own*: your trusty PostgreSQL gains vector search without adopting a new system. **Elasticsearch/OpenSearch** are *trucks*: full search engines that added vectors next to their famous keyword search. Choosing well is mostly about **what you already run and what you need around the search**.

| Family | Examples | What it is | Typical use | 
 | ----- | ----- | ----- | ----- | 
| **Vector library** | **FAISS**, hnswlib, Annoy, ScaNN | In-process code for fast similarity search | Research, embedded apps, custom systems, max speed | 
| **Purpose-built vector DB** | **Chroma**, **Qdrant**, **Weaviate**, **Milvus**, **Pinecone**, LanceDB | A full database designed for vectors | Most RAG applications | 
| **DB with vector extension** | **pgvector** (PostgreSQL), MongoDB Atlas Vector Search, Redis, Oracle AI Vector Search, SQL Server/Azure SQL | Vectors as a column type in a general DB | When you already use that DB; transactional + vector data together | 
| **Search engine with vectors** | Elasticsearch, OpenSearch, Vespa, Azure AI Search | Keyword search engine + kNN vector search | **Hybrid search** at enterprise scale; existing search stacks | 

## 3. Anatomy of a Vector Record

> 💡 **Intuition:** A record is a **library card with four parts**: a unique **call number** (id), a **GPS coordinate of its meaning** (vector), the **actual text** (so you can put it in the prompt), and **labels** (metadata) such as date, department, and who's allowed to read it. The vector finds the card; the text feeds the LLM; the metadata keeps you from handing over the wrong (outdated, unauthorized) card. Skimp on any part and the system suffers: no stable IDs → you can't update; no text → nothing to put in the prompt; no metadata → no filtering, no citations, no access control.

```json
{
  "id": "LOANS#c0",
  "vector": [0.021, -0.113, 0.087, "... 384 numbers ..."],
  "document": "ZyntraCorp Bank home loan interest rates start at 7.9% per annum for salaried customers...",
  "metadata": {
    "doc_id": "LOANS",
    "source": "loan_policy_2026.pdf",
    "page": 4,
    "department": "retail_lending",
    "year": 2026,
    "access_level": "public",
    "embedding_model": "all-MiniLM-L6-v2"
  }
}
```

### Common vocabulary across tools

| Concept | FAISS | Chroma | pgvector | Pinecone | Qdrant | 
 | ----- | ----- | ----- | ----- | ----- | ----- | 
| Container | Index | Collection | Table | Index (+ namespace) | Collection | 
| Record | Vector (+ int ID) | Record | Row | Record | Point | 
| Metadata | ❌ (DIY) | Metadata | Columns / JSONB | Metadata | Payload | 
| Insert/update | `add` | `add` / `upsert` | `INSERT` / `UPSERT` | `upsert` | `upsert` | 
| Filter | IDSelector / DIY | `where` | `WHERE` | `filter` | `filter` | 

## 4. Core Capabilities to Understand

| Capability | What it means | Why it matters for RAG | Deep dive | 
 | ----- | ----- | ----- | ----- | 
| **Exact (flat) search** | Compare the query with every vector | Perfect recall; fine up to ~100k-1M vectors | Day 5 | 
| **ANN indexes** | HNSW, IVF, PQ, DiskANN: approximate but fast | Millions-billions of vectors in milliseconds | Day 11 | 
| **Distance metric** | Cosine / dot / L2, fixed at creation | Must match the embedding model | Day 5 | 
| **Metadata filtering** | Restrict search by fields | Freshness, departments, **access control** | Day 10 | 
| **Hybrid search** | Combine keyword (BM25/sparse) + dense | Exact IDs, codes, and names + meaning | Day 13 | 
| **CRUD / upsert** | Add, update, delete individual records | Documents change constantly | Today | 
| **Namespaces / multi-tenancy** | Isolate data per customer or team | Security, data separation | Today | 
| **Persistence and backups** | Durable storage, snapshots | Don't re-embed everything after a crash | Today | 
| **Horizontal scaling** | Sharding, replication | Large corpora, high query volume | Day 29 | 

## 5. The Four Tools in Depth

### 5.1 FAISS (Facebook AI Similarity Search)

| Aspect | Details | 
 | ----- | ----- | 
| Type | Library (C++ with Python bindings), in-process | 
| Index types | `IndexFlatL2` / `IndexFlatIP` (exact), `IndexHNSWFlat`, `IndexIVFFlat`, `IndexIVFPQ` (compressed), GPU variants | 
| IDs | Positional by default; use `IndexIDMap` for your own **int64** IDs | 
| Metadata / filtering | ❌ Not stored. Filter via `IDSelector` search params or by **over-fetching + post-filtering** | 
| Persistence | `faiss.write_index` / `faiss.read_index` (files) | 
| Updates / deletes | Limited (`remove_ids` on some index types); often a rebuild | 
| Best for | Research, benchmarks, embedded/offline apps, custom systems, very large static corpora | 

### 5.2 Chroma

| Aspect | Details | 
 | ----- | ----- | 
| Type | Open-source vector DB, **embedded** (in-process) or **client/server** | 
| Metric | `l2` (**default**), `cosine`, `ip`, set at collection creation | 
| Filtering | `where` on metadata (`$eq $ne $gt $gte $lt $lte $in $nin`, `$and $or`) + `where_document` (`$contains`) | 
| Embeddings | Pass your own vectors **or** attach an embedding function (auto-embeds) | 
| Persistence | `PersistentClient(path=...)` | 
| CRUD | `add`, `upsert`, `update`, `get`, `delete(ids=... / where=...)` | 
| Best for | Learning, prototypes, small-medium apps, local development | 

### 5.3 pgvector (PostgreSQL extension)

| Aspect | Details | 
 | ----- | ----- | 
| Type | Extension for PostgreSQL (`CREATE EXTENSION vector`) | 
| Types | `vector(n)`, `halfvec(n)` (16-bit), `sparsevec`, `bit(n)` | 
| Operators | `<->` L2 • `<#>` negative inner product • `<=>` cosine distance • `<+>` L1 | 
| Indexes | `HNSW` (best speed/recall), `IVFFlat` (faster build, lower memory). Check the README for dimension limits per type | 
| Filtering | Plain SQL `WHERE`, `JOIN`, partial indexes | 
| Best for | Teams already on Postgres; transactional + vector data together; strong governance needs | 

### 5.4 Pinecone

| Aspect | Details | 
 | ----- | ----- | 
| Type | Fully managed, **serverless** cloud vector DB | 
| Metric | `cosine`, `euclidean`, `dotproduct`, set at index creation | 
| Organization | Index → `namespaces` (great for multi-tenancy) | 
| Filtering | Metadata filter (`$eq $ne $gt $gte $lt $lte $in $nin $exists`, `$and $or`) | 
| Extras | Sparse-dense **hybrid** vectors, integrated embedding/reranking options | 
| Best for | Teams wanting zero ops, fast scaling, production SaaS | 

### 5.5 Others worth knowing

| Tool | Highlights | 
 | ----- | ----- | 
| **Qdrant** | Rust, fast, rich payload filtering, quantization, open-source + managed cloud | 
| **Weaviate** | Built-in hybrid search, modules for vectorization, GraphQL/REST, open-source + cloud | 
| **Milvus / Zilliz** | Built for **billions** of vectors, distributed, GPU support | 
| **Elasticsearch / OpenSearch** | Mature keyword search + kNN; strong **hybrid** and enterprise features | 
| **LanceDB** | Embedded, columnar (Lance format), good for multimodal and local-first apps | 
| **MongoDB Atlas / Redis** | Vector search inside DBs many teams already use | 

## 6. Comparison and How to Choose

### 6.1 Side-by-side

| | FAISS | Chroma | pgvector | Pinecone | Qdrant | Weaviate | Milvus | 
 | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | 
| Type | Library | Vector DB | Postgres ext. | Managed DB | Vector DB | Vector DB | Vector DB | 
| Open source | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | 
| Self-host | ✅ (in-process) | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | 
| Managed option | ❌ | ❌ | ✅ (many clouds) | ✅ | ✅ | ✅ | ✅ (Zilliz) | 
| Metadata filtering | ⚠️ DIY | ✅ | ✅ SQL | ✅ | ✅ Rich | ✅ | ✅ | 
| Hybrid search | ❌ | ⚠️ Limited | ⚠️ With full-text search | ✅ | ✅ | ✅ | ✅ | 
| Setup effort | Low (code) | **Lowest** | Medium (if new to Postgres) | Low (API key) | Low-Medium | Medium | Medium-High | 
| Sweet spot | Speed, research | Prototypes | Existing Postgres | Zero-ops SaaS | Performance + filters | Hybrid, modules | Billion scale | 

> ⚠️ **Feature sets evolve quickly.** Check current capabilities in each tool's docs before committing.

### 6.2 Decision guide

```
Are you just learning or prototyping?
 └─ Yes → Chroma (or FAISS if you want raw speed and control)
 └─ No ↓
Do you already run PostgreSQL and have < ~10M vectors?
 └─ Yes → pgvector (SQL filters, joins, governance for free)
 └─ No ↓
Must data stay on-prem / in your own cloud account (regulation, data residency)?
 └─ Yes → Self-hosted Qdrant / Weaviate / Milvus / pgvector / OpenSearch
 └─ No ↓
Do you want zero infrastructure work?
 └─ Yes → Pinecone (or managed Qdrant/Weaviate/Zilliz)
 └─ No ↓
Hundreds of millions to billions of vectors?
 └─ Yes → Milvus / Qdrant / Weaviate (distributed) or FAISS-based custom
Need strong keyword + vector hybrid in an existing search stack?
 └─ Yes → Elasticsearch / OpenSearch
```

> 🎯 **Rule of thumb:** the "best" vector DB is usually **the one that fits your existing infrastructure and compliance rules**. Retrieval quality is mostly driven by **embeddings, chunking, and hybrid/re-ranking**, not by the choice of DB, as long as you use exact search or well-tuned ANN.

## 7. Metadata Filtering: Pre-Filter vs Post-Filter

| Strategy | How | Pros | Cons | 
 | ----- | ----- | ----- | ----- | 
| **Post-filter** | Search the top-N, then drop non-matching | Simple; works with any index | May return **< K** results; wasteful when the filter is rare | 
| **Pre-filter** | Restrict candidates, then search | Always K valid results (if they exist) | Can be slow with brute force on large filtered sets | 
| **Filtered ANN (in-index)** | Filter applied while traversing the index | Fast and correct | Needs DB support (Qdrant, Weaviate, Pinecone, pgvector iterative scans, etc.) | 

**Mitigation for post-filtering:** over-fetch (search `K * 5` or more) and stop once you have K matches (Lab 1).

## 8. Production Concerns

### 8.1 Updates and deletes

| Practice | Why | 
 | ----- | ----- | 
| **Deterministic chunk IDs** (`doc_id#c{n}`) | Re-ingesting the same doc overwrites instead of duplicating | 
| Store **`doc_id`** in metadata | Lets you **delete all chunks of a document** in one call | 
| **Delete-then-insert** on change | Handles documents that got shorter (stale chunk IDs would otherwise linger) | 
| **Content hash** per document | Skip re-embedding unchanged docs (saves time and money) | 
| Store **`embedding_model`** (and version) | Detects mixed-model indexes; supports migrations | 
| **Soft delete / versioning** | Audit trail: "what did the bot know on date X?" | 

### 8.2 Security and multi-tenancy

| Practice | How | 
 | ----- | ----- | 
| **Access-control metadata** | `access_level`, `department`, `tenant_id` on every chunk | 
| **Enforce filters server-side** | Never trust the client to add the filter (security trimming) | 
| **Namespaces / collections per tenant** | Strong isolation between customers | 
| **Row-level security** (pgvector) | The DB enforces who sees which rows | 
| **Encryption and data residency** | Especially for regulated data (banking, health); check regional regulations | 

> ⚠️ **Embeddings are not anonymization.** Research has shown that text can be partially reconstructed from embeddings. Treat vectors of sensitive text **as sensitive data**.

### 8.3 Operations

| Concern | Practice | 
 | ----- | ----- | 
| **Backups** | Snapshot the DB; keep raw source docs so you can **rebuild** the index | 
| **Monitoring** | Query latency, recall on a canary eval set, index size, error rates | 
| **Re-indexing** | Blue/green; build the new index alongside the old one, switch atomically | 
| **Cost** | Vector count × dims × replicas; managed pricing by storage + reads/writes | 

---

## 9. 🧪 Hands-On

### Setup

```bash
pip install faiss-cpu chromadb sentence-transformers numpy
# Optional labs:
pip install "psycopg[binary]" pgvector       # Lab 5 (needs Docker or a Postgres server)
pip install pinecone                         # Lab 6 (needs a free Pinecone API key)
```

> Run the labs **in order in one notebook or script**: later labs reuse `CHUNKS`, `embed()`, and `vecs`.

### Lab 0: Shared data and embedder

```python
import numpy as np
from sentence_transformers import SentenceTransformer

_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

def embed(texts: list[str]) -> np.ndarray:
    """Return L2-normalized float32 embeddings (cosine = dot product)."""
    return np.asarray(_model.encode(texts, normalize_embeddings=True), dtype="float32")

DIM = embed(["dimension probe"]).shape[1]   # 384 for MiniLM

CHUNKS = [
    {"id": "LOANS#c0", "doc_id": "LOANS", "department": "retail_lending", "year": 2026, 
     "text": "Home loan interest rates start at 7.9% per annum for salaried customers and 8.3% for self-employed customers."},
    {"id": "LOANS#c1", "doc_id": "LOANS", "department": "retail_lending", "year": 2026, 
     "text": "Home loan processing fees are 0.5% of the loan amount, capped at 10,000 rupees. Maximum tenure is 30 years."},
    {"id": "SAVINGS#c0", "doc_id": "SAVINGS", "department": "retail_banking", "year": 2026, 
     "text": "The Savings Plus account offers 4.25% annual interest, credited quarterly, with no minimum balance requirement."},
    {"id": "CARDS#c0", "doc_id": "CARDS", "department": "cards", "year": 2026, 
     "text": "The Platinum credit card has an annual fee of 2,500 rupees, waived on annual spends above 3 lakh rupees."},
    {"id": "CARDS#c1", "doc_id": "CARDS", "department": "cards", "year": 2026, 
     "text": "Platinum cardholders get 2% cashback on online purchases and four airport lounge visits per year."},
    {"id": "FD#c0", "doc_id": "FD", "department": "retail_banking", "year": 2026, 
     "text": "Fixed deposit rates are 7.1% for 1 to 2 year tenures and 7.4% for senior citizens."},
    {"id": "FD#c1", "doc_id": "FD", "department": "retail_banking", "year": 2026, 
     "text": "Premature withdrawal of a fixed deposit attracts a penalty of 1% on the applicable rate."},
    {"id": "SUPPORT#c0", "doc_id": "SUPPORT", "department": "operations", "year": 2026, 
     "text": "Customer support is available 24/7 by phone at 1800-000-000 and through in-app chat."},
    {"id": "LOANS-OLD#c0", "doc_id": "LOANS-OLD", "department": "retail_lending", "year": 2023, 
     "text": "In 2023, home loan interest rates started at 8.6% per annum for all customers."},
]

texts = [c["text"] for c in CHUNKS]
vecs = embed(texts)
print("Embeddings:", vecs.shape, vecs.dtype)
```

### Lab 1: FAISS (index, search, ID mapping, save/load, post-filtering)

```python
import faiss

# 1) Build an exact inner-product index with our own int64 IDs
index = faiss.IndexIDMap(faiss.IndexFlatIP(DIM))
index.add_with_ids(vecs, np.arange(len(CHUNKS), dtype="int64"))
print("Vectors in FAISS:", index.ntotal)

def faiss_search(query: str, k: int = 3):
    scores, ids = index.search(embed([query]), k)
    # FAISS returns only integer IDs, so map them back to our chunks ourselves
    return [(CHUNKS[i]["id"], round(float(s), 3)) for s, i in zip(scores[0], ids[0]) if i != -1]

print(faiss_search("cost of borrowing to buy a house"))
print(faiss_search("what is the penalty for breaking an FD early?"))

# 2) Persist and reload (vectors only! keep CHUNKS in your own store, e.g., JSON/SQLite)
faiss.write_index(index, "bank.faiss")
reloaded = faiss.read_index("bank.faiss")
print("Reloaded vectors:", reloaded.ntotal)

**Post-filtering and its pitfall:**

def faiss_search_filtered(query: str, k: int = 3, year: int | None = None, overfetch: int = 1):
    fetch = min(index.ntotal, k * overfetch)
    scores, ids = index.search(embed([query]), fetch)
    results = []
    for s, i in zip(scores[0], ids[0]):
        if i == -1:
            continue
        if year is not None and CHUNKS[i]["year"] != year:
            continue                             # post-filter
        results.append((CHUNKS[i]["id"], round(float(s), 3)))
        if len(results) == k:
            break
    return results

q = "credit card annual fee and cashback"
print("year=2023, overfetch=1 :", faiss_search_filtered(q, k=2, year=2023, overfetch=1))
print("year=2023, overfetch=10:", faiss_search_filtered(q, k=2, year=2023, overfetch=10))
```

> 🚨 **Observe:** With `overfetch=1`, FAISS fetches only the top 2 (the two 2026 **card** chunks), so the 2023 filter removes both and you get **`[]`**, even though a 2023 chunk exists. Over-fetching finds it. **This is the post-filter trap.**

### Lab 2: Chroma (persistent collection, cosine, filters)

```python
import chromadb

client = chromadb.PersistentClient(path="./chroma_db")

# Start fresh each run (fine for a lab; never do this casually in production!)
if "bank_docs" in [c.name for c in client.list_collections()]:
    client.delete_collection("bank_docs")

col = client.create_collection(
    name="bank_docs",
    metadata={"hnsw:space": "cosine"},      # default is L2! (see Day 5)
    embedding_function=None,                # we supply our own embeddings
)

col.add(
    ids=[c["id"] for c in CHUNKS],
    embeddings=vecs.tolist(),
    documents=texts,
    metadatas=[{"doc_id": c["doc_id"], "department": c["department"], "year": c["year"]} for c in CHUNKS],
)
print("Records in Chroma:", col.count())

def chroma_search(query: str, k: int = 3, where: dict | None = None, where_document: dict | None = None):
    res = col.query(
        query_embeddings=embed([query]).tolist(),
        n_results=k,
        where=where,
        where_document=where_document,
        include=["documents", "metadatas", "distances"],
    )
    # Chroma returns DISTANCES; for cosine space: similarity = 1 - distance
    return [(i, round(1 - d, 3)) for i, d in zip(res["ids"][0], res["distances"][0])]

print("No filter       :", chroma_search("home loan interest rate"))
print("year = 2026     :", chroma_search("home loan interest rate", where={"year": 2026}))
print("year = 2023     :", chroma_search("credit card annual fee", where={"year": 2023}))  # pre-filter: still finds it
print("AND filter      :", chroma_search(
    "interest rate", 
    where={"$and": [{"year": {"$gte": 2025}}, {"department": {"$in": ["retail_banking", "retail_lending"]}}]},
))
print("Doc text contains:", chroma_search("rates", where_document={"$contains": "senior"}))
```

> 🚨 **Observe:**
> * Unlike FAISS post-filtering, Chroma's `where` filter **still finds the 2023 chunk** for an unrelated query: filtering happens **before/during** the search.
> * Combining conditions requires an explicit **`$and`**.
> * `where_document` filters on the **text itself** (a simple keyword constraint).

### Lab 3: CRUD and a safe re-ingestion strategy

```python
import hashlib

def content_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]

def reindex_document(collection, doc_id: str, new_chunk_texts: list[str], metadata: dict):
    """Delete all old chunks of a document, then add the new ones with deterministic IDs."""
    collection.delete(where={"doc_id": doc_id})
    ids = [f"{doc_id}#c{n}" for n in range(len(new_chunk_texts))]
    collection.add(
        ids=ids,
        embeddings=embed(new_chunk_texts).tolist(),
        documents=new_chunk_texts,
        metadatas=[{**metadata, "doc_id": doc_id, "hash": content_hash(t)} for t in new_chunk_texts],
    )
    return ids

# The loan policy was revised: the rate dropped and the doc now has ONE chunk instead of two
new_ids = reindex_document(
    col, "LOANS", 
    ["Revised policy: home loan interest rates now start at 7.6% for all customers."], 
    {"department": "retail_lending", "year": 2026},
)
print("New IDs:", new_ids)
print("LOANS chunks now:", col.get(where={"doc_id": "LOANS"})["ids"])      # the old LOANS#c1 is gone
print("Search:", chroma_search("home loan interest rate", where={"year": 2026}))

# Retire the outdated 2023 policy entirely
col.delete(where={"doc_id": "LOANS-OLD"})
print("Total records:", col.count())

# Persistence check: a brand-new client sees the same data
client2 = chromadb.PersistentClient(path="./chroma_db")
print("Records after reopening:", client2.get_collection("bank_docs").count())
```

> 🚨 **Observe:** If you had **upserted** the single new chunk instead of delete-then-add, the stale `LOANS#c1` (old processing-fee text) would have **lingered** in the index. Delete-by-`doc_id` prevents orphaned chunks.

### Lab 4: Plug real vector stores into your Day 3 pipeline

Both adapters implement the same interface as Day 3's `InMemoryVectorStore`: `add(chunks, vectors)` and `search(query_vec, k, filters)` → `[(chunk, score)]`.

```python
class FaissVectorStore:
    """Exact inner-product search with over-fetch + post-filtering for metadata."""
    
    def __init__(self, overfetch: int = 5):
        self.index = None
        self.chunks = []
        self.overfetch = overfetch
        
    def add(self, chunks, vectors):
        vectors = np.ascontiguousarray(vectors, dtype="float32")
        if self.index is None:
            self.index = faiss.IndexFlatIP(vectors.shape[1])
        self.index.add(vectors)
        self.chunks.extend(chunks)
        
    def search(self, query_vec, k=3, filters=None):
        q = np.ascontiguousarray(np.asarray(query_vec, dtype="float32").reshape(1, -1))
        fetch = min(len(self.chunks), k * self.overfetch if filters else k)
        scores, ids = self.index.search(q, fetch)
        results = []
        for s, i in zip(scores[0], ids[0]):
            if i == -1:
                continue
            chunk = self.chunks[i]
            if filters and any(chunk.metadata.get(key) != val for key, val in filters.items()):
                continue
            results.append((chunk, float(s)))
            if len(results) == k:
                break
        return results

class ChromaVectorStore:
    """Persistent Chroma collection using cosine space; metadata filters are pushed down to Chroma."""
    
    def __init__(self, path: str = "./chroma_db", name: str = "day6_pipeline"):
        self.client = chromadb.PersistentClient(path=path)
        if name in [c.name for c in self.client.list_collections()]:
            self.client.delete_collection(name)
        self.col = self.client.create_collection(name=name, metadata={"hnsw:space": "cosine"}, 
                                                 embedding_function=None)
        self._chunks = {}
        
    def add(self, chunks, vectors):
        self.col.add(
            ids=[c.id for c in chunks],
            embeddings=np.asarray(vectors, dtype="float32").tolist(),
            documents=[c.text for c in chunks],
            metadatas=[{**c.metadata, "doc_id": c.doc_id} for c in chunks],
        )
        self._chunks.update({c.id: c for c in chunks})
        
    def search(self, query_vec, k=3, filters=None):
        where = None
        if filters:
            conds = [{key: val} for key, val in filters.items()]
            where = conds[0] if len(conds) == 1 else {"$and": conds}
        res = self.col.query(query_embeddings=[np.asarray(query_vec, dtype="float32").tolist()], 
                             n_results=k, where=where)
        return [(self._chunks[i], 1 - d) for i, d in zip(res["ids"][0], res["distances"][0])]
```

**Run the Day 3 evaluation with each store:**

```python
# Re-use from Day 3: Document, DOCS, WordChunker, InMemoryVectorStore, EchoGenerator,
#                    RAGPipeline, EVAL_SET, evaluate_retrieval
# Re-use from Day 4: SentenceTransformerEmbedder

for name, store in [
    ("InMemory", InMemoryVectorStore()),
    ("FAISS", FaissVectorStore()),
    ("Chroma", ChromaVectorStore()),
]:
    rag = RAGPipeline(WordChunker(25, 5), SentenceTransformerEmbedder(), store,
                      EchoGenerator(), k=3, min_score=0.2)
    rag.index(DOCS)
    print(f"{name:<9}", evaluate_retrieval(rag.retriever, EVAL_SET, k=3, filters={"year": 2026}))
```

> 🚨 **Observe:** All three give the **same Recall@3 and MRR**, because all three do **exact** search with the same vectors and metric. The storage engine changes **persistence, filtering, and scale**, not relevance. (ANN indexes, which trade a little recall for speed, come on Day 11.)

### Lab 5 (Optional): pgvector with Docker

```bash
docker run -d --name pgvector -e POSTGRES_PASSWORD=postgres -p 5432:5432 pgvector/pgvector:pg16
```

```python
import psycopg
from pgvector.psycopg import register_vector

conn = psycopg.connect("postgresql://postgres:postgres@localhost:5432/postgres",
                       autocommit=True)
conn.execute("CREATE EXTENSION IF NOT EXISTS vector")
register_vector(conn)

conn.execute("DROP TABLE IF EXISTS chunks")
conn.execute(f"""
    CREATE TABLE chunks (
        id          text PRIMARY KEY,
        doc_id      text NOT NULL,
        department  text,
        year        int,
        content     text NOT NULL,
        embedding   vector({DIM}) NOT NULL
    )
""")

with conn.cursor() as cur:
    for c, v in zip(CHUNKS, vecs):
        cur.execute(
            "INSERT INTO chunks (id, doc_id, department, year, content, embedding) VALUES (%s, %s, %s, %s, %s, %s)",
            (c["id"], c["doc_id"], c["department"], c["year"], c["text"], v),
        )

conn.execute("CREATE INDEX ON chunks USING hnsw (embedding vector_cosine_ops)")
conn.execute("CREATE INDEX ON chunks (year)")

def pg_search(query: str, k: int = 3, year: int | None = None):
    q = embed([query])[0]
    sql = """
        SELECT id, content, 1 - (embedding <=> %(q)s) AS cosine_similarity
        FROM chunks
        WHERE %(year)s::int IS NULL OR year = %(year)s::int
        ORDER BY embedding <=> %(q)s
        LIMIT %(k)s
    """
    return conn.execute(sql, {"q": q, "year": year, "k": k}).fetchall()

for row in pg_search("cost of borrowing to buy a house", year=2026):
    print(row[0], round(row[2], 3), row[1][:60])
```

> 🚨 **Observe:** Filtering is just SQL. You could `JOIN` with a `products` or `customers` table, use transactions, and apply **row-level security** for per-user access.

### Lab 6 (Optional): Pinecone (serverless)

```python
import os
from pinecone import Pinecone, ServerlessSpec

pc = Pinecone(api_key=os.environ["PINECONE_API_KEY"])
INDEX_NAME = "bank-docs-day6"

if not pc.has_index(INDEX_NAME):
    pc.create_index(
        name=INDEX_NAME, dimension=DIM, metric="cosine",
        spec=ServerlessSpec(cloud="aws", region="us-east-1"),
    )

pidx = pc.Index(INDEX_NAME)
pidx.upsert(
    vectors=[
        {"id": c["id"], "values": v.tolist(),
         "metadata": {"doc_id": c["doc_id"], "department": c["department"], "year": c["year"], "text": c["text"]}}
        for c, v in zip(CHUNKS, vecs)
    ],
    namespace="zyntracorp",
)

res = pidx.query(
    vector=embed(["cost of borrowing to buy a house"])[0].tolist(),
    top_k=3,
    include_metadata=True,
    filter={"year": {"$eq": 2026}},
    namespace="zyntracorp",
)

for m in res.matches:
    print(m.id, round(m.score, 3), m.metadata["text"][:60])

# Clean up to stay within free-tier limits:
# pc.delete_index(INDEX_NAME)
```

> ⚠️ **Newly upserted vectors can take a moment to become queryable (eventual consistency). If you get no results, wait a few seconds and retry.**
> 💡 Pinecone's SDK evolves; if a call fails, check the current Python SDK docs.

### Lab 7: Exact vs approximate search at scale (FAISS preview of Day 11)

```python
import time

N, D, NQ, K = 50_000, 384, 200, 10
rng = np.random.default_rng(0)

def make_data(structured: bool):
    """Structured = clustered like real embeddings (topics); random = no structure (worst case)."""
    if structured:
        centers = rng.normal(size=(500, D)).astype("float32")
        faiss.normalize_L2(centers)
        pts = centers[rng.integers(0, 500, N + NQ)] + (0.3 / np.sqrt(D)) * rng.normal(size=(N + NQ, D)).astype("float32")
    else:
        pts = rng.normal(size=(N + NQ, D)).astype("float32")
    pts = np.ascontiguousarray(pts, dtype="float32")
    faiss.normalize_L2(pts)
    return pts[:N], np.ascontiguousarray(pts[N:])

for label, structured in [("STRUCTURED (clustered)", True), ("RANDOM (no structure)", False)]:
    data, queries = make_data(structured)
    
    flat = faiss.IndexFlatIP(D)                        # exact search = ground truth
    flat.add(data)
    t0 = time.perf_counter()
    _, gt = flat.search(queries, K)
    t_flat = time.perf_counter() - t0
    
    hnsw = faiss.IndexHNSWFlat(D, 32, faiss.METRIC_INNER_PRODUCT)
    t0 = time.perf_counter()
    hnsw.add(data)
    t_build = time.perf_counter() - t0
    
    print(f"\n=== {label} ===")
    print(f"Exact (flat) : {t_flat / NQ * 1000:.3f} ms/query, recall@{K} = 1.000")
    print(f"HNSW build   : {t_build:.1f} s")
    
    for ef in (16, 64, 256):
        hnsw.hnsw.efSearch = ef
        t0 = time.perf_counter()
        _, approx = hnsw.search(queries, K)
        t_h = time.perf_counter() - t0
        
        recall = np.mean([len(set(gt[i]) & set(approx[i])) / K for i in range(NQ)])
        print(f"HNSW ef={ef:<4}: {t_h / NQ * 1000:.3f} ms/query, recall@{K} = {recall:.3f}")
```

> 🚨 **Observe:**
> - HNSW takes seconds to **build**, but each query is typically **several times faster** than exact search, and the gap grows with N.
> - Increasing `efSearch` raises **recall** at the cost of **speed**: the core ANN trade-off.
> - On **structured** data (like real embeddings, which cluster by topic), HNSW reaches **~0.95+ recall** even at low `efSearch`. On **random** data it struggles badly. That's why ANN works so well in practice, and why you should **measure recall on your own data** (Day 11).

---

## ❓ Common Confusions

| ❌ Misconception | ✅ Reality | 
 | ----- | ----- | 
| "I need a vector database to build RAG." | For a few thousand chunks, a **numpy array or FAISS file** works fine. Use a DB when you need persistence, filters, updates, or scale. | 
| "A better vector DB gives more relevant results." | With exact (or well-tuned ANN) search, relevance comes from **embeddings, chunking, and re-ranking**. DBs differ in ops, filtering, and scale. | 
| "FAISS is a database." | It's a **library**. No text, no metadata, no server; you manage those yourself. | 
| "Upsert handles document updates." | Upsert only overwrites **matching IDs**. If a doc shrinks, old chunks **linger**. Delete by `doc_id` first. | 
| "Filtering is always free and exact." | **Post-filtering** can return fewer than K results. Know how your DB filters. | 
| "Chroma returns similarity scores." | It returns **distances** (and defaults to **L2**). Convert with `1 - distance` for cosine space. | 
| "Vectors are anonymous, so storing them in the cloud is safe." | Text can be partially **reconstructed from embeddings**. Treat vectors as sensitive as the source text. | 

---

## 10. 🏋️ Exercises

1. **FAISS persistence:** Save both the FAISS index **and** `CHUNKS` (as JSON) to disk. Write `load_store()` that restores both and answers a query after a Python restart.
2. **Post-filter study:** In Lab 1, for `overfetch` = 1, 2, 5, 10, record how many results come back for `year=2023`. What overfetch guarantees K results in the worst case?
3. **FAISS pre-filtering:** Research `faiss.IDSelectorBatch` and `faiss.SearchParameters(sel=...)` and implement **true pre-filtering** on a plain `IndexFlatIP` (no `IndexIDMap`, so the selector sees the positional IDs directly).
4. **Access control:** Add an `access_level` field (`public` / `internal`) to `CHUNKS`. Implement `secure_search(query, user_role)` in Chroma that **always** applies the right filter server-side.
5. **Change detection:** Extend `reindex_document()` to **skip** re-embedding when the document's content hash hasn't changed. Print "unchanged, skipped".
6. **pgvector + SQL join (optional):** Create a `products` table (`doc_id`, `product_name`, `is_active`) and write a query that returns only chunks from **active** products using a `JOIN`.
7. **Choose for your project:** For your own use case (for example, the financial persona project), write 5 lines justifying a vector DB choice, covering data size, infrastructure, compliance, filtering, and budget.

---

## 11. 📝 Quiz (Self-Check)

1. Name four things a vector DB provides that a plain numpy array doesn't.
2. What are the four families of vector search tools? Give one example of each.
3. What does FAISS store, and what must you manage yourself?
4. What is Chroma's default distance metric, and how do you change it?
5. What does the pgvector operator `<=>` return, and how do you convert it to cosine similarity?
6. Explain **post-filtering** and the failure it can cause.
7. Why use deterministic chunk IDs like `doc_id#c0`?
8. A document shrinks from 5 chunks to 3. Why is "upsert the new 3 chunks" not enough?
9. Why might a bank choose pgvector or self-hosted Qdrant over Pinecone?
10. In Lab 4, why do InMemory, FAISS, and Chroma produce the same retrieval metrics?

<details>
<summary>✅ Answers</summary>

1. Any four of: persistence, metadata filtering, CRUD/upserts, ANN indexing at scale, concurrency, text+metadata storage with vectors, access control/multi-tenancy, hybrid search, backups.
2. **Library** (FAISS), **vector DB** (Chroma/Qdrant/Pinecone...), **DB extension** (pgvector), **search engine** (Elasticsearch/OpenSearch).
3. Only **vectors and integer IDs**. You manage the text, metadata, filtering, persistence of the side data, and any server/API.
4. **L2**. Set `metadata={"hnsw:space": "cosine"}` (or the newer configuration syntax, depending on the version) when **creating** the collection.
5. **Cosine distance**. Cosine similarity = `1 - (a <=> b)`.
6. Searching the top-N first and then removing non-matching items. With a selective filter, you can get **fewer than K (even zero)** results, even though matching items exist.
7. Re-ingesting overwrites the same records (no duplicates), and IDs are traceable to their source document for citations and deletes.
8. Chunks `#c3` and `#c4` from the old version **remain** in the index as stale content. Delete by `doc_id` first, then insert.
9. **Data residency / regulatory control**, existing infrastructure and ops skills, security policies (keep data in its own environment), cost predictability.
10. All three perform **exact** search with the **same vectors and metric**, so the rankings are identical. The store changes ops features, not relevance.
</details>

---

## 12. 📚 Resources

### Official docs
- FAISS wiki: https://github.com/facebookresearch/faiss/wiki
- Chroma docs: https://docs.trychroma.com/
- pgvector README: https://github.com/pgvector/pgvector
- pgvector Python: https://github.com/pgvector/pgvector-python
- Pinecone docs: https://docs.pinecone.io/
- Qdrant docs: https://qdrant.tech/documentation/
- Weaviate docs: https://weaviate.io/developers/weaviate
- Milvus docs: https://milvus.io/docs

### Papers and articles
- *Billion-scale similarity search with GPUs* (FAISS, Johnson et al., 2017): https://arxiv.org/abs/1702.08734
- *The Faiss Library* (Douze et al., 2024): https://arxiv.org/abs/2401.08281
- *Efficient and robust approximate nearest neighbor search using HNSW graphs* (Malkov & Yashunin, 2016): https://arxiv.org/abs/1603.09320
- *Text Embeddings Reveal (Almost) As Much As Text* (Morris et al., 2023), on embedding inversion: https://arxiv.org/abs/2310.06816
- Pinecone Learning Center: *What is a Vector Database?*: https://www.pinecone.io/learn/vector-database/

### Benchmarks
- ANN-Benchmarks: https://ann-benchmarks.com/

---

## 13. 🧠 Key Takeaways

- A vector DB = **similarity search + database features** (persistence, filters, CRUD, scale, security).
- Know the four families: **library** (FAISS), **vector DB** (Chroma/Qdrant/Pinecone...), **DB extension** (pgvector), **search engine** (Elasticsearch/OpenSearch).
- **FAISS** = raw speed, DIY everything else. **Chroma** = easiest start. **pgvector** = vectors in the Postgres you already trust. **Pinecone** = zero-ops managed cloud.
- **Pre-filter > post-filter.** Post-filtering can silently return too few results.
- Design for change: **deterministic IDs, `doc_id` metadata, delete-then-insert**, content hashes, embedding-model tags.
- Enforce **access control server-side**, and treat embeddings of sensitive text as **sensitive data**.
- The DB choice affects **ops, cost, compliance, and scale** far more than **relevance**.

---

## ⏩ Next: Day 7: Build a Basic RAG Pipeline (LangChain or LlamaIndex)
You'll rebuild your from-scratch pipeline with a framework (loaders, splitters, embeddings, vector store, retriever, prompt, LLM) and compare the developer experience.