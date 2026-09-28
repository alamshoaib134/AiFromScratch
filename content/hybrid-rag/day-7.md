---
title: "Basic RAG Pipeline"
day: 7
concept: "Assembling the pieces with LangChain and LlamaIndex"
chapter: 1
chapterTitle: "Foundations"
---

# Day 7: Build a Basic RAG Pipeline (LangChain and LlamaIndex)

> **30-Day RAG Course, Week 1: Foundations (Week Finale 🎉)**
> **Date:** Oct 5, 2026 | **Estimated time:** 4 hours
> **Prerequisites:** [Day 3](./day03_rag_architecture.md) (from-scratch pipeline), [Day 4](./day04_text_embeddings.md) (embeddings), [Day 6](./day06_vector_databases.md) (vector stores)

---

## 📌 Cheat Sheet (1-Minute Revision)

| Concept | Remember this |
|---|---|
| **Why a framework?** | Ready-made **loaders, splitters, embedders, vector stores, retrievers, prompts, LLM wrappers**, all swappable behind common interfaces. |
| **LangChain** | A general **LLM app toolkit**. Build pipelines by composing **Runnables** with `\|` (LCEL). |
| **LlamaIndex** | A **data/RAG-first** framework: `Documents -> Nodes -> Index -> QueryEngine`, with sensible defaults. |
| **LangChain RAG in 4 lines** | `splitter.split_documents()` -> `Chroma.from_documents()` -> `.as_retriever()` -> `{context, question} \| prompt \| llm \| parser`. |
| **LlamaIndex RAG in 3 lines** | `VectorStoreIndex.from_documents(docs)` -> `.as_query_engine()` -> `.query("...")`. |
| **Sources** | LangChain: return retrieved docs alongside the answer (`RunnableParallel`). LlamaIndex: `response.source_nodes`. |
| **Retriever options** | `similarity`, `mmr` (diversity), `similarity_score_threshold`, plus **metadata filters**. |
| **Watch out** | Hidden defaults (LlamaIndex defaults to OpenAI; Chroma defaults to L2), **chunk size in characters vs tokens**, fast-changing imports. |
| **Golden rule** | Frameworks change **how much code you write**, not **how RAG works**. Evaluate exactly as before. |

---

## 🎯 Learning Objectives

By the end of today, you should be able to:

1. Map every component of your **from-scratch pipeline** (Day 3) to its **LangChain** and **LlamaIndex** equivalent.
2. Build a complete RAG pipeline in **LangChain** using **LCEL** (load -> split -> embed -> store -> retrieve -> prompt -> LLM -> parse).
3. Return **answers with sources**, and use **streaming** and **batch** calls.
4. Use retriever variants: **similarity, MMR, score threshold, metadata filters**.
5. Build the same pipeline in **LlamaIndex** (Documents, Nodes, `VectorStoreIndex`, query engine, custom prompt, persistence).
6. **Evaluate** framework pipelines with the same Recall@K/MRR harness you built on Day 3.
7. Choose between **LangChain, LlamaIndex, and from-scratch** for a project.
8. Ship a **Week-1 mini capstone**: a command-line bank assistant.

---

## 📅 Suggested Schedule

| Time | Activity |
|---|---|
| 0:00 - 0:30 | Section 1-2: Why frameworks; concept mapping |
| 0:30 - 1:00 | Section 3-4: LangChain and LlamaIndex essentials |
| 1:00 - 1:20 | Section 5-7: Splitters, choosing a framework, pitfalls |
| 1:20 - 3:20 | Section 8: Hands-on labs (LangChain, LlamaIndex, evaluation) |
| 3:20 - 4:00 | Lab 6: Week-1 mini capstone + quiz |

---

## 1. Why Use a Framework?

> 💡 **Intuition:** On Day 3 you built RAG like a **carpenter**: you cut every board yourself (chunker, embedder, store, retriever, prompt builder, generator). That's the best way to *understand* furniture, but slow when you need a whole office. Frameworks are **flat-pack furniture kits**: pre-cut, standardized parts that snap together. Need to load a PDF, a web page, or a Confluence space? There's a loader. Want to swap Chroma for pgvector, or OpenAI for a local Llama? Change one line. The catch: kits come with **hidden assumptions** (default settings, default prompts), and when something wobbles you need to know which part is which. Because you built it by hand first, you can now use the kit **without being fooled by it**.

| Benefit | Example |
|---|---|
| **Integrations** | 100s of loaders (PDF, HTML, Notion, SharePoint, S3, SQL), vector stores, LLMs, embedders |
| **Standard interfaces** | Swap `Chroma` -> `PGVector` or `ChatOpenAI` -> `ChatOllama` without rewriting the pipeline |
| **Composability** | Chain steps, add re-rankers, routers, memory, and agents later (Weeks 3-4) |
| **Production features** | Streaming, batching, async, retries, callbacks, tracing (LangSmith, Arize, Langfuse) |
| **Community recipes** | Advanced RAG patterns are often available as ready components |

| Cost | Mitigation |
|---|---|
| **Abstraction hides details** | Inspect retrieved chunks and final prompts (you'll do this in every lab) |
| **Fast-moving APIs** | Pin versions in `requirements.txt`; prefer official docs over old blog posts |
| **Hidden defaults** | Set chunk size, metric, model, and prompt **explicitly** |
| **Dependency weight** | Install only the integration packages you need |

---

## 2. Concept Mapping: From Scratch -> LangChain -> LlamaIndex

> 💡 **Intuition:** Every RAG framework is the **same pipeline with different names**. Learn the mapping once and you can read any framework's docs, or switch frameworks, without starting from zero.

| Pipeline step | Day 3 (from scratch) | LangChain | LlamaIndex |
|---|---|---|---|
| Unit of text | `Document`, `Chunk` | `Document` (`page_content`, `metadata`) | `Document` -> `Node` / `TextNode` |
| Loading | Python list | Plain Python -> `Document`, or standalone loader/parser packages (the `langchain_community` loaders are legacy) | `SimpleDirectoryReader`, LlamaHub readers |
| Chunking | `WordChunker` | `RecursiveCharacterTextSplitter` | `SentenceSplitter` (node parser) |
| Embedding | `TfidfEmbedder` / `SentenceTransformerEmbedder` | `HuggingFaceEmbeddings`, `OpenAIEmbeddings` | `HuggingFaceEmbedding`, `OpenAIEmbedding` |
| Vector store | `InMemoryVectorStore` / FAISS / Chroma adapters | `Chroma`, `FAISS`, `PGVector`, `PineconeVectorStore`... | `SimpleVectorStore` (default), `ChromaVectorStore`... |
| Retriever | `Retriever.retrieve()` | `vectorstore.as_retriever()` | `index.as_retriever()` |
| Prompt | `PromptBuilder` | `ChatPromptTemplate` | `PromptTemplate` (`text_qa_template`) |
| Generator | `OpenAIGenerator` / `EchoGenerator` | `ChatOpenAI`, `ChatOllama`... | `OpenAI`, `Ollama`... (`Settings.llm`) |
| Pipeline | `RAGPipeline.query()` | LCEL chain: `retriever \| prompt \| llm \| parser` | `QueryEngine.query()` |
| Sources | `result["sources"]` | Return docs via `RunnableParallel` | `response.source_nodes` |

---

## 3. LangChain Essentials

> 💡 **Intuition:** LangChain's central idea is the **Runnable**: any component (prompt, model, retriever, parser, or plain Python function) that takes an input and returns an output, with the same methods everywhere: `.invoke()`, `.stream()`, `.batch()`. The pipe operator `\|` connects Runnables like **Unix pipes** or **LEGO studs**: the output of one becomes the input of the next. This is called **LCEL (LangChain Expression Language)**. Once you see a RAG chain as "a dict of inputs -> prompt -> model -> parser", the whole framework becomes readable.

### 3.1 Package layout (as of LangChain 1.x)

| Package | Contains |
|---|---|
| `langchain-core` | Base abstractions: `Document`, prompts, Runnables/LCEL, output parsers, retriever interface |
| `langchain-text-splitters` | Text splitters |
| `langchain-community` | ⚠️ **Sunset (May 2026)**: legacy community integrations (incl. many document loaders). Still installs, but no new features. Prefer standalone packages or plain Python |
| `langchain-openai`, `langchain-huggingface`, `langchain-chroma`, `langchain-ollama`, ... | Official **partner** integrations |
| `langchain` | High-level APIs (for example, agents via `create_agent`, `init_chat_model`) |
| `langchain-classic` | **Legacy** chains (for example, `RetrievalQA`, `create_retrieval_chain`) moved here in 1.0 |

> ⚠️ Many online tutorials use `RetrievalQA` or `from langchain.chains import ...`. Those are **legacy**. Today we build with **LCEL**, which is stable, transparent, and version-proof.

### 3.2 The core RAG chain (LCEL)

```text
                  ┌─── RunnableParallel (a dict) ──────────┐
question ────────►│ "context": retriever | format_docs ────┼─► "...[LOANS#c0] Home..."
                  │ "question": RunnablePassthrough() ─────┼─► "What is the rate?"
                  └────────────────────────────────────────┘
                                      │
                                      ▼
                             ChatPromptTemplate
                                      │
                                      ▼
                              Chat model (LLM)
                                      │
                                      ▼
                              StrOutputParser ──► "The rate is 7.9% [LOANS#c0]."
```

### 3.3 Runnable methods you'll use

| Method | Use |
|---|---|
| `.invoke(x)` | Run once |
| `.stream(x)` | Yield output tokens as they're generated (great UX) |
| `.batch([x1, x2])` | Run many inputs (in parallel where possible) |
| `.ainvoke / .astream / .abatch` | Async versions for web servers |

---

## 4. LlamaIndex Essentials

> 💡 **Intuition:** Where LangChain hands you a toolbox, LlamaIndex hands you a **ready-to-drive RAG car** with the seat already adjusted. Its mental model is data-first: you give it **Documents**, it parses them into **Nodes** (chunks with relationships and metadata), builds an **Index** over them, and gives you a **Query Engine** that retrieves and synthesizes answers in one call. The defaults are good enough to demo in three lines, and every part can be swapped when you need control. The main trap is that those defaults are **invisible**: unless you set them, LlamaIndex uses OpenAI for both embeddings and the LLM, and its own built-in prompt.

| Concept | What it is |
|---|---|
| **Document** | A source unit (file, page, record) with text + metadata |
| **Node** | A chunk of a Document (plus metadata and relationships to neighbors/parent) |
| **Node parser** | Splits Documents -> Nodes (for example, `SentenceSplitter`) |
| **Settings** | Global defaults: `llm`, `embed_model`, `node_parser`, `chunk_size` |
| **Index** | Data structure for retrieval. `VectorStoreIndex` is the standard for RAG |
| **Retriever** | Returns `NodeWithScore` objects for a query |
| **Response synthesizer** | Turns retrieved nodes + query into an answer (modes: `compact`, `refine`, `tree_summarize`...) |
| **Query engine** | Retriever + synthesizer in one: `index.as_query_engine()` |
| **Chat engine** | Query engine + conversation memory (Day 20) |
| **StorageContext** | Where the docstore/index/vector store are persisted |

---

## 5. Text Splitters: A First Look (Deep Dive on Day 9)

> 💡 **Intuition:** A good splitter cuts text the way a careful editor would: **between paragraphs first, then between lines, then between words**, and only chops mid-word as a last resort. That's exactly what `RecursiveCharacterTextSplitter` does: it tries a list of separators in order (`"\n\n"`, `"\n"`, `" "`, `""`) and only falls back to the next one when a piece is still too big. The overlap is a **safety margin**: a sentence that straddles a boundary appears in both chunks, so it isn't lost.

| Splitter | Unit of `chunk_size` | Notes |
|---|---|---|
| LangChain `RecursiveCharacterTextSplitter` | **Characters** (default) | `.from_tiktoken_encoder(...)` to measure in **tokens** |
| LangChain `TokenTextSplitter` | Tokens | Simple token windows |
| LlamaIndex `SentenceSplitter` | **Tokens** | Prefers sentence boundaries |

> ⚠️ `chunk_size=500` means **500 characters (~125 tokens)** in LangChain's default splitter but **500 tokens** in LlamaIndex's. Same number, **4x different chunk**!

---

## 6. LangChain vs LlamaIndex vs From Scratch

> 💡 **Intuition:** It's not a religious choice. Many teams use **LlamaIndex for ingestion/indexing** and **LangChain/LangGraph for orchestration and agents**, or neither in the hot path. Pick the tool that makes *your* system simplest to understand, test, and operate.

| Criterion | From scratch | LangChain | LlamaIndex |
|---|---|---|---|
| Learning value | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| Lines of code for basic RAG | ~150 | ~30 | ~10 |
| Integrations | DIY | ⭐⭐⭐⭐⭐ Huge | ⭐⭐⭐⭐⭐ Huge (LlamaHub) |
| Advanced retrieval built in | DIY | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ (many retrievers, node postprocessors) |
| Agents / complex workflows | DIY | ⭐⭐⭐⭐⭐ (LangGraph) | ⭐⭐⭐ (Workflows, agents) |
| Transparency / control | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ (LCEL is explicit) | ⭐⭐⭐ by default, ⭐⭐⭐⭐ when configured |
| API stability | You decide | Fast-moving | Fast-moving |
| Best for | Learning, tiny/latency-critical services | General LLM apps, agents, custom chains | Document-heavy RAG, quick high-quality baselines |

---

## 7. ⚠️ Framework Pitfalls

| Pitfall | Symptom | Fix |
|---|---|---|
| **Hidden default models** | LlamaIndex errors about `OPENAI_API_KEY`, or silently calls OpenAI | Set `Settings.llm` and `Settings.embed_model` explicitly |
| **Characters vs tokens** | Chunks far smaller or larger than expected | Check the splitter's unit; use a token-based splitter when it matters |
| **Metadata inflates chunks (LlamaIndex)** | "Metadata length is close to chunk size" warnings; tiny effective chunks | Concise metadata; `excluded_embed_metadata_keys` / `excluded_llm_metadata_keys` |
| **Deprecated packages** | `langchain-community` deprecation warning | Use `langchain-core` + standalone integration packages, or plain Python |
| **Default distance metric** | Scores look odd; thresholds don't work | Set `collection_metadata={"hnsw:space": "cosine"}` for Chroma |
| **Outdated tutorials** | `ImportError` / deprecation warnings | Use current docs; LCEL instead of legacy chains |
| **Default prompts** | The model answers from its own knowledge instead of saying "I don't know" | Always provide **your own** grounded prompt |
| **Duplicate ingestion** | The same chunk retrieved 2-3x | Deterministic IDs; delete/recreate the collection in labs |
| **Not inspecting retrieval** | "The LLM is bad!" when retrieval failed | Print the retrieved chunks and scores **every time** while developing |

---

## 8. 🧪 Hands-On

### Setup

```bash
# LangChain stack
pip install langchain-core langchain-text-splitters langchain-chroma chromadb
pip install langchain-huggingface sentence-transformers          # free local embeddings
pip install langchain-openai                                     # optional: OpenAI LLM/embeddings

# LlamaIndex stack
pip install llama-index-core llama-index-embeddings-huggingface
pip install llama-index-llms-openai                              # optional
```

> 💡 **No API key?** Every lab runs in **mock mode**: a transparent "echo" LLM that shows the exact prompt it would send. Retrieval is fully real (local Hugging Face embeddings). Set `OPENAI_API_KEY` to get real answers.

### Lab 0: Sample data and provider switches

```python
import os
from pathlib import Path

DATA_DIR = Path("data_day7")
DATA_DIR.mkdir(exist_ok=True)

RAW_DOCS = {
    "loans_2026.txt": ("LOANS", "retail_lending", 2026,
        "ZyntraCorp Bank home loan interest rates start at 7.9% per annum for salaried customers "
        "and 8.3% for self-employed customers. The maximum tenure is 30 years.\n\n"
        "Processing fees are 0.5% of the loan amount, capped at 10,000 rupees."),
    "savings_2026.txt": ("SAVINGS", "retail_banking", 2026,
        "The Savings Plus account offers 4.25% annual interest, credited quarterly. "
        "There is no minimum balance requirement.\n\n"
        "Customers get free unlimited UPI transfers and a free debit card for the first year."),
    "cards_2026.txt": ("CARDS", "cards", 2026,
        "The Platinum credit card has an annual fee of 2,500 rupees, waived on annual spends above 3 lakh rupees.\n\n"
        "It offers 2% cashback on online purchases and airport lounge access four times per year."),
    "fd_2026.txt": ("FD", "retail_banking", 2026,
        "Fixed deposit rates are 7.1% for tenures of 1 to 2 years and 7.4% for senior citizens.\n\n"
        "Premature withdrawal attracts a penalty of 1% on the applicable rate."),
    "support_2026.txt": ("SUPPORT", "operations", 2026,
        "Customer support is available 24/7 via phone at 1800-000-000 and through in-app chat.\n\n"
        "Lost card reports are handled immediately through the mobile app."),
    "loans_2023.txt": ("LOANS-OLD", "retail_lending", 2023,
        "ZyntraCorp Bank home loan interest rates start at 8.6% per annum for all customers. "
        "This policy applied during 2023.")
}

for fname, (_, _, _, text) in RAW_DOCS.items():
    (DATA_DIR / fname).write_text(text, encoding="utf-8")

# Metadata we'll attach after loading (in real life: from a document registry or file properties)
FILE_META = {fname: {"doc_id": d, "department": dept, "year": yr} for fname, (d, dept, yr, _) in RAW_DOCS.items()}

USE_OPENAI = bool(os.getenv("OPENAI_API_KEY"))
EMBED_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

# Same evaluation set as Day 3
EVAL_SET = [
    ("home loan rate for salaried people", "LOANS"),
    ("processing fee on home loan", "LOANS"),
    ("savings account interest rate", "SAVINGS"),
    ("credit card annual fee waiver", "CARDS"),
    ("fixed deposit rate for senior citizens", "FD"),
    ("how do I report a lost card", "SUPPORT"),
    ("cost of borrowing to buy a house", "LOANS"),
    ("do I have to keep money parked in my account", "SAVINGS"),
    ("helpline number", "SUPPORT"),
    ("breaking my term deposit early", "FD")
]

print(f"Wrote {len(RAW_DOCS)} files to {DATA_DIR.resolve()}")
```

### Lab 1: LangChain, from loading to retrieval

```python
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma

# 1) LOAD (plain Python + business metadata; Day 8 covers PDF/HTML/DOCX parsing)
docs = [
    Document(page_content=p.read_text(encoding="utf-8"),
             metadata={"source": str(p), **FILE_META[p.name]})
    for p in sorted(DATA_DIR.glob("*.txt"))
]
print(f"Loaded {len(docs)} documents. Example metadata: {docs[0].metadata}")
```

> ℹ️ Older tutorials use `DirectoryLoader` / `TextLoader` from `langchain-community`. That package was **sunset in May 2026**: it still installs, but prints a deprecation warning and gets no new features. For plain text, plain Python is simplest; for PDFs, HTML, and DOCX, Day 8 covers dedicated parsers.

```python
# 2) SPLIT (chunk_size is in CHARACTERS here)
splitter = RecursiveCharacterTextSplitter(chunk_size=200, chunk_overlap=30, add_start_index=True)
chunks = splitter.split_documents(docs)

# Deterministic chunk IDs: doc_id#c{n}
counters = {}
for c in chunks:
    n = counters.get(c.metadata["doc_id"], 0)
    counters[c.metadata["doc_id"]] = n + 1
    c.metadata["chunk_id"] = f"{c.metadata['doc_id']}#c{n}"
print(f"Split into {len(chunks)} chunks:")
for c in chunks[:4]:
    print(f"  {c.metadata['chunk_id']:<14} {len(c.page_content):>3} chars | {c.page_content[:60]}...")

# 3) EMBED + STORE
embeddings = HuggingFaceEmbeddings(model_name=EMBED_MODEL, encode_kwargs={"normalize_embeddings": True})
vectorstore = Chroma(
    collection_name="bank_lc",
    embedding_function=embeddings,
    persist_directory="./chroma_day7",
    collection_metadata={"hnsw:space": "cosine"}
)
vectorstore.reset_collection()                         # lab only: start fresh each run
vectorstore.add_documents(chunks, ids=[c.metadata["chunk_id"] for c in chunks])

# 4) RETRIEVE (inspect before generating!)
for doc, score in vectorstore.similarity_search_with_relevance_scores("cost of borrowing to buy a house", k=3):
    print(f"  [{score:.3f}] {doc.metadata['chunk_id']:<14} {doc.page_content[:60]}...")
```

> 📝 **Observe:**
>
> * `RecursiveCharacterTextSplitter` first splits on blank lines (`"\n\n"`), then **merges small neighboring pieces back together** up to `chunk_size`. Short paragraphs can share a chunk (for example, both FD paragraphs fit in 200 characters), while longer ones stand alone. It is not "one paragraph = one chunk".
> * The metadata you attached (`doc_id`, `year`, `chunk_id`) travels with every chunk into the vector store.
> * **Always look at the retrieved chunks** before blaming the LLM.

---

### Lab 2: LangChain RAG chain with LCEL (answers, sources, streaming, batch)

```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableLambda, RunnableParallel, RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

SYSTEM = """You are ZyntraCorp Bank's assistant.
Answer ONLY using the CONTEXT. If the answer is not in the CONTEXT, reply exactly:
"I don't know based on the provided documents."
Cite chunk IDs in square brackets, e.g., [LOANS#c0]. Be concise."""

prompt = ChatPromptTemplate.from_messages([
    ("system", SYSTEM),
    ("human", "CONTEXT:\n\"\"\"\n{context}\n\"\"\"\n\nQUESTION: {question}"),
])

def format_docs(docs) -> str:
    return "\n\n".join(f"[{d.metadata['chunk_id']}] {d.page_content}" for d in docs)

# LLM: real if an API key is set, otherwise a transparent echo "LLM"
if USE_OPENAI:
    from langchain_openai import ChatOpenAI
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
else:
    llm = RunnableLambda(lambda prompt_value: "[MOCK LLM] Would answer from:\n"
                         + prompt_value.to_messages()[-1].content[:400])

retriever = vectorstore.as_retriever(search_kwargs={"k": 3, "filter": {"year": 2026}})

# (a) Simple chain: question -> answer
rag_chain = (
    {"context": retriever | RunnableLambda(format_docs), "question": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)
print(rag_chain.invoke("What is the home loan rate for salaried customers?"))

# (b) Chain that ALSO returns the sources (needed for citations and audit)
answer_step = RunnableLambda(lambda x: {"context": format_docs(x["docs"]), "question": x["question"]}) \
    | prompt | llm | StrOutputParser()
rag_with_sources = RunnableParallel(docs=retriever, question=RunnablePassthrough()).assign(answer=answer_step)

out = rag_with_sources.invoke("Is there a minimum balance on the savings account?")
print("\nANSWER :", out["answer"][:300])
print("SOURCES:", [d.metadata["chunk_id"] for d in out["docs"]])

# (c) Streaming: tokens appear as they're generated (real LLMs stream token by token)
print("\nSTREAM :", end=" ")
for piece in rag_chain.stream("What is the FD rate for senior citizens?"):
    print(piece, end="", flush=True)
print()

# (d) Batch: several questions at once
answers = rag_chain.batch(["What is the Platinum card fee?", "What is ZyntraCorp's share price?"])
for a in answers:
    print("\nBATCH  :", a[:200])
```

> 📝 **Observe:**
>
> * The chain is just **data flowing through pipes**. Print `prompt.invoke({...})` to see the exact messages the LLM receives.
> * With a real LLM, the share-price question should get *"I don't know based on the provided documents."*
> * Version (b) is the one you'll use in production: **the answer and its evidence travel together**.

---

### Lab 3: Retriever variants (similarity, MMR, threshold, filters)

```python
q = "Tell me about home loans"
variants = {
    "similarity k=3": vectorstore.as_retriever(search_kwargs={"k": 3}),
    "similarity + year=2026": vectorstore.as_retriever(search_kwargs={"k": 3, "filter": {"year": 2026}}),
    "mmr (diverse)": vectorstore.as_retriever(search_type="mmr",
                                              search_kwargs={"k": 3, "fetch_k": 8,
                                                             "lambda_mult": 0.5}),
    "score threshold 0.3": vectorstore.as_retriever(
        search_type="similarity_score_threshold",
        search_kwargs={"score_threshold": 0.3, "k": 5}),
    "AND filter": vectorstore.as_retriever(search_kwargs={
        "k": 3, "filter": {"$and": [{"year": 2026}, {"department": "retail_lending"}]}}),
}
for name, r in variants.items():
    print(f"{name:<24} -> {[d.metadata['chunk_id'] for d in r.invoke(q)]}")
```

> 📝 **Observe:**
>
> * The plain similarity search may include the **2023** policy. The year filter removes it.
> * **MMR** trades a little relevance for **variety** (Day 5).
> * A **score threshold** can return **fewer than k** results (or none), which is useful for "I don't know" detection, but it must be **tuned per embedding model** (Day 5).

---

### Lab 4: The same pipeline in LlamaIndex

```python
from llama_index.core import (Document, PromptTemplate, Settings, StorageContext,
                              VectorStoreIndex, load_index_from_storage)
from llama_index.core.node_parser import SentenceSplitter
from llama_index.core.vector_stores import ExactMatchFilter, MetadataFilters
from llama_index.embeddings.huggingface import HuggingFaceEmbedding

# 1) Global settings: be EXPLICIT (otherwise LlamaIndex defaults to OpenAI for both!)
Settings.embed_model = HuggingFaceEmbedding(model_name=EMBED_MODEL)
Settings.node_parser = SentenceSplitter(chunk_size=80, chunk_overlap=10)   # TOKENS, not characters
if USE_OPENAI:
    from llama_index.llms.openai import OpenAI
    Settings.llm = OpenAI(model="gpt-4o-mini", temperature=0)
else:
    from llama_index.core.llms import MockLLM
    Settings.llm = MockLLM(max_tokens=40)                                  # placeholder text generator

# 2) Documents with metadata
li_docs = [
    Document(text=text, metadata={"doc_id": d, "department": dept, "year": yr, "file": fname},
             id_=d)
    for fname, (d, dept, yr, text) in RAW_DOCS.items()
]

# 3) Index (parse -> nodes -> embed -> store)
index = VectorStoreIndex.from_documents(li_docs)
print("Nodes indexed:", len(index.docstore.docs))

# 4) Our own grounded prompt (never rely on the default for RAG)
qa_prompt = PromptTemplate(
    "You are ZyntraCorp Bank's assistant. Answer ONLY using the context below.\n"
    "If the answer is not in the context, reply exactly: \"I don\'t know based on the provided documents.\"\n"
    "---------------------\n{context_str}\n---------------------\n"
    "Question: {query_str}\nAnswer: "
)

query_engine = index.as_query_engine(
    similarity_top_k=3,
    filters=MetadataFilters(filters=[ExactMatchFilter(key="year", value=2026)]),
    text_qa_template=qa_prompt,
)
response = query_engine.query("What is the home loan rate for salaried customers?")
print("ANSWER:", str(response)[:200])
for sn in response.source_nodes:
    print(f"  [{sn.score:.3f} {sn.node.metadata['doc_id']:<10} {sn.node.get_content()[:60]}...]")

# 5) Retriever only (no LLM), which is useful for evaluation
li_retriever = index.as_retriever(similarity_top_k=3)
print([n.node.metadata["doc_id"] for n in li_retriever.retrieve("cost of borrowing to buy a house")])

# 6) Persist and reload (no re-embedding needed next time)
index.storage_context.persist(persist_dir="./storage_day7")
reloaded = load_index_from_storage(StorageContext.from_defaults(persist_dir="./storage_day7"))
print("Reloaded nodes:", len(reloaded.docstore.docs))
```

> 📝 **Observe:**
>
> * Three lines (`from_documents` -> `as_query_engine` -> `query`) do what Day 3's whole pipeline did.
> * `response.source_nodes` gives you the **evidence and scores**, so print them every time.
> * With `MockLLM`, the "answer" is placeholder text ("text text text..."); the **retrieval and sources are real**.
> * **Metadata counts toward chunk size in LlamaIndex**: by default, metadata is prepended to the node text for embedding and for the LLM. Try `chunk_size=64` and you'll see *"Metadata length is close to chunk size"* warnings. Keep metadata concise, or exclude keys with `excluded_embed_metadata_keys` / `excluded_llm_metadata_keys` on the `Document`.

---

### Lab 5: Evaluate all three pipelines with the same harness

```python
def recall_mrr(retrieve_doc_ids, eval_set, k=3):
    """retrieve_doc_ids(question) -> ordered list of doc_ids (length <= k)."""
    hits, rr = 0, 0.0
    for question, relevant in eval_set:
        ids = retrieve_doc_ids(question)[:k]
        if relevant in ids:
            hits += 1
            rr += 1 / (ids.index(relevant) + 1)
    n = len(eval_set)
    return {"recall@k": round(hits / n, 2), "mrr": round(rr / n, 2)}

lc_ret = vectorstore.as_retriever(search_kwargs={"k": 3, "filter": {"year": 2026}})
li_ret = index.as_retriever(similarity_top_k=3,
                            filters=MetadataFilters(filters=[ExactMatchFilter(key="year",
                            value=2026)]))

print("LangChain :", recall_mrr(lambda q: [d.metadata["doc_id"] for d in lc_ret.invoke(q)], EVAL_SET))
print("LlamaIndex:", recall_mrr(lambda q: [n.node.metadata["doc_id"] for n in li_ret.retrieve(q)], EVAL_SET))

# From scratch (Day 3 + Day 4 classes), if they're loaded in this session:
# rag = RAGPipeline(WordChunker(25, 5), SentenceTransformerEmbedder(), InMemoryVectorStore(),
#                   EchoGenerator(), k=3, min_score=0.0)
# rag.index(DOCS)
# print("Scratch   :", recall_mrr(lambda q: [c.doc_id for c, _ in rag.retriever.retrieve(q, k=3, filters={"year": 2026})], EVAL_SET))
```

> 📝 **Observe:** With the **same embedding model**, all three pipelines should land in the **same ballpark**. Small differences come from **chunking** (characters vs tokens vs words, and different boundaries), not from the framework. **Frameworks don't make retrieval better; your choices do.**

---

### Lab 6: 🪓 Week-1 Mini Capstone: *ZyntraCorp Bank Assistant* (CLI)

Build `bank_assistant.py` using **either** framework. Requirements checklist:

* [ ] Loads all `.txt` files from a folder and attaches metadata (`doc_id`, `department`, `year`)
* [ ] Deterministic chunk IDs; the collection is rebuilt cleanly on `--reindex`
* [ ] Cosine metric; `year = current` filter by default
* [ ] Grounded prompt with an **"I don't know"** rule and **`[chunk_id]`** citations
* [ ] Prints **answer + sources + top score** for each question
* [ ] Refuses (without calling the LLM) if the top retrieval score is below a tuned threshold
* [ ] `--eval` flag prints Recall@3 and MRR on `EVAL_SET`
* [ ] Works in mock mode without an API key

**Starter skeleton (LangChain):**

```python
import argparse

REFUSAL = "I don't know based on the provided documents."
MIN_SCORE = 0.30  # tune on answerable vs unanswerable questions (Day 5)

def answer(question: str) -> dict:
    hits = vectorstore.similarity_search_with_relevance_scores(question, k=3, filter={"year": 2026})
    if not hits or hits[0][1] < MIN_SCORE:
        return {"answer": REFUSAL, "sources": [], "top_score": hits[0][1] if hits else None}
    docs = [d for d, _ in hits]
    text = (prompt | llm | StrOutputParser()).invoke({"context": format_docs(docs), "question": question})
    return {"answer": text, "sources": [d.metadata["chunk_id"] for d in docs], "top_score": round(hits[0][1], 3)}

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--eval", action="store_true")
    args = ap.parse_args()
    if args.eval:
        print(recall_mrr(lambda q: [d.metadata["doc_id"] for d in lc_ret.invoke(q)], EVAL_SET))
    else:
        while (q := input("\nAsk (or 'exit'): ").strip().lower()) != "exit":
            r = answer(q)
            print(f"\n{r['answer']}\nSources: {r['sources']} | top score: {r['top_score']}")
```

> 🎯 **Stretch goals:** add a `--mmr` flag; log every question, retrieved IDs, and scores to a CSV (your first **observability** step, Day 29); add 10 of your own questions to `EVAL_SET`.

---

## ❓ Common Confusions

| ❌ Misconception | ✅ Reality |
|---|---|
| "LangChain/LlamaIndex make retrieval more accurate." | They make it **faster to build**. Accuracy comes from embeddings, chunking, filters, re-ranking, and prompts. |
| "`RetrievalQA` is how you build RAG in LangChain." | That's a **legacy** chain (now in `langchain-classic`). Use **LCEL** (or LangGraph for complex flows). |
| "`chunk_size=500` means the same thing everywhere." | LangChain's default splitter counts **characters**; LlamaIndex's `SentenceSplitter` counts **tokens**. |
| "LlamaIndex runs locally by default." | By default it uses **OpenAI** for embeddings and the LLM. Set `Settings` explicitly. |
| "The framework's default prompt is fine for RAG." | Defaults may not enforce "answer only from context" or citations. **Write your own.** |
| "If I use a framework, I don't need to understand the internals." | When results are wrong, you debug **retrieval, chunks, and prompts**, which are exactly what you built on Days 3-6. |
| "I must choose one framework forever." | Components are swappable, and many teams mix LlamaIndex (ingestion) with LangChain/LangGraph (orchestration). |

---

## 🏋️ 9. 🏋️ Exercises

1. **Inspect the prompt:** In Lab 2, print `prompt.invoke({"context": ..., "question": ...}).to_messages()` for one question. Identify the system rules, context block, and question.
2. **Token-based splitting:** Replace the splitter with `RecursiveCharacterTextSplitter.from_tiktoken_encoder(chunk_size=50, chunk_overlap=10)`. How do the chunk count and Recall@3 change?
3. **Swap the vector store:** Replace `Chroma` with LangChain's built-in `InMemoryVectorStore` (`from langchain_core.vectorstores import InMemoryVectorStore`; `InMemoryVectorStore.from_documents(chunks, embeddings)`). Does the rest of the chain need to change? How does filtering differ (hint: it takes a Python function)?
4. **Swap the LLM:** Run with a local model via `langchain-ollama` (`ChatOllama(model="llama3.2", temperature=0)`). Compare answer quality and latency with `gpt-4o-mini`.
5. **LlamaIndex response modes:** Try `index.as_query_engine(response_mode="refine")` and `"tree_summarize"` with a real LLM. When would each be useful?
6. **Framework diff:** Write a 10-line comparison of your experience with from-scratch vs LangChain vs LlamaIndex (lines of code, debuggability, flexibility).
7. **Capstone:** Complete Lab 6 and all its checklist items.

---

## 10. 📝 Quiz (Self-Check)

1. What is a **Runnable** in LangChain, and which three methods do all Runnables share?
2. In the LCEL chain `{"context": retriever | format_docs, "question": RunnablePassthrough()} | prompt | llm | StrOutputParser()`, what does `RunnablePassthrough()` do?
3. How do you return **sources along with the answer** in LCEL?
4. What is the difference between a LlamaIndex **Document** and a **Node**?
5. What will LlamaIndex use for embeddings if you don't set `Settings.embed_model`?
6. `RecursiveCharacterTextSplitter(chunk_size=400)` produces chunks of roughly how many tokens?
7. Name three retriever `search_type`s in LangChain vector stores.
8. Why might a `similarity_score_threshold` retriever return zero documents, and why can that be useful?
9. With the same embedding model, why can LangChain and LlamaIndex still give slightly different Recall@3?
10. Give two reasons you might **not** use a framework in production.

<details>
<summary>✅ Answers</summary>

1. A composable component with a standard interface. All Runnables share **`invoke`**, **`stream`**, **`batch`** (plus async variants).
2. It passes the **original input** (the question string) through unchanged into the `"question"` key.
3. Use `RunnableParallel(docs=retriever, question=RunnablePassthrough()).assign(answer=...)`, so the output dict contains both `docs` and `answer`.
4. A **Document** is a whole source unit. A **Node** is a **chunk** of it, with metadata and relationships.
5. **OpenAI embeddings** (a default that needs `OPENAI_API_KEY`).
6. **~100 tokens** ($400\text{ characters} \div 4\text{ characters/token}$).
7. `similarity`, `mmr`, `similarity_score_threshold`.
8. No chunk meets the minimum relevance score. It signals the question is probably **unanswerable**, so you can refuse without calling the LLM.
9. **Chunking differs** (characters vs tokens, different boundary rules), so the chunks, and therefore the vectors, differ.
10. Any two of: fewer dependencies and a smaller attack surface; stable APIs under your control; lower latency or overhead; full transparency; simpler debugging for small, fixed pipelines.

</details>

---

## 11. 📚 Resources

### LangChain

* LangChain docs home (tutorials, concepts, migration guides): https://docs.langchain.com/oss/python/
* Integrations and providers overview (standalone packages): https://docs.langchain.com/oss/python/integrations/providers/overview
* `langchain-community` sunset announcement (May 2026): https://github.com/langchain-ai/langchain-community/issues/674
* Topics to look up in the docs: **RAG tutorial**, **LCEL / Runnables**, **text splitters**, **retrievers**, **vector stores**

### LlamaIndex

* Starter tutorial: https://docs.llamaindex.ai/en/stable/getting_started/starter_example/
* High-level concepts: https://docs.llamaindex.ai/en/stable/getting_started/concepts/
* Customization FAQ ("how do I change the LLM/embedding/chunk size?"): https://docs.llamaindex.ai/en/stable/getting_started/customization/
* Metadata filters: https://docs.llamaindex.ai/en/stable/module_guides/indexing/vector_store_index/

### Courses and videos

* DeepLearning.AI: *LangChain: Chat with Your Data* (short course)
* DeepLearning.AI: *Building and Evaluating Advanced RAG* (LlamaIndex + TruLens)
* LangChain YouTube: *RAG From Scratch* series

---

## 12. 🔑 Key Takeaways

- Frameworks are **the same RAG pipeline with standard, swappable parts**. Map them to what you built on Day 3.
- **LangChain** = composable Runnables with `\|` (LCEL); great for custom chains, streaming, and later agents (LangGraph).
- **LlamaIndex** = data-first, great defaults (`Documents -> Nodes -> Index -> QueryEngine`); great for document-heavy RAG.
- **Set everything explicitly**: embedding model, LLM, chunk size (and its **unit**), distance metric, and **your own grounded prompt**.
- **Return sources with every answer**, and **inspect retrieval** before blaming the LLM.
- **Evaluate framework pipelines with the same harness.** The framework doesn't change relevance; your choices do.

---

## 🗺️ Week 1 Recap

| Day | You learned | You built |
|---|---|---|
| **1** | LLMs, tokens, context windows, prompting | First API call, token counter |
| **2** | Hallucination and why RAG helps | Keyword mini-RAG, self-consistency and LLM-judge checks |
| **3** | RAG architecture (indexing vs query pipelines) | Modular RAG from scratch + Recall@K/MRR |
| **4** | Embeddings | Neural embedder that fixes the paraphrase misses |
| **5** | Similarity metrics, normalization, MMR | Vectorized top-K search, MMR |
| **6** | Vector databases, filtering, updates | FAISS/Chroma stores, safe re-indexing, HNSW benchmark |
| **7** | Frameworks | LangChain + LlamaIndex pipelines, CLI assistant |

**Week 2 preview: data ingestion and retrieval quality.** Loaders for real PDFs/HTML/tables (Day 8), chunking strategies (Day 9), metadata (Day 10), ANN indexing (Day 11), BM25 (Day 12), hybrid search (Day 13), and re-ranking (Day 14).

---

## ⏩ Next: Day 8: Document Loaders (PDF, HTML, DOCX, Tables)