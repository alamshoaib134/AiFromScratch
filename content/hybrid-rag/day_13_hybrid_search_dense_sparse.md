---
title: "Hybrid Search (Dense + Sparse)"
day: 13
concept: "Combining vector search and keyword search"
chapter: 2
chapterTitle: "Data Ingestion and Retrieval"
---

# Day 13: Hybrid Search (Dense + Sparse)

> **30-Day RAG Course, Week 2: Data Ingestion and Retrieval**
>
> **Date:** Oct 11, 2026 | **Estimated time:** 3.5-4 hours
>
> **Prerequisites:** [Day 5](./day05_similarity_metrics.md) (scores vs distances), [Day 10](./day10_metadata_filtering.md) (filters), [Day 12](./day12_keyword_search_bm25.md) (BM25; **run its Labs 0-2 first**)

## 🧭 Cheat Sheet (1-Minute Revision)

| Concept | Remember this | 
| ----- | ----- | 
| **Why hybrid?** | Dense catches **meaning**; sparse catches **exact tokens**. They fail on **different** queries, so combine them. | 
| **Standard pattern** | Retrieve top-N from **each** retriever (for example, 20-100) -> **fuse** -> top-K (-> re-rank, Day 14). | 
| **The core problem** | Scores live on **different scales** (BM25 is unbounded; cosine is roughly -1..1). Never add raw scores. | 
| **RRF** | `score = Σ 1 / (k + rank)`, with `k ≈ 60`. **Rank-based**, scale-free, no tuning. **The robust default.** | 
| **Weighted fusion** | Normalize (min-max / z-score) -> `α·dense + (1-α)·sparse`. Tune `α` on an eval set. | 
| **α meaning** | `α = 1` -> pure dense; `α = 0` -> pure sparse; `0.5-0.7` is a typical start. | 
| **Adaptive** | Queries containing **codes/IDs** -> lean sparse; natural-language questions -> lean dense. | 
| **Security** | Apply the **same filters to both branches**. A missed filter on one branch **leaks** data. | 
| **DB support** | Elasticsearch/OpenSearch, Weaviate, Qdrant, Milvus, Pinecone, Vespa, Azure AI Search, and SQL (pgvector + full-text) all support hybrid. | 

## 🎯 Learning Objectives

By the end of today, you should be able to:

1. Explain **why** hybrid retrieval beats either retriever alone on mixed query workloads.

2. Describe the main **hybrid architectures** (parallel + fusion, cascade, single sparse-dense model).

3. Implement **RRF, min-max, z-score, weighted-sum, and CombMNZ** fusion from scratch.

4. Build a **hybrid retriever** and evaluate it by query type (R@1, R@3, MRR).

5. **Tune `α` and RRF `k`** without overfitting, and implement **query-adaptive** weighting.

6. Apply **filters and access control consistently** across both branches.

7. Use hybrid search in production systems (Qdrant, Weaviate, Elasticsearch, pgvector SQL, LlamaIndex).

## 📅 Suggested Schedule

| Time | Activity | 
| ----- | ----- | 
| 0:00 - 0:20 | Section 1-2: Why hybrid; architectures | 
| 0:20 - 1:00 | Section 3-5: The scale problem; RRF; score normalization and weighted fusion | 
| 1:00 - 1:25 | Section 6-9: Candidate depth, tuning, DB support, pitfalls | 
| 1:25 - 3:30 | Section 10: Hands-on labs | 
| 3:30 - 4:00 | Exercises and quiz | 

## 1. Why Hybrid Search?

> 💡 **Intuition:** Yesterday you met two witnesses with different blind spots. The **dense** witness understands that "misplaced my plastic, how do I freeze it?" means "block a lost card", but confuses IFSC `ZYNT0004521` with `ZYNT0001187`. The **sparse** witness never confuses two codes, but draws a blank on "misplaced my plastic". Real users ask **both** kinds of questions, often in the same sentence: *"Can I pull surplus money out of ZYN-HL-FLEX?"*. **Hybrid search asks both witnesses and combines their testimony.** When they agree, the document rises to the top; when only one of them knows, the document still makes it into the shortlist. It's one of the most reliable, lowest-risk upgrades you can make to a RAG system.

| Query | Dense | Sparse | Hybrid | 
| ----- | ----- | ----- | ----- | 
| "What does UPI error **E1043** mean?" | ⚠️ May pick the E2091 doc | ✅ | ✅ | 
| "I misplaced my **plastic**, how do I **freeze** it?" | ✅ | ❌ No shared words | ✅ | 
| "Can I pull surplus money out of **ZYN-HL-FLEX**?" | ⚠ | ✅ | ✅ Both agree | 
| "Tax relief on **housing loan** principal under **80C**" | ✅ | ✅ | ✅ | 

> Across public benchmarks and industry reports, hybrid (BM25 + dense) is consistently **at least as good as the better of the two**, and often better. That's why most production vector DBs now ship hybrid search built in.

## 2. Hybrid Architectures

> 💡 **Intuition:** There are three ways to get two opinions. You can ask both experts **in parallel** and merge their lists (**fusion**, the most common). You can ask one expert for a shortlist and have the other **re-order** it (**cascade**), which is cheaper but can't recover what the first expert missed. Or you can train **one expert who thinks both ways** (a single model producing dense *and* sparse representations, like BGE-M3).

**(A) PARALLEL + FUSION (most common)**

```
          ┌── Dense retriever ──► top-N ──┐
Query ────┤                               ├──► FUSION (RRF / weighted) ──► top-K ──► (re-rank) ──► LLM
          └── Sparse (BM25)    ──► top-N ──┘

```

**(B) CASCADE**

```
Query ──► BM25 top-100 ──► dense re-score ──► top-K    (or dense first, then keyword boosts)

```

**(C) SINGLE MODEL / SINGLE VECTOR**

```
Query ──► model ──► {dense vector + sparse weights} ──► one index scores both (e.g., Pinecone sparse-dense, BGE-M3)

```

| Architecture | Pros | Cons | 
| ----- | ----- | ----- | 
| **Parallel + fusion** | Robust; each side can recover the other's misses; easy to debug | Two indexes; fusion design choices | 
| **Cascade** | Cheaper; simple | The first stage's misses are **unrecoverable** | 
| **Single sparse-dense** | One index/query; learned balance | Needs specific models/DB support; less transparent | 

## 3. The Fusion Problem: Scores Don't Speak the Same Language

> 💡 **Intuition:** BM25 scores are like **exam marks out of an unknown total**: a 12.5 might be excellent for one query and mediocre for another, depending on how rare the query words are. Cosine similarities are like **percentages**, but compressed into a narrow band (0.2-0.8 for most text). Adding them directly is like adding marks and percentages: whoever has the bigger numbers (usually BM25) silently dominates. Fusion needs a **common currency**: either **ranks** (RRF) or **normalized scores**.

| Retriever | Typical score range | Depends on | 
| ----- | ----- | ----- | 
| BM25 | $0 \rightarrow 15+$ (unbounded) | Query length, term rarity, corpus statistics | 
| Cosine (normalized embeddings) | $\sim 0.1 \rightarrow 0.9$ | Embedding model (anisotropy, Day 5) | 
| Learned sparse (SPLADE) | $0 \rightarrow 30+$ | Model, query | 

## 4. Reciprocal Rank Fusion (RRF)

> 💡 **Intuition:** RRF ignores the raw scores entirely and only asks **"what position did each retriever put this document in?"**. Each list gives every document a vote of `1 / (k + rank)`: first place is worth a bit more than second, which is worth a bit more than third, and so on. The constant `k` (usually **60**) keeps any single list from dominating with its #1 pick. A document that is **decently ranked by both** retrievers beats a document that is **#1 in one list and absent from the other**. That's exactly the "two witnesses agree" behavior you want. Because it only uses ranks, RRF needs **no normalization and no tuning**, which makes it the go-to default.

$$
\text{RRF}(d) = \sum_{r \in \text{retrievers}} \frac{w_r}{k + \text{rank}_r(d)} \qquad (k \approx 60, w_r = 1 \text{ by default})
$$

### Worked example ($k = 60$)

| Doc | Dense rank | Sparse rank | RRF score | 
| ----- | ----- | ----- | ----- | 
| **A** | 1 | \- | $1 / 61 \approx \mathbf{0.0164}$ | 
| **B** | 2 | 2 | $1 / 62 + 1 / 62 \approx \mathbf{0.0323}$ 🥇 | 
| **C** | \- | 1 | $1 / 61 \approx \mathbf{0.0164}$ | 
| **D** | 3 | 5 | $1 / 63 + 1 / 65 \approx \mathbf{0.0313}$ 🥈 | 

👉 **B** and **D**, which are found by **both** retrievers, beat the single-list #1s.

| ✅ Pros | ❌ Cons | 
| ----- | ----- | 
| Scale-free, so no normalization | Ignores **score gaps** (a clear #1 counts the same as a marginal #1) | 
| Robust; no training; `k=60` works broadly | Needs a reasonable candidate depth from each list | 
| Easy to extend to 3+ retrievers | Weights (`w_r`) can be tuned, but then it isn't "tuning-free" anymore | 

## 5. Score Normalization and Weighted Fusion

> 💡 **Intuition:** Sometimes the **size of the gap** matters: if BM25 finds one document with a score of 14 and everything else below 2, that's a strong signal RRF throws away. **Weighted fusion** keeps score information by first **rescaling each list to a common range**, then blending with a dial `α` (how much you trust dense vs sparse). The catch: normalization choices matter, and `α` must be **tuned on your data**.

| Normalization | Formula (per query, per list) | Notes | 
| ----- | ----- | ----- | 
| **Min-max** | `(s - min) / (max - min)` | Simple; the best -> 1, the worst -> 0. Sensitive to outliers; a single result -> divide by zero (handle it!) | 
| **Z-score** | `(s - mean) / std` | Keeps distribution shape; unbounded | 
| **Distribution-based (DBSF)** | Min-max using `mean ± 3σ` as the bounds | Used by Qdrant; robust to outliers | 
| **Rank-based** | `1 / (k + rank)` | That's RRF | 

| Fusion rule | Formula | 
| ----- | ----- | 
| **Weighted sum (convex)** | `α · norm(dense) + (1 - α) · norm(sparse)` | 
| **CombSUM** | Sum of normalized scores | 
| **CombMNZ** | CombSUM × (number of lists that retrieved the doc), which rewards agreement | 

### Missing documents

A doc can appear in one list but not the other. It must score **below everything that list returned**: use 0 after min-max (the list's worst doc is also 0), or something below the list's minimum after z-score. ⚠️ A tempting shortcut ("give missing docs the list's minimum normalized score") creates **ties**, and when a list has a **single** result, min-max gives it 1.0, so every missing doc also gets 1.0! With RRF, a missing doc simply gets **no contribution** from that list.

## 6. Candidate Depth, and Where Re-Ranking Fits

| Setting | Guidance | 
| ----- | ----- | 
| **Candidates per retriever (N)** | 20-100. Too small -> the fusion can't recover misses; too large -> noise and latency | 
| **Final K after fusion** | 3-10 for the LLM, or 20-50 if a **re-ranker** follows (Day 14) | 
| **Parallelism** | Run both retrievers **concurrently**, so latency $\approx$ the max, not the sum | 

```
Dense top-50 ──┐
               ├──► RRF ──► top-20 ──► cross-encoder re-rank (Day 14) ──► top-5 ──► LLM
BM25 top-50  ──┘

```

## 7. Tuning Without Fooling Yourself

> 💡 **Intuition:** With 20 test questions, you can find an `α` that looks perfect **for those 20 questions** and is mediocre on the next 2,000. That's overfitting. Prefer **robust defaults** (RRF, or `α = 0.5-0.7`), choose parameters from a **flat, good region** rather than a single spike, and confirm on **held-out** questions. When your queries are clearly of two kinds (codes vs natural language), a simple **query-adaptive** rule often beats any single global `α`.

| Practice | Why | 
| ----- | ----- | 
| Evaluate **per query type** (exact / paraphrase / mixed) | Averages hide trade-offs | 
| Prefer a **plateau** over a peak | Robust to new queries | 
| Use **train/test splits** or cross-validation | Detects overfitting | 
| Start with **RRF (k=60)** | A strong, tuning-free baseline | 
| Try **adaptive α** | Codes/IDs -> sparse-leaning; conversational -> dense-leaning | 

## 8. Hybrid Search in Production Systems

| System | How | Fusion options | 
| ----- | ----- | ----- | 
| **Elasticsearch** (8.x+) | `retriever` API: `rrf` over `standard` (BM25) + `knn`; also a `linear` retriever | RRF, weighted linear with normalization | 
| **OpenSearch** | `hybrid` query + search pipeline `normalization-processor` | min-max / L2 normalization + arithmetic/geometric/harmonic mean; RRF | 
| **Weaviate** | `hybrid(query, alpha=...)` | `rankedFusion` (RRF-like), `relativeScoreFusion` (min-max) | 
| **Qdrant** | Query API: `prefetch` (dense + sparse) + `FusionQuery` | RRF, DBSF | 
| **Milvus** | `hybrid_search` with multiple `AnnSearchRequest`s | `RRFRanker`, `WeightedRanker` | 
| **Pinecone** | Sparse-dense vectors in one index; client-side `α` scaling | Convex combination via vector scaling | 
| **pgvector + Postgres FTS** | SQL CTEs + `FULL OUTER JOIN` | Any (RRF shown in Lab 8) | 
| **Azure AI Search / Vespa** | Built-in hybrid | RRF / custom ranking expressions | 
| **LlamaIndex** | `QueryFusionRetriever` | `reciprocal_rerank`, `relative_score`, `dist_based_score` | 
| **LangChain** | `EnsembleRetriever` (weighted RRF). In 1.x it's in the legacy `langchain-classic` package; check the docs | Weighted RRF | 

## 9. ⚠️ Pitfalls

| Pitfall | Symptom | Fix | 
| ----- | ----- | ----- | 
| **Adding raw scores** | BM25 dominates everything | RRF or normalization | 
| **Min-max with one (or identical) results** | Division by zero / NaN | Guard: if max == min -> set all to 1 (or 0.5) | 
| **Wrong default for missing docs** | Docs absent from a list **tie** with (or beat) its real results; `α=0` no longer reproduces BM25 | Missing docs score **below** everything in that list (Section 5) | 
| **Filters applied to one branch only** | **Data leaks** through the other branch | Apply the **same** metadata/security filter to both (Lab 7) | 
| **Too-shallow candidate lists** | Hybrid $\approx$ one retriever | $N \ge 20$ per branch | 
| **Different ID granularity** | Chunk IDs vs doc IDs don't match | Fuse on the **same unit** (chunk ID) | 
| **Overfitting α** | Great on the dev set, worse in production | Plateaus, held-out tests, adaptive rules | 
| **Sequential calls** | Latency doubles | Query both retrievers concurrently | 
| **Different analyzers/versions after reindexing** | BM25 and dense see different corpora | Index both from the **same** chunk set and version | 

## 10. 🧪 Hands-On

### Setup

```bash
pip install numpy snowballstemmer sentence-transformers
```

> **Before starting:** run **Day 12 Labs 0-2** in the same notebook/session (they define `DOCS`, `IDS`, `FULL_TEXT`, `QUERIES`, `analyze()`, and `BM25`).

### Lab 0: Retrievers, extra "mixed" queries, and the evaluation harness

```python
from collections import defaultdict
import numpy as np
from sentence_transformers import SentenceTransformer

_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

def embed(texts: list[str]) -> np.ndarray:
    return np.asarray(_model.encode(texts, normalize_embeddings=True), dtype="float32")

bm25 = BM25([analyze(t) for t in FULL_TEXT])       # from Day 12
doc_vecs = embed(FULL_TEXT)

# Mixed queries: code/name + natural paraphrase in the same question
ALL_QUERIES = QUERIES + [
    ("What is the SWIFT code for money sent to me from overseas?", "SWIFT", "mixed"),
    ("IFSC for the branch in Shivajinagar", "BR-PUNE", "mixed"),
    ("Can I pull surplus money out of ZYN-HL-FLEX?", "HL-FLEX", "mixed"),
    ("Tax relief on housing loan principal under 80C", "HL-TAX", "mixed"),
    ("What does E2091 mean for my daily payment limit?", "UPI-ERR", "mixed"),
]

def dense_scores(q: str, n: int = 10) -> dict[str, float]:
    s = doc_vecs @ embed([q])[0]
    return {IDS[i]: float(s[i]) for i in np.argsort(-s)[:n]}        # ordered best -> worst

def sparse_scores(q: str, n: int = 10) -> dict[str, float]:
    return {IDS[i]: s for i, s in bm25.search(analyze(q), k=n)}     # ordered best -> worst

def evaluate(search_fn, queries=ALL_QUERIES) -> dict[str, dict]:
    """search_fn(question) -> ranked list of doc IDs. Returns R@1, R@3, and MRR per query type."""
    by_type = defaultdict(list)
    for q, rel, qtype in queries:
        ranked = search_fn(q)
        rank = ranked.index(rel) + 1 if rel in ranked else None
        by_type[qtype].append(rank)
        by_type["ALL"].append(rank)
    return {t: {"R@1": np.mean([r == 1 for r in ranks]),
                "R@3": np.mean([r is not None and r <= 3 for r in ranks]),
                "MRR": np.mean([1 / r if r else 0 for r in ranks])}
            for t, ranks in by_type.items()}

def print_eval(name: str, res: dict) -> None:
    cells = "  ".join(f"{t}: R@1={m['R@1']:.2f} R@3={m['R@3']:.2f} MRR={m['MRR']:.2f}"
                      for t, m in res.items() if t in ("exact", "paraphrase", "mixed", "ALL"))
    print(f"{name:<22} {cells}")

print(len(ALL_QUERIES), "queries:", {t: sum(1 for *_, x in ALL_QUERIES if x == t) for t in ("exact", "paraphrase", "mixed")})
```

### Lab 1: See the scale problem

```python
q = "Can I pull surplus money out of ZYN-HL-FLEX?"
d, s = dense_scores(q, 5), sparse_scores(q, 5)
print("Dense  (cosine):", {k: round(v, 3) for k, v in d.items()})
print("Sparse (BM25)  :", {k: round(v, 2) for k, v in s.items()})

naive = defaultdict(float)
for doc, v in list(d.items()) + list(s.items()):
    naive[doc] += v
print("Naive sum      :", [(k, round(v, 2)) for k, v in sorted(naive.items(), key=lambda x: -x[1])[:5]])
```

👀 **Observe:** Cosine scores sit in a narrow band (~0.1-0.7) while BM25 scores run far higher, so the naive sum is **essentially BM25's ranking**. Dense barely gets a vote. Never add raw scores from different retrievers.

### Lab 2: Fusion functions from scratch (with a toy check)

```python
def rrf(ranked_lists: list[list[str]], k: int = 60, weights: list[float] | None = None) -> dict[str, float]:
    weights = weights or [1.0] * len(ranked_lists)
    scores = defaultdict(float)
    for w, lst in zip(weights, ranked_lists):
        for rank, doc in enumerate(lst, start=1):
            scores[doc] += w / (k + rank)
    return dict(sorted(scores.items(), key=lambda x: -x[1]))

def minmax(scores: dict[str, float]) -> dict[str, float]:
    if not scores:
        return {}
    lo, hi = min(scores.values()), max(scores.values())
    if hi == lo:
        return {d: 1.0 for d in scores}      # guard: one result or ties
    return {d: (v - lo) / (hi - lo) for d, v in scores.items()}

def zscore(scores: dict[str, float]) -> dict[str, float]:
    if not scores:
        return {}
    vals = np.array(list(scores.values()))
    std = vals.std()
    return {d: (v - vals.mean()) / std if std > 0 else 0.0 for d, v in scores.items()}

def weighted_fusion(dense: dict, sparse: dict, alpha: float = 0.5, norm=minmax) -> dict[str, float]:
    dn, sn = norm(dense), norm(sparse)

    def floor(nd: dict) -> float:
        # A doc MISSING from a list must rank below everything that list returned.
        # (Using the list's minimum would TIE with its results; with a single result, min-max gives 1.0!)
        if not nd:
            return 0.0
        return min(nd.values()) - 1.0 if norm is zscore else 0.0

    d_missing, s_missing = floor(dn), floor(sn)
    fused = {doc: alpha * dn.get(doc, d_missing) + (1 - alpha) * sn.get(doc, s_missing)
             for doc in set(dn) | set(sn)}
    return dict(sorted(fused.items(), key=lambda x: (-x[1], x[0])))     # deterministic tie-break

def comb_mnz(dense: dict, sparse: dict) -> dict[str, float]:
    dn, sn = minmax(dense), minmax(sparse)
    fused = {doc: (dn.get(doc, 0) + sn.get(doc, 0)) * ((doc in dn) + (doc in sn)) for doc in set(dn) | set(sn)}
    return dict(sorted(fused.items(), key=lambda x: (-x[1], x[0])))

# Toy check: the worked example from Section 4
toy_dense, toy_sparse = ["A", "B", "D"], ["C", "B", "X", "Y", "D"]
print("RRF toy:", {d: round(v, 4) for d, v in rrf([toy_dense, toy_sparse]).items()})
```

👉 **Expected:** `'B' (0.0323) > 'D' (0.0313) > 'A' = 'C' (0.0164) > 'X', 'Y'`. Agreement between the retrievers wins.

### Lab 3: Hybrid retriever and a head-to-head evaluation

```python
def hybrid_search(q: str, method: str = "rrf", k: int = 10, n: int = 10,
                  alpha: float = 0.5, rrf_k: int = 60) -> list[str]:
    d, s = dense_scores(q, n), sparse_scores(q, n)
    if method == "dense":
        fused = d
    elif method == "sparse":
        fused = s
    elif method == "rrf":
        fused = rrf([list(d), list(s)], k=rrf_k)
    elif method == "minmax":
        fused = weighted_fusion(d, s, alpha, minmax)
    elif method == "zscore":
        fused = weighted_fusion(d, s, alpha, zscore)
    elif method == "combmnz":
        fused = comb_mnz(d, s)
    else:
        raise ValueError(method)
    return list(fused)[:k]

for method in ("sparse", "dense", "rrf", "minmax", "zscore", "combmnz"):
    print_eval(method, evaluate(lambda q, m=method: hybrid_search(q, m)))
```

👀 **Observe and interpret:**
- **Sparse** tends to ace **exact** questions and struggle on **paraphrase**; **dense** tends to show the opposite pattern (Day 12).
- The **hybrid** methods should land **at or near the better retriever on each query type**. They're insurance against each retriever's blind spots. Whether hybrid beats the best single retriever **overall** depends on your data: when one retriever is already strong on your whole query mix, fusion mainly protects against its occasional misses (and can cost a little R@3 when the other retriever adds noise).
- Look especially at the **mixed** questions, where both signals help.
- If one fusion method stands out, check **which queries** it fixes. With ~19 queries, one question is ~5 points, so don't over-read small gaps.

### Lab 4: Sweep `α` (and don't overfit it)

```python
alphas = [0.0, 0.2, 0.4, 0.5, 0.6, 0.8, 1.0]
print(f"{'alpha':>5} {'exact':>6} {'paraph':>6} {'mixed':>6} {'ALL MRR':>8}")
for a in alphas:
    res = evaluate(lambda q, a=a: hybrid_search(q, "minmax", alpha=a))
    print(f"{a:>5} {res['exact']['MRR']:>6.2f} {res['paraphrase']['MRR']:>6.2f} "
          f"{res['mixed']['MRR']:>6.2f} {res['ALL']['MRR']:>8.2f}")

# Simple held-out check: tune on even-indexed queries, test on odd-indexed ones
train, test = ALL_QUERIES[::2], ALL_QUERIES[1::2]
best_a = max(alphas, key=lambda a: evaluate(lambda q: hybrid_search(q, "minmax", alpha=a), train)["ALL"]["MRR"])
test_mrr = evaluate(lambda q: hybrid_search(q, "minmax", alpha=best_a), test)["ALL"]["MRR"]
rrf_test = evaluate(lambda q: hybrid_search(q, "rrf"), test)["ALL"]["MRR"]
print(f"\nBest α on train = {best_a} -> test MRR {test_mrr:.2f}   |   RRF (no tuning) test MRR {rrf_test:.2f}")
```

👀 **Observe:**
- `α = 0` ranks **BM25's results first, in BM25's order** (docs found only by dense trail behind with score 0), and `α = 1` does the same for dense. That's a good **sanity check** for your fusion code: if the top of the `α = 0` list doesn't match pure BM25, something's wrong (see the "missing documents" pitfall). The **exact** column tends to fall as `α` rises, while **paraphrase** rises.
- Look for a **flat, good region** (often around 0.4-0.7), not a single spike.
- Compare the tuned `α`'s **test** MRR with untuned **RRF**. On small datasets, the `α` that wins on the training half can easily **lose** on the test half (overfitting), while RRF holds up. That's why RRF is the default.

### Lab 5: Query-adaptive weighting

```python
import re
CODE_LIKE = re.compile(r"\b(?=[A-Za-z]*\d)[A-Za-z0-9-]{3,}\b|\b[A-Z]{2,}[A-Z0-9-]*\b")   # E1043, 80C, ZYN-HL-FLEX, IFSC
PROPER_NOUNS = re.compile(r"(?<!^)(?<![.?!]\s)\b[A-Z][a-z]{2,}\b")                          # Radhika, Iyer, Pune

def adaptive_alpha(q: str) -> float:
    signals = len(CODE_LIKE.findall(q)) + len(PROPER_NOUNS.findall(q))
    return 0.3 if signals >= 1 else 0.7       # codes/names -> lean sparse; natural language -> lean dense

for q, *_ in ALL_QUERIES[:3] + ALL_QUERIES[8:10] + ALL_QUERIES[-2:]:
    print(f"α={adaptive_alpha(q)}  {q}")

print()
print_eval("minmax α=0.5", evaluate(lambda q: hybrid_search(q, "minmax", alpha=0.5)))
print_eval("minmax adaptive", evaluate(lambda q: hybrid_search(q, "minmax", alpha=adaptive_alpha(q))))
print_eval("rrf", evaluate(lambda q: hybrid_search(q, "rrf")))
```

👀 **Observe:** A simple rule (a regex for codes and proper nouns) routes each query to a sensible balance. On workloads with a clear split between "look up this code" and "explain this to me", adaptive weighting often matches or beats any single global `α`. In production, this rule can become a small **query classifier** (Day 20: routing).

### Lab 6: RRF `k` and candidate depth `N`

```python
print("RRF k sensitivity (N=10):")
for rk in (1, 10, 60, 100):
    print_eval(f"  rrf k={rk}", evaluate(lambda q, rk=rk: hybrid_search(q, "rrf", rrf_k=rk)))

print("\nCandidate depth N (RRF k=60):")
for n in (1, 3, 5, 10, 16):
    print_eval(f"  N={n}", evaluate(lambda q, n=n: hybrid_search(q, "rrf", n=n)))
```

👀 **Observe:**
- Results are usually **insensitive** to `k` over a wide range (that's why `k=60` is a safe default). A very small `k` makes RRF over-trust each list's #1.
- With a **tiny N** (1-3), fusion has little to work with. Deeper candidate lists give each retriever a chance to rescue the other's misses. (With only 16 docs, N=16 means "everything"; real corpora need N ≈ 20-100.)

### Lab 7: Security: filter BOTH branches (or leak data)

```python
# Add an INTERNAL document that mentions a public code
INTERNAL = ("RISK-NOTE", "Internal Credit Note",
            "Internal only: branch IFSC ZYNT0004521 is under an elevated fraud-alert review for Q3.")
SEC_DOCS = DOCS + [INTERNAL]
SEC_IDS = [d[0] for d in SEC_DOCS]
SEC_TEXT = [f"{t}. {x}" for _, t, x in SEC_DOCS]
ACCESS = {doc_id: ("internal" if doc_id == "RISK-NOTE" else "public") for doc_id in SEC_IDS}

sec_bm25 = BM25([analyze(t) for t in SEC_TEXT])
sec_vecs = embed(SEC_TEXT)

def allowed_ids(user_levels: set[str]) -> set[str]:
    return {d for d in SEC_IDS if ACCESS[d] in user_levels}

def sec_dense(q, n, allow):
    s = sec_vecs @ embed([q])[0]
    return [SEC_IDS[i] for i in np.argsort(-s) if SEC_IDS[i] in allow][:n]

def sec_sparse(q, n, allow=None):
    hits = [SEC_IDS[i] for i, _ in sec_bm25.search(analyze(q), k=len(SEC_IDS))]
    return [h for h in hits if allow is None or h in allow][:n]

def buggy_hybrid(q, user_levels, n=5):
    allow = allowed_ids(user_levels)
    return list(rrf([sec_dense(q, n, allow), sec_sparse(q, n)]))[:3]    # ❌ sparse branch unfiltered

def secure_hybrid(q, user_levels, n=5):
    allow = allowed_ids(user_levels)
    results = list(rrf([sec_dense(q, n, allow), sec_sparse(q, n, allow)]))[:3]  # ✅ same filter on both
    assert all(r in allow for r in results), "security violation"                 # defense in depth
    return results

q = "Tell me about IFSC ZYNT0004521"
print("Customer, BUGGY  :", buggy_hybrid(q, {"public"}))
print("Customer, SECURE :", secure_hybrid(q, {"public"}))
print("Employee, SECURE :", secure_hybrid(q, {"public", "internal"}))
```

👀 **Observe:** In the buggy version, the dense branch was filtered but the **BM25 branch was not**, so the internal fraud note (which matches the exact IFSC code) **leaks into the customer's results**. Exact-match retrievers are *especially* good at surfacing sensitive documents that mention a specific ID. **Every branch must receive the same security filter**, plus a final assertion.

### Lab 8 (Reference): Hybrid in production systems

**Qdrant (Query API: dense + sparse prefetch, RRF fusion):**

```python
from qdrant_client import models

results = qc.query_points(
    collection_name="bank_docs",
    prefetch=[
        models.Prefetch(query=dense_query_vector, using="dense", limit=20),
        models.Prefetch(query=models.SparseVector(indices=sparse_idx, values=sparse_vals), using="sparse", limit=20),
    ],
    query=models.FusionQuery(fusion=models.Fusion.RRF),        # or models.Fusion.DBSF
    query_filter=security_filter,                             # applied to the whole query
    limit=5,
)
```

**Weaviate (v4 client):**

```python
from weaviate.classes.query import HybridFusion

res = collection.query.hybrid(query="Can I pull surplus money out of ZYN-HL-FLEX?",
                              alpha=0.5, fusion_type=HybridFusion.RELATIVE_SCORE, limit=5)
```

**Elasticsearch (RRF retriever):**

```json
GET bank_docs/_search
{
  "retriever": {
    "rrf": {
      "retrievers": [
        { "standard": { "query": { "match": { "body": "Can I pull surplus money out of ZYN-HL-FLEX?" } } } },
        { "knn": { "field": "embedding", "query_vector": [0.01, -0.02], "k": 20, "num_candidates": 100 } }
      ],
      "rank_window_size": 50,
      "rank_constant": 60
    }
  }
}
```

**PostgreSQL: pgvector + full-text search with RRF in SQL:**

```sql
WITH semantic AS (
    SELECT id, RANK() OVER (ORDER BY embedding <=> :qvec) AS rnk
    FROM chunks WHERE access_level = ANY(:allowed)                   -- same filter...
    ORDER BY embedding <=> :qvec LIMIT 20
),
keyword AS (
    SELECT id, RANK() OVER (ORDER BY ts_rank_cd(tsv, q) DESC) AS rnk
    FROM chunks, plainto_tsquery('english', :qtext) q
    WHERE tsv @@ q AND access_level = ANY(:allowed)                  -- ...on both branches
    ORDER BY ts_rank_cd(tsv, q) DESC LIMIT 20
)
SELECT COALESCE(s.id, k.id) AS id,
       COALESCE(1.0 / (60 + s.rnk), 0) + COALESCE(1.0 / (60 + k.rnk), 0) AS rrf_score
FROM semantic s FULL OUTER JOIN keyword k ON s.id = k.id
ORDER BY rrf_score DESC
LIMIT 5;
```

**LlamaIndex:**

```python
from llama_index.core.retrievers import QueryFusionRetriever

hybrid = QueryFusionRetriever(
    [vector_index.as_retriever(similarity_top_k=20), bm25_retriever],    # bm25 from llama-index-retrievers-bm25
    similarity_top_k=5, num_queries=1,                                    # num_queries=1 -> no LLM query rewriting
    mode="reciprocal_rerank", use_async=False,
)
nodes = hybrid.retrieve("Can I pull surplus money out of ZYN-HL-FLEX?")
```

> ⚠️ **SDK syntax evolves; check each tool's current docs before copying.**

## ❓ Common Confusions

| ❌ Misconception | ✅ Reality |
| ----- | ----- |
| "Just add the BM25 score to the cosine score." | Different scales. BM25 dominates. Use RRF or normalize first. |
| "Hybrid is always better than dense." | Usually at least as good, but a badly tuned `α`, shallow candidates, or a poor analyzer can make it worse. **Measure.** |
| "RRF uses the scores." | It uses **ranks only**. That's why it's robust, and also why it ignores score gaps. |
| "`α = 0.5` means equal importance." | Only after normalization, and even then it depends on the score distributions. Tune on data. |
| "Filtering the vector search is enough." | **Every** branch must be filtered. Keyword search happily surfaces sensitive docs by exact IDs. |
| "Hybrid replaces re-ranking." | Fusion merges candidate lists; a **re-ranker** (Day 14) then reads query + doc together to order them precisely. They're complementary. |
| "The best α from my 20 test questions is the best α." | That's likely overfit. Prefer plateaus, held-out checks, or RRF. |

## 11. 🏋️ Exercises

1. **Miss analysis:** For each method in Lab 3, list the queries it gets wrong at R@1. Which misses does fusion fix, and which remain for re-ranking (Day 14)?
2. **Weighted RRF:** Add weights to RRF (`weights=[w_dense, w_sparse]`) and sweep `w_sparse ∈ {0.5, 1, 1.5, 2}`. Compare with min-max `α`.
3. **DBSF:** Implement distribution-based score fusion (min-max using `mean ± 3σ` bounds, clipped to `[0, 1]`). Compare with min-max and z-score.
4. **Three retrievers:** Add a third retriever (for example, BM25 over **titles only**, or a dense model with a different embedder) and fuse all three with RRF. Does it help?
5. **Latency:** Run the dense and sparse retrievers concurrently with `concurrent.futures.ThreadPoolExecutor` and measure the end-to-end time vs sequential calls.
6. **Adaptive router v2:** Replace the regex with a tiny classifier (for example, logistic regression on features: has digits, has uppercase tokens, question length, has a question word). Train on 30 labeled queries and evaluate.
7. **Plug into Day 7:** Replace the retriever in your Day 7 LangChain/LlamaIndex pipeline with your hybrid retriever (wrap `hybrid_search` in a function that returns documents). Compare answer quality on 10 questions.

## 12. 📝 Quiz (Self-Check)

1. Why does hybrid retrieval help on real enterprise query mixes?
2. Why can't you add BM25 and cosine scores directly?
3. Compute RRF (k=60) for a doc ranked 1st in dense and 4th in sparse.
4. What does `α` control in weighted fusion, and what do `α=0` and `α=1` reproduce?
5. When might weighted (score-based) fusion beat RRF?
6. What does CombMNZ reward?
7. Why is the candidate depth `N` per retriever important?
8. What's the security risk in hybrid search, and how do you prevent it?
9. How do you avoid overfitting `α`?
10. Name two production systems with built-in hybrid search and their fusion options.

<details>
<summary>✅ Answers</summary>

1. Users ask both **exact-token** questions (codes, IDs, names) and **natural-language** ones. Dense and sparse fail on different types, so combining them covers both.
2. They're on **different, query-dependent scales** (BM25 is unbounded; cosine is narrow), so the larger-scale score dominates.
3. $1 / 61 + 1 / 64 = 0.01639 + 0.01563 = \mathbf{0.0320}$.
4. The weight on dense vs sparse after normalization. `α=0` -> pure **sparse (BM25)**; `α=1` -> pure **dense**.
5. When **score gaps** carry information (for example, one very confident BM25 match) and you have enough eval data to tune the normalization and `α`.
6. **Agreement**: docs retrieved by more lists get their summed score multiplied by the number of lists.
7. Fusion can only promote documents that appear in at least one list. Too-shallow lists mean each retriever can't rescue the other's misses.
8. A filter (security/tenant/metadata) applied to only one branch lets restricted docs **leak through the other**. Apply identical filters to **all** branches and assert on the final results.
9. Evaluate per query type, prefer **plateaus**, use **held-out/cross-validation**, and compare against untuned **RRF**; consider adaptive rules.
10. For example, **Elasticsearch** (RRF/linear retrievers), **OpenSearch** (normalization processor), **Weaviate** (rankedFusion/relativeScoreFusion with α), **Qdrant** (RRF/DBSF), **Milvus** (RRFRanker/WeightedRanker), **Pinecone** (sparse-dense α).
</details>

## 13. 📚 Resources

### Papers
- [Reciprocal Rank Fusion outperforms Condorcet and Individual Rank Learning Methods](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf) (Cormack, Clarke, Büttcher, SIGIR 2009)
- [An Analysis of Fusion Functions for Hybrid Retrieval](https://arxiv.org/abs/2210.11934) (Bruch, Gai, Ingber, 2022)
- Combination of Multiple Searches (Fox & Shaw, TREC-2, 1994), the origin of CombSUM/CombMNZ
- [BGE M3-Embedding: Multi-Lingual, Multi-Functionality, Multi-Granularity](https://arxiv.org/abs/2402.03216) (Chen et al., 2024)

### Docs
- Elasticsearch: Reciprocal rank fusion / retrievers: https://www.elastic.co/guide/en/elasticsearch/reference/current/rrf.html
- OpenSearch: Hybrid search and the normalization processor: https://opensearch.org/docs/latest/search-plugins/hybrid-search/
- Weaviate: Hybrid search: https://weaviate.io/developers/weaviate/search/hybrid
- Qdrant: Hybrid queries (Query API, RRF/DBSF): https://qdrant.tech/documentation/concepts/hybrid-queries/
- Milvus: Hybrid search: https://milvus.io/docs/multi-vector-search.md
- Pinecone: Hybrid search (sparse-dense): https://docs.pinecone.io/guides/search/hybrid-search
- LlamaIndex: Reciprocal rerank fusion retriever: https://docs.llamaindex.ai/en/stable/examples/retrievers/reciprocal_rerank_fusion/

## 14. 📌 Key Takeaways

- **Dense + sparse fail differently.** Hybrid covers codes/IDs **and** paraphrases, which is exactly what enterprise users ask.
- The standard pattern is **parallel retrieval (top-N each) -> fusion -> top-K -> (re-rank)**.
- **Never add raw scores.** Use **RRF (`1/(k+rank)`, `k≈60`)** as the robust default, or **normalize** and blend with `α`.
- Tune with care: **per query type**, **plateaus**, **held-out** checks; consider **adaptive α** for code-vs-natural-language queries.
- **Apply the same filters (especially security) to every branch.**
- Most vector DBs and search engines ship hybrid built in. Know their fusion options.

## ⏭️ Next: Day 14: Re-Ranking (Cross-Encoders, Cohere Rerank)
Take the fused top-20-50 and re-order it with a model that reads the **query and each document together**, often the biggest single quality jump in a RAG pipeline.