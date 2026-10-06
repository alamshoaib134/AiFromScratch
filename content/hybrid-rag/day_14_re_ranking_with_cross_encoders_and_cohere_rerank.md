---
title: "Re-ranking with Cross-Encoders and Cohere Rerank"
day: 14
concept: "Sorting retrieved results for maximum accuracy"
chapter: 2
chapterTitle: "Data Ingestion and Retrieval"
---

# Day 14: Re-ranking with Cross-Encoders and Cohere Rerank

> **30-Day RAG Course, Week 2: Data Ingestion and Retrieval**
> **Date:** Oct 12, 2026 | **Estimated time:** 4 hours
> **Prerequisites:** [Day 5](./day05_similarity_metrics.md) (bi-encoder similarity), [Day 11](./day11_indexing_methods.md) (ANN candidate generation), [Day 13](./day13_hybrid_search.md) (hybrid retrieval and RRF)

---

## 📌 Cheat Sheet (1-Minute Revision)

| Concept | Remember this |
|---|---|
| **Purpose** | Retrieval gets a high-recall shortlist; re-ranking puts the truly useful chunks first. |
| **Standard pipeline** | Dense + BM25 -> fuse top **20-100** -> re-rank -> keep top **3-10** -> LLM. |
| **Bi-encoder** | Encodes query and document separately. Fast and indexable, but interaction is compressed into one vector similarity. |
| **Cross-encoder** | Reads `[query, document]` together and outputs one relevance score. Slower, but sees token-level interactions. |
| **Main rule** | A re-ranker can reorder candidates; it **cannot recover a relevant document that retrieval missed**. |
| **Good at** | Negation, exact clauses, dates, numbers, constraints, and distinguishing closely related chunks. |
| **Evaluate** | Candidate Recall@N first; then MRR, nDCG@K, Precision@K, and downstream answer quality. |
| **Latency controls** | Candidate count, document length, model size, batching, hardware, caching, and timeouts. |
| **Security** | Filter unauthorized documents **before** re-ranking. Never send forbidden text to a local or hosted model. |
| **Default start** | Retrieve 50 -> re-rank 50 -> pass top 5; measure quality and p95 latency, then tune. |

---

## 🎯 Learning Objectives

By the end of today, you should be able to:

1. Explain the difference between a **bi-encoder** and a **cross-encoder**.
2. Explain why first-stage retrieval optimizes recall while re-ranking optimizes top-rank precision.
3. Add a local cross-encoder or hosted re-ranking API to a hybrid retrieval pipeline.
4. Preserve document IDs, metadata, filters, and original retrieval scores through re-ranking.
5. Evaluate re-ranking with **MRR, nDCG@K, Precision@K, Recall@K**, and latency.
6. Tune candidate depth and final context size without exceeding latency or token budgets.
7. Handle batching, truncation, timeouts, API failures, and access control safely.
8. Decide when a re-ranker is worth its cost.

---

## 🗓️ Suggested Schedule

| Time | Activity |
|---|---|
| 0:00-0:25 | Sections 1-2: Why re-rank; bi-encoder vs cross-encoder |
| 0:25-1:05 | Sections 3-5: architecture, model choices, trade-offs |
| 1:05-1:30 | Sections 6-8: evaluation, candidate depth, production design |
| 1:30-3:40 | Section 10: hands-on labs |
| 3:40-4:00 | Exercises and quiz |

---

## 1. Why Re-rank?

> 🎯 **Intuition:** First-stage retrieval is a fast airport security line. Its job is to avoid missing anyone who may matter, so it lets a moderately large set through. The re-ranker is the careful second inspection: it spends more time on only those candidates and puts the best evidence first. The LLM then receives a small, clean context instead of a noisy pile.

Dense and sparse retrieval are optimized to search millions of chunks quickly. This speed requires approximations:

- a dense retriever compresses each text into one vector;
- BM25 mostly matches lexical evidence;
- ANN search may miss some exact nearest neighbors;
- rank fusion combines imperfect lists without reading the query and chunk together.

A re-ranker operates on only a shortlist, so it can afford a much more expensive relevance model.

```text
               | HIGH RECALL                              HIGH PRECISION
Query ----> dense top-50 ---|
                            |--> RRF top-50 -> CROSS-ENCODER -> top-5 -> LLM
         -> BM25 top-50 ----|
             milliseconds                     more expensive
```

### Division of responsibility

| Stage | Primary objective | Typical depth | Can recover an absent document? |
|---|---|---|---|
| Dense/BM25 retrieval | Candidate recall | 20-1,000 | Yes, by searching the corpus |
| Fusion | Combine retriever evidence | 20-200 | Only if one branch returned it |
| Re-ranking | Correct order and precision | 10-100 | **No** |
| Context selection | Useful, non-redundant evidence | 3-10 | No |

The quality ceiling is:

$$
\text{Best possible reranked Recall@K} \leq \text{Candidate Recall@N}, \quad K \leq N
$$

If the relevant chunk is absent from the top 50, no re-ranker applied to those 50 can select it.

---

## 2. Bi-Encoder vs Cross-Encoder

### 2.1 Bi-encoder

A bi-encoder processes query and document independently:

```text
query -> encoder -> q vector ---|
                                |--> cosine/dot product
doc   -> encoder -> d vector ---|
```

Document vectors can be precomputed and indexed. At query time, only the query is encoded, making million-document search practical.

$$
s(q, d) = E(q)^\top E(d)
$$

The cost of this efficiency is an information bottleneck: all relevance interactions must fit into two fixed-size vectors.

### 2.2 Cross-encoder

A cross-encoder processes the pair jointly:

```text
[CLS] how do I block a card? [SEP] card replacement policy ... [SEP]
  |________________________ joint self-attention _______________________|
                                    |
                             relevance score
```

$$
s(q, d) = f_\theta([q; d])
$$

Every query token can attend to every document token. The model can distinguish:

- "loans **with no prepayment fee**" from "loans **have a prepayment fee**";
- "$5,000 daily limit" from "$50,000 monthly limit";
- policy effective in 2026 from an expired 2024 policy;
- a clause that answers the question from a broadly related page.

But document representations cannot be precomputed independently. Scoring 10 million documents means 10 million forward passes, so cross-encoders are used only after retrieval.

| Property | Bi-encoder | Cross-encoder |
|---|---|---|
| Inputs | Query and document separately | Query-document pair together |
| Precompute documents | Yes | No |
| Search entire corpus | Yes | No |
| Token-level interaction | Limited/implicit | Full joint attention |
| Typical role | Candidate generation | Candidate re-ranking |
| Speed | Fast | 10-1,000x more expensive per candidate |
| Relevance quality | Good | Usually better |

> **Common confusion:** A cross-encoder is not simply "a larger embedding model." It produces a score for a pair, not a reusable document embedding.

---

## 3. Pointwise, Pairwise, and Listwise Re-ranking

| Method | What the model sees | Output | Strength | Weakness |
|---|---|---|---|---|
| **Pointwise** | One `(query, document)` pair | Relevance score | Easy to batch; standard cross-encoder/API design | Scores may not be calibrated across queries |
| **Pairwise** | Query plus two documents | Which document is better | Direct preference training | Many comparisons for long lists |
| **Listwise** | Query plus a list of documents | Ordered list | Can reason across candidates | Token-heavy; position bias; harder to scale |

Most local cross-encoders and hosted re-rank APIs are used pointwise internally, then candidates are sorted by score. LLM prompts can perform listwise ranking, but are usually slower, costlier, less deterministic, and harder to evaluate.

### Score interpretation

A re-ranker score is useful mainly **within one query's candidate set**. Do not assume:

- `0.8` means an 80% probability unless the model is explicitly calibrated;
- scores from different models are comparable;
- one global threshold works for every query;
- hosted API scores have the same range across model versions.

Use rank-based metrics, and calibrate thresholds on your own validation data if you need abstention.

---

## 4. Re-ranker Options

### Local cross-encoders

Common model families include:

- `cross-encoder/ms-marco-MiniLM-L-6-v2` - small and useful for learning;
- BGE reranker models - multilingual and larger variants;
- Jina reranker models;
- mixedbread rerankers;
- domain-specific models fine-tuned on your relevance judgments.

**Pros:** private deployment, predictable marginal cost, control over batching and versioning.
**Cons:** model hosting, GPU/CPU sizing, updates, and inference engineering.

### Hosted APIs

Providers include Cohere Rerank, Jina AI, Voyage AI, and others.

**Pros:** minimal infrastructure, strong managed models, simple API.
**Cons:** network latency, recurring cost, data-governance review, rate limits, and provider dependency.

### LLM re-ranking

An LLM can label each chunk or rank a list. This is useful when relevance requires complex instructions, but a compact cross-encoder is normally cheaper and more stable.

### ColBERT and late interaction

ColBERT stores vectors for multiple document tokens. At query time it performs token-level maximum similarity:

$$
s(q, d) = \sum_{i \in q} \max_{j \in d} q_i^\top d_j
$$

It sits between bi-encoders and cross-encoders: richer token interactions than one-vector retrieval, but indexable and cheaper than full joint attention. It is not the same as a cross-encoder.

---

## 5. What Makes a Good Candidate Set?

Re-ranking works only if candidate generation supplies:

1. **High recall** - relevant chunks are present.
2. **Diversity** - candidates cover dense and exact-match evidence.
3. **Correct security scope** - only authorized chunks are included.
4. **Enough text** - each candidate contains the evidence needed for judgment.
5. **Stable identity** - every item preserves `doc_id`, chunk ID, source, and metadata.

Start with hybrid retrieval and RRF from Day 13:

```text
dense top 50 + BM25 top 50 -> RRF union top 50 -> rerank -> top 5
```

Increasing candidate depth raises the possible recall but also raises latency nearly linearly. If 50 candidates already give 99% candidate recall, scoring 200 is usually wasted work.

---

## 6. Evaluation Metrics

Assume graded human judgments:

- `0`: irrelevant
- `1`: somewhat relevant
- `2`: relevant
- `3`: ideal answer-bearing evidence

### Recall@N

Did candidate generation include the relevant evidence?

$$
\text{Recall@N} = \frac{|\{\text{relevant documents retrieved in top } N\}|}{|\{\text{relevant documents}\}|}
$$

Measure this **before** re-ranking.

### Precision@K

How much of the small final context is relevant?

$$
\text{Precision@K} = \frac{|\{\text{relevant documents in top } K\}|}{K}
$$

### Mean Reciprocal Rank (MRR)

How soon does the first relevant result appear?

$$
\text{RR} = \frac{1}{\text{rank of first relevant result}}, \qquad \text{MRR} = \frac{1}{|Q|} \sum_{q \in Q} \text{RR}_q
$$

### nDCG@K

nDCG rewards placing highly relevant documents near the top:

$$
\text{DCG@K} = \sum_{i=1}^{K} \frac{2^{\text{rel}_i} - 1}{\log_2(i + 1)}, \qquad \text{nDCG@K} = \frac{\text{DCG@K}}{\text{ideal DCG@K}}
$$

### End-to-end measures

Retrieval metrics are necessary but not sufficient. Also measure:

- answer correctness and completeness;
- citation correctness;
- faithfulness to supplied context;
- context token count;
- p50/p95/p99 latency;
- cost per query and failure rate.

---

## 7. Production Design

### 7.1 Truncation

Cross-encoders have maximum sequence lengths. A common allocation is:

```text
[special tokens] + query tokens + document tokens <= model maximum
```

Silent truncation can remove the answer at the end of a chunk. Prevent this by:

- using appropriately sized chunks during ingestion;
- logging the percentage of candidates truncated;
- reserving enough document tokens after encoding the query;
- splitting overlong candidates and aggregating subchunk scores;
- placing headings and critical metadata in the scored text.

### 7.2 Batching

Score pairs in batches, not one model call per candidate:

```python
pairs = [(query, candidate["text"]) for candidate in candidates]
scores = model.predict(pairs, batch_size=32)
```

Tune batch size against memory and tail latency. Dynamic batching can improve GPU throughput, but waiting to form a batch may hurt interactive latency.

### 7.3 Failure policy

Define the behavior explicitly:

- on timeout, return the already-filtered fused order;
- record `rerank_applied=False` and the error class;
- use a circuit breaker for repeated provider failures;
- never return an empty success-shaped response after a re-ranker error;
- pin model versions and evaluate before upgrades.

Fallback order is degraded, not equivalent. Monitor fallback frequency.

### 7.4 Security and privacy

```text
authenticated identity
         |
         v
server-side ACL filter -> retrieval -> authorized candidates only -> reranker
```

Never retrieve broadly, send all candidates to a hosted API, and filter afterward. That already disclosed unauthorized text to the provider. Build filters from authenticated claims, not from user prompt text.

### 7.5 Redundancy

A relevance re-ranker may place five near-duplicate chunks first. After re-ranking, consider:

- per-document caps;
- overlap suppression;
- MMR or diversity selection;
- merging adjacent chunks from the same source.

Do not let diversity remove the only answer-bearing chunk.

---

## 8. Practical Tuning Workflow

1. Freeze a representative evaluation set by query type.
2. Measure dense, sparse, and hybrid retrieval.
3. Choose candidate depth where Recall@N reaches the target.
4. Add the re-ranker without changing retrieval.
5. Compare MRR, nDCG@5, Precision@5, latency, and cost.
6. Sweep candidate depths such as 10, 20, 50, and 100.
7. Sweep final context sizes such as 3, 5, and 8.
8. Inspect regressions, especially numbers, negation, and long chunks.
9. Validate downstream answer and citation quality.
10. Pin configuration and monitor drift.

Do not tune on the test set. Use train/validation/test splits, or at least a development set and untouched final set.

---

## 9. Architecture Contract

Keep retrieval evidence instead of overwriting it:

```python
{
    "id": "policy-2026#chunk-04",
    "text": "Early repayment has no fee after 12 months...",
    "metadata": {"tenant_id": "acme", "effective_year": 2026},
    "dense_score": 0.71,
    "bm25_score": 8.4,
    "rrf_score": 0.0318,
    "rerank_score": 0.93,
    "original_rank": 7,
    "rerank_rank": 1,
}
```

This makes failures debuggable: you can tell whether retrieval missed the chunk, fusion demoted it, or the re-ranker judged it badly.

---

## 10. Hands-On Labs

### Lab 0 - Setup

Create a clean environment:

```bash
python -m venv .venv
# Windows:
.venv\Scripts\activate
python -m pip install numpy
```

Optional real-model integrations:

```bash
python -m pip install sentence-transformers cohere
```

> The core labs below run offline. Their transparent rule-based scorer demonstrates pipeline mechanics and evaluation, **not real cross-encoder quality**. Labs 4 and 5 use real services/models and require model access or credentials.

### Lab 1 - Build an offline re-ranking test bed

Save as `rerank_lab.py`:

```python
import math
import re
import time
from collections import Counter

TOKEN_RE = re.compile(r"[a-z0-9$.-]+")

def tokens(text):
    return TOKEN_RE.findall(text.lower())

def features(query, document):
    """Transparent pair features; this is not a neural cross-encoder."""
    q = tokens(query)
    d = tokens(document)
    qs, ds = set(q), set(d)
    overlap = len(qs & ds) / max(1, len(qs))

    q_numbers = {t for t in qs if any(c.isdigit() for c in t)}
    number_match = len(q_numbers & ds) / max(1, len(q_numbers)) if q_numbers else 1.0

    negations = {"no", "not", "never", "without"}
    q_neg = bool(qs & negations)
    d_neg = bool(ds & negations)
    negation_agreement = 1.0 if q_neg == d_neg else 0.0

    phrase = 1.0 if " ".join(q) in " ".join(d) else 0.0
    return {
        "overlap": overlap,
        "number_match": number_match,
        "negation_agreement": negation_agreement,
        "phrase": phrase,
    }

def offline_pair_score(query, document):
    f = features(query, document)
    return (
        0.55 * f["overlap"]
        + 0.20 * f["number_match"]
        + 0.20 * f["negation_agreement"]
        + 0.05 * f["phrase"]
    )

def rerank(query, candidates, score_fn=offline_pair_score, top_n=None):
    scored = []
    for original_rank, candidate in enumerate(candidates, start=1):
        item = dict(candidate)
        item["original_rank"] = original_rank
        item["rerank_score"] = float(score_fn(query, item["text"]))
        scored.append(item)

    scored.sort(key=lambda x: (-x["rerank_score"], x["original_rank"], x["id"]))
    for rerank_rank, item in enumerate(scored, start=1):
        item["rerank_rank"] = rerank_rank
    return scored[:top_n] if top_n is not None else scored

if __name__ == "__main__":
    query = "Which loan has no prepayment fee after 12 months?"
    candidates = [
        {
            "id": "d1",
            "text": "Flex Loan charges a 2% prepayment fee after 12 months.",
            "rrf_score": 0.033,
        },
        {
            "id": "d2",
            "text": "Prime Loan has no prepayment fee after 12 months.",
            "rrf_score": 0.031,
        },
        {
            "id": "d3",
            "text": "Flex Loan has no late payment fee during the first month.",
            "rrf_score": 0.029,
        },
        {
            "id": "d4",
            "text": "Prime Loan rates are reviewed every 12 months.",
            "rrf_score": 0.026,
        },
    ]

    ranked = rerank(query, candidates, top_n=3)
    for item in ranked:
        print(
            item["rerank_rank"],
            item["id"],
            round(item["rerank_score"], 3),
            "was", item["original_rank"],
        )
```

Expected first result:

```text
1 d2 ... was 2
```

Study what the stand-in can and cannot do. It uses pair-level evidence such as number and negation agreement, but it does not understand language. A trained cross-encoder learns far richer interactions.

### Lab 2 - Implement ranking metrics

Append:

```python
def precision_at_k(ranked_ids, relevant_ids, k):
    selected = ranked_ids[:k]
    return sum(doc_id in relevant_ids for doc_id in selected) / k

def reciprocal_rank(ranked_ids, relevant_ids):
    for rank, doc_id in enumerate(ranked_ids, start=1):
        if doc_id in relevant_ids:
            return 1.0 / rank
    return 0.0

def dcg_at_k(ranked_ids, grades, k):
    return sum(
        (2 ** grades.get(doc_id, 0) - 1) / math.log2(rank + 1)
        for rank, doc_id in enumerate(ranked_ids[:k], start=1)
    )

def ndcg_at_k(ranked_ids, grades, k):
    actual = dcg_at_k(ranked_ids, grades, k)
    ideal_grades = sorted(grades.values(), reverse=True)[:k]
    ideal = sum(
        (2 ** grade - 1) / math.log2(rank + 1)
        for rank, grade in enumerate(ideal_grades, start=1)
    )
    return actual / ideal if ideal else 0.0

before = ["d1", "d2", "d3", "d4"]
after = [item["id"] for item in ranked]
relevant = {"d2"}
grades = {"d1": 0, "d2": 3, "d3": 0, "d4": 0}

print("MRR before/after:", reciprocal_rank(before, relevant), reciprocal_rank(after, relevant))
print("nDCG@3 before/after:", ndcg_at_k(before, grades, 3), ndcg_at_k(after, grades, 3))
```

Expected:

- reciprocal rank improves from `0.5` to `1.0`;
- nDCG@3 improves to `1.0`.

### Lab 3 - Prove the candidate-recall ceiling

```python
def recall_at_k(ranked_ids, relevant_ids, k):
    if not relevant_ids:
        return 1.0
    return len(set(ranked_ids[:k]) & set(relevant_ids)) / len(relevant_ids)

all_candidates = [
    {"id": "wrong-1", "text": "General loan fees and rates."},
    {"id": "wrong-2", "text": "How monthly repayments are calculated."},
    {"id": "answer", "text": "Prime Loan has no prepayment fee after 12 months."},
]

for candidate_depth in (1, 2, 3):
    shortlist = all_candidates[:candidate_depth]
    output = rerank(query, shortlist)
    ids = [item["id"] for item in output]
    print(
        "depth", candidate_depth,
        "candidate_recall", recall_at_k(ids, {"answer"}, candidate_depth),
        "top1", ids[0],
    )
```

At depths 1 and 2 the answer is absent, so re-ranking cannot put it first. At depth 3 it can.

### Lab 4 - Use a real Sentence Transformers CrossEncoder

This lab requires access to the model registry:

```python
from sentence_transformers import CrossEncoder

model = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")

def cross_encoder_rerank(query, candidates, top_n=5):
    pairs = [(query, item["text"]) for item in candidates]
    scores = model.predict(pairs, batch_size=32, show_progress_bar=False)

    output = []
    for original_rank, (candidate, score) in enumerate(
        zip(candidates, scores), start=1
    ):
        item = dict(candidate)
        item["original_rank"] = original_rank
        item["rerank_score"] = float(score)
        output.append(item)

    output.sort(key=lambda x: (-x["rerank_score"], x["original_rank"], x["id"]))
    return output[:top_n]
```

Important controls:

- inspect the model card and license;
- confirm expected language and domain;
- set maximum length deliberately;
- batch pairs;
- measure CPU and GPU performance separately;
- pin the exact model revision in production.

### Lab 5 - Cohere Rerank

Set the API key outside source code:

```powershell
$env:COHERE_API_KEY = "your-key"
```

Then:

```python
import os
import cohere

def cohere_rerank(query, candidates, top_n=5):
    api_key = os.environ["COHERE_API_KEY"]
    client = cohere.ClientV2(api_key=api_key)
    response = client.rerank(
        model="rerank-v3.5",
        query=query,
        documents=[item["text"] for item in candidates],
        top_n=min(top_n, len(candidates)),
    )

    output = []
    for rerank_rank, result in enumerate(response.results, start=1):
        original = candidates[result.index]
        item = dict(original)
        item["original_rank"] = result.index + 1
        item["rerank_rank"] = rerank_rank
        item["rerank_score"] = float(result.relevance_score)
        output.append(item)
    return output
```

The returned `index` refers to the position in the submitted `documents` list. Map it back to your original candidate object; do not invent IDs from rank positions.

Before sending data to a hosted API:

- confirm data residency, retention, and contractual requirements;
- remove unnecessary personal or secret data;
- apply ACL filters first;
- configure timeout, retry, and rate-limit handling;
- log IDs and timing, not sensitive full text;
- verify the current model name in official documentation.

### Lab 6 - Candidate-depth and latency sweep

```python
def benchmark_depths(query, candidates, relevant_ids, depths, repeats=200):
    rows = []
    for depth in depths:
        subset = candidates[:depth]
        start = time.perf_counter()
        for _ in range(repeats):
            result = rerank(query, subset)
        elapsed_ms = (time.perf_counter() - start) * 1000 / repeats
        ids = [item["id"] for item in result]
        rows.append(
            {
                "depth": depth,
                "candidate_recall": recall_at_k(
                    [item["id"] for item in subset], relevant_ids, depth
                ),
                "mrr": reciprocal_rank(ids, relevant_ids),
                "ms": elapsed_ms,
            }
        )
    return rows

for row in benchmark_depths(
    query, all_candidates, {"answer"}, depths=[1, 2, 3]
):
    print(row)
```

The offline scorer is too cheap for meaningful production latency numbers, but the harness is correct. Replace `rerank` with the real implementation and:

- warm up the model;
- run enough queries;
- report p50 and p95, not only the mean;
- test realistic text lengths and concurrency;
- separate network time from inference time for hosted APIs.

### Lab 7 - Safe pipeline composition

```python
def retrieve_then_rerank(query, identity, retriever, reranker, top_n=5):
    # The retriever must enforce these constraints at the data store.
    filters = {
        "tenant_id": identity["tenant_id"],
        "access_groups": {"$in": identity["groups"]},
        "is_active": True,
    }
    candidates = retriever.search(query=query, top_k=50, filters=filters)

    for item in candidates:
        if item["metadata"]["tenant_id"] != identity["tenant_id"]:
            raise PermissionError("Retriever returned a cross-tenant candidate")

    return reranker(query, candidates, top_n=top_n)
```

The assertion is defense in depth, not a substitute for server-side filtering. Never build `tenant_id` from text in the user's query.

### Lab 8 - Add re-ranking to LangChain and LlamaIndex

Framework APIs move quickly, so understand the stable design:

```text
LangChain:
base retriever
  -> contextual-compression retriever
  -> cross-encoder compressor/reranker
  -> Documents with original metadata

LlamaIndex:
retriever returns Nodes
  -> node postprocessor / SentenceTransformerRerank
  -> top_n Nodes
  -> response synthesizer
```

Illustrative LlamaIndex pattern:

```python
from llama_index.core.postprocessor import SentenceTransformerRerank

reranker = SentenceTransformerRerank(
    model="cross-encoder/ms-marco-MiniLM-L-6-v2",
    top_n=5,
)

query_engine = index.as_query_engine(
    similarity_top_k=50,
    node_postprocessors=[reranker],
)
```

Check the current official integration documentation and pin package versions. Regardless of framework, test the same IDs, ranks, and metrics as the from-scratch pipeline.

---

## 11. Common Confusions

### "Why not use the cross-encoder as the retriever?"
It cannot independently precompute one reusable vector per document. Scoring the entire corpus for every query is too expensive.

### "Does re-ranking increase Recall@50?"
Not if it receives exactly the same 50 candidates. It can improve top-5 recall and ranking metrics by moving relevant items upward, but set recall is unchanged.

### "Should I combine RRF and re-ranker scores?"
Usually sort by the re-ranker score and retain RRF as diagnostic evidence. A weighted combination may help, but tune it on validation data rather than assuming score scales are compatible.

### "Is a higher re-ranker score always relevant?"
No. Scores are model-dependent and often uncalibrated. Evaluate ranks on your domain and inspect mistakes.

### "Should re-ranking happen before metadata filters?"
No. Filters representing authorization, tenancy, effective dates, and mandatory constraints happen before re-ranking. Optional preference boosts can occur later.

### "Can the re-ranker replace good chunking?"
No. It cannot recover text cut away during ingestion or understand an answer split across unusable fragments. Revisit Day 9 if chunks lack coherent evidence.

### "Why did answer quality fall when nDCG improved?"
The re-ranker may favor individually relevant but duplicate chunks, omit complementary evidence, or expose a generator weakness. Evaluate the complete system, not one metric.

---

## 12. Exercises

1. Build 12 queries covering paraphrases, codes, numbers, negation, dates, and multi-constraint questions.
2. Assign graded relevance labels from 0 to 3 to a fixed candidate pool.
3. Compare RRF order with a real cross-encoder using MRR and nDCG@5.
4. Sweep candidate depths `10, 20, 50, 100`; plot nDCG@5 against p95 latency.
5. Sweep final context sizes `3, 5, 8`; measure answer correctness and context tokens.
6. Find three re-ranker regressions and classify each as candidate miss, truncation, domain mismatch, or bad judgment.
7. Add per-document caps after re-ranking and verify that the answer-bearing chunk remains.
8. Simulate a re-ranker timeout and prove that the system returns the authorized fused order with an explicit degraded-mode flag.
9. Write a privacy review for sending your candidate text to a hosted re-ranker.
10. Compare pointwise cross-encoder re-ranking with one LLM listwise prompt on quality, latency, cost, and stability.

---

## 13. Self-Check Quiz

1. Why can a bi-encoder search millions of documents while a cross-encoder normally cannot?
2. What is the most important prerequisite for successful re-ranking?
3. If candidate Recall@50 is 0.86, what is the maximum possible Recall@5 after re-ranking?
4. Which metric supports graded relevance and discounts lower ranks?
5. Why should re-ranker scores not automatically be treated as probabilities?
6. Where must authorization filters be applied?
7. Name three controls for re-ranking latency.
8. What does Cohere's returned document index refer to?
9. Why can passing more candidates reduce end-to-end quality?
10. What should happen if the re-ranker times out?

### Answers

1. Bi-encoders precompute independent document vectors and use an index; cross-encoders must jointly process every query-document pair.
2. High candidate recall: the relevant evidence must be in the shortlist.
3. At most **0.86**; re-ranking cannot recover absent documents.
4. **nDCG@K**.
5. They are usually uncalibrated, model-specific ranking scores.
6. Server-side during/before retrieval, before any candidate text reaches the re-ranker.
7. Candidate depth, text length, model size, batching, hardware, caching, or timeout budget.
8. Its zero-based position in the documents submitted to that API request.
9. It adds latency and may add confusing or duplicate context if final selection is not controlled.
10. Use an explicit, monitored fallback such as the already-authorized fused order; mark re-ranking as not applied.

---

## 14. Resources

- Sentence Transformers documentation: CrossEncoder and re-ranking
- Cohere documentation: Rerank API
- Nogueira and Cho, *Passage Re-ranking with BERT*
- MS MARCO passage ranking benchmark
- BGE reranker model cards and technical reports
- ColBERT: *Efficient and Effective Passage Search via Contextualized Late Interaction*
- BEIR: heterogeneous information retrieval benchmark
- LangChain contextual compression documentation
- LlamaIndex node postprocessor documentation

Always check current package/API documentation because model names and framework imports can change.

---

## ✅ Key Takeaways

1. Retrieval and re-ranking solve different problems: **find broadly, then order carefully**.
2. Cross-encoders are more accurate because they jointly read the query and each candidate.
3. Candidate Recall@N is the hard ceiling on re-ranker success.
4. Hybrid top 20-100 -> re-rank -> top 3-10 is a strong production pattern.
5. Measure MRR/nDCG/Precision, downstream answers, latency, cost, and failures together.
6. Batch inference and monitor truncation.
7. Preserve all IDs, metadata, and stage scores for debugging.
8. Apply access controls before re-ranking, especially before hosted APIs.
9. Use explicit degraded behavior when re-ranking fails.
10. A re-ranker improves evidence selection; it does not repair bad ingestion or missing candidates.

---

## 🔜 Tomorrow: Day 15

**Query transformation** - rewriting ambiguous questions, decomposition, multi-query retrieval, HyDE, routing, and guarding against query drift.