# Day 5: Similarity Metrics (Cosine, Dot Product, Euclidean)

> **30-Day RAG Course, Week 1: Foundations**
>
> **Date:** Oct 3, 2026 | **Estimated time:** 3 hours
>
> **Prerequisite:** [Day 4: Text Embeddings](./day04_text_embeddings.md)

---

## 📌 Cheat Sheet (1-Minute Revision)

| Concept | Remember this |
|---|---|
| **Dot product** | $\sum a_i b_i$. Higher = better. Uses **direction + length**. |
| **Cosine** | $\text{dot} / (\Vert a \Vert \Vert b \Vert)$. Higher = better. Uses **direction only**. Range $[-1, 1]$. |
| **Euclidean (L2)** | $\Vert a - b \Vert$. **Lower = better** (a distance). |
| **Key identity** | For unit vectors: $\cos = \text{dot}$, and $L2^2 = 2 - 2 \cdot \cos$, so **all rankings are identical**. |
| **Best practice** | **Normalize + inner product** = cosine quality at dot-product speed. |
| **Which metric?** | The one the **model was trained with** (check the model card). |
| **Distances** | Lower = better. Cosine distance = $1 - \cos$. FAISS `IndexFlatL2` returns **squared** L2. Chroma defaults to **L2**. |
| **Thresholds** | **Model-specific.** Tune on labeled answerable/unanswerable questions. |
| **Brute force** | $O(N \cdot d)$ per query. Fine up to ~100k-1M vectors; beyond that, use **ANN** (Day 11). |
| **MMR** | $\lambda = 1 \rightarrow$ pure relevance, $\lambda = 0 \rightarrow$ pure diversity. Typical **0.5-0.7**. |

---

## 🎯 Learning Objectives

By the end of today, you should be able to:

1. Compute **dot product, cosine similarity, and Euclidean distance** by hand and in code.
2. Explain how each metric treats **direction** vs **magnitude**.
3. Prove why, for **normalized vectors**, all three metrics give the **same ranking**.
4. Pick the right metric for an embedding model and **configure it in a vector DB** (FAISS, Chroma, pgvector, Pinecone, Qdrant).
5. Convert between **similarity and distance** scores without sorting the wrong way.
6. Understand **high-dimensional behavior** and why similarity thresholds are model-specific.
7. Implement **fast vectorized top-K search** and **MMR** (diverse retrieval).

---

## 📅 Suggested Schedule

| Time | Activity |
|---|---|
| 0:00 - 0:20 | Section 1-2: Why metrics matter; vector basics |
| 0:20 - 1:00 | Section 3-5: Dot, cosine, Euclidean; the normalization identity |
| 1:00 - 1:30 | Section 6-9: Choosing metrics, vector DB settings, scores vs distances, high dimensions |
| 1:30 - 1:45 | Section 10: MMR (diversity) |
| 1:45 - 2:45 | Section 11: Hands-on labs (numpy only) |
| 2:45 - 3:00 | Exercises and quiz |

---

## 1. Why Similarity Metrics Matter

> 🧭 **Intuition:** "Find the nearest restaurant" sounds precise until you ask: nearest by **straight line**, by **driving time**, or by **type of food**? Each definition gives a different answer. Vector search has the same issue: "nearest chunk" only means something once you pick a **metric**. The metric is literally your **definition of relevance written in math**, and it's usually set once when you create the index and then forgotten. Today you'll learn why, for well-prepared embeddings, the choice matters less than you'd fear, and why, when it's done wrong, it fails silently.

Retrieval in RAG is a **nearest-neighbor search**:

> *"Given the query vector **q**, find the K document vectors **closest** to it."*

The **similarity metric defines what "closest" means**. Pick the wrong one (or sort the wrong way) and your retriever quietly returns the wrong chunks.

```text
          ^
          |      * d1 (loan policy)
          |     /
          |    /
          |   / * q (user query)
          |  /     * d2 (loan FAQ)
          | /
          +-----------------------* d3 (credit card fees)
```

---

## 2. Vector Basics (2-Minute Refresher)

For vectors **a** = ($a_1, a_2, \dots, a_d$) and **b** = ($b_1, b_2, \dots, b_d$):

| Concept | Formula | Meaning |
|---|---|---|
| **Dot product** | $a \cdot b = \sum a_i b_i$ | Combines direction **and** length |
| **Magnitude (L2 norm)** | $\Vert a \Vert = \sqrt{\sum a_i^2}$ | Length of the vector |
| **Unit vector** | $\hat{a} = a / \Vert a \Vert$ | Same direction, length 1 ("normalized") |
| **Angle** | $\cos \theta = a \cdot b / (\Vert a \Vert \Vert b \Vert)$ | How aligned the directions are |

### Worked example (2D)
**a** = (3, 4), **b** = (4, 3)

| Quantity | Calculation | Result |
|---|---|---|
| $a \cdot b$ | $3 \times 4 + 4 \times 3$ | **24** |
| $\Vert a \Vert$, $\Vert b \Vert$ | $\sqrt{9+16}$, $\sqrt{16+9}$ | **5**, **5** |
| $\text{cosine}(a, b)$ | $24 / (5 \times 5)$ | **0.96** |
| $\text{Euclidean}(a, b)$ | $\sqrt{(3-4)^2 + (4-3)^2}$ | $\sqrt{2} \approx 1.414$ |

---

## 3. The Three Core Metrics

> 🧭 **Intuition:** Picture every embedding as an **arrow** from the origin. **Cosine** is a **compass**: it only asks whether two arrows point the same way, and ignores how long they are. **Euclidean** is a **ruler**: it measures the straight-line gap between the two arrowheads, so length matters. **Dot product** is a **weighted vote**: it asks "how aligned are they?" and then multiplies by how long both arrows are, so a long arrow shouts louder. For text, the *direction* carries the meaning, which is why the compass (cosine) is the default mental model.

### 3.1 Dot product (inner product)

$$\text{dot}(a, b) = \sum_{i=1}^{n} a_i b_i = \Vert a \Vert \Vert b \Vert \cos\theta$$

| Property | Value |
|---|---|
| Range | $(-\infty, +\infty)$ |
| Higher = | More similar |
| Sensitive to magnitude? | ✅ **Yes**: longer vectors get higher scores |
| Speed | ⚡ Fastest (no division, no square root) |
| Search name | **MIPS** (Maximum Inner Product Search) |

### 3.2 Cosine similarity

$$\text{cos}(a, b) = \frac{a \cdot b}{\Vert a \Vert \Vert b \Vert}$$

| Property | Value |
|---|---|
| Range | $[-1, +1]$ ($1 =$ same direction, $0 =$ orthogonal, $-1 =$ opposite) |
| Higher = | More similar |
| Sensitive to magnitude? | ❌ **No**: only the **angle** matters |
| Related | **Cosine distance** $= 1 - \cos$ (range $[0, 2]$, lower = closer) |

### 3.3 Euclidean distance (L2)

$$\text{L2}(a, b) = \Vert a - b \Vert = \sqrt{\sum_{i=1}^{n} (a_i - b_i)^2}$$

| Property | Value |
|---|---|
| Range | $[0, +\infty)$ |
| Lower = | More similar (**it's a distance, not a similarity!**) |
| Sensitive to magnitude? | ✅ Yes |
| Variant | **Squared L2** (skips the $\sqrt{}$; same ranking, faster). FAISS returns this |

### 3.4 Side-by-side

| | Dot product | Cosine | Euclidean (L2) |
|---|---|---|---|
| Measures | Direction + length | Direction only | Straight-line gap |
| Type | Similarity $\uparrow$ | Similarity $\uparrow$ | Distance $\downarrow$ |
| Range | $(-\infty, \infty)$ | $[-1, 1]$ | $[0, \infty)$ |
| Magnitude matters | Yes | No | Yes |
| Typical use | Normalized embeddings, MIPS-trained models | **Most text embeddings** | Normalized embeddings, image/other vectors |

---

## 4. Direction vs Magnitude: An Intuition

```text
Query q = (1, 1)

d_long  = (5, 5)     same direction, long
d_short = (1, 1)     same direction, short
d_tilt  = (1, 0.8)   slightly different direction, short
```

| Doc | Dot ($\uparrow$) | Cosine ($\uparrow$) | L2 ($\downarrow$) |
|---|---|---|---|
| d_long | **10.0** 🥇 | 1.000 🥇 | 5.66 🥉 |
| d_short | 2.0 🥈 | 1.000 🥇 | **0.00** 🥇 |
| d_tilt | 1.8 🥉 | 0.994 🥉 | 0.20 🥈 |

➡️ **Three metrics, three different "winners".** Without normalization, the metric choice **changes your results**.

> 💬 In text embeddings, magnitude is usually **not** meaningful (or is influenced by text length or word frequency), which is why **cosine** or **normalized vectors** are the standard.

---

## 5. ⭐ The Key Identity: Normalize, and They All Agree

> 🧭 **Intuition:** Normalizing makes every arrow exactly **length 1**, so all arrowheads now sit on the surface of a sphere. On a sphere, "pointing in nearly the same direction" (small angle, so high cosine) and "tips close together" (short ruler distance, so low L2) are **the same thing**, and there's no length left for the dot product to reward. The three metrics become three ways of reading the same measurement, so they **can't disagree** on ranking. That's the whole reason "normalize, then use dot product" is the industry default.

If $\Vert a \Vert = \Vert b \Vert = 1$ (normalized):

$$\Vert a - b \Vert^2 = \Vert a \Vert^2 + \Vert b \Vert^2 - 2 a \cdot b = 2 - 2\cos(a, b)$$

So for **unit vectors**:

| Relationship | Consequence |
|---|---|
| $\cos(a, b) = a \cdot b$ | Cosine **is** the dot product $\rightarrow$ use fast dot product |
| $L2^2 = 2 - 2 \cdot \cos$ | Smaller L2 $\Leftrightarrow$ larger cosine $\rightarrow$ **identical rankings** |
| $\cos = 1 - L2^2 / 2$ | You can convert L2 distance back to cosine |

> 💡 **Best practice:** **L2-normalize** all embeddings (documents *and* queries) and use **dot product / inner product** search. You get cosine semantics at dot-product speed.
> - `sentence-transformers`: `model.encode(texts, normalize_embeddings=True)`
> - OpenAI embeddings are already normalized to length 1 (per OpenAI docs), so cosine = dot.
> - FAISS: `faiss.normalize_L2(vectors)` then `IndexFlatIP`

---

## 6. Which Metric Should I Use?

> 🧭 **Intuition:** A map is only accurate if you read it **with the scale it was drawn with**. An embedding model was trained with a particular metric in its loss function: the space was *shaped* so that that metric gives good rankings. Use a different metric and you're reading the map with the wrong scale. Usually that's harmless (normalized vectors, where all metrics agree), but for models trained on raw dot product, where length carries learned signal, it can quietly hurt quality.

| Situation | Use |
|---|---|
| Model card says "use cosine" (most sentence-transformers, BGE, E5, OpenAI) | **Cosine**, or normalize + dot |
| Model trained for **dot product** (for example, some MS MARCO "dot" models such as `msmarco-distilbert-base-tas-b`) | **Dot product on un-normalized vectors** |
| Vectors already normalized | Any of the three; **dot** is fastest |
| Binary / quantized embeddings | **Hamming** distance |
| Sets of tokens or keywords | **Jaccard** similarity |
| Sparse keyword vectors (BM25) | BM25's own scoring (Day 12) |

> 🔑 **Rule:** use **the metric the embedding model was trained with**. Check the model card.

### Other metrics you may see

| Metric | Formula / idea | Where |
|---|---|---|
| **Manhattan (L1)** | $\sum \vert a_i - b_i \vert$ | Qdrant, Weaviate, pgvector |
| **Hamming** | # of differing bits | Binary quantized vectors |
| **Jaccard** | $\vert A \cap B \vert / \vert A \cup B \vert$ | Token sets, deduplication (MinHash) |
| **Chebyshev ($L_\infty$)** | $\max \vert a_i - b_i \vert$ | Rare in RAG |

---

## 7. Metric Settings in Vector Databases

> 🧭 **Intuition:** A vector index is like the **shelving layout of a library**: it's arranged around one definition of "near", so that lookups are fast. Change the definition and every shelf is in the wrong place, which is why most databases make you pick the metric **when the index is created** and rebuild it to change. Get this right on day one, and write it down next to the embedding model name.

| Vector DB | Options | Default | How to set cosine |
|---|---|---|---|
| **FAISS** | `IndexFlatL2` (squared L2), `IndexFlatIP` (inner product) | Depends on index | `faiss.normalize_L2(x)` + `IndexFlatIP` |
| **Chroma** | `l2`, `cosine`, `ip` | **`l2`** | Set `hnsw:space = "cosine"` at collection creation (config syntax varies by version) |
| **pgvector** | `<->` L2, `<#>` negative inner product, `<=>` cosine distance, `<+>` L1 | n/a (per query/index) | `ORDER BY embedding <=> query` + `vector_cosine_ops` index |
| **Pinecone** | `cosine`, `euclidean`, `dotproduct` | Set at index creation | `metric="cosine"` |
| **Qdrant** | `Cosine`, `Dot`, `Euclid`, `Manhattan` | Set per collection | `Distance.COSINE` |
| **Weaviate** | `cosine`, `dot`, `l2-squared`, `hamming`, `manhattan` | `cosine` | Default |

> ⚠️ **Metric is usually fixed at index creation**. Changing it means **rebuilding the index**.
> 
> ⚠️ **Chroma defaults to L2**. If your vectors aren't normalized, results can differ from cosine.

### Reference snippets (not required to run today)

**FAISS**
```python
import faiss, numpy as np

vecs = np.random.rand(1000, 384).astype("float32")
faiss.normalize_L2(vecs)                # in-place normalization
index = faiss.IndexFlatIP(384)          # inner product = cosine on unit vectors
index.add(vecs)

q = np.random.rand(1, 384).astype("float32")
faiss.normalize_L2(q)
scores, ids = index.search(q, 5)        # higher score = more similar
```

**Chroma**
```python
import chromadb

client = chromadb.Client()
col = client.create_collection("docs", metadata={"hnsw:space": "cosine"})
# Note: col.query(...) returns *distances* (cosine distance = 1 - cosine similarity)
```

**pgvector (PostgreSQL)**
```sql
-- Top-5 by cosine (<=> returns cosine DISTANCE, so ascending order)
SELECT id, content, 1 - (embedding <=> '[0.01, -0.02, ...]') AS cosine_similarity
FROM chunks
ORDER BY embedding <=> '[0.01, -0.02, ...]'
LIMIT 5;
```

---

## 8. Scores vs Distances: Don't Sort the Wrong Way!

> 🧭 **Intuition:** A similarity is like a **basketball score** (higher wins); a distance is like a **golf score** (lower wins). Both are perfectly good, but if you apply basketball rules to a golf leaderboard you crown the worst player. Vector DBs and libraries mix both conventions, and nothing crashes when you get it wrong: you just get the *least* relevant chunks, delivered confidently. Always check **what a number means before you sort or threshold it**.

| What you get back | Better = | Convert to cosine similarity (unit vectors) |
|---|---|---|
| Cosine similarity | Higher | n/a |
| Cosine distance (Chroma `cosine`, pgvector `<=>`) | Lower | `sim = 1 - d` |
| L2 distance | Lower | `sim = 1 - d^2 / 2` |
| Squared L2 (FAISS `IndexFlatL2`, Chroma `l2`) | Lower | `sim = 1 - d / 2` |
| Negative inner product (pgvector `<#>`) | Lower | `sim = -d` |
| Inner product (FAISS `IndexFlatIP`) | Higher | `sim = d` (if normalized) |

> 🐛 **Common bug:** applying `score >= 0.7` as a threshold on **distances** (which should be `<=`), so you keep the *worst* results.

---

## 9. High Dimensions and Why Thresholds Are Tricky

> 🧭 **Intuition:** In 384 dimensions there is **so much room** that two randomly chosen directions are almost always nearly perpendicular ($\text{cosine} \approx 0$). Real embeddings don't use that room evenly: they bunch into a narrow cone, so even unrelated texts share some direction and score above zero. How narrow the cone is **differs by model**. So a "0.3" might mean "unrelated" for one model and "fairly related" for another, like grades from a strict teacher vs a lenient one. **Compare rankings within a model, never raw scores across models.**

### 9.1 Distance concentration
In high dimensions, **random** vectors are almost **orthogonal**: their cosine clusters tightly around **0**, with spread $\approx 1/\sqrt{d}$.

| Dimensions | Typical cosine between random vectors |
|---|---|
| 2 | Anywhere in [-1, 1] |
| 100 | $\approx 0 \pm 0.10$ |
| 384 | $\approx 0 \pm 0.05$ |
| 1536 | $\approx 0 \pm 0.026$ |

### 9.2 Real embeddings are *not* random (anisotropy)
Real embedding spaces are **anisotropic**: vectors occupy a narrow "cone", so even **unrelated** texts can score noticeably **above 0**.
- Some models score unrelated texts around 0.0-0.3; others (for example, E5, per its model card) produce scores **concentrated in a high range (~0.7-1.0)**.
- **Absolute scores are not comparable across models.** Only the **ranking** is reliable.

### 9.3 Practical threshold strategy
1. Build a small labeled set of **answerable vs unanswerable** questions.
2. Plot the **top-1 score** distributions for both groups.
3. Choose the threshold that best separates them, **per model**.
4. Consider **relative signals** (for example, the gap between the top-1 and top-2 scores) or a **re-ranker score** (Day 14), which is better calibrated.

---

## 10. Beyond Pure Similarity: MMR (Maximal Marginal Relevance)

> 🧭 **Intuition:** If you're assembling a **panel of three experts**, you don't invite three people who'll say the same thing, even if each is individually the most qualified. You pick the best one, then the next best *who adds a new perspective*. MMR does exactly this for chunks: each new pick must be relevant to the question **and** different from what's already been picked. With a limited token budget, three chunks that each add new facts beat three copies of the same fact.

**Problem:** the top-K results are often **near-duplicates** (the same fact from 3 versions of a document), which wastes your context budget.

**MMR** picks each next result by balancing **relevance to the query** against **novelty vs results already picked**:

$$\text{MMR} = \arg\max_{d \in R \setminus S} \Big[\lambda \cdot \text{sim}(q, d) - (1 - \lambda) \cdot \max_{s \in S}\text{sim}(d, s)\Big]$$

| $\lambda$ | Behavior |
|---|---|
| 1.0 | Pure relevance (same as normal top-K) |
| 0.5 | Balanced |
| 0.0 | Pure diversity |

> Available in LangChain as `search_type="mmr"` (Day 7). You'll implement it from scratch in Lab 7.

---

## 11. 🧪 Hands-On (numpy only)

```bash
pip install numpy
# Optional for Lab 9:
pip install sentence-transformers
```

### Lab 1: Implement the metrics from scratch

```python
import numpy as np

def dot(a, b):
    return float(sum(x * y for x, y in zip(a, b)))

def norm(a):
    return dot(a, a) ** 0.5

def cosine(a, b):
    return dot(a, b) / (norm(a) * norm(b))

def euclidean(a, b):
    return sum((x - y) ** 2 for x, y in zip(a, b)) ** 0.5

A = np.array([3.0, 4.0])
B = np.array([4.0, 3.0])

# Using custom functions vs numpy
print("Custom:", round(dot(A, B), 4), round(cosine(A, B), 4), round(euclidean(A, B), 4))
print("NumPy: ", round(float(A @ B), 4),
      round(float(A @ B / (np.linalg.norm(A) * np.linalg.norm(B))), 4),
      round(float(np.linalg.norm(A - B)), 4))
```

✅ Expected: `24.0 0.96 1.4142` for both.

---

### Lab 2: Direction vs magnitude (three metrics, three winners)

```python
q = np.array([1.0, 1.0])
docs = {
    "d_long ": np.array([5.0, 5.0]),
    "d_short": np.array([1.0, 1.0]),
    "d_tilt ": np.array([1.0, 0.8]),
}

def cos_np(x, y):
    return float(x @ y / (np.linalg.norm(x) * np.linalg.norm(y)))

print(f"{'doc':<8} {'dot':>6} {'cosine':>7} {'L2':>6}")
for name, d in docs.items():
    print(f"{name:<8} {q @ d:>6.2f} {cos_np(q, d):>7.3f} {np.linalg.norm(q - d):>6.2f}")

for metric, fn, reverse in [
    ("dot", lambda d: q @ d, True),
    ("cosine", lambda d: cos_np(q, d), True),
    ("L2", lambda d: np.linalg.norm(q - d), False),
]:
    ranking = sorted(docs, key=lambda n: fn(docs[n]), reverse=reverse)
    print(f"{metric:>6} ranking: {[n.strip() for n in ranking]}")

# Now normalize everything and re-rank
unit = lambda v: v / np.linalg.norm(v)
qn = unit(q)
print("\nAfter normalization:")
for name, d in docs.items():
    dn = unit(d)
    print(f"{name:<8} dot={qn @ dn:.3f}  L2={np.linalg.norm(qn - dn):.3f}")
```

📑 **Observe:** Before normalization, dot favors `d_long`, L2 favors `d_short`, and cosine ties them. After normalization, `d_long` and `d_short` become **identical**, and all metrics agree.

---

### Lab 3: Verify the identity $\|a - b\|^2 = 2 - 2\cdot\cos$

```python
rng = np.random.default_rng(42)

def normalize_rows(x):
    return x / np.linalg.norm(x, axis=-1, keepdims=True)

a, b = normalize_rows(rng.normal(size=(2, 384)))
print("L2^2      :", round(float(np.sum((a - b) ** 2)), 6))
print("2 - 2*cos :", round(float(2 - 2 * (a @ b)), 6))

# Rankings are identical for normalized vectors
docs = normalize_rows(rng.normal(size=(1000, 384)))
q = normalize_rows(rng.normal(size=384))

top_dot = np.argsort(-(docs @ q))[:10]
top_l2 = np.argsort(np.linalg.norm(docs - q, axis=1))[:10]
print("Same top-10 (dot vs L2)?", np.array_equal(top_dot, top_l2))
```

---

### Lab 4: When vectors are NOT normalized, rankings disagree

```python
raw = rng.normal(size=(1000, 384)) * rng.uniform(0.5, 3.0, size=(1000, 1))  # random lengths
qr = rng.normal(size=384)

dot_scores = raw @ qr
cos_scores = dot_scores / (np.linalg.norm(raw, axis=1) * np.linalg.norm(qr))
l2_dists = np.linalg.norm(raw - qr, axis=1)

top = lambda arr, k=10, largest=True: set(np.argsort(-arr if largest else arr)[:k])
t_dot, t_cos, t_l2 = top(dot_scores), top(cos_scores), top(l2_dists, largest=False)

print("Top-10 overlap dot vs cosine:", len(t_dot & t_cos), "/ 10")
print("Top-10 overlap L2 vs cosine:", len(t_l2 & t_cos), "/ 10")
print("Avg length of dot's top-10  :", round(float(np.linalg.norm(raw[list(t_dot)], axis=1).mean()), 1))
print("Avg length of L2's top-10   :", round(float(np.linalg.norm(raw[list(t_l2)], axis=1).mean()), 1))
print("Avg length overall          :", round(float(np.linalg.norm(raw, axis=1).mean()), 1))
```

📑 **Observe:** Dot product favors **long** vectors; L2 favors **short** ones. Cosine ignores length. **Normalize your embeddings!**

---

### Lab 5: Fast vectorized top-K search (brute force)

```python
import time

N, D = 100_000, 384
corpus = normalize_rows(rng.normal(size=(N, D)).astype(np.float32))
target = 12345
query = normalize_rows(corpus[target] + 0.02 * rng.normal(size=D).astype(np.float32))  # a "paraphrase"

# (a) Python loop over 10k rows
t0 = time.perf_counter()
loop_scores = [float(np.dot(v, query)) for v in corpus[:10_000]]
t_loop = time.perf_counter() - t0

# (b) One matrix-vector product over all 100k rows
t0 = time.perf_counter()
scores = corpus @ query
k = 5
top_k = np.argpartition(-scores, k)[:k]            # O(N): unordered top-k
top_k = top_k[np.argsort(-scores[top_k])]           # sort just those k
t_vec = time.perf_counter() - t0

print(f"Loop over 10k rows : {t_loop * 1000:.1f} ms")
print(f"Vectorized 100k    : {t_vec * 1000:.1f} ms")
print("Top-5 ids:", top_k.tolist(), "| scores:", [round(float(s), 3) for s in scores[top_k]])
print("Target found at rank 1?", top_k[0] == target)
```

📑 **Observe:** Vectorized search over **10x more rows** is still **much faster** than the loop. Brute force is **$O(N \cdot d)$** per query. That's fine for about 100k vectors, but for millions you need **ANN indexes** (HNSW, IVF: Day 11).

---

### Lab 6: The curse of dimensionality

```python
print(f"{'dims':>5} {'mean cos':>9} {'std':>7} {'min':>7} {'max':>7}  1/sqrt(d)")
for dim in (2, 10, 100, 384, 1536):
    x = normalize_rows(rng.normal(size=(4000, dim)))
    sims = np.sum(x[:2000] * x[2000:], axis=1)
    print(f"{dim:>5} {sims.mean():>9.3f} {sims.std():>7.3f} {sims.min():>7.3f} {sims.max():>7.3f}  {1/np.sqrt(dim):.3f}")
```

📑 **Observe:** As the number of dimensions grows, random vectors become **nearly orthogonal** ($\cos \approx 0$) with spread $\approx 1/\sqrt{d}$. Real embeddings are *not* random, which is why unrelated texts often still score above 0 (anisotropy).

---

### Lab 7: Implement MMR for diverse results

```python
def mmr(query_vec, doc_vecs, k=3, lambda_=0.5):
    sim_q = doc_vecs @ query_vec             # relevance to the query
    sim_d = doc_vecs @ doc_vecs.T           # similarity between docs
    selected = [int(np.argmax(sim_q))]
    candidates = set(range(len(doc_vecs))) - set(selected)
    while len(selected) < k and candidates:
        best = max(
            candidates,
            key=lambda i: lambda_ * sim_q[i] - (1 - lambda_) * max(sim_d[i, j] for j in selected),
        )
        selected.append(best)
        candidates.remove(best)
    return selected

labels = [
    "Home loan rate is 7.9% (policy v1)",
    "Home loan rate is 7.9% (policy v1 copy)",
    "Home loan rate is 7.9% (FAQ page)",
    "Home loan processing fee is 0.5%",
    "Home loan max tenure is 30 years",
    "Credit card annual fee is 2,500",
]

toy = normalize_rows(np.array([
    # dims: [loan-ness, rate, fee, tenure, card]
    [1.00, 0.50, 0.00, 0.00, 0.00],
    [1.00, 0.52, 0.02, 0.00, 0.00],
    [0.98, 0.50, 0.00, 0.03, 0.00],
    [0.90, 0.30, 0.50, 0.00, 0.00],
    [0.90, 0.30, 0.00, 0.50, 0.00],
    [0.05, 0.00, 0.00, 0.00, 1.00],
]))

q_toy = normalize_rows(np.array([1.0, 0.45, 0.25, 0.25, 0.0]))  # "Tell me about home loans"

print("Plain top-3 :", [labels[i] for i in np.argsort(-(toy @ q_toy))[:3]])
for lam in (1.0, 0.7, 0.5, 0.3):
    print(f"MMR lambda={lam:<4}:", [labels[i] for i in mmr(q_toy, toy, k=3, lambda_=lam)])
```

📑 **Observe:**
- Plain top-3 (and MMR with $\lambda = 1.0$) returns **three copies of the same fact**.
- MMR with $\lambda = 0.5\text{--}0.7$ keeps the best rate chunk and adds the **fee** and **tenure** chunks, giving **more information per token**.
- At $\lambda = 0.3$, diversity dominates and the **irrelevant credit-card chunk** sneaks in. **Too much diversity hurts relevance.**

---

### Lab 8: Jaccard similarity (lexical, set-based)

```python
def jaccard(a: str, b: str) -> float:
    A, B = set(a.lower().split()), set(b.lower().split())
    return len(A & B) / len(A | B)

pairs = [
    ("home loan interest rate", "home loan interest rates"),
    ("home loan interest rate", "cost of borrowing to buy a house"),
    ("loan approved", "loan not approved"),
]

for x, y in pairs:
    print(f"{jaccard(x, y):.2f} | {x!r} vs {y!r}")
```

📑 **Observe:** Jaccard only sees **word overlap**. It scores the paraphrase **0.00** (just like TF-IDF on Day 3), yet gives *"loan approved"* vs *"loan not approved"* a **high 0.67**. It's useful for **deduplication** and keyword checks, not for semantic search.

---

### Lab 9 (Optional): The metrics on real embeddings

```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
query = "cost of borrowing to buy a house"
texts = [
    "Home loan interest rates start at 7.9% per annum.",
    "Processing fees are 0.5% of the loan amount.",
    "The Platinum credit card has an annual fee of 2,500 rupees.",
    "Customer support is available 24/7.",
]

raw_docs, raw_q = model.encode(texts), model.encode(query)                 # un-normalized
print("Vector lengths:", np.round(np.linalg.norm(raw_docs, axis=1), 3))    # ~1.0 for this model

unit_docs, unit_q = normalize_rows(raw_docs), normalize_rows(raw_q)
for t, d_raw, d_unit in zip(texts, raw_docs, unit_docs):
    print(f"dot={raw_q @ d_raw:.3f}  cos={d_unit @ unit_q:.3f}  "
          f"L2={np.linalg.norm(unit_q - d_unit):.3f} | {t[:50]}")
```

📑 **Observe:** Check the vector lengths. Many sentence-transformers models already output (nearly) unit vectors, so all three metrics agree. **Always check; never assume.**

---

## ❓ Common Confusions

| ❌ Misconception | ✅ Reality |
|---|---|
| "Cosine and dot product always give the same result." | Only for **normalized** vectors. Otherwise dot product favors long vectors (Lab 4). |
| "A cosine of 0 means opposite meanings." | 0 means **unrelated (orthogonal)**; -1 means opposite. Text embeddings rarely go strongly negative. |
| "Chroma's query results are similarity scores." | By default they are **distances** (lower = better), and the default metric is L2. |
| "Euclidean distance is wrong for text embeddings." | On **normalized** vectors, it gives exactly the same ranking as cosine. |
| "Normalizing throws away information I need." | For most text models, length isn't meaningful. The exception is models **trained for raw dot product**. |
| "Raising the score threshold always improves quality." | It trades **recall for precision**. A threshold that's too high drops correct chunks. Tune it on labeled data. |
| "MMR makes results more relevant." | MMR makes results more **diverse**. Set $\lambda$ too low and irrelevant chunks sneak in (Lab 7, $\lambda = 0.3$). |

---

## 12. 🏋️ Exercises

1. **By hand:** For $a = (1, 2, 2)$ and $b = (2, 1, 2)$, compute the dot product, cosine, and L2. Then normalize both and verify $L2^2 = 2 - 2 \cdot \cos$.
2. **Conversion helper:** Write `to_cosine(value, kind)` that converts `"cosine_distance"`, `"l2"`, `"l2_squared"`, `"neg_ip"`, and `"ip"` to cosine similarity (assume unit vectors). Test it with Lab 3 vectors.
3. **Threshold bug hunt:** Given Chroma-style *distances* `[0.12, 0.35, 0.58, 0.91]`, write the correct filter to keep results with cosine similarity $\ge 0.6$.
4. **Scale test:** Repeat Lab 5 with $N = 10\text{k}, 100\text{k},$ and $1\text{M}$ (watch your RAM: $1\text{M} \times 384 \times 4\text{ bytes} \approx 1.5\text{ GB}$). Plot query time against $N$. Is it linear?
5. **MMR tuning:** In Lab 7, sweep $\lambda$ from 0.0 to 1.0 in steps of 0.1. Find the $\lambda$ range that avoids **both** duplicates and the irrelevant credit-card chunk. How would you choose $\lambda$ for real data?
6. **Add MMR to your pipeline:** Add an `mmr: bool` option to your Day 3/4 `Retriever` (retrieve the top 20 by similarity, then MMR down to K).
7. **Model metric check:** Pick 3 embedding models on Hugging Face. From their model cards, record the recommended metric and whether their outputs are normalized.

---

## 13. 📑 Quiz (Self-Check)

1. Which metric ignores vector length completely?
2. For Euclidean distance, is a higher or a lower value better?
3. State the identity that connects L2 distance and cosine for unit vectors.
4. Why is "normalize + dot product" a popular choice in production?
5. What does FAISS `IndexFlatL2` actually return?
6. Chroma returns a cosine distance of 0.25. What is the cosine similarity?
7. A model card says the model was trained with **dot product** on un-normalized vectors. Should you normalize? Why or why not?
8. Why can't you reuse a similarity threshold of 0.75 when switching embedding models?
9. What problem does MMR solve, and what does $\lambda$ control?
10. What is the time complexity of brute-force search, and what's the alternative for millions of vectors?

<details>
<summary>✅ Answers</summary>

1. **Cosine similarity.**
2. **Lower** (it's a distance).
3. $\|a - b\|^2 = 2 - 2\cdot\cos(a, b)$.
4. It gives **cosine semantics** with the **speed of dot product** (no division at query time), and it's supported by every vector DB.
5. **Squared** L2 distances (lower = closer).
6. $1 - 0.25 = \mathbf{0.75}$.
7. Generally **no**. Use the metric and preprocessing the model was trained with, because normalizing can throw away magnitude information the model learned to use.
8. Different models have different score **distributions** (anisotropy, training), so absolute values aren't comparable. Re-tune thresholds per model.
9. It removes **redundant or near-duplicate** results by balancing relevance and diversity. $\lambda = 1 \rightarrow$ pure relevance; $\lambda = 0 \rightarrow$ pure diversity.
10. **$O(N \cdot d)$** per query. Use **Approximate Nearest Neighbor (ANN)** indexes such as HNSW or IVF (Day 11).

</details>

---

## 14. 📚 Resources

### Docs
- Sentence-Transformers: *Semantic Search* and util functions (`cos_sim`, `dot_score`): https://www.sbert.net/examples/applications/semantic-search/README.html
- FAISS wiki: *MetricType and distances*: https://github.com/facebookresearch/faiss/wiki/MetricType-and-distances
- pgvector README (operators and index types): https://github.com/pgvector/pgvector
- Chroma docs (collection configuration / distance): https://docs.trychroma.com/
- Qdrant docs: *Distance metrics*: https://qdrant.tech/documentation/concepts/collections/
- Pinecone: *Vector similarity explained*: https://www.pinecone.io/learn/vector-similarity/
- OpenAI Embeddings FAQ (normalization, which distance to use): https://platform.openai.com/docs/guides/embeddings

### Papers
- *The Use of MMR, Diversity-Based Reranking for Reordering Documents and Producing Summaries* (Carbonell & Goldstein, SIGIR 1998)
- *How Contextual are Contextualized Word Representations?* (Ethayarajh, 2019), on anisotropy: https://arxiv.org/abs/1909.00512
- *On the Surprising Behavior of Distance Metrics in High Dimensional Space* (Aggarwal et al., 2001)

### Math refreshers
- 3Blue1Brown: *Essence of Linear Algebra*, "Dot products and duality" (YouTube)
- Khan Academy: *Vector dot product and vector length*

---

## 15. 💡 Key Takeaways

- **Dot product** = direction + length. **Cosine** = direction only. **Euclidean** = straight-line distance (lower is better).
- **Normalize your vectors**, and then **all three metrics produce the same ranking**, so use **dot product** for speed.
- Always use **the metric the embedding model was trained with** (check the model card).
- Vector DBs **fix the metric at index creation**. Know whether they return **similarities or distances**, and **sort and threshold accordingly**.
- **Absolute similarity scores are model-specific.** Tune thresholds on your own labeled data.
- Brute-force search is **$O(N \cdot d)$**: fine for about 100k vectors, and ANN handles the rest (Day 11).
- **MMR** removes near-duplicates so each token in your context adds new information.

---

## ⏩ Next: Day 6: Vector Databases (FAISS, Chroma, Pinecone, pgvector)
You'll store your embeddings in real vector databases and run filtered similarity search.