---
title: "RAG Architecture"
day: 3
concept: "The end-to-end blueprint: indexing, retrieval, and generation"
chapter: 1
chapterTitle: "Foundations"
---

# Day 3: RAG Architecture (Retriever, Generator, Pipeline Flow)

> **30-Day RAG Course, Week 1: Foundations**
>
> **Date:** Oct 1, 2026 | **Estimated time:** 3-4 hours
>
> **Prerequisites:** [Day 1: LLM Basics](./day01_llm_basics.md), [Day 2: Hallucination and RAG](./day02_hallucination_and_rag.md)

## 🎯 Learning Objectives

By the end of today, you should be able to:

1. Draw the **end-to-end RAG architecture** from memory.

2. Explain the two phases: the **Indexing (offline)** pipeline and the **Query (online)** pipeline.

3. Describe each component: **Loader, Chunker, Embedder, Vector Store, Retriever, Re-ranker, Prompt Builder, Generator**.

4. Compare retriever types: **sparse, dense, hybrid** (and bi-encoder vs cross-encoder).

5. Explain the evolution: **Naive → Advanced → Modular → Agentic RAG**.

6. Plan a **context token budget**.

7. Build a **modular RAG pipeline from scratch** in Python and measure retrieval quality with **Recall@K** and **MRR**.

## 🗓️ Suggested Schedule

| Time | Activity | 
 | ----- | ----- | 
| 0:00 - 0:30 | Section 1: The big picture (two pipelines) | 
| 0:30 - 1:00 | Section 2: Indexing pipeline components | 
| 1:00 - 1:40 | Section 3-4: Query pipeline and retriever deep dive | 
| 1:40 - 2:10 | Section 5-6: Generator, token budget, RAG paradigms | 
| 2:10 - 3:30 | Section 9: Hands-on (build a modular RAG from scratch) | 
| 3:30 - 4:00 | Exercises and quiz | 

## 1. The Big Picture: Two Pipelines

Every RAG system has **two separate flows**:

| Phase | When it runs | Goal | 
 | ----- | ----- | ----- | 
| **⚙️ Indexing (Ingestion)** | **Offline**: once, then on a schedule or when docs change | Turn raw documents into a **searchable index** | 
| **🔍 Query (Retrieval + Generation)** | **Online**: on every user question | Find relevant chunks and **generate a grounded answer** | 

```
               ⚙️ INDEXING PIPELINE (offline)
+-----------+     +-----------+     +--------------+     +------------+     +----------------+
|   Load    | --> |   Clean   | --> |    Chunk     | --> |   Embed    | --> |  Vector Store  |
|  PDF/HTML |     |  /Parse   |     |  + metadata  |     |  (vectors) |     |    (Index)     |
+-----------+     +-----------+     +--------------+     +------------+     +----------------+
                                                                                    |
============================== 🔍 QUERY PIPELINE (online) =========================|
                                                                                    v
+-----------+     +-----------+     +--------------+     +------------+     +----------------+
|   User    | --> |   Query   | --> |    Embed     | --> |  Retrieve  | <---+ (from Index)   |
| Question  |     |  Process  |     |    Query     |     |   Top-K    |
+-----------+     +-----------+     +--------------+     +------------+
                                                               |
      +--------------------------------------------------------+
      v
+-----------+     +-----------+     +--------------+     +------------+
|  Re-rank  | --> | Generate  | --> |    Post-     | --> |   Answer   |
| / Build   |     |   (LLM)   |     |   process    |     | +citations |
|  Prompt   |     +-----------+     +--------------+     +------------+
+-----------+

```

> 🔑 **The "R-A-G" in RAG:**
>
> * **R**etrieve: find relevant knowledge.
>
> * **A**ugment: insert that knowledge into the prompt.
>
> * **G**enerate: the LLM writes an answer grounded in it.

## 2. Indexing Pipeline (Offline)

### 2.1 Components

| \# | Component | What it does | Examples | Deep dive | 
 | ----- | ----- | ----- | ----- | ----- | 
| 1 | **Loader** | Reads raw files and sources | PDF, DOCX, HTML, Confluence, SharePoint, SQL, S3 | Day 8 | 
| 2 | **Parser / Cleaner** | Extracts text and tables, removes noise (headers, footers, boilerplate) | Unstructured, PyMuPDF, Docling | Day 8 | 
| 3 | **Chunker** | Splits text into smaller retrievable pieces | Fixed, recursive, semantic | Day 9 | 
| 4 | **Metadata enricher** | Adds source, date, author, section, department, access level | Custom | Day 10 | 
| 5 | **Embedder** | Converts each chunk into a dense vector | OpenAI `text-embedding-3-*`, BGE, E5 | Day 4 | 
| 6 | **Vector store / Index** | Stores vectors + text + metadata for fast search | FAISS, Chroma, pgvector, Pinecone | Days 6, 11 | 

### 2.2 What gets stored per chunk

```
{
  "id": "POLICY-2026-LOANS#chunk-3",
  "text": "Home loan interest rates start at 7.9% for salaried customers...",
  "vector": [0.021, -0.087, "... 1536 numbers ..."],
  "metadata": {
    "source": "loan_policy_2026.pdf",
    "page": 4,
    "section": "Home Loans",
    "department": "Retail Lending",
    "effective_date": "2026-01-01",
    "access_level": "public"
  }
}

```

### 2.3 Why chunk at all?

| Reason | Explanation | 
 | ----- | ----- | 
| **Precision** | Small, focused chunks match specific questions better | 
| **Context budget** | You can't fit entire documents into the prompt | 
| **Embedding quality** | One vector for a 50-page doc blurs all its meaning together | 
| **Cost** | Fewer, more relevant tokens mean cheaper and faster answers | 

> ⚠️ **Trade-off:** Chunks that are too **small** lose context; chunks that are too **large** add noise. (Details on Day 9.)

## 3. Query Pipeline (Online)

| Stage | What happens | Examples | Deep dive | 
 | ----- | ----- | ----- | ----- | 
| **1. Query processing** | Clean, rewrite, expand, or decompose the question | Query rewriting, HyDE, multi-query | Days 15-17 | 
| **2. Query embedding** | Convert the question into a vector (**same model** as the documents!) | Same embedder as indexing | Day 4 | 
| **3. Retrieval** | Find the top-K most similar chunks (+ metadata filters) | Vector search, BM25, hybrid | Days 5, 12, 13 | 
| **4. Post-retrieval** | Re-rank, deduplicate, filter by score, compress | Cross-encoder reranker | Days 14, 19 | 
| **5. Augmentation** | Build the prompt: instructions + context + question | Prompt templates | Day 7 | 
| **6. Generation** | The LLM writes the answer | GPT-4o, Claude, Llama | Day 1 | 
| **7. Post-processing** | Add citations, check faithfulness, apply guardrails, format | Guardrails, validators | Day 27 | 

### 3.1 A single request, traced

```
Q: "What is the home loan rate for salaried people?"

[1] Query processed    -> "home loan interest rate salaried customers"
[2] Query embedded     -> [0.018, -0.097, ...]
[3] Retrieved top-5    -> loans#3 (0.86), loans#4 (0.79), cards#1 (0.41), ...
[4] Re-ranked, top-2   -> loans#3, loans#4         (score threshold removed cards#1)
[5] Prompt built       -> system rules + 2 chunks + question (~650 tokens)
[6] LLM generated      -> "Home loan rates start at 7.9% for salaried customers [loans#3]."
[7] Post-processed     -> citation verified ✓, no PII ✓ -> returned to user

```

### 3.2 Where the latency goes (typical)

| Stage | Typical latency | 
 | ----- | ----- | 
| Query embedding | 20-100 ms | 
| Vector search (ANN) | 5-50 ms | 
| Re-ranking (cross-encoder) | 50-300 ms | 
| LLM generation | **500 ms - several seconds** (usually the biggest part) | 

> 💡 **Optimization on Day 28: caching, streaming, smaller models, fewer tokens.**

## 4. The Retriever: Deep Dive

### 4.1 Retriever types

| Type | How it works | Strengths | Weaknesses | 
 | ----- | ----- | ----- | ----- | 
| **Sparse (lexical)** | Keyword matching: TF-IDF, **BM25** | Exact terms, IDs, codes, names; no training needed | Misses synonyms ("CEO" vs "runs the company") | 
| **Dense (semantic)** | Embedding similarity (vectors) | Understands meaning and paraphrases | Can miss exact keywords, rare terms, numbers | 
| **Hybrid** | Combines sparse + dense scores (for example, RRF) | Best of both; the **production default** | Slightly more complex | 
| **Structured** | Text-to-SQL, APIs | Exact numbers and tables | Needs a schema | 
| **Graph** | Walks a knowledge graph of entities and relations | Multi-hop, relationship questions | Costly to build | 
| **Web search** | Search engine APIs | Fresh, public info | Less control, noisier | 

### 4.2 Bi-encoder vs cross-encoder

```
BI-ENCODER (retrieval: fast)              CROSS-ENCODER (re-ranking: accurate)

Query ---> [Encoder] ---> q_d
                           \
                            score = cos(q_d, d_d)     [Query + Doc] ---> [Encoder] ---> score
                           /
Doc   ---> [Encoder] ---> d_d

```

|  | Bi-encoder | Cross-encoder | 
 | ----- | ----- | ----- | 
| **Encodes** | Query and doc **separately** | Query and doc **together** | 
| **Doc vectors pre-computed?** | ✅ Yes (at indexing time) | ❌ No (computed per query) | 
| **Speed** | ⚡ Millions of docs in ms | 🐢 Only practical for about 20-100 docs | 
| **Accuracy** | Good | **Better** | 
| **Role** | **Stage 1: Retrieve** candidates | **Stage 2: Re-rank** candidates | 

> 🏆 **Production pattern (two-stage retrieval):** a bi-encoder or hybrid search retrieves the **top 20-50** → a cross-encoder re-ranks → the **top 3-5** go to the LLM.

### 4.3 Key retriever settings

| Setting | Meaning | Typical start | 
 | ----- | ----- | ----- | 
| `top_k` | Number of chunks returned | 3-5 (or 20-50 before re-ranking) | 
| `score_threshold` | Drop chunks below this similarity | Tune on your data | 
| `filters` | Metadata constraints (date, department, access) | As needed | 
| `search_type` | similarity / MMR (diversity) / hybrid | similarity, then hybrid | 

### 4.4 Retrieval metrics (preview for Day 25)

| Metric | Question it answers | 
 | ----- | ----- | 
| **Recall@K** | Did the correct chunk appear in the top-K at all? | 
| **Precision@K** | What fraction of the top-K chunks are relevant? | 
| **MRR** (Mean Reciprocal Rank) | How high is the **first** correct result? (1st -> 1.0, 2nd -> 0.5, 3rd -> 0.33) | 
| **nDCG@K** | Ranking quality, with graded relevance | 

> 🎯 **Retrieval quality puts a ceiling on answer quality.** If the right chunk isn't retrieved, the LLM can't answer correctly.

## 5. The Generator: Deep Dive

### 5.1 Generator responsibilities

1. **Read** the retrieved context.

2. **Answer** the question **using only** that context.

3. **Cite** the sources.

4. **Refuse** ("I don't know") when the context lacks the answer.

5. **Follow the format** (bullets, JSON, tables).

### 5.2 Choosing the generator LLM

| Factor | Consideration | 
 | ----- | ----- | 
| **Quality** | Reasoning ability, instruction following, faithfulness | 
| **Context window** | Must fit system prompt + chunks + history + answer | 
| **Latency / cost** | Smaller models (for example, `gpt-4o-mini`, Llama 8B) are often enough for RAG | 
| **Data privacy** | Regulated data may need self-hosted or private-endpoint models | 
| **Language support** | Multilingual users -> a multilingual model | 

### 5.3 Context ordering matters

Because of **"Lost in the Middle"** (Day 1):

* Put the **most relevant chunks first** (and/or last).

* Avoid sending too many low-relevance chunks.

* Some frameworks offer a "long-context reorder" utility (for example, LangChain `LongContextReorder`).

### 5.4 Token budget planning

```
Context window (e.g., 128K) — but practically, keep prompts small for cost and latency.

Example budget for a single RAG call (target: 4,000 tokens total)
+-------------------------------+-------+
| System prompt / rules         |   300 |
| Chat history (summarized)     |   500 |
| Retrieved context (5x400)     | 2,000 |
| User question                 |   100 |
| Reserved for answer           | 1,000 |
| Safety margin                 |   100 |
+-------------------------------+-------+
| TOTAL                         | 4,000 |
+-------------------------------+-------+

```

> **Formula:** `max_context_tokens = budget - system - history - question - answer_reserve - margin`

## 6. Evolution of RAG Paradigms

| Paradigm | Description | Key additions | 
 | ----- | ----- | ----- | 
| **Naive RAG** | Index -> retrieve top-K -> stuff into prompt -> generate | The basic pipeline (Days 3-7) | 
| **Advanced RAG** | Adds **pre-retrieval** and **post-retrieval** optimizations | Query rewriting, hybrid search, re-ranking, compression (Days 12-19) | 
| **Modular RAG** | Swappable components + flexible flows (routing, loops, fusion) | Routers, multiple retrievers, memory, iterative retrieval (Days 20-24) | 
| **Agentic RAG** | An LLM agent **decides** when, what, and how to retrieve, and checks itself | Tool use, self-reflection (Self-RAG, CRAG), multi-step planning (Day 23) | 

```
Naive:     Query -> Retrieve -> Generate

Advanced:  Query -> [Rewrite] -> Retrieve(Hybrid) -> [Rerank/Compress] -> Generate

Modular:   Query -> Router -> Vector Retriever --+
                           -> SQL Retriever     -+-> Fuse -> Generate -> [Verify]
                           -> Web Search       --+

Agentic:   Query -> Agent <-> {Tools: search, SQL, calculator} <-> Reflect -> Answer

```

### 6.1 The original RAG model (Lewis et al., 2020): a quick note

* **Retriever:** DPR (Dense Passage Retrieval, a bi-encoder) over Wikipedia.

* **Generator:** BART (seq2seq).

* **RAG-Sequence:** uses the same retrieved docs for the whole answer.

* **RAG-Token:** can use different docs for each generated token.

* Retriever + generator were **trained jointly**. Modern RAG usually uses **off-the-shelf** embedders and LLMs **without joint training**.

## 7. Key Design Decisions (Starter Defaults)

| Decision | Options | Sensible starting default | 
 | ----- | ----- | ----- | 
| **Chunk size** | 100-2,000 tokens | **300-800 tokens** | 
| **Chunk overlap** | 0-30% | **10-20%** | 
| **Embedding model** | OpenAI, Cohere, BGE, E5, GTE | `text-embedding-3-small` or `BAAI/bge-small-en-v1.5` | 
| **Vector store** | FAISS, Chroma, pgvector, Pinecone, Qdrant, Weaviate | `Chroma`/`FAISS` (learning), `pgvector`/`Qdrant` (production) | 
| **Retrieval** | Dense, sparse, hybrid | Dense -> then **hybrid** | 
| **Top-K** | 1-50 | **3-5** (or 20 -> re-rank -> 5) | 
| **Re-ranker** | None, cross-encoder, Cohere Rerank | Add once the baseline works | 
| **Generator** | GPT-4o-mini, Claude, Llama, Mistral | A small, fast model first | 
| **Temperature** | 0-1 | **0-0.2** | 
| **Evaluation** | Manual, RAGAS, TruLens | A small labeled Q&A set from day one | 

> 💡 **Golden rule:** Start **simple** (naive RAG), **measure**, then add complexity only where the metrics show weakness.

## 8. Frameworks Overview (Preview)

| Framework | Strength | Used on | 
 | ----- | ----- | ----- | 
| **LangChain** | Huge ecosystem, flexible chains and agents (LangGraph) | Day 7 onwards | 
| **LlamaIndex** | Data/indexing-focused, many advanced retrievers | Day 7 onwards | 
| **Haystack** | Production pipelines, clean components | Optional | 
| **DSPy** | Programmatic prompt/pipeline optimization | Optional | 
| **From scratch** | Full understanding, no magic | **Today!** | 

> 💡 **Building it from scratch first helps you understand what the frameworks do under the hood.**

## 9. 🧪 Hands-On: Build a Modular RAG From Scratch

Today you'll build every component as its own class. We'll use **TF-IDF vectors** as a stand-in for embeddings (you'll swap in real neural embeddings on Day 4).

### Setup

```bash
pip install numpy scikit-learn openai tiktoken
```

### Lab 1: Components

```python
# rag_from_scratch.py
import os
import time
from dataclasses import dataclass, field

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer


# ----------------------- Data models -----------------------
@dataclass
class Document:
    id: str
    text: str
    metadata: dict = field(default_factory=dict)


@dataclass
class Chunk:
    id: str
    doc_id: str
    text: str
    metadata: dict


# ----------------------- 1. Chunker -----------------------
class WordChunker:
    """Fixed-size chunks measured in words, with overlap."""

    def __init__(self, chunk_size: int = 40, overlap: int = 10):
        assert 0 <= overlap < chunk_size
        self.chunk_size = chunk_size
        self.overlap = overlap

    def split(self, doc: Document) -> list[Chunk]:
        words = doc.text.split()
        step = self.chunk_size - self.overlap
        chunks = []
        for i, start in enumerate(range(0, len(words), step)):
            piece = words[start : start + self.chunk_size]
            chunks.append(
                Chunk(
                    id=f"{doc.id}#c{i}",
                    doc_id=doc.id,
                    text=" ".join(piece),
                    metadata={**doc.metadata, "chunk_index": i},
                )
            )
            if start + self.chunk_size >= len(words):
                break
        return chunks


# ----------------------- 2. Embedder -----------------------
class TfidfEmbedder:
    """Stand-in for a neural embedder. Vectors are L2-normalized, so dot product = cosine similarity."""

    def __init__(self):
        self.vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))

    def fit(self, texts: list[str]) -> None:
        self.vectorizer.fit(texts)

    def embed(self, texts: list[str]) -> np.ndarray:
        return self.vectorizer.transform(texts).toarray()


# ----------------------- 3. Vector store -----------------------
class InMemoryVectorStore:
    def __init__(self):
        self.vectors: np.ndarray | None = None
        self.chunks: list[Chunk] = []

    def add(self, chunks: list[Chunk], vectors: np.ndarray) -> None:
        self.chunks.extend(chunks)
        self.vectors = vectors if self.vectors is None else np.vstack([self.vectors, vectors])

    def search(self, query_vec: np.ndarray, k: int = 3, filters: dict | None = None):
        scores = self.vectors @ query_vec
        results = []
        for idx in np.argsort(-scores):
            chunk = self.chunks[idx]
            if filters and any(chunk.metadata.get(key) != val for key, val in filters.items()):
                continue
            results.append((chunk, float(scores[idx])))
            if len(results) == k:
                break
        return results


# ----------------------- 4. Retriever -----------------------
class Retriever:
    def __init__(self, embedder: TfidfEmbedder, store: InMemoryVectorStore, min_score: float = 0.05):
        self.embedder = embedder
        self.store = store
        self.min_score = min_score

    def retrieve(self, query: str, k: int = 3, filters: dict | None = None):
        q_vec = self.embedder.embed([query])[0]
        hits = self.store.search(q_vec, k=k, filters=filters)
        return [(c, s) for c, s in hits if s >= self.min_score]


# ----------------------- 5. Prompt builder -----------------------
SYSTEM_PROMPT = """You are a banking assistant.
Answer ONLY using the CONTEXT. If the answer is not in the CONTEXT, reply exactly:
"I don't know based on the provided documents."
Cite chunk IDs in square brackets, e.g., [LOANS#c0]. Be concise."""


class PromptBuilder:
    def build(self, question: str, hits) -> list[dict]:
        if hits:
            context = "\n\n".join(f"[{c.id}] {c.text}" for c, _ in hits)
        else:
            context = "(no relevant documents found)"
        user = f"CONTEXT:\n\"\"\"\n{context}\n\"\"\"\n\nQUESTION: {question}"
        return [{"role": "system", "content": SYSTEM_PROMPT}, {"role": "user", "content": user}]


# ----------------------- 6. Generators -----------------------
class OpenAIGenerator:
    def __init__(self, model: str = "gpt-4o-mini", temperature: float = 0.0):
        from openai import OpenAI
        self.client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
        self.model = model
        self.temperature = temperature

    def generate(self, messages: list[dict]) -> str:
        resp = self.client.chat.completions.create(
            model=self.model, temperature=self.temperature, messages=messages
        )
        return resp.choices[0].message.content


class EchoGenerator:
    """Offline stand-in: shows the prompt the LLM would receive (no API key needed)."""

    def generate(self, messages: list[dict]) -> str:
        return f"[ECHO] Prompt sent to LLM:\n" + messages[-1]["content"]


# ----------------------- 7. Pipeline -----------------------
class RAGPipeline:
    def __init__(self, chunker, embedder, store, generator, k: int = 3, min_score: float = 0.05):
        self.chunker = chunker
        self.embedder = embedder
        self.store = store
        self.retriever = Retriever(embedder, store, min_score)
        self.prompt_builder = PromptBuilder()
        self.generator = generator
        self.k = k

    # Indexing (offline)
    def index(self, docs: list[Document]) -> None:
        chunks = [c for d in docs for c in self.chunker.split(d)]
        self.embedder.fit([c.text for c in chunks])  # TF-IDF needs fitting; neural embedders don't
        vectors = self.embedder.embed([c.text for c in chunks])
        self.store.add(chunks, vectors)
        print(f"Indexed {len(docs)} docs -> {len(chunks)} chunks -> vectors {vectors.shape}")

    # Query (online)
    def query(self, question: str, filters: dict | None = None) -> dict:
        t0 = time.perf_counter()
        hits = self.retriever.retrieve(question, k=self.k, filters=filters)
        t1 = time.perf_counter()
        messages = self.prompt_builder.build(question, hits)
        answer = self.generator.generate(messages)
        t2 = time.perf_counter()
        return {
            "question": question,
            "answer": answer,
            "sources": [(c.id, round(s, 3)) for c, s in hits],
            "timing_ms": {"retrieve": round((t1 - t0) * 1000, 1), "generate": round((t2 - t1) * 1000, 1)},
        }
```

---

### Lab 2: Knowledge base and running the pipeline

```python
DOCS = [
    Document("LOANS", "ZyntraCorp Bank home loan interest rates start at 7.9% per annum for salaried "
                      "customers and 8.3% for self-employed customers. The maximum tenure is 30 years. "
                      "Processing fees are 0.5% of the loan amount, capped at 10,000 rupees.",
             {"department": "retail_lending", "year": 2026}),
    Document("SAVINGS", "The Savings Plus account offers 4.25% annual interest, credited quarterly. "
                        "There is no minimum balance requirement. Customers get free unlimited UPI transfers "
                        "and a free debit card for the first year.",
             {"department": "retail_banking", "year": 2026}),
    Document("CARDS", "The Platinum credit card has an annual fee of 2,500 rupees, waived on annual "
                      "spends above 3 lakh rupees. It offers 2% cashback on online purchases and airport "
                      "lounge access four times per year.",
             {"department": "cards", "year": 2026}),
    Document("FD", "Fixed deposit rates are 7.1% for tenures of 1 to 2 years and 7.4% for senior "
                   "citizens. Premature withdrawal attracts a penalty of 1% on the applicable rate.",
             {"department": "retail_banking", "year": 2026}),
    Document("SUPPORT", "Customer support is available 24/7 via phone at 1800-000-000 and through "
                        "in-app chat. Lost card reports are handled immediately through the mobile app.",
             {"department": "operations", "year": 2026}),
    Document("LOANS-OLD", "ZyntraCorp Bank home loan interest rates start at 8.6% per annum for all "
                          "customers. This policy applied during 2023.",
             {"department": "retail_lending", "year": 2023}),
]

# Swap EchoGenerator() -> OpenAIGenerator() when you have an API key
rag = RAGPipeline(
    chunker=WordChunker(chunk_size=40, overlap=10),
    embedder=TfidfEmbedder(),
    store=InMemoryVectorStore(),
    generator=EchoGenerator(),
    k=3,
)

rag.index(DOCS)

for q in [
    "What is the home loan interest rate for salaried customers?",
    "Is there a minimum balance for the savings account?",
    "What is the FD rate for senior citizens?",
    "What is ZyntraCorp's share price?",  # not in the KB
]:
    result = rag.query(q)
    print(f"\nQ: {result['question']}")
    print(f"Sources: {result['sources']}")
    print(f"Timing : {result['timing_ms']}")
    print(f"Answer : {result['answer'][:500]}")
```

> 📄 **Observe:**
> * Which chunks were retrieved, and with what scores?
> * Do `LOANS` and `LOANS-OLD` compete? (That's a **conflicting-sources** problem.)

---

### Lab 3: Metadata filtering (fix conflicting sources)

```python
q = "What is the home loan interest rate?"
print("No filter :", rag.query(q)["sources"])
print("year=2026 :", rag.query(q, filters={"year": 2026})["sources"])
```

> 📄 **Observe:** Filters remove the outdated 2023 policy. (More on Day 10.)

---

### Lab 4: Evaluate retrieval (Recall@K and MRR)

```python
EVAL_SET = [
    ("home loan rate for salaried people", "LOANS"),
    ("processing fee on housing loan", "LOANS"),
    ("savings account interest rate", "SAVINGS"),
    ("do I need to keep minimum balance", "SAVINGS"),
    ("credit card annual fee waiver", "CARDS"),
    ("lounge access on card", "CARDS"),
    ("fixed deposit rate senior citizens", "FD"),
    ("penalty for breaking FD early", "FD"),
    ("how do I report a lost card", "SUPPORT"),
    ("customer care phone number", "SUPPORT"),
]

def evaluate_retrieval(retriever: Retriever, eval_set, k: int = 3, filters: dict | None = None) -> dict:
    hits_count, reciprocal_ranks = 0, []
    for question, relevant_doc in eval_set:
        doc_ids = [c.doc_id for c, _ in retriever.retrieve(question, k=k, filters=filters)]
        if relevant_doc in doc_ids:
            hits_count += 1
            reciprocal_ranks.append(1 / (doc_ids.index(relevant_doc) + 1))
        else:
            reciprocal_ranks.append(0.0)
            print(f"  ❌ MISS: '{question}' -> got {doc_ids}")
    n = len(eval_set)
    return {"recall@k": round(hits_count / n, 2), "mrr": round(sum(reciprocal_ranks) / n, 2)}

for k in (1, 3, 5):
    print(f"k={k}:", evaluate_retrieval(rag.retriever, EVAL_SET, k=k, filters={"year": 2026}))
```

> 📄 **Observe:**
> * Recall goes up as K increases, but more chunks means more noise and tokens.
> * Look at the **misses**: queries such as *"penalty for breaking FD early"* or *"customer care phone number"* may fail because TF-IDF matches **words, not meaning**. $\rightarrow$ **Day 4 (embeddings) fixes this.**

---

### Lab 5: Enforce a token budget

```python
import tiktoken

enc = tiktoken.get_encoding("o200k_base")

def count_tokens(text: str) -> int:
    return len(enc.encode(text))

def fit_to_budget(hits, max_context_tokens: int):
    selected, used = [], 0
    for chunk, score in hits:  # hits are already sorted by relevance
        n = count_tokens(chunk.text)
        if used + n > max_context_tokens:
            break
        selected.append((chunk, score))
        used += n
    return selected, used

hits = rag.retriever.retrieve("home loan rate and processing fee", k=5)
for budget in (50, 100, 300):
    sel, used = fit_to_budget(hits, budget)
    print(f"budget={budget:>3} -> kept {len(sel)} chunks, {used} tokens: {[c.id for c, _ in sel]}")
```

---

### Lab 6 (Bonus): Swap components

Because each component is modular, try:
* `WordChunker(chunk_size=20, overlap=5)` vs `WordChunker(chunk_size=80, overlap=20)`, then re-run Lab 4.
* `k=1` vs `k=5`.
* `min_score=0.0` vs `min_score=0.15`.
* `EchoGenerator()` $\rightarrow$ `OpenAIGenerator()`.

> Record your results in a small table. This is **experiment-driven RAG development**.

---

## 10. 🏋️ Exercises

1. **Draw it:** From memory, sketch both pipelines (indexing + query) with all components. Label which run offline and which run online.
2. **Chunk-size experiment:** Run Lab 4 with chunk sizes 15, 40, and 100 words. Plot or tabulate Recall@3 and MRR.
3. **Add a component:** Implement a `Deduplicator` that keeps only the **best chunk per `doc_id`** before prompt building. Does the answer quality change?
4. **Add a query processor:** Implement a simple `QueryProcessor` that lowercases the query and expands abbreviations (`"FD"` $\rightarrow$ `"fixed deposit"`, `"CC"` $\rightarrow$ `"credit card"`). Re-run the evaluation.
5. **Citations validator:** After generation, parse `[...]` citations in the answer and check that every cited ID was actually in the retrieved context. Flag invalid citations.
6. **Architecture for your domain:** Design (on paper) a RAG system for **your use case** (for example, a financial persona Q&A). List the data sources, metadata fields, retriever type, top-K, generator model, and evaluation plan.

---

## 11. 📝 Quiz (Self-Check)

1. What are the two main pipelines in RAG, and when does each run?
2. List the 6 components of the indexing pipeline in order.
3. Why must the **same embedding model** be used for documents and queries?
4. What is the difference between **sparse** and **dense** retrieval? Give one strength of each.
5. Why is a **cross-encoder** not used for first-stage retrieval over millions of docs?
6. What does **Recall@5 = 0.8** mean?
7. A correct chunk is retrieved at rank 4. What is its reciprocal rank?
8. Name the four RAG paradigms in order of evolution.
9. Which pipeline stage usually adds the most latency?
10. Why is "start simple, measure, then add complexity" important in RAG?

<details>
<summary>✅ Answers</summary>

1. **Indexing** runs offline (once or when data changes). **Query** runs online (on every user question).
2. Load $\rightarrow$ Parse/Clean $\rightarrow$ Chunk $\rightarrow$ Add metadata $\rightarrow$ Embed $\rightarrow$ Store in the vector index.
3. Vectors from different models live in **different vector spaces**, so their similarities are meaningless.
4. **Sparse** = keyword matching (strength: exact terms, IDs, names). **Dense** = semantic vectors (strength: synonyms and paraphrases).
5. It must process **each query-document pair together** at query time, which is too slow for millions of docs. Bi-encoders pre-compute the doc vectors.
6. For 80% of the test questions, a relevant chunk appeared in the top-5 results.
7. $1 / 4 = 0.25$.
8. Naive $\rightarrow$ Advanced $\rightarrow$ Modular $\rightarrow$ Agentic.
9. **LLM generation.**
10. Each added component adds cost, latency, and complexity. Measuring shows **where** the real bottleneck is (retrieval vs generation).
</details>

---

## 12. 📚 Resources

### Papers
* *Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks* (Lewis et al., 2020): https://arxiv.org/abs/2005.11401
* *Dense Passage Retrieval for Open-Domain QA* (Karpukhin et al., 2020): https://arxiv.org/abs/2004.04906
* *Retrieval-Augmented Generation for Large Language Models: A Survey* (Gao et al., 2023), covers Naive/Advanced/Modular RAG: https://arxiv.org/abs/2312.10997
* *Modular RAG: Transforming RAG Systems into LEGO-like Reconfigurable Frameworks* (Gao et al., 2024): https://arxiv.org/abs/2407.21059

### Docs and guides
* LangChain: RAG tutorial: https://python.langchain.com/docs/tutorials/rag/
* LlamaIndex: High-level concepts: https://docs.llamaindex.ai/en/stable/getting_started/concepts/
* Haystack: documentation: https://docs.haystack.deepset.ai/
* Pinecone: Learning Center (RAG, retrieval, reranking): https://www.pinecone.io/learn/
* scikit-learn: `TfidfVectorizer`: https://scikit-learn.org/stable/modules/generated/sklearn.feature_extraction.text.TfidfVectorizer.html

### Videos (search on YouTube)
* *"RAG from Scratch"* series by LangChain
* *"Building and Evaluating Advanced RAG"* by DeepLearning.AI (short course)

---

## 13. 💡 Key Takeaways

* RAG = **two pipelines**: **Indexing** (offline: load $\rightarrow$ chunk $\rightarrow$ embed $\rightarrow$ store) and **Query** (online: retrieve $\rightarrow$ augment $\rightarrow$ generate).
* The **retriever** decides *what the LLM sees*. **Retrieval quality puts a ceiling on answer quality.**
* **Sparse** retrieval catches exact words; **dense** retrieval catches meaning. **Hybrid** retrieval gets both.
* The **two-stage pattern** is a fast bi-encoder retrieving many candidates, then a cross-encoder re-ranking them down to a few.
* The **generator** must answer **only from context**, **cite** its sources, and **refuse** when unsure. Plan your **token budget**.
* RAG has evolved from **Naive $\rightarrow$ Advanced $\rightarrow$ Modular $\rightarrow$ Agentic**.
* Build **modular**, **measure early** (Recall@K, MRR), and **iterate**.

---

## ⏭️ Next: Day 4: Text Embeddings (Concepts and Models)
You'll replace the TF-IDF embedder with **real neural embeddings** and see the "missed" queries from Lab 4 get fixed.