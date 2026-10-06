---
title: "Indexing Methods (Flat, IVF, HNSW, and Quantization)"
day: 11
concept: "How vector databases organize data for fast retrieval"
chapter: 2
chapterTitle: "Data Ingestion and Retrieval"
---

# Day 11: Indexing Methods (Flat, IVF, HNSW, and Quantization)

**30-Day RAG Course, Week 2: Data Ingestion and Retrieval**
**Date:** Oct 9, 2026 | **Estimated time:** 4 hours
**Prerequisites:** [Day 5](../day05_similarity_metrics.md) (metrics, brute-force top-K), [Day 6](../day06_vector_databases.md) (vector DBs, HNSW preview), [Day 10](../day10_metadata_filtering.md) (filtering)

---

## ⚡ Cheat Sheet (1-Minute Revision)

| Concept | Remember this |
|---|---|
| **Why ANN?** | Exact search costs $\mathcal{O}(N \cdot d)$ per query. At millions of vectors, you trade a little **recall** for a lot of **speed**. |
| **The triangle** | **Recall** $\leftrightarrow$ **latency** $\leftrightarrow$ **memory** (plus build time). You tune for an operating point, not a perfect score. |
| **Flat** | Exact, no training, 100% recall. Perfect up to ~100k-1M vectors. Also your **ground truth**. |
| **IVF** | k-means into `nlist` clusters; search the `nprobe` nearest clusters. Needs **training**. `nlist` $\approx \sqrt{N} - 4\sqrt{N}$; raise `nprobe` for recall. |
| **HNSW** | A multi-layer **graph** with greedy navigation. `M` (links: memory/recall), `efConstruction` (build quality), `efSearch` (query recall/latency). The default in most vector DBs. |
| **Quantization** | **SQ8** (4x smaller), **PQ** (16-64x smaller), **binary** (32x smaller). Recover recall with **re-ranking** (refine) on full vectors. |
| **Measure** | Recall@k vs **exact** results + ms/query + MB + build time. Target something like **recall@10** $\ge 0.95$. |
| **Gotchas** | FAISS IVF `nprobe` defaults to $1$; HNSW `efSearch` defaults to $16$. Selective filters hurt HNSW. ANN recall $\ne$ answer relevance. |

---

## 🎯 Learning Objectives

By the end of today, you should be able to:

1. Explain why approximate nearest neighbor (ANN) search is needed and what it trades away.
2. Explain how **Flat**, **IVF**, **HNSW**, and **quantized** indexes work, in plain language.
3. Tune the key parameters (`nlist`, `nprobe`, `M`, `efConstruction`, `efSearch`, PQ `m`) and predict their effects.
4. Estimate **memory** for each index type.
5. Benchmark indexes properly: **recall@k** against exact search, latency, memory, build time.
6. Understand how **filters, updates, and deletes** interact with each index type.
7. Pick an index and settings for a given scale, budget, and recall target, and configure it in real vector DBs.

---

## 🗓️ Suggested Schedule

| Time | Activity |
|---|---|
| 0:00 - 0:20 | Section 1: Why ANN; the recall-latency-memory triangle |
| 0:20 - 1:20 | Section 2-5: Flat, IVF, HNSW, quantization |
| 1:20 - 1:45 | Section 6-9: Other methods, DB support, tuning, filters/updates, decision guide |
| 1:45 - 3:40 | Section 11: Hands-on benchmarks (numpy + FAISS) |
| 3:40 - 4:00 | Exercises and quiz |

---

## ## 1. Why Approximate Nearest Neighbor (ANN) Search?

> 💡 **Intuition:** Exact search is like finding the closest coffee shop by **measuring the distance to every coffee shop on Earth**. It's perfectly accurate and painfully slow once there are millions of them. ANN indexes are like using a **map organized by neighborhoods**: you check only the few neighborhoods near you. Occasionally the closest shop sits just across a boundary you didn't check, so you "miss" it, but you answer in milliseconds instead of seconds. For RAG this trade is almost always worth it: missing the 9th-best chunk out of 10 million rarely changes the answer, while a 2-second retrieval delay is felt by every user.

### ### The cost of exact search

```
Per query:   N x d multiply-adds
10M chunks x 768 dims $\approx$ 7.7 billion operations per query
Memory:      10M x 768 x 4 bytes $\approx$ 30.7 GB (float32), just for the vectors
```

### ### The trade-off triangle

```
          RECALL
        (accuracy)
           / \
          /   \
         /     \
        /       \
       /         \
LATENCY           MEMORY
(speed/QPS)     (RAM/disk, cost)
               + build time, update cost
```

| Knob turned up | Recall | Latency | Memory |
|---|---|---|---|
| IVF `nprobe` | $\uparrow$ | $\uparrow$ (slower) | $-$ |
| HNSW `efSearch` | $\uparrow$ | $\uparrow$ | $-$ |
| HNSW `M` | $\uparrow$ | $\uparrow$ | $\uparrow$ |
| Compression (PQ/SQ/binary) | $\downarrow$ | $\downarrow$ (faster) | $\downarrow$ |
| Re-ranking with full vectors | $\uparrow$ | $\uparrow$ (a little) | $\uparrow$ (full vectors kept) |

> 📌 **ANN recall** means "what fraction of the *exact* top-k did the index return?". It's measured against **Flat search**, not against human relevance. A perfect ANN index still returns whatever your embeddings consider closest.

---

## ## 2. Flat (Brute-Force) Index

> 💡 **Intuition:** Flat means **no index at all**: compare the query with every vector, exactly like Day 5's `corpus @ query`. It's slow at huge scale, but it's **100% accurate, needs no training or tuning, supports instant inserts and deletes**, and is surprisingly fast with optimized matrix math (and GPUs). It's also the **ground truth** you benchmark every other index against.

| Aspect | Details |
|---|---|
| Recall | 100% (exact) |
| Query cost | $\mathcal{O}(N \cdot d)$, highly optimized (BLAS/SIMD/GPU) |
| Memory | $N \times d \times 4\text{ bytes}$ (float32) |
| Build / training | None |
| Inserts / deletes | Trivial |
| Use when | $\le$ 100k-1M vectors, heavily filtered subsets, ground-truth evaluation |

---

## ## 3. IVF (Inverted File Index)

> 💡 **Intuition:** IVF is the **"neighborhoods"** approach. First, k-means groups all vectors into `nlist` clusters, each represented by a **centroid** (the neighborhood's center). Every vector is filed under its nearest centroid (an "inverted list", like a book index listing which pages mention a word). At query time you find the `nprobe` centroids closest to the query and search **only those neighborhoods** exactly. With `nlist=1024` and `nprobe=16`, you scan about $\approx 1.6\%$ of the data. The risk: the true nearest neighbor might live in a neighborhood you didn't visit, especially if the query sits near a boundary. Raising `nprobe` visits more neighborhoods, which is slower but safer.

```
Training:    k-means -> nlist centroids  •  •  •  •  •
Indexing:    each vector -> list of its nearest centroid
Query:       q -> find nprobe nearest centroids -> exact search inside those lists only

[ list 1 ]   [ list 2 ]   [ list 3 ]   [ list 4 ] ... (nlist lists)
    |            |            |            |
    +------------+------------+------------+-- q searches only nprobe = 2 lists
```

| Parameter | Effect | Typical |
|---|---|---|
| `nlist` (clusters) | More clusters = smaller lists = faster, but needs a higher `nprobe` for the same recall | $\approx \sqrt{N}$ to $4\sqrt{N}$ (for example, 1,000-4,000 for 1M vectors) |
| `nprobe` (lists searched) | $\uparrow$ recall, $\uparrow$ latency | 1-5% of `nlist`, then tune |
| Training sample | k-means needs representative data | $\ge 30-40 \times \text{nlist}$ vectors |

| ✅ Pros | ❌ Cons |
|---|---|
| Low memory overhead (just centroids + list IDs) | Needs **training**; retrain if the data distribution shifts |
| Combines naturally with compression (**IVF-PQ**) | Boundary misses $\rightarrow$ lower recall at low `nprobe` |
| Fast to build | Unbalanced clusters make latency uneven |

> ⚠️ In FAISS, `nprobe` **defaults to 1**, which often gives surprisingly poor recall. Always set it.

---

## ## 4. HNSW (Hierarchical Navigable Small World)

> 💡 **Intuition:** HNSW builds a **social network of vectors**: each vector is "friends" with $\sim M$ of its nearest neighbors. Search is like the famous **"six degrees of separation"**: start somewhere, hop to whichever friend is closest to your target, repeat until no friend is closer. To make the early hops long and fast, HNSW adds **layers**, like a **road network**: the top layer has only a few nodes with long-range links (**highways**), lower layers are denser (**main roads**), and the bottom layer contains every vector (**local streets**). You drive the highway toward the right region, exit onto main roads, then walk the local streets to the exact address. `efSearch` is how many candidate addresses you keep in your notebook while walking: a bigger notebook means you're less likely to miss the true nearest one.

```
Layer 2:  •---------------------•                  (few nodes, long links: "highways")
          |                     |
Layer 1:  •---------•-----------•---------•        (more nodes: "main roads")
          |         |           |         |
Layer 0:  •-•-•-•-•-•-•-•-•-•-•-•-•-•-•-•-•-•-•    (all vectors: "local streets")

Search: enter at the top -> greedy hops toward q -> descend -> refine with a candidate list of size efSearch
```

| Parameter | Effect | Typical |
|---|---|---|
| `M` | Links per node. $\uparrow$ recall and robustness, $\uparrow$ memory and build time | 16-64 (16-32 is common) |
| `efConstruction` | Candidate list size **while building**. $\uparrow$ graph quality, $\uparrow$ build time | 64-400 |
| `efSearch` (`ef`) | Candidate list size **while searching**. $\uparrow$ recall, $\uparrow$ latency | 32-256 (must be $\ge k$) |

| ✅ Pros | ❌ Cons |
|---|---|
| Excellent recall/latency trade-off; the **de facto default** | **Memory-hungry**: vectors + graph links ($\approx M \times 2 \times 4\text{ bytes/vector}$ extra, roughly) |
| Incremental inserts (no training) | Deletes are hard (tombstones; periodic rebuilds) |
| Tunable at query time (`efSearch`) | Build is slower than IVF; RAM-resident in most implementations |
| Very selective filters can break graph navigation (Section 8) | |

> ⚠️ In FAISS, HNSW `efSearch` **defaults to 16**. Most vector DBs use higher defaults, but check them.

---

## ## 5. Quantization (Compression)

> 💡 **Intuition:** Quantization is **lossy compression for vectors**, like saving a photo as JPEG. **Scalar quantization (SQ8)** stores each number in 1 byte instead of 4, like reducing color depth: 4x smaller, and barely noticeable. **Product quantization (PQ)** splits each vector into `m` small pieces and replaces each piece with the ID of its closest "prototype" from a learned codebook of 256. It's like describing a face as "eyes #17, nose #203, mouth #88": 16-64x smaller, but details blur. **Binary quantization** keeps only the **sign** of each number (1 bit): 32x smaller, and very blurry. The universal trick to recover accuracy is **re-ranking**: use the compressed vectors to quickly shortlist, say, 100 candidates, then re-score only those with the full-precision vectors.

| Method | Bytes/vector ($d=384$) | Compression | Recall impact | Notes |
|---|---|---|---|---|
| float32 (none) | 1,536 | 1x | Baseline | |
| float16 / bfloat16 | 768 | 2x | $\approx$ none | Easy win |
| **SQ8** (int8) | 384 | 4x | Small | Widely supported (Qdrant, pgvector `halfvec`/int, FAISS SQ8) |
| **PQ** (m=48, 8 bits) | 48 | 32x | Moderate-large | Needs training; asymmetric distance computation (ADC) |
| **Binary** (1 bit/dim) | 48 | 32x | Large alone; good with **rescoring** | Hamming distance is extremely fast |
| Any of these + re-ranking | + full vectors (RAM or disk) | $-$ | Recovers most recall | Keep the originals, possibly on disk |

### ### Memory math (1M vectors, $d=768$)

| Index | Approx. memory |
|---|---|
| Flat float32 | $1\text{M} \times 768 \times 4 \approx \textbf{3.1 GB}$ |
| HNSW (M=32) float32 | $3.1\text{ GB} + \approx 0.26\text{ GB links} \approx \textbf{3.4 GB}$ |
| HNSW + SQ8 | $\approx 0.77\text{ GB} + \text{links} \approx \textbf{1.0 GB}$ |
| IVF-PQ (m=96) | $1\text{M} \times 96\text{ B} \approx \textbf{0.1 GB}$ (+ centroids) |
| Binary | $1\text{M} \times 96\text{ B} \approx \textbf{0.1 GB}$ |

---

## ## 6. Other Methods Worth Knowing

| Method | Idea | Where |
|---|---|---|
| **DiskANN / Vamana** | Graph index designed to live on **SSD**, with compressed vectors in RAM | Milvus, Azure (Cosmos DB, SQL), pgvectorscale |
| **ScaNN** | Anisotropic quantization + tree + re-scoring (Google) | ScaNN library, AlloyDB, Vertex AI Vector Search |
| **SPANN / SPFresh** | Disk-based IVF-style partitions with memory-resident centroids | Research / Microsoft |
| **LSH** (locality-sensitive hashing) | Hash similar vectors to the same buckets | Older; mostly superseded for dense embeddings |
| **Tree-based** (Annoy, KD-trees) | Space partitioning with trees | Annoy (Spotify); KD-trees fail in high dimensions |
| **GPU indexes** (CAGRA, IVF on GPU) | Massive parallelism | FAISS GPU, cuVS, Milvus |

---

## ## 7. Indexes in Vector Databases

| DB | Index types | Key knobs |
|---|---|---|
| **FAISS** | Everything: Flat, IVF, HNSW, PQ, SQ, binary, GPU | `index_factory` strings; `nprobe`, `efSearch` |
| **Chroma** | HNSW (hnswlib) | `hnsw:M`, `hnsw:construction_ef`, `hnsw:search_ef` (collection metadata; newer versions use a `configuration` object) |
| **pgvector** | HNSW, IVFFlat | `WITH (m, ef_construction)`, `SET hnsw.ef_search`; `WITH (lists)`, `SET ivfflat.probes`; iterative scans for filters |
| **Qdrant** | HNSW + scalar/product/binary quantization | `m`, `ef_construct`, `hnsw_ef`, `quantization_config`, `rescore` |
| **Weaviate** | HNSW, Flat, dynamic (Flat $\rightarrow$ HNSW), with PQ/BQ/SQ | `ef`, `efConstruction`, `maxConnections` |
| **Milvus** | FLAT, IVF_FLAT, IVF_SQ8, IVF_PQ, DISKANN, SCANN, GPU_* | Per index type |
| **Elasticsearch / OpenSearch** | HNSW (Lucene), int8/int4/bbq quantization; OpenSearch also has FAISS engines (IVF, PQ) | `m`, `ef_construction`, `num_candidates` |
| **Pinecone** | Proprietary, managed (no index tuning) | $-$ |

---

## ## 8. Filters, Updates and Deletes vs Index Type

> 💡 **Intuition:** A graph index is a road network built for **all** addresses. Add a filter that allows only 0.5% of houses, and most roads now lead to houses you're not allowed to visit. The search may run out of candidates (`efSearch`) before finding enough valid ones, which means low recall, or even fewer than $k$ results. IVF suffers less (it just scans lists and skips invalid items), and Flat on a small filtered subset is often the fastest and most exact option. Updates differ too: graphs accept inserts easily but deletes leave "holes"; IVF needs retraining if the data drifts.

| Situation | Flat | IVF | HNSW |
|---|---|---|---|
| Very selective filter ($<1\%$) | ✅ Exact on the subset (fast when the subset is small) | ⚠️ May need a higher `nprobe` | ❌ Recall can collapse; needs higher `ef`, filtered-HNSW variants, or a fallback to Flat |
| Moderate filter ($10-50\%$) | OK | ✅ | ✅ (slightly higher `ef`) |
| Inserts | ✅ | ⚠️ (assign to the nearest list) | ✅ (incremental) |
| Deletes | ✅ | ⚠️ (remove from list) | ⚠️ Tombstones $\rightarrow$ periodic rebuild |
| Data drift (new topics) | ✅ | ⚠️ Retrain centroids | ✅ Mostly OK |

> 📌 **Many DBs switch strategies automatically** (for example, **pre-filter + brute force** when the filter is very selective, or **iterative/relaxed scans** in pgvector $\ge 0.8$). Know what yours does.

---

## ## 9. How to Choose

```
How many vectors?
  $\le$ ~100k (or heavily filtered subsets) -> Flat. Done.
  100k - ~10M, RAM available             -> HNSW (M=16-32, efSearch tuned for recall@10 $\ge$ 0.95)
  10M+ or RAM-constrained                -> HNSW + SQ8 / IVF-PQ + re-ranking / DiskANN
  Billions                               -> IVF-PQ (GPU), DiskANN, distributed DBs (Milvus, Vespa...)
Frequent deletes/updates?                -> Plan periodic rebuilds (HNSW) or choose DB-managed compaction
Many small tenants / selective filters?  -> Partition (namespace per tenant) or Flat per partition
```

### ### Tuning methodology

1. Build a **Flat** index $\rightarrow$ compute the **ground-truth** top-k for 200-1,000 representative queries.
2. For each candidate index/setting: measure **recall@k**, **p50/p95 latency**, **memory**, and **build time**.
3. Plot recall vs latency; pick the **cheapest setting that meets your recall target** (for example, $\ge 0.95$).
4. Re-check **end-to-end RAG quality** (answer-containment recall from Day 9), which is what users feel.

---

## ## 10. ⚠️ Pitfalls

| Pitfall | Symptom | Fix |
|---|---|---|
| Forgetting `nprobe` / `efSearch` | Mysteriously low recall | Set and tune them explicitly (FAISS defaults: 1 / 16) |
| Measuring ANN against ANN | "Recall = 1.0" but results are wrong | Ground truth must come from **exact (Flat)** search |
| Training IVF/PQ on a tiny or unrepresentative sample | Unbalanced lists, poor recall | Train on $\ge 30-40 \times \text{nlist}$ representative vectors |
| Ignoring normalization with inner product | Rankings differ from cosine | Normalize vectors (Day 5) before building an IP index |
| HNSW memory surprise | Out-of-memory at scale | Budget for links; use SQ8/PQ/disk-based indexes |
| Benchmarking on random data | Pessimistic or unrealistic numbers | Use **real embeddings** (or at least clustered data) |
| Selective filters + HNSW | Too few results | Higher `ef`, filtered-ANN features, fallback to Flat, partitions |
| Chasing recall 0.999 | 3x latency for invisible gains | Stop at the knee of the curve; check end-to-end quality |

---

## ## 11. 🧪 Hands-On (numpy + FAISS)

### ### Setup

```bash
pip install faiss-cpu numpy
```

> 📌 **Run the labs in order in one notebook or script**. Everything runs on a laptop CPU in a few minutes (the PQ build in Lab 3 takes ~1-2 minutes). Real embeddings cluster by **topic $\rightarrow$ subtopic**, with fuzzy boundaries, so we simulate them with **hierarchical clustered vectors** (Day 6 showed that uniform random vectors are an unrealistic worst case).

---

### ### Lab 0: Data, ground truth, and benchmarking helpers

```python
import time
import faiss
import numpy as np

faiss.omp_set_num_threads(1)  # single thread -> fair per-query latency comparisons
rng = np.random.default_rng(0)

N, D, NQ, K = 50_000, 384, 200, 10
TOPICS, SUBTOPICS, SUB_SPREAD, POINT_SPREAD = 100, 1_000, 0.8, 1.6

def f32(a) -> np.ndarray:
    return np.ascontiguousarray(a, dtype="float32")

topic_centers = f32(rng.normal(size=(TOPICS, D)))
faiss.normalize_L2(topic_centers)
sub_centers = f32(topic_centers[rng.integers(0, TOPICS, SUBTOPICS)]
                 + (SUB_SPREAD / np.sqrt(D)) * rng.normal(size=(SUBTOPICS, D)))
faiss.normalize_L2(sub_centers)

def make_points(n: int) -> np.ndarray:
    pts = f32(sub_centers[rng.integers(0, SUBTOPICS, n)] + (POINT_SPREAD / np.sqrt(D)) * rng.normal(size=(n, D)))
    faiss.normalize_L2(pts)
    return pts

xb = make_points(N)       # database vectors ("chunks")
xq = make_points(NQ)      # queries (new points, not copies of the database)

# Ground truth = exact search
flat = faiss.IndexFlatIP(D)
flat.add(xb)
t0 = time.perf_counter()
_, GT = flat.search(xq, K)
flat_ms = (time.perf_counter() - t0) / NQ * 1000

def recall_at_k(found: np.ndarray, gt: np.ndarray = None, k: int = K) -> float:
    gt = GT if gt is None else gt
    return float(np.mean([len(set(found[i, :k]) & set(gt[i, :k])) / k for i in range(len(found))]))

def index_mb(index) -> float:
    return faiss.serialize_index(index).nbytes / 1e6

RESULTS = []

def bench(name: str, index, build_s: float = 0.0) -> dict:
    t0 = time.perf_counter()
    _, found = index.search(xq, K)
    ms = (time.perf_counter() - t0) / NQ * 1000
    row = {"index": name, "recall@10": recall_at_k(found), "ms/query": ms, "MB": index_mb(index), "build_s": build_s}
    RESULTS.append(row)
    print(f"{name:32} recall@10={row['recall@10']:.3f} {ms:7.3f} ms/q {row['MB']:8.1f} MB build {build_s:5.1f}s")
    return row

print(f"Data: {N:,} x {D} | Flat: {flat_ms:.3f} ms/query, {index_mb(flat):.1f} MB, recall 1.000 (by definition)")
RESULTS.append({"index": "Flat (exact)", "recall@10": 1.0, "ms/query": flat_ms, "MB": index_mb(flat), "build_s": 0.0})
```

---

### ### Lab 1: IVF from scratch (to understand it), then with FAISS

```python
def kmeans(x: np.ndarray, k: int, iters: int = 10) -> np.ndarray:
    cent = x[rng.choice(len(x), k, replace=False)].copy()
    for _ in range(iters):
        assign = np.argmax(x @ cent.T, axis=1)    # nearest centroid (cosine on unit vectors)
        for c in range(k):
            members = x[assign == c]
            if len(members):
                cent[c] = members.mean(axis=0)
        cent /= np.linalg.norm(cent, axis=1, keepdims=True)
    return cent

NLIST = 256
t0 = time.perf_counter()
centroids = kmeans(xb[rng.choice(N, 20_000, replace=False)], NLIST)   # train on a sample
lists = np.argmax(xb @ centroids.T, axis=1)                          # file every vector under a centroid
inverted = {c: np.where(lists == c)[0] for c in range(NLIST)}
print(f"Mini-IVF built in {time.perf_counter() - t0:.1f}s; list sizes: min={min(map(len, inverted.values()))}, "
      f"max={max(map(len, inverted.values()))}")

def mini_ivf_search(q: np.ndarray, nprobe: int, k: int = K) -> np.ndarray:
    probe = np.argsort(-(centroids @ q))[:nprobe]           # nearest neighborhoods
    cand = np.concatenate([inverted[c] for c in probe])
    top = cand[np.argsort(-(xb[cand] @ q))[:k]]             # exact search inside them
    return np.pad(top, (0, k - len(top)), constant_values=-1)

for nprobe in (1, 4, 16, 64):
    t0 = time.perf_counter()
    found = np.stack([mini_ivf_search(q, nprobe) for q in xq])
    ms = (time.perf_counter() - t0) / NQ * 1000
    scanned = nprobe / NLIST
    print(f"mini-IVF nprobe={nprobe:<3} scans ~{scanned:5.1%} of data  recall@10={recall_at_k(found):.3f} {ms:6.2f} ms/q")
```

> 📝 **Observe:** With `nprobe=1`, you scan well under 1% of the data, but you miss some neighbors that live in adjacent clusters. Recall climbs as `nprobe` grows, and so does latency. **That's IVF in 20 lines.**

**Now the real thing (FAISS), sweeping `nlist` and `nprobe`:**

```python
for nlist in (256, 1024):
    ivf = faiss.index_factory(D, f"IVF{nlist},Flat", faiss.METRIC_INNER_PRODUCT)
    t0 = time.perf_counter()
    ivf.train(xb)
    ivf.add(xb)
    build = time.perf_counter() - t0
    for nprobe in (1, 8, 32):
        faiss.ParameterSpace().set_index_parameter(ivf, "nprobe", nprobe)
        bench(f"IVF{nlist},Flat nprobe={nprobe}", ivf, build)
```

> 📝 **Observe:**
> - `nprobe=1` (the FAISS default!) gives the lowest recall, especially with **more, smaller clusters** (`nlist=1024`), where neighbors are more likely to sit across a boundary.
> - A modest `nprobe` (for example, 8) recovers nearly all the recall while still scanning a small fraction of the data.
> - ⚠️ Synthetic clusters are cleaner than real embeddings, so IVF looks **easier here than in production**. On real data you'll typically need a larger `nprobe` (Exercise 5).

---

### ### Lab 2: HNSW: `M` and `efSearch`

```python
for M in (16, 32):
    hnsw = faiss.IndexHNSWFlat(D, M, faiss.METRIC_INNER_PRODUCT)
    hnsw.hnsw.efConstruction = 100
    t0 = time.perf_counter()
    hnsw.add(xb)
    build = time.perf_counter() - t0
    for ef in (16, 64, 256):
        hnsw.hnsw.efSearch = ef
        bench(f"HNSW{M} efSearch={ef}", hnsw, build)
```

> 📝 **Observe:**
> - `efSearch` is your **query-time dial**: higher = better recall, slower queries, **no rebuild needed**.
> - `M=32` costs more **memory** and **build time** than `M=16`, but reaches high recall at lower `efSearch`.
> - Compare the MB column with Flat: HNSW stores the **full vectors plus the graph links**.

---

### ### Lab 3: Compression: SQ8, PQ, and re-ranking

```python
# (a) SQ8: int8 vectors inside HNSW
sq8 = faiss.index_factory(D, "HNSW32,SQ8", faiss.METRIC_INNER_PRODUCT)
t0 = time.perf_counter()
sq8.train(xb)
sq8.add(xb)
build = time.perf_counter() - t0
faiss.ParameterSpace().set_index_parameter(sq8, "efSearch", 64)
bench("HNSW32,SQ8 efSearch=64", sq8, build)

# (b) PQ + re-ranking with full vectors (RFlat). One build, then sweep the re-rank factor.
pq = faiss.index_factory(D, "IVF256,PQ48,RFlat", faiss.METRIC_INNER_PRODUCT)
t0 = time.perf_counter()
pq.train(xb[:15_000])                  # train codebooks on a sample (faster)
pq.add(xb)
build = time.perf_counter() - t0
faiss.ParameterSpace().set_index_parameter(pq, "nprobe", 32)
for k_factor in (1, 4, 16):           # k_factor=1 $\approx$ PQ ranking alone (no extra candidates)
    faiss.ParameterSpace().set_index_parameter(pq, "k_factor_rf", k_factor)
    bench(f"IVF256,PQ48,RFlat k_factor={k_factor}", pq, build)

pq_only_mb = N * 48 / 1e6
print(f"(PQ codes alone $\approx$ {pq_only_mb:.1f} MB; the RFlat index also stores the full float32 vectors for re-ranking)")
```

> 📝 **Observe:**
> - **SQ8** keeps recall close to full-precision HNSW, with the vectors stored at a quarter of the size.
> - **PQ48 on its own** (`k_factor=1`) loses a lot of recall: 48 bytes can't preserve the fine differences between near neighbors.
> - **Re-ranking** a larger shortlist (`k_factor=4`, `16`) with full vectors recovers recall to ~0.9+ and then ~1.0. The catch: the MB column grows back, because the full vectors must be kept (in production they can live on **disk**, with only the PQ codes in RAM).

---

### ### Lab 4: Binary quantization + rescoring (in numpy)

```python
def to_bits(x: np.ndarray) -> np.ndarray:
    return np.packbits(x > 0, axis=1)          # 384 dims -> 48 bytes

xb_bits, xq_bits = to_bits(xb), to_bits(xq)
print(f"Binary DB size: {xb_bits.nbytes / 1e6:.1f} MB  vs float32 {xb.nbytes / 1e6:.1f} MB")

def binary_search(qi: int, k: int = K, rescore: int = 0) -> np.ndarray:
    ham = np.bitwise_count(np.bitwise_xor(xb_bits, xq_bits[qi])).sum(axis=1)  # Hamming distance
    if rescore:
        cand = np.argpartition(ham, rescore)[:rescore]                         # shortlist by Hamming
        return cand[np.argsort(-(xb[cand] @ xq[qi]))[:k]]                      # re-score with full vectors
    return np.argsort(ham, kind="stable")[:k]

for rescore in (0, 50, 200, 1000):
    t0 = time.perf_counter()
    found = np.stack([binary_search(i, rescore=rescore) for i in range(NQ)])
    ms = (time.perf_counter() - t0) / NQ * 1000
    label = "binary only" if not rescore else f"binary + rescore top {rescore}"
    print(f"{label:<28} recall@10={recall_at_k(found):.3f} {ms:6.2f} ms/q")
```

> 📝 **Observe:** Binary codes alone are **32x smaller** but coarse (recall well below 0.5). Rescoring a few hundred candidates with full vectors brings recall back above ~0.9. This is the pattern behind "binary quantization + rescore" in Qdrant, Weaviate, and Elasticsearch. (`np.bitwise_count` needs NumPy $\ge 2.0$. Our per-query numpy loop is **slow**; real engines use SIMD popcount and are orders of magnitude faster, so judge the **recall** here, not the ms/query.)

---

### ### Lab 5: The Pareto table: pick an operating point

```python
print(f"\n{'index':<42} {'recall@10':>9} {'ms/query':>9} {'MB':>8} {'build s':>8}")
for r in sorted(RESULTS, key=lambda r: r["ms/query"]):
    flag = "  ✅" if r["recall@10"] >= 0.95 else ""
    print(f"{r['index']:<42} {r['recall@10']:>9.3f} {r['ms/query']:>9.3f} {r['MB']:>8.1f} {r['build_s']:>8.1f}{flag}")

TARGET = 0.95
ok = [r for r in RESULTS if r["recall@10"] >= TARGET and r["index"] != "Flat (exact)"]
if ok:
    fastest = min(ok, key=lambda r: r["ms/query"])
    smallest = min(ok, key=lambda r: r["MB"])
    print(f"\nFastest meeting recall $\ge$ {TARGET}: {fastest['index']}")
    print(f"Smallest meeting recall $\ge$ {TARGET}: {smallest['index']}")
```

> 📝 **Observe:**
> - There's **no single winner**, and the ranking depends on your data. On this cleanly clustered synthetic data, **IVF with a small `nprobe`** is the fastest way to hit the target (clean clusters favor IVF). On real embeddings, whose cluster boundaries are fuzzier, IVF usually needs a larger `nprobe`, and **HNSW** typically wins the latency race at high recall.
> - The **smallest** index meeting the target is the compressed one (**HNSW + SQ8**, about 2.5x smaller than HNSW). PQ codes are smaller still, if you can keep the full vectors for re-ranking on disk.
> - Your choice depends on whether **latency** or **memory/cost** is your binding constraint. And at only 50k vectors, **Flat (~2 ms/query) is still perfectly usable**!

---

### ### Lab 6: Filters vs HNSW (selectivity matters)

```python
hnsw = faiss.IndexHNSWFlat(D, 32, faiss.METRIC_INNER_PRODUCT)
hnsw.hnsw.efConstruction = 100
hnsw.add(xb)

print(f"{'selectivity':>11} {'HNSW ef=64':>11} {'HNSW ef=512':>12} {'short(<k)':>10}")
for selectivity in (0.5, 0.05, 0.005):
    allowed = np.where(rng.random(N) < selectivity)[0].astype("int64")  # e.g., one tenant / one product
    # Exact filtered ground truth: brute force on the allowed subset
    sub = xb[allowed]
    gt_sub = allowed[np.argsort(-(xq @ sub.T), axis=1)[:, :K]]

    row = []
    for ef in (64, 512):
        params = faiss.SearchParametersHNSW(sel=faiss.IDSelectorBatch(allowed), efSearch=ef)
        _, found = hnsw.search(xq, K, params=params)
        short = float(np.mean((found == -1).any(axis=1)))
        row.append((recall_at_k(found, gt_sub), short))
    print(f"{selectivity:>11.1%} {row[0][0]:>11.3f} {row[1][0]:>12.3f} {row[0][1]:>10.1%}")
```

> 📝 **Observe:**
> - At 50% selectivity, filtered HNSW behaves almost like unfiltered HNSW.
> - At 5%, recall at `ef=64` starts to slip; raising `ef` fixes it.
> - At **0.5%**, recall **collapses** (roughly 0.25 at `ef=64`), and almost every query returns **fewer than k** results. Even `ef=512` only partially helps. The graph walk spends its budget on nodes that the filter rejects.
> - For tiny subsets, **exact search on the subset** (what we used for the ground truth) is fast and perfect. That's why many vector DBs switch to it automatically for selective filters.

---

### ### Lab 7 (Reference): Setting index parameters in real databases

**Chroma (HNSW):**
```python
import chromadb

client = chromadb.PersistentClient(path="./chroma_day11")
col = client.get_or_create_collection(
    "tuned",
    metadata={"hnsw:space": "cosine", "hnsw:M": 32, "hnsw:construction_ef": 200, "hnsw:search_ef": 100},
    embedding_function=None,
)
# Newer Chroma versions also accept a `configuration={"hnsw": {...}}` argument; check your version's docs.
```

**pgvector (HNSW / IVFFlat):**
```sql
CREATE INDEX ON chunks USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
SET hnsw.ef_search = 100;                      -- per session / transaction

CREATE INDEX ON chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 1000);
SET ivfflat.probes = 20;

-- pgvector >= 0.8: keep scanning until enough rows pass the WHERE filter
SET hnsw.iterative_scan = relaxed_order;
```

**Qdrant (HNSW + scalar quantization + rescoring):**
```python
from qdrant_client import QdrantClient, models

qc = QdrantClient(":memory:")
qc.create_collection(
    "tuned",
    vectors_config=models.VectorParams(size=384, distance=models.Distance.COSINE),
    hnsw_config=models.HnswConfigDiff(m=16, ef_construct=128),
    quantization_config=models.ScalarQuantization(
        scalar=models.ScalarQuantizationConfig(type=models.ScalarType.INT8, always_ram=True),
    )
)
# At query time: search_params=models.SearchParams(hnsw_ef=128, quantization=models.QuantizationSearchParams(rescore=True))
```

---

## ## ❓ Common Confusions

| ❌ Misconception | ✅ Reality |
|---|---|
| "ANN recall 0.95 means 95% of answers are correct." | It means 95% overlap with the **exact** top-k. Answer quality also depends on embeddings, chunking, and the LLM. |
| "HNSW is always the best index." | It's a great default, but memory-hungry. Small corpora $\rightarrow$ Flat; huge or RAM-bound $\rightarrow$ IVF-PQ, SQ, DiskANN. |
| "Once built, the index settings are fixed." | Query-time knobs (`efSearch`, `nprobe`) can be tuned **without rebuilding**. `M`, `nlist`, and PQ settings need a rebuild. |
| "Compression always ruins accuracy." | SQ8 is nearly lossless, and PQ/binary + **re-ranking** recover most recall at a fraction of the memory. |
| "Benchmarks on random vectors predict production." | Random data is a worst case. Benchmark with **real embeddings** and realistic queries. |
| "Filtering doesn't affect ANN quality." | Very selective filters can sharply reduce HNSW recall or return fewer than k results. |
| "I need an ANN index for my 20k-chunk RAG app." | Flat search over 20k vectors takes about a millisecond. Keep it simple. |

---

## ## 🏋️ Exercises

1. **Scale test:** Re-run Labs 0 and 2 with $N = 20\text{k}, 100\text{k},$ and $500\text{k}$. Plot Flat vs HNSW latency against $N$. Where does HNSW start to clearly win?
2. **Knee finder:** For HNSW32, sweep `efSearch` $\in \{8, 16, 24, 32, 48, 64, 96, 128, 256\}$ and plot recall vs ms/query. Where is the "knee"?
3. **IVF rule of thumb:** For $N = 100\text{k}$, compare `nlist` $= 100, 316\text{ }(\sqrt{N}), 1{,}264\text{ }(4\sqrt{N})$. For each, find the smallest `nprobe` that reaches $\text{recall} \ge 0.95$.
4. **PQ sizing:** Try `PQ24`, `PQ48`, `PQ96` (with and without `RFlat`). Tabulate bytes/vector vs recall.
5. **Real embeddings:** Replace the synthetic data with MiniLM embeddings of ~20k real sentences (for example, a Wikipedia or news dataset) and repeat Lab 2. Are the recall curves better or worse than synthetic?
6. **Filter fallback:** Implement `smart_filtered_search(q, allowed_ids)` that uses exact search when `len(allowed) < 2_000` and filtered HNSW otherwise. Compare recall and latency with Lab 6.
7. **Memory budget:** You have 10M chunks, $d = 768$, and a 16 GB RAM budget with $\ge 0.95\text{ recall@10}$ required. Propose two index configurations with memory estimates.

---

## ## 📑 Quiz (Self-Check)

1. What does ANN trade away, and what does it gain?
2. What are `nlist` and `nprobe` in IVF, and how does each affect recall and speed?
3. Explain HNSW's layers with an analogy.
4. Which HNSW parameter can you change at query time without rebuilding?
5. Why is HNSW memory-hungry?
6. What does product quantization store per vector?
7. How does re-ranking (refine/rescore) recover recall after compression?
8. How should ANN recall be measured?
9. Why can very selective filters hurt HNSW, and what are two mitigations?
10. You have 50k chunks. Which index do you use, and why?

<details>
<summary><b>Answers</b></summary>

1. It trades a small amount of **recall** (exactness) for large gains in **speed** (and sometimes memory).
2. `nlist` = number of k-means clusters (more = smaller lists = faster, but you need more probes); `nprobe` = clusters searched per query (more = higher recall, slower).
3. Like a **road network**: sparse top layers are highways for long jumps, and the dense bottom layer is local streets for the exact neighbors. Search goes greedily top-down.
4. `efSearch` (`ef`).
5. It stores the **full vectors plus graph links** (~$M$ neighbors per node, per layer) in RAM.
6. `m` small **codebook IDs** (usually 1 byte each), one per sub-vector: for example, 48 bytes for PQ48.
7. It uses the compressed index to **shortlist** extra candidates, then **re-scores** them with the full-precision vectors to get the true top-k.
8. As the overlap between the ANN top-k and the **exact (Flat)** top-k, over many representative queries.
9. Graph traversal visits many disallowed nodes and can run out of candidates before finding enough allowed ones. Mitigations: higher `ef`, filtered-ANN features/iterative scans, exact search on small subsets, partitioning.
10. **Flat**: exact, no tuning, instant updates, and fast enough (~1 ms) at that scale.

</details>

---

## ## 📚 Resources

### ### Papers
* **Efficient and robust approximate nearest neighbor search using HNSW graphs** (Malkov & Yashunin, 2016): [https://arxiv.org/abs/1603.09320](https://arxiv.org/abs/1603.09320)
* **Product Quantization for Nearest Neighbor Search** (Jégou, Douze, Schmid, 2011): [https://ieeexplore.ieee.org/document/5432202](https://ieeexplore.ieee.org/document/5432202)
* **The Faiss library** (Douze et al., 2024): [https://arxiv.org/abs/2401.08281](https://arxiv.org/abs/2401.08281)
* **DiskANN: Fast Accurate Billion-point Nearest Neighbor Search on a Single Node** (Subramanya et al., NeurIPS 2019)
* **Accelerating Large-Scale Inference with Anisotropic Vector Quantization** (ScaNN, Guo et al., 2020): [https://arxiv.org/abs/1908.10396](https://arxiv.org/abs/1908.10396)

### ### Docs and guides
* FAISS wiki: *Guidelines to choose an index*: [https://github.com/facebookresearch/faiss/wiki/Guidelines-to-choose-an-index](https://github.com/facebookresearch/faiss/wiki/Guidelines-to-choose-an-index)
* FAISS wiki: *The index factory*: [https://github.com/facebookresearch/faiss/wiki/The-index-factory](https://github.com/facebookresearch/faiss/wiki/The-index-factory)
* Pinecone Learning Center: *Faiss: The Missing Manual* (IVF, PQ, HNSW chapters): [https://www.pinecone.io/learn/series/faiss/](https://www.pinecone.io/learn/series/faiss/)
* pgvector README (HNSW, IVFFlat, iterative scans): [https://github.com/pgvector/pgvector](https://github.com/pgvector/pgvector)
* Qdrant: *Quantization*: [https://qdrant.tech/documentation/guides/quantization/](https://qdrant.tech/documentation/guides/quantization/)

### ### Benchmarks
* ANN-Benchmarks: [https://ann-benchmarks.com/](https://ann-benchmarks.com/)
* Big-ANN Benchmarks (NeurIPS competitions): [https://big-ann-benchmarks.com/](https://big-ann-benchmarks.com/)

---

## ## 🔑 Key Takeaways

* **ANN = trade a little recall for a lot of speed.** Tune along the **recall-latency-memory** triangle.
* **Flat is exact and fine up to ~100k-1M vectors; it's also your ground truth.**
* **IVF searches a few k-means neighborhoods (`nlist`, `nprobe`); HNSW navigates a layered graph (`M`, `efConstruction`, `efSearch`).**
* **Compression (SQ8, PQ, binary) slashes memory; re-ranking with full vectors wins back recall.**
* **Benchmark properly**: recall vs exact search, latency, memory, and build time on **realistic data**. Pick the cheapest point that meets your target.
* Watch the **defaults** (FAISS `nprobe=1`, `efSearch=16`) and **selective filters**.

---

## ⏭️ Next: Day 12: Keyword Search (BM25 and Sparse Retrieval)
Why exact words still matter (IDs, codes, names, rare terms), how BM25 scores documents, and learned sparse retrieval (SPLADE), setting up hybrid search on Day 13.