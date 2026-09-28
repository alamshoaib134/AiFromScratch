---
title: "Text Embeddings"
day: 4
concept: "Translating human meaning into mathematical coordinates"
chapter: 1
chapterTitle: "Foundations"
---

# Day 4: Text Embeddings (Concepts and Models)

> **30-Day RAG Course, Week 1: Foundations**  
> **Date:** Oct 2, 2026 | **Estimated time:** 3-4 hours  
> **Prerequisite:** [Day 3: RAG Architecture](./day03_rag_architecture.md) (we'll upgrade its TF-IDF embedder)

---

## 🎯 Learning Objectives

By the end of today, you should be able to:

1. Explain what an **embedding** is and why it captures **meaning**.
2. Trace the evolution: **one-hot → TF-IDF → Word2Vec → BERT → sentence embeddings → modern embedding models**.
3. Explain how sentence embedding models are **built** (pooling) and **trained** (contrastive learning).
4. Choose an embedding model using **dimensions, max tokens, language, cost, MTEB score, and your own data**.
5. Use **query/passage prefixes**, **normalization**, and **Matryoshka (shortened) embeddings** correctly.
6. Know the **weak spots** of embeddings (negation, numbers, exact IDs).
7. Replace TF-IDF with **neural embeddings** in the Day 3 pipeline and **fix the retrieval misses**.

---

## 📅 Suggested Schedule

| Time | Activity |
|---|---|
| 0:00 - 0:30 | Section 1-2: What embeddings are and how they evolved |
| 0:30 - 1:10 | Section 3-4: How models are built and trained; key properties |
| 1:10 - 1:50 | Section 5-7: Choosing a model, prefixes, Matryoshka, storage |
| 1:50 - 2:10 | Section 8: Pitfalls and weak spots |
| 2:10 - 3:30 | Section 9: Hands-on labs |
| 3:30 - 4:00 | Exercises and quiz |

---

## 1. What is an Embedding?

> An **embedding** is a list of numbers (a **vector**) that represents the **meaning** of a piece of text, so that **similar meanings end up close together** in vector space.

```
"How do I reset my password?"      -> [ 0.12, -0.45,  0.33, ...,  0.08]   (384 numbers)
"I forgot my login credentials"    -> [ 0.11, -0.41,  0.36, ...,  0.05]   <- close ✅
"Home loan interest rates"         -> [-0.52,  0.19, -0.07, ...,  0.61]   <- far ❌
```

### 🗺️ Analogy: GPS coordinates for meaning
- A city has 2 coordinates (latitude, longitude). Nearby cities have similar coordinates.
- A sentence has **hundreds of coordinates** (dimensions). Sentences with similar meanings have **nearby coordinates**.
- Each dimension isn't a human-readable concept. Meaning is **spread across all of them**.

### Why RAG needs embeddings
Day 3's TF-IDF retriever **missed** *"cost of borrowing to buy a house"* because it shares **no words** with *"home loan interest rates"*.  
Embeddings match on **meaning**, so these two texts land close together.

---

## 2. Evolution of Text Representations

| Era | Method | Idea | Captures meaning? | Context-aware? |
|---|---|---|---|---|
| Classic | **One-hot / Bag-of-Words** | 1 dimension per vocabulary word | ❌ | ❌ |
| Classic | **TF-IDF / BM25** | Weight words by rarity | ❌ (words only) | ❌ |
| 2013-14 | **Word2Vec, GloVe, FastText** | Learn a dense vector **per word** from co-occurrence | ✅ (words) | ❌ one vector per word |
| 2018 | **ELMo, BERT** | Vector per token **depends on the sentence** | ✅ | ✅ |
| 2019 | **Sentence-BERT (SBERT)** | Fine-tune BERT to produce **one vector per sentence** for similarity | ✅ | ✅ |
| 2022+ | **E5, BGE, GTE, Nomic, OpenAI, Cohere, Voyage...** | Large-scale **contrastive training** on billions of pairs; long inputs; multilingual | ✅ | ✅ |
| 2024+ | **LLM-based embedders** | Decoder LLMs (for example, Mistral/Qwen-based) turned into embedders | ✅ | ✅ |

### Static vs contextual: the "bank" problem

| Sentence | Word2Vec "bank" | BERT "bank" |
|---|---|---|
| "I deposited cash at the **bank**." | Same vector | 🏦 financial meaning |
| "We had a picnic on the river **bank**." | Same vector | 🏞️ riverside meaning |

> Static embeddings give **one vector per word**; contextual models give a **different vector depending on context**.

### Famous Word2Vec property: vector arithmetic
```
vector("king") - vector("man") + vector("woman") ≈ vector("queen")
```
This shows that relationships (gender, tense, country→capital) become **directions** in the vector space.

---

## 3. How Sentence Embedding Models Work

### 3.1 Architecture (bi-encoder, from Day 3)

```
"Home loan rates for salaried people"
         │
         ▼
    ┌──────────┐
    │Tokenizer │ ─► [CLS] home loan rates for salaried people [SEP]
    └──────────┘
         │
         ▼
┌──────────────────┐
│Transformer (BERT │ ─► one contextual vector per token
│  / RoBERTa / …)  │    h₁, h₂, …, hₙ  (each 384/768/1024-dim)
└──────────────────┘
         │
         ▼
    ┌──────────┐
    │ Pooling  │ ─► mean of token vectors  OR  the [CLS] vector
    └──────────┘
         │
         ▼
  ┌──────────────┐
  │ L2 Normalize │ ─► unit-length vector (length = 1)
  └──────────────┘
         │
         ▼
Sentence embedding [0.021, -0.113, …]
```

| Pooling | How | Used by |
|---|---|---|
| **Mean pooling** | Average of all token vectors | SBERT / MiniLM, E5, GTE |
| **CLS pooling** | Vector of the special `[CLS]` token | BGE |
| **Last-token pooling** | Vector of the final token | LLM-based embedders |

> You don't need to implement pooling yourself: `sentence-transformers` and the embedding APIs handle it. But you must know **why** the same model must be used for queries and documents.

### 3.2 How they're trained: contrastive learning

The model learns to **pull matching pairs together** and **push non-matching pairs apart**.

```
Anchor (query):   "How to reset my password?"
Positive:         "Steps to recover a forgotten login"      ◄─ pull closer ──►
Negatives:        "Home loan interest rates", "Credit card fees" ◄─ push away ──►
```

| Concept | Meaning |
|---|---|
| **Positive pairs** | (question, answer), (title, body), (query, clicked doc), paraphrases |
| **In-batch negatives** | Other examples in the same training batch act as negatives |
| **Hard negatives** | Similar-looking but **wrong** passages; they teach fine distinctions |
| **Loss (InfoNCE / MultipleNegativesRanking)** | Maximize the score of the positive relative to all the negatives |

> 🔑 **Why this matters for you:** a model is only as good as its **training pairs**. General web-trained models may struggle with **niche domain jargon** (for example, finance terms such as "CASA ratio", "NPA", "haircut"). Always **evaluate on your data**.

---

## 4. Key Properties of Embeddings

| Property | What to know |
|---|---|
| **Dimension** | Length of the vector (384, 768, 1024, 1536, 3072...). More dims = more capacity, but more storage and compute |
| **Max input tokens** | Text beyond this is **silently truncated** (512 for many BERT-based models; ~8K for OpenAI, Nomic, BGE-M3) |
| **Normalization** | Normalized (unit-length) vectors → **cosine similarity = dot product** (faster) |
| **Similarity scores are relative** | 0.75 may be "very similar" for one model and "unrelated" for another. **Don't reuse thresholds across models** |
| **Model-specific space** | Vectors from different models (or versions) **can't be compared** |
| **Deterministic** | The same model + text gives the same vector (cache them!) |

> Similarity metrics (cosine, dot product, Euclidean) are covered in depth on **Day 5**.

---

## 5. Choosing an Embedding Model

### 5.1 Popular models (approximate specs; always check the model card)

| Model | Type | Dims | Max tokens | Languages | Notes |
|---|---|---|---|---|---|
| `sentence-transformers/all-MiniLM-L6-v2` | Open | 384 | 256 | English | Tiny and fast; great for learning |
| `BAAI/bge-small-en-v1.5` | Open | 384 | 512 | English | Strong small model |
| `BAAI/bge-base-en-v1.5` | Open | 768 | 512 | English | Good balance |
| `BAAI/bge-large-en-v1.5` | Open | 1024 | 512 | English | Higher quality, slower |
| `BAAI/bge-m3` | Open | 1024 | 8192 | 100+ | Dense + sparse + multi-vector in one model |
| `intfloat/e5-base-v2` | Open | 768 | 512 | English | Needs `query:` / `passage:` prefixes |
| `intfloat/multilingual-e5-large` | Open | 1024 | 512 | 100+ | Multilingual (for example, Hindi + English) |
| `nomic-ai/nomic-embed-text-v1.5` | Open | 768 (Matryoshka) | 8192 | English | Long context; needs task prefixes |
| OpenAI `text-embedding-3-small` | API | 1536 (shortenable) | 8191 | Multilingual | Cheap, strong default |
| OpenAI `text-embedding-3-large` | API | 3072 (shortenable) | 8191 | Multilingual | Higher quality |
| Cohere `embed-english-v3.0` / `embed-multilingual-v3.0` | API | 1024 | 512 | EN / 100+ | Uses `input_type` (query vs document) |
| Voyage AI models | API | varies | long | varies | Includes domain models (for example, finance, code, law) |

### 5.2 Decision checklist

| Question | Guidance |
|---|---|
| **Data privacy?** | Regulated or sensitive data → **self-hosted open model** or a private cloud endpoint |
| **Languages?** | Mixed Hindi/English or other languages → a **multilingual** model (multilingual-E5, BGE-M3, Cohere multilingual) |
| **Document/chunk length?** | Chunks > 512 tokens → a long-context model, or smaller chunks |
| **Latency and scale?** | Millions of chunks or CPU-only → small models (384 dims) |
| **Budget?** | API cost per 1M tokens vs GPU hosting cost |
| **Domain?** | Heavy jargon → test domain models or **fine-tune** an embedder |
| **Quality?** | Check the **MTEB Retrieval** leaderboard, then **benchmark on your own Q&A set** |

### 5.3 MTEB: the Massive Text Embedding Benchmark
- A public leaderboard comparing embedding models across tasks: **Retrieval**, STS, Classification, Clustering, Reranking...
- For RAG, look at the **Retrieval** scores (usually nDCG@10).
- ⚠️ **Caveats:** leaderboard gains are often small; some models may be tuned toward benchmark data; **your data is the real test**.

> 💡 **Practical path:** Start with `bge-small-en-v1.5` (open) or `text-embedding-3-small` (API) → build an eval set → try 2-3 alternatives → pick the best quality/cost trade-off.

---

## 6. Asymmetric Search and Prefixes

### Symmetric vs asymmetric

| Type | Query vs document | Example |
|---|---|---|
| **Symmetric** | Similar length and style | Duplicate question detection |
| **Asymmetric** | **Short query** vs **long passage** | RAG: *"FD rate seniors?"* vs a policy paragraph |

RAG is **asymmetric**. Many models expect you to **mark** which text is a query and which is a document.

| Model family | Query prefix | Document prefix |
|---|---|---|
| **E5** | `"query: "` | `"passage: "` |
| **BGE v1.5 (English)** | `"Represent this sentence for searching relevant passages: "` (optional; helps short queries) | *(none)* |
| **Nomic** | `"search_query: "` | `"search_document: "` |
| **Cohere v3** | `input_type="search_query"` | `input_type="search_document"` |
| **OpenAI text-embedding-3** | *(none needed)* | *(none needed)* |

> ⚠️ Forgetting required prefixes can **noticeably lower retrieval quality**. Always read the model card.

---

## 7. Matryoshka Embeddings, Quantization and Storage

### 7.1 Matryoshka Representation Learning (MRL)
Some models are trained so that the **first N dimensions are a good embedding on their own** (like Russian nesting dolls 🪆).

```
Full:       [d1 d2 d3 ... d768]    <- best quality
Truncated:  [d1 d2 ... d256]       <- ~3x smaller, small quality drop
```

- OpenAI `text-embedding-3-*`: pass `dimensions=256` (or 512, 1024...).
- Nomic v1.5 and others: truncate, then **re-normalize**.
- Useful for **cheaper storage and faster search**, or a **coarse-to-fine** search strategy.

### 7.2 Quantization (preview for Days 11 and 28)

| Format | Bytes per dim | Size vs float32 | Quality |
|---|---|---|---|
| float32 | 4 | 1x | Baseline |
| float16 | 2 | ½ | ~Same |
| int8 | 1 | ¼ | Small drop |
| binary | 1/8 | 1/32 | Larger drop (often used with re-scoring) |

### 7.3 Storage math

```
Storage ≈ num_chunks × dimensions × bytes_per_dim

1,000,000 chunks × 1536 dims × 4 bytes ≈ ~6.1 GB    (OpenAI small, float32)
1,000,000 chunks ×  384 dims × 4 bytes ≈ ~1.5 GB    (MiniLM / bge-small)
1,000,000 chunks ×  384 dims × 1 byte  ≈ ~0.4 GB    (int8)
```

(Plus index overhead, metadata, and the chunk text itself.)

---

## 8. ⚠️ Pitfalls and Weak Spots

| Pitfall | Example | Mitigation |
|---|---|---|
| **Mixing models** | Docs embedded with model A, queries with model B | Store the model name/version with the index; re-embed everything on a model change |
| **Silent truncation** | A 2,000-token chunk into a 512-token model → the tail is ignored | Chunk to fit the model's max tokens (Day 9) |
| **Negation** | "Loan **approved**" ≈ "Loan **not approved**" (high similarity!) | Re-rankers (Day 14), LLM reasoning, hybrid search |
| **Numbers and exact values** | "7.9% rate" ≈ "8.6% rate" | Metadata filters, keyword/BM25 (Days 10, 12) |
| **IDs, codes, rare names** | "Form 26AS", "IFSC ZYNT0001234" | **Hybrid search** with BM25 (Day 13) |
| **Domain jargon** | "NPA", "CASA", "haircut" (finance meaning) | Domain models, fine-tuning, query expansion |
| **Language mismatch** | Hindi query vs English docs | Multilingual models |
| **Missing prefixes** | E5 without `query:` / `passage:` | Follow the model card |
| **Re-using thresholds** | `min_score=0.5` tuned on TF-IDF, used on BGE | Re-tune thresholds for each model |

---

## 9. 🧪 Hands-On

### Setup

```bash
pip install sentence-transformers numpy scikit-learn matplotlib
# Optional (API embeddings):
pip install openai
```

> The first run downloads the model (~90 MB for MiniLM, ~130 MB for bge-small) from Hugging Face.

---

### Lab 1: Your first embeddings and a similarity matrix

```python
import numpy as np
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

sentences = [
    "How do I reset my password?",
    "I forgot my login credentials.",
    "What is the home loan interest rate?",
    "How much does it cost to borrow money to buy a house?",
    "The weather is sunny today.",
]

emb = model.encode(sentences, normalize_embeddings=True)
print("Shape:", emb.shape)                         # (5, 384)
print("Vector length:", np.linalg.norm(emb[0]).round(3))  # 1.0 (normalized)

sim = emb @ emb.T                                  # cosine similarity (vectors are normalized)
np.set_printoptions(precision=2, suppress=True)
print(sim)
```

📝 **Observe:**
- The password pair (0,1) and the loan pair (2,3) score **high**, even though they share few words.
- "Weather" is **low** against everything.

---

### Lab 2: Contextual meaning (the "bank" test)

```python
texts = [
    "I deposited my salary at the bank.",
    "The financial institution approved my loan.",
    "We had a picnic on the river bank.",
    "The children played near the edge of the stream.",
]
e = model.encode(texts, normalize_embeddings=True)
labels = ["bank(money)", "institution", "bank(river)", "stream edge"]
for i in range(len(texts)):
    for j in range(i + 1, len(texts)):
        print(f"{labels[i]:>12} vs {labels[j]:<12}: {e[i] @ e[j]:.2f}")
```

📝 **Observe:** "bank (money)" is closer to "financial institution", and "river bank" is closer to "edge of the stream". The model understands **context**.

---

### Lab 3: Upgrade the Day 3 pipeline (TF-IDF → neural embeddings)

Add this class to your Day 3 `rag_from_scratch.py`. It has the **same interface** as `TfidfEmbedder`, so nothing else needs to change.

```python
from sentence_transformers import SentenceTransformer

class SentenceTransformerEmbedder:
    """Drop-in replacement for TfidfEmbedder (for models that need no prefixes, e.g., MiniLM)."""

    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        self.model = SentenceTransformer(model_name)

    def fit(self, texts):
        pass  # pre-trained, so there's nothing to fit (unlike TF-IDF)

    def embed(self, texts):
        return self.model.encode(texts, normalize_embeddings=True)
```

> 💡 Day 3's pipeline uses a single `embed()` for both documents and queries. That's fine for MiniLM, but models like E5/BGE/Nomic need **different prefixes** for queries and documents. The better design uses separate `embed_documents()` and `embed_query()` methods, which is exactly what LangChain does (Day 7):

```python
class PrefixAwareEmbedder:
    def __init__(self, model_name: str, query_prefix: str = "", doc_prefix: str = ""):
        self.model = SentenceTransformer(model_name)
        self.query_prefix, self.doc_prefix = query_prefix, doc_prefix

    def embed_documents(self, texts):
        return self.model.encode([self.doc_prefix + t for t in texts], normalize_embeddings=True)

    def embed_query(self, text):
        return self.model.encode(self.query_prefix + text, normalize_embeddings=True)
```

**Run the Day 3 evaluation with both embedders:**

```python
# Re-use DOCS, WordChunker, InMemoryVectorStore, EchoGenerator, RAGPipeline,
# EVAL_SET and evaluate_retrieval from Day 3.

for name, embedder, min_score in [
    ("TF-IDF", TfidfEmbedder(), 0.05),
    ("MiniLM", SentenceTransformerEmbedder("sentence-transformers/all-MiniLM-L6-v2"), 0.2),
]:
    rag = RAGPipeline(WordChunker(25, 5), embedder, InMemoryVectorStore(), EchoGenerator(),
                      k=3, min_score=min_score)
    rag.index(DOCS)
    print(f"\n=== {name} ===")
    print(evaluate_retrieval(rag.retriever, EVAL_SET, k=3, filters={"year": 2026}))
```

📝 **Observe:** (expected, since results vary slightly by model and library version):
- The paraphrased questions that TF-IDF **missed** (*"cost of borrowing to buy a house"*, *"helpline number"*) should now be **found**.
- Note that `min_score` must be **re-tuned**: neural similarity scores sit on a different scale than TF-IDF scores.

---

### Lab 4: Compare embedding models on your eval set

```python
from sentence_transformers import SentenceTransformer

MODELS = [
    # (model name, query prefix, doc prefix)
    ("sentence-transformers/all-MiniLM-L6-v2", "", ""),
    ("BAAI/bge-small-en-v1.5", "Represent this sentence for searching relevant passages: ", ""),
    ("intfloat/e5-small-v2", "query: ", "passage: "),
]

chunks = [c for d in DOCS if d.metadata["year"] == 2026 for c in WordChunker(25, 5).split(d)]
chunk_texts = [c.text for c in chunks]

def recall_mrr(model_name, qp, dp, k=3):
    m = SentenceTransformer(model_name)
    doc_vecs = m.encode([dp + t for t in chunk_texts], normalize_embeddings=True)
    hits, rr = 0, 0.0
    for question, relevant in EVAL_SET:
        q_vec = m.encode(qp + question, normalize_embeddings=True)
        top = np.argsort(-(doc_vecs @ q_vec))[:k]
        doc_ids = [chunks[i].doc_id for i in top]
        if relevant in doc_ids:
            hits += 1
            rr += 1 / (doc_ids.index(relevant) + 1)
    n = len(EVAL_SET)
    return round(hits / n, 2), round(rr / n, 2)

for name, qp, dp in MODELS:
    r, mrr = recall_mrr(name, qp, dp)
    print(f"{name:<45} Recall@3={r}  MRR={mrr}")
```

> ✏️ Also try `intfloat/e5-small-v2` **without** prefixes (`""`, `""`) and compare. How much do the prefixes matter?

> With only 10 questions, the differences between models may be small or noisy. Real benchmarking needs **50-200+ questions** (Day 25).

---

### Lab 5: Find the weak spots (negation, numbers, IDs)

```python
pairs = [
    ("Your loan has been approved.", "Your loan has not been approved."),        # negation
    ("The home loan rate is 7.9%.", "The home loan rate is 8.6%."),             # numbers
    ("IFSC code ZYNT0001234", "IFSC code ZYNT0009876"),                         # IDs
    ("Transfer money to my savings account", "Transfer money from my savings account"), # direction
    ("Your loan has been approved.", "Congratulations, the credit was sanctioned."),   # paraphrase
]
for a, b in pairs:
    va, vb = model.encode([a, b], normalize_embeddings=True)
    print(f"{va @ vb:.2f} | {a} <-> {b}")
```

📝 **Observe:** Pairs with **opposite or different facts** often score **very high**, sometimes higher than a real paraphrase!  
→ This is why production RAG adds **BM25/hybrid search (Day 13)**, **re-rankers (Day 14)**, and **metadata filters (Day 10)**.

---

### Lab 6: Visualize embeddings in 2D

```python
import matplotlib.pyplot as plt
from sklearn.decomposition import PCA

texts = [
    # Loans
    "home loan interest rate", "mortgage EMI calculation", "cost of borrowing for a house",
    # Cards
    "credit card annual fee", "cashback on credit card", "lost my debit card",
    # Deposits
    "fixed deposit rates", "term deposit for senior citizens", "savings account interest",
    # Unrelated
    "football world cup", "best pizza in town", "weather forecast tomorrow",
]
groups = ["loans"] * 3 + ["cards"] * 3 + ["deposits"] * 3 + ["other"] * 3
colors = {"loans": "tab:blue", "cards": "tab:orange", "deposits": "tab:green", "other": "tab:gray"}

vecs = model.encode(texts, normalize_embeddings=True)
xy = PCA(n_components=2).fit_transform(vecs)

plt.figure(figsize=(8, 6))
for (x, y), t, g in zip(xy, texts, groups):
    plt.scatter(x, y, c=colors[g])
    plt.annotate(t, (x, y), fontsize=8)
plt.title("Embeddings projected to 2D (PCA)")
plt.show()
```

📝 **Observe:** Topics form **clusters**. (PCA squashes 384 dims into 2, so some structure is lost; try `sklearn.manifold.TSNE` or UMAP too.)

---

### Lab 7 (Optional): OpenAI embeddings and Matryoshka dimensions

```python
import os
import numpy as np
from openai import OpenAI

client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

def openai_embed(texts, dims=None):
    kwargs = {"model": "text-embedding-3-small", "input": texts}
    if dims:
        kwargs["dimensions"] = dims
    resp = client.embeddings.create(**kwargs)
    vecs = np.array([d.embedding for d in resp.data])
    return vecs / np.linalg.norm(vecs, axis=1, keepdims=True)

texts = ["What is the home loan interest rate?",
         "How much does it cost to borrow money to buy a house?",
         "The weather is sunny today."]

for dims in (None, 512, 256, 64):
    v = openai_embed(texts, dims)
    print(f"dims={v.shape[1]:>4}  loan-vs-house={v[0] @ v[1]:.3f}  loan-vs-weather={v[0] @ v[2]:.3f}")
```

📝 **Observe:** Even at 256 dims, the **ranking** (loan≈house ≫ weather) usually holds, with about 6x less storage.

---

### Lab 8: Storage and cost calculator

```python
def embedding_storage_gb(num_chunks: int, dims: int, bytes_per_dim: float = 4) -> float:
    return num_chunks * dims * bytes_per_dim / 1024**3

def embedding_api_cost(num_chunks: int, avg_tokens_per_chunk: int,
                       price_per_million_tokens: float) -> float:
    return num_chunks * avg_tokens_per_chunk / 1_000_000 * price_per_million_tokens

for dims, bpd, label in [(1536, 4, "1536 float32"), (384, 4, "384 float32"), (384, 1, "384 int8")]:
    print(f"{label:<14}: {embedding_storage_gb(1_000_000, dims, bpd):.2f} GB for 1M chunks")

# Fill in the current price from your provider's pricing page
print("API cost:", embedding_api_cost(1_000_000, 400, price_per_million_tokens=0.02), "USD")
```

---

## 10. 🏋️ Exercises

1. **Similarity intuition:** Write 10 sentence pairs you *think* are similar or dissimilar. Predict their scores, then compute them. Where was your intuition wrong?
2. **Fix Day 3:** Swap TF-IDF for MiniLM in your Day 3 pipeline. Report Recall@3 and MRR before and after.
3. **Model shoot-out:** Extend `EVAL_SET` to 30 questions (paraphrases, abbreviations like "FD", "EMI", "CC", and one Hindi-English "Hinglish" query). Compare 3 models. Which wins, and by how much?
4. **Prefix ablation:** Measure E5 with and without `query:`/`passage:` prefixes.
5. **Threshold tuning:** For MiniLM, print the similarity score of the top hit for answerable and unanswerable questions (for example, "share price"). Choose a `min_score` that separates them.
6. **Weak-spot catalogue:** Create 10 "trap" pairs (negation, numbers, dates, IDs) relevant to banking. Save them; you'll test re-rankers against them on Day 14.
7. **Multilingual test:** Embed *"What is the FD interest rate?"* and *"FD ka interest rate kya hai?"* with MiniLM and `intfloat/multilingual-e5-small`. Compare the similarities.

---

## 11. 📝 Quiz (Self-Check)

1. What is an embedding, in one sentence?
2. What's the key difference between **Word2Vec** and **BERT** embeddings?
3. What does **pooling** do in a sentence embedding model?
4. Explain **contrastive learning** with positives and negatives.
5. Why must queries and documents use the **same** embedding model?
6. What happens if a chunk is longer than the model's **max tokens**?
7. Why do models like E5 need `query:` and `passage:` prefixes?
8. What are **Matryoshka embeddings**, and why are they useful?
9. Calculate the float32 storage for 2M chunks with 768-dim vectors.
10. Name three things embeddings are **bad** at, and one fix for each.
11. Why shouldn't you trust the MTEB leaderboard alone?

<details>
<summary>✅ Answers</summary>

1. A numeric vector representing the meaning of text, where similar meanings are close together.
2. Word2Vec gives **one fixed vector per word** (static). BERT gives **context-dependent** vectors.
3. It combines the per-token vectors into a **single sentence vector** (mean, CLS, or last-token).
4. Training pulls **matching pairs** (query-answer) closer and pushes **non-matching pairs** (negatives) apart in vector space.
5. Each model has its **own vector space**. Vectors from different models aren't comparable.
6. It's **silently truncated**, so the content past the limit is ignored and can't be retrieved.
7. RAG is **asymmetric** (short queries vs long passages). The model was trained with those markers to tell the two roles apart.
8. Embeddings whose **first N dimensions** also work as a good embedding. They save storage and speed up search with only a small quality loss.
9. $2,000,000 \times 768 \times 4\text{ bytes} = 6,144,000,000\text{ bytes} \approx \mathbf{5.7\text{ GiB}}$ ($\approx 6.1\text{ GB}$).
10. **Negation** → re-ranker or LLM check. **Numbers/exact values** → metadata filters or BM25. **IDs/codes/rare names** → hybrid search (BM25 + dense).
11. Benchmark data may not match your **domain, language, or query style**, and differences are often small. Always evaluate on **your own Q&A set**.

</details>

---

## 12. 📚 Resources

### Papers
- *Efficient Estimation of Word Representations in Vector Space* (Word2Vec, Mikolov et al., 2013): https://arxiv.org/abs/1301.3781
- *BERT* (Devlin et al., 2018): https://arxiv.org/abs/1810.04805
- *Sentence-BERT* (Reimers & Gurevych, 2019): https://arxiv.org/abs/1908.10084
- *Text Embeddings by Weakly-Supervised Contrastive Pre-training* (E5, Wang et al., 2022): https://arxiv.org/abs/2212.03533
- *C-Pack: Packaged Resources to Advance General Chinese Embedding* (BGE, Xiao et al., 2023): https://arxiv.org/abs/2309.07597
- *MTEB: Massive Text Embedding Benchmark* (Muennighoff et al., 2022): https://arxiv.org/abs/2210.07316
- *Matryoshka Representation Learning* (Kusupati et al., 2022): https://arxiv.org/abs/2205.13147

### Docs and tools
- Sentence-Transformers documentation: https://www.sbert.net/
- MTEB Leaderboard (Hugging Face): https://huggingface.co/spaces/mteb/leaderboard
- OpenAI Embeddings guide: https://platform.openai.com/docs/guides/embeddings
- Hugging Face model cards: search for `BAAI/bge-small-en-v1.5`, `intfloat/e5-small-v2`, `nomic-ai/nomic-embed-text-v1.5`

### Articles and videos
- Jay Alammar: *The Illustrated Word2Vec*: https://jalammar.github.io/illustrated-word2vec/
- Jay Alammar: *The Illustrated BERT*: https://jalammar.github.io/illustrated-bert/
- Pinecone Learning Center: *Sentence Transformers* and *Embeddings* articles: https://www.pinecone.io/learn/
- YouTube search: *"Vector embeddings explained"* (e.g., IBM Technology, StatQuest on Word Embeddings)

---

## 13. 🧠 Key Takeaways

- **Embeddings turn text into vectors where "close" means "similar in meaning"**. They're the heart of semantic retrieval.
- Modern embedders are **transformers + pooling**, trained with **contrastive learning** on huge sets of (query, positive, negative) examples.
- Choose a model using **privacy, language, length, latency, cost, MTEB**, and above all **your own eval set**.
- **Follow the model card**: prefixes, max tokens, normalization.
- **Never mix models**; re-embed when you switch.
- Embeddings are **weak at negation, numbers, and exact IDs**, so you'll add **hybrid search, re-ranking, and filters** later in the course.
- **Matryoshka + quantization** can cut storage by **4-30x** with only a small quality loss.

---

## ⏭️ Next: Day 5: Similarity Metrics (Cosine, Dot Product, Euclidean)
Why cosine = dot product for normalized vectors, when Euclidean distance matters, and how vector databases use these metrics.