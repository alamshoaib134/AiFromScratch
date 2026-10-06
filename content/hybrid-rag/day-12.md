---
title: "Keyword Search (BM25 and Sparse Retrieval)"
day: 12
concept: "Classic text search vs. Semantic search"
chapter: 2
chapterTitle: "Data Ingestion and Retrieval"
---

# Day 12: Keyword Search (BM25 and Sparse Retrieval)

> **30-Day RAG Course, Week 2: Data Ingestion and Retrieval**
>
> **Date:** Oct 10, 2026 | **Estimated time:** 3.5-4 hours
>
> **Prerequisites:** [Day 3](./day03_rag_architecture.md) (TF-IDF baseline), [Day 4](./day04_text_embeddings.md) (dense weak spots), [Day 11](./day11_indexing_methods.md) (indexes)

---

## ⚡ Cheat Sheet (1-Minute Revision)

| Concept | Remember this |
|---|---|
| **Why keywords still matter** | Dense embeddings capture **gist**. Keywords catch **exact tokens**: IDs, codes, names, acronyms, rare terms, new jargon. |
| **Sparse vector** | One dimension per vocabulary term, mostly zeros. Stored as an **inverted index**: term $\rightarrow$ list of docs. |
| **BM25** | `$\sum \text{IDF(term)} \times \text{saturated TF} \times \text{length normalization}$`. Rare terms count more; repeats have **diminishing returns**; long docs are penalized. |
| **Knobs** | `k1` $\approx$ 1.2-2.0 (TF saturation), `b` $\approx$ 0.75 (length normalization). The defaults work well. |
| **Analyzer** | Tokenize $\rightarrow$ lowercase $\rightarrow$ stopwords $\rightarrow$ stemming. **Protect codes** (`ZYN-HL-FLEX`, `E1043`, `80C`). Use the **same** analyzer for docs and queries. |
| **Weakness** | **Vocabulary mismatch**: "house" $\neq$ "home loan", "freeze" $\neq$ "block". No synonyms or meaning. |
| **Learned sparse** | SPLADE / ELSER / BGE-M3 sparse: a model **adds related terms** and weights them, keeping the inverted-index speed. |
| **Tools** | `rank_bm25`, `bm25s`, SQLite **FTS5** (built into Python), Elasticsearch/OpenSearch, Pyserini/Lucene, Tantivy, built-in BM25 in Weaviate/Qdrant/ParadeDB. |
| **Takeaway** | Sparse and dense **fail differently**, so **combine them** (hybrid search, Day 13). |

---

## 🎯 Learning Objectives

By the end of today, you should be able to:

1. Explain **where dense retrieval fails** and why exact-term matching still matters in enterprise RAG.
2. Describe **sparse vectors** and the **inverted index**.
3. Derive and explain every part of the **BM25** formula, including `k1`, `b`, and IDF.
4. Build a text **analyzer** that handles stemming, stopwords, and **codes/IDs** safely.
5. Implement **BM25 from scratch** with an inverted index and per-term score explanations.
6. Add **phrase matching, fuzzy (typo) matching, and field boosting**.
7. Use production-grade options: `rank_bm25`, **SQLite FTS5**, Elasticsearch/OpenSearch, and learned sparse models (SPLADE).
8. Compare **BM25 vs dense** by query type, setting up **hybrid search** (Day 13).

---

## 📅 Suggested Schedule

| Time | Activity |
|---|---|
| 0:00 - 0:25 | Section 1-2: Why keywords matter; sparse vectors and inverted indexes |
| 0:25 - 1:05 | Section 3-4: BM25 in depth; analyzers |
| 1:05 - 1:30 | Section 5-8: Query features, dense vs sparse, learned sparse, tools |
| 1:30 - 3:30 | Section 9: Hands-on labs |
| 3:30 - 4:00 | Exercises and quiz |

---

## ## 1. Why Keyword Search Still Matters

> 🧠 **Intuition:** On Day 4 you learned that embeddings capture the **gist** of text: "what is this about?". That's exactly why they struggle with questions whose meaning lives in **one exact token**. To an embedding model, `"IFSC ZYNT0004521"` and `"IFSC ZYNT0001187"` are nearly the same thing ("a bank branch code"), but to a customer they are **different branches**. The same goes for error code `E1043` vs `E2091`, `Section 80C` vs `Section 24(b)`, a product code like `ZYN-HL-FLEX`, or a person's name. Keyword search is the **opposite specialist**: it has no idea what anything *means*, but it never confuses two different tokens. Enterprise and financial questions are full of such tokens, which is why nearly every production RAG system keeps a keyword retriever next to the vector one.

| Query type | Example | Dense (embeddings) | Sparse (BM25) |
|---|---|---|---|
| **IDs and codes** | "IFSC ZYNT0001187", "error E1043" | ❌ Treats similar codes as the same | ✅ Exact match |
| **Product/legal references** | "ZYN-HL-FLEX", "Section 80C", "Form 15H" | ⚠️ Often confuses siblings | ✅ |
| **Names** | "Radhika Iyer" | ⚠️ Rare names are poorly represented | ✅ |
| **New jargon / out-of-domain terms** | A product launched after the model was trained | ⚠️ | ✅ |
| **Paraphrases** | "cost of borrowing for a house" | ✅ | ❌ No shared words |
| **Synonyms** | "freeze my card" vs "block card" | ✅ | ❌ |
| **Conceptual questions** | "Is it safe to break my deposit early?" | ✅ | ⚠️ |

---

## ## 2. Sparse Vectors and the Inverted Index

> 🧠 **Intuition:** A sparse vector is a **checklist of every word in the vocabulary**, with a weight next to the few words that appear in this text and zero everywhere else. With a 50,000-word vocabulary, a chunk might have only 40 non-zero entries, hence "sparse". Storing it naively would waste space, so search engines flip it around into an **inverted index**, exactly like the **index at the back of a textbook**: for each word, a list of the pages (documents) where it appears. To answer a query, you look up only the query's words and combine their page lists. You never scan documents that share no words with the query, which is why keyword search is fast even over billions of documents.

```
Documents                                  Inverted index (term -> postings)
D1: "home loan interest rates"             home     -> [D1, D3]
D2: "fixed deposit interest"               loan     -> [D1, D3]
D3: "home loan tax benefits"               interest -> [D1, D2]
                                           tax      -> [D3]
Query "home loan tax" -> look up 3 lists -> score only D1, D3 (D2 is never touched)
```

| Dense vector | Sparse vector |
|---|---|
| Dimensions | 384-3,072 (fixed) | Vocabulary size (30k-1M+) |
| Non-zeros | All | A handful per document |
| Meaning of a dimension | Not interpretable | **One word/term**: fully interpretable |
| Index | ANN (HNSW, IVF) | **Inverted index** |
| Explainability | "Similar vectors" | "Matched *ifsc* (weight 5.2) and *pune* (3.1)" |

---

## ## 3. BM25 in Depth

> 🧠 **Intuition:** BM25 ("Best Matching 25") scores a document by asking three common-sense questions for each query word. **(1) How rare is this word?** Matching `"ZYNT0004521"` (in 1 document) is strong evidence; matching "bank" (in every document) is almost none. That's **IDF**. **(2) How often does the word appear in this document?** More is better, but with **diminishing returns**: the 10th mention adds much less than the 2nd, so keyword stuffing doesn't win. That's **TF saturation** (`k1`). **(3) How long is the document?** A word appearing once in a 20-word chunk is more telling than once in a 2,000-word chunk. That's **length normalization** (`b`). Add up the per-word scores, and you have one of the most successful ranking functions ever designed. It's still the default in Elasticsearch, OpenSearch, and Lucene, and still a strong baseline against neural retrievers.

### ### 3.1 The formula

$$
\text{BM25}(D, Q) = \sum_{t \in Q} \text{IDF}(t) \cdot \frac{f(t, D) \cdot (k_1 + 1)}{f(t, D) + k_1 \cdot \left(1 - b + b \cdot \frac{\vert{}D\vert{}}{\text{avgdl}}\right)}
$$

$$
\text{IDF}(t) = \ln \left( \frac{N - n(t) + 0.5}{n(t) + 0.5} + 1 \right)
$$

| Symbol | Meaning |
|---|---|
| `f(t, D)` | How many times term `t` appears in document `D` (term frequency) |
| `|D|`, `avgdl` | Length of `D`, and the average document length |
| `N`, `n(t)` | Number of documents, and the number of documents containing `t` |
| `k1` | TF saturation: how quickly repeats stop helping (typically **1.2-2.0**) |
| `b` | Length normalization strength: 0 = none, 1 = full (typically **0.75**) |

### ### 3.2 A worked example

Corpus: $N = 1,000$ chunks. Query: *"ifsc loan"*. Document D has average length, and each term appears once.

| Term | n(t) | IDF | TF part (f=1, k1=1.2, \|D\| = avgdl) | Contribution |
|---|---|---|---|---|
| `ifsc` | 5 | $\ln(995.5 / 5.5 + 1) = \mathbf{5.20}$ | $1 \times 2.2 / (1 + 1.2) = 1.00$ | **5.20** |
| `loan` | 400 | $\ln(600.5 / 400.5 + 1) = \mathbf{0.92}$ | 1.00 | **0.92** |

The **rare** term dominates. If `ifsc` appeared **3 times**, the TF part becomes $3 \times 2.2 / (3 + 1.2) = \mathbf{1.57}$ (not 3.0): that's saturation.

### ### 3.3 BM25 vs TF-IDF (Day 3)

| TF-IDF | BM25 |
|---|---|
| Term frequency | Linear (or log) | **Saturating** (`k1`) |
| Document length | Only via vector normalization | Explicit, tunable (`b`) |
| Keyword stuffing | Rewarded | Limited |
| Typical quality | Baseline | **Stronger baseline** |

### ### 3.4 Variants

| Variant | Idea |
|---|---|
| **BM25+ / BM25L** | Fixes for over-penalizing very long documents |
| **BM25F** | **Fields** (title, headings, body) with separate weights (for example, title $\times$ 2) |
| **Lucene BM25** | The IDF above (always positive); the default in Elasticsearch/OpenSearch |

---

## ## 4. Analyzers: Turning Text into Terms

> 🧠 **Intuition:** BM25 only compares **terms**, so how you turn text into terms (the **analyzer**) matters as much as the formula. Lowercasing makes `"Loan" = "loan"`. **Stemming** makes `"charges", "charged", "charging" -> "charg"`, so they match. Stopword removal drops `"the", "is", "of"`, which carry no signal. But analyzers are also where keyword search quietly breaks: a naive tokenizer splits `"ZYN-HL-FLEX"` into `"zyn", "hl", "flex"` (so any doc mentioning "flex" matches), turns `"7.9%"` into `"7"` and `"9"`, and stems away meaning in codes. The golden rule: **the same analyzer must process documents and queries**, and it must **protect the tokens your users actually search for**.

| Step | Example | Watch out |
|---|---|---|
| **Tokenization** | "Form 15G/15H" $\rightarrow$ `form`, `15g`, `15h` | Keep codes, decimals, emails, and hyphenated IDs intact (optionally also emit their parts) |
| **Lowercasing** | "IFSC" $\rightarrow$ `ifsc` | Fine for most cases; case-sensitive codes are rare |
| **Stopwords** | drop `the, is, of, what` | Don't drop meaningful short words ("no", "not" in "no minimum balance"?) |
| **Stemming** | `charges` $\rightarrow$ `charg` (Porter/Snowball) | Aggressive; don't stem codes and names |
| **Lemmatization** | `better` $\rightarrow$ `good` | Slower; needs NLP models |
| **Synonyms** | `fd` $\leftrightarrow$ `fixed deposit`, `emi` $\leftrightarrow$ `instalment` | A curated domain synonym list is a cheap, big win |
| **N-grams / shingles** | `home_loan` as a single term | Helps phrases; grows the index |
| **Language-specific** | Hindi, Tamil, Hinglish | Use Unicode-aware tokenizers and language analyzers |

---

## ## 5. Query Features Beyond Plain BM25

| Feature | What it does | Example |
|---|---|---|
| **Phrase queries** | Require words **adjacent, in order** | `"no minimum balance"` |
| **Fuzzy matching** | Tolerate typos (edit distance) | `procesing` $\rightarrow$ `processing` |
| **Prefix / wildcard** | Partial terms | `ZYNT000*` |
| **Boolean** | `AND`, `OR`, `NOT` | `ifsc AND pune NOT mumbai` |
| **Field boosts** | Title matches count more | `title^2 body^1` |
| **Minimum-should-match** | At least N query terms must match | Cuts noise on long queries |

---

## ## 6. Dense vs Sparse: Complementary Failure Modes

> 🧠 **Intuition:** Dense and sparse retrievers are like two witnesses with **different blind spots**. The dense witness remembers *what happened* but is fuzzy on *exact numbers and names*; the sparse witness remembers *exact words* but can't recognize the same event described differently. When both agree, you can be confident; when they disagree, each covers the other's weakness. That's the whole motivation for **hybrid search** tomorrow.

| Property | Dense | Sparse (BM25) |
|---|---|---|
| Synonyms / paraphrases | ✅ | ❌ (vocabulary mismatch) |
| Exact IDs, codes, names | ❌ | ✅ |
| Rare/new terms | ⚠️️ | ✅ |
| Multilingual / cross-lingual | ✅ (multilingual models) | ❌ (same-language only) |
| Explainability | ⚠️ | ✅ Per-term contributions |
| Needs training / GPU | Embedding model | ❌ None |
| Index updates | Re-embed | Cheap |
| Long-tail domain jargon | ⚠️ | ✅ |

---

## ## 7. Learned Sparse Retrieval (SPLADE and Friends)

> 🧠 **Intuition:** What if keyword search could learn synonyms? **Learned sparse** models such as SPLADE read a text with a transformer and output a sparse vector over the vocabulary. They **re-weight** the words that are present and **add related words** that aren't ("home loan" also activates `"mortgage", "housing", "emi"`). The result still fits in an inverted index (fast, explainable), but with much less vocabulary mismatch. The cost: running a model at indexing time (and usually at query time) and a larger index.

| Approach | Idea | Examples |
|---|---|---|
| **Learned term weighting + expansion** | A transformer (MLM head) $\rightarrow$ weights over the vocabulary | **SPLADE**, Elastic **ELSER**, **BGE-M3** (sparse output) |
| **Document expansion** | Generate likely questions per chunk and append them to the text | **doc2query / docT5query**, LLM-generated FAQs |
| **Learned impacts** | Learned per-term scores | uniCOIL, DeepImpact |

| ✅ Pros | ❌ Cons |
|---|---|
| Fixes much of the vocabulary mismatch | Model inference cost |
| Keeps inverted-index speed and explainability | Larger indexes than BM25 |
| Often strong out-of-domain | Mostly English-centric (check the model) |

---

## ## 8. Tools

| Tool | Type | Notes |
|---|---|---|
| **`rank_bm25`** | Python library | Simple, great for learning and small corpora; slow at scale |
| **`bm25s`** | Python library | Fast (sparse matrices), used by LlamaIndex's BM25 retriever |
| **SQLite FTS5** | Embedded DB | **Built into Python's `sqlite3`** (on most builds); `bm25()` ranking function; persistent |
| **Elasticsearch / OpenSearch** | Search engine | Industry standard; analyzers, synonyms, BM25F-style boosts, hybrid |
| **Pyserini (Lucene)** | Research toolkit | Reproducible BM25/SPLADE baselines |
| **Tantivy** | Rust library | Lucene-like, fast; Python bindings |
| **PostgreSQL** | DB | Built-in full-text search (`ts_rank`, not BM25); BM25 via extensions (for example, ParadeDB `pg_search`) |
| **Weaviate / Qdrant / Milvus** | Vector DBs | Built-in BM25 or sparse-vector support for hybrid search |
| **LlamaIndex `BM25Retriever`** | Framework | `llama-index-retrievers-bm25` (uses bm25s) |
| **LangChain `BM25Retriever`** | Framework | Lived in `langchain-community` (**sunset May 2026**, Day 7). Prefer a standalone library or DB |

---

## ## 9. Hands-On

### ### Setup

```bash
pip install numpy rank_bm25 snowballstemmer sentence-transformers
# SQLite FTS5 ships with Python's sqlite3 on most platforms (no install needed)
```

> Run the labs **in order in one notebook or script**.

---

### ### Lab 0: A corpus full of codes, IDs, and names

```python
import math
import re
from collections import Counter, defaultdict

import numpy as np

DOCS = [
    ("HL-RATES", "Home Loan Interest Rates",
     "Floating home loan interest rates start at 7.9% per annum for salaried customers and 8.3% for self-employed customers."),
    ("HL-FLEX", "Flexi Home Loan (ZYN-HL-FLEX)",
     "The ZYN-HL-FLEX flexi home loan links an overdraft account to your loan. Surplus funds parked in it reduce interest, and you can withdraw them anytime."),
    ("HL-TAX", "Home Loan Tax Benefits",
     "Principal repayment on a home loan qualifies for deduction under Section 80C up to 1.5 lakh rupees, and interest paid qualifies under Section 24(b) up to 2 lakh rupees for a self-occupied property."),
    ("HL-FEES", "Home Loan Fees",
     "A processing fee of 0.5% of the loan amount is charged, capped at 10,000 rupees. There are no prepayment charges on floating rate loans."),
    ("FD-RATES", "Fixed Deposit Rates",
     "Fixed deposit rates are 7.1% for 1 to 2 years. Senior citizens earn 7.4% on the same tenure."),
    ("FD-TDS", "TDS on Fixed Deposits",
     "TDS is deducted on FD interest above 40,000 rupees a year (50,000 for senior citizens). Submit Form 15G or Form 15H to avoid TDS if your income is below the taxable limit. TDS details appear in Form 26AS."),
    ("SAV-MAB", "Savings Plus Account",
     "The Savings Plus account has no minimum balance requirement and pays 4.25% interest credited quarterly."),
    ("UPI-ERR", "UPI Error Codes",
     "Error E1043 means the UPI transaction failed due to a bank server timeout; retry after 5 minutes. Error E2091 means the daily UPI limit of 1 lakh rupees has been exceeded."),
    ("BR-PUNE", "Pune Main Branch",
     "The Pune Main Branch is at FC Road, Shivajinagar. IFSC code: ZYNT0004521. MICR code: 411240017."),
    ("BR-MUMBAI", "Mumbai Fort Branch",
     "The Mumbai Fort Branch is at Horniman Circle. IFSC code: ZYNT0001187."),
    ("SWIFT", "International Transfers",
     "For inward international wire transfers, use SWIFT code ZYNTINBBXXX along with the beneficiary's account number."),
    ("NEFT", "NEFT and RTGS",
     "NEFT transfers are available 24x7 including holidays. RTGS is used for amounts of 2 lakh rupees and above."),
    ("CARD-LOST", "Lost or Stolen Cards",
     "If your card is lost or stolen, open the mobile app, go to Cards, and tap Block Card. The card is blocked instantly."),
    ("CARD-PLAT", "Platinum Credit Card",
     "The Platinum credit card has an annual fee of 2,500 rupees, waived on spends above 3 lakh rupees a year. There is no minimum spend requirement, and an outstanding balance can be converted into EMIs."),
    ("GRIEV", "Grievance Redressal",
     "If a complaint is unresolved after 30 days, write to the Nodal Officer, Ms. Radhika Iyer, at nodal.officer@zyntracorp.example, or escalate to the RBI Banking Ombudsman."),
    ("SUPPORT", "Customer Support",
     "Customer care is available 24/7 at 1800-000-000 and via in-app chat."),
]

IDS = [d[0] for d in DOCS]
FULL_TEXT = [f"{title}. {text}" for _, title, text in DOCS]

# (question, relevant doc, query type)
QUERIES = [
    ("What is the IFSC code of the Pune branch?", "BR-PUNE", "exact"),
    ("Which branch has IFSC ZYNT0001187?", "BR-MUMBAI", "exact"),
    ("What does UPI error E1043 mean?", "UPI-ERR", "exact"),
    ("What is ZYN-HL-FLEX?", "HL-FLEX", "exact"),
    ("Section 80C deduction limit", "HL-TAX", "exact"),
    ("When should I submit Form 15H?", "FD-TDS", "exact"),
    ("SWIFT code for receiving money from abroad", "SWIFT", "exact"),
    ("Who is Radhika Iyer?", "GRIEV", "exact"),
    ("How much does it cost to borrow for buying a house?", "HL-RATES", "paraphrase"),
    ("I misplaced my plastic, how do I freeze it?", "CARD-LOST", "paraphrase"),
    ("Whom do I phone for help?", "SUPPORT", "paraphrase"),
    ("What do elderly people earn on term deposits?", "FD-RATES", "paraphrase"),
    ("Where can I complain if the bank ignores me?", "GRIEV", "paraphrase"),
    ("Do I need to maintain some amount of money to avoid fees?", "SAV-MAB", "paraphrase"),
]

print(len(DOCS), "docs,", len(QUERIES), "queries")
```

---

### ### Lab 1: An analyzer that protects codes

```python
try:
    import snowballstemmer
    _stemmer = snowballstemmer.stemmer("english")
    stem = _stemmer.stemWord
except ImportError:
    # graceful fallback
    stem = lambda w: re.sub(r"(ing|ed|es|s)$", "", w) if len(w) > 4 else w

STOPWORDS = {"a", "an", "the", "is", "are", "of", "to", "in", "on", "for", "and", "or", "at", "by", "it",
             "what", "which", "who", "whom", "how", "do", "does", "i", "my", "me", "can", "if", "your",
             "with", "be", "this", "that", "from", "has", "have", "will", "should", "when", "where", "there"}

TOKEN_RE = re.compile(r"[a-z0-9]+(?:[-./@][a-z0-9]+)*%?")

def naive_tokens(text: str) -> list[str]:
    return re.findall(r"[a-z0-9]+", text.lower())

def analyze(text: str) -> list[str]:
    terms = []
    for tok in TOKEN_RE.findall(text.lower()):
        if tok in STOPWORDS:
            continue
        is_code = any(ch.isdigit() for ch in tok) or "-" in tok or "@" in tok or "." in tok
        if is_code:
            terms.append(tok)                            # keep the code whole: zyn-hl-flex, e1043, 7.9%
            parts = [p for p in re.split(r"[-./@]", tok) if p and p != tok]
            terms.extend(parts)                          # also emit parts: zyn, hl, flex
        else:
            terms.append(stem(tok))                      # stem ordinary words only
    return terms

for sample in ["What is ZYN-HL-FLEX?", "Interest rates start at 7.9% per annum",
               "Submit Form 15G/15H", "Charges charged charging", "email nodal.officer@zyntracorp.example"]:
    print(f"{sample!r:45}\n  naive   : {naive_tokens(sample)}\n  analyzed: {analyze(sample)}")
```

📕 **Observe:**
- The naive tokenizer shreds `ZYN-HL-FLEX` into `zyn / hl / flex` and `7.9%` into `7 / 9`.
- The analyzer keeps the **whole code** as one high-IDF term (and adds the parts as weaker backups), stems ordinary words (`charges/charged/charging` $\rightarrow$ one stem), and drops stopwords.

---

### ### Lab 2: BM25 from scratch, with an inverted index and explanations

```python
class BM25:
    def __init__(self, docs_terms: list[list[str]], k1: float = 1.2, b: float = 0.75):
        self.k1, self.b = k1, b
        self.N = len(docs_terms)
        self.doc_len = [len(t) for t in docs_terms]
        self.avgdl = sum(self.doc_len) / self.N
        self.tf = [Counter(t) for t in docs_terms]
        self.postings = defaultdict(list)               # term -> [doc indices] (inverted index)
        for i, counts in enumerate(self.tf):
            for term in counts:
                self.postings[term].append(i)
        self.idf = {t: math.log((self.N - len(p) + 0.5) / (len(p) + 0.5) + 1) for t, p in self.postings.items()}

    def term_score(self, term: str, i: int) -> float:
        f = self.tf[i].get(term, 0)
        if f == 0:
            return 0.0
        norm = self.k1 * (1 - self.b + self.b * self.doc_len[i] / self.avgdl)
        return self.idf[term] * f * (self.k1 + 1) / (f + norm)

    def search(self, query_terms: list[str], k: int = 3) -> list[tuple[int, float]]:
        scores = defaultdict(float)
        for term in set(query_terms):
            for i in self.postings.get(term, []):        # only docs that contain the term
                scores[i] += self.term_score(term, i)
        return sorted(scores.items(), key=lambda x: -x[1])[:k]

    def explain(self, query_terms: list[str], i: int) -> dict:
        return {t: round(self.term_score(t, i), 3) for t in set(query_terms) if self.term_score(t, i) > 0}


bm25 = BM25([analyze(t) for t in FULL_TEXT])
print(f"Vocabulary: {len(bm25.postings)} terms | avg doc length: {bm25.avgdl:.1f} terms")

for q in ["What is the IFSC code of the Pune branch?", "What does UPI error E1043 mean?", "Who is Radhika Iyer?"]:
    qt = analyze(q)
    print(f"\nQ: {q}\n  terms: {qt}")
    for i, s in bm25.search(qt):
        print(f"  {s:6.2f} {IDS[i]:<10} why: {bm25.explain(qt, i)}")

print("\nIDF of a few terms (rare = high):")
for t in ["zynt0004521", "ifsc", "pune", "loan", "rupe"]:
    if t in bm25.idf:
        print(f"  {t:<12} df={len(bm25.postings[t]):>2}  idf={bm25.idf[t]:.2f}")
```

📕 **Observe:**
- Each result comes with a **per-term explanation** (`"matched *pune* 2.1 + *ifsc* 1.4..."`). That's something dense retrieval can't give you.
- **IDF at work:** `ifsc` appears in 2 docs, so it helps but can't decide between the two branches alone. `pune` (1 doc) decides.
- The inverted index only touches documents that share a term with the query.

---

### ### Lab 3: Feel the knobs (`k1` saturation and `b` length normalization)

```python
def tf_part(f: int, k1: float, len_ratio: float = 1.0, b: float = 0.75) -> float:
    return f * (k1 + 1) / (f + k1 * (1 - b + b * len_ratio))

print("TF saturation (doc of average length): contribution multiplier vs term count")
print(f"{'tf':>4} " + " ".join(f"k1={k:<4}" for k in (0.5, 1.2, 2.0, 5.0)))
for f in (1, 2, 3, 5, 10, 20):
    print(f"{f:>4} " + " ".join(f"{tf_part(f, k):7.2f}" for k in (0.5, 1.2, 2.0, 5.0)))

print("\nLength normalization (tf=1, k1=1.2): contribution vs doc length / avgdl")
print(f"{'len/avg':>8} " + " ".join(f"b={b:<5}" for b in (0.0, 0.5, 0.75, 1.0)))
for ratio in (0.25, 0.5, 1.0, 2.0, 4.0):
    print(f"{ratio:>8} " + " ".join(f"{tf_part(1, 1.2, ratio, b):7.2f}" for b in (0.0, 0.5, 0.75, 1.0)))
```

📕 **Observe:**
- With `k1=1.2`, going from 1 $\rightarrow$ 20 occurrences raises the multiplier from 1.0 to only ~2.1: **keyword stuffing barely helps**. A large `k1` behaves more like raw TF.
- With `b=0.75`, a match in a doc **4x longer than average** is worth about half as much as in an average doc; `b=0` ignores length entirely.

---

### ### Lab 4: Check against a library (`rank_bm25`)

```python
from rank_bm25 import BM25Okapi

corpus_terms = [analyze(t) for t in FULL_TEXT]
lib = BM25Okapi(corpus_terms, k1=1.2, b=0.75)

agree = 0
for q, _, _ in QUERIES:
    qt = analyze(q)
    ours = [i for i, _ in bm25.search(qt, k=1)]
    theirs = [int(np.argmax(lib.get_scores(qt)))] if any(lib.get_scores(qt)) else []
    agree += ours == theirs
print(f"Top-1 agreement with rank_bm25: {agree}/{len(QUERIES)}")
```

📕 **Observe:** The top results mostly agree. Small differences come from **IDF variants**: `rank_bm25`'s Okapi IDF can go negative for very common terms (it floors them with an epsilon), while our Lucene-style IDF is always positive. **BM25 is a family**; know which variant your engine uses.

---

### ### Lab 5: BM25 vs dense, head-to-head by query type

```python
from sentence_transformers import SentenceTransformer

_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

def embed(texts: list[str]) -> np.ndarray:
    return np.asarray(_model.encode(texts, normalize_embeddings=True), dtype="float32")

doc_vecs = embed(FULL_TEXT)

def dense_search(q: str, k: int = 3) -> list[int]:
    return list(np.argsort(-(doc_vecs @ embed([q])[0]))[:k])

def sparse_search(q: str, k: int = 3) -> list[int]:
    return [i for i, _ in bm25.search(analyze(q), k=k)]

def evaluate(search_fn, qtype: str, k: int = 3) -> tuple[float, float]:
    rows = [(q, rel) for q, rel, t in QUERIES if t == qtype]
    r1 = np.mean([IDS.index(rel) in search_fn(q, 1) for q, rel in rows])
    rk = np.mean([IDS.index(rel) in search_fn(q, k) for q, rel in rows])
    return r1, rk

print(f"{'retriever':<8} {'query type':<11} {'R@1':>5} {'R@3':>5}")
for name, fn in [("BM25", sparse_search), ("Dense", dense_search)]:
    for qtype in ("exact", "paraphrase"):
        r1, r3 = evaluate(fn, qtype)
        print(f"{name:<8} {qtype:<11} {r1:>5.2f} {r3:>5.2f}")

print("\nPer-query top-1 (✅ correct / ❌ wrong / - nothing):")
for q, rel, t in QUERIES:
    s, d = sparse_search(q, 1), dense_search(q, 1)
    mark = lambda r: "-" if not r else ("✅" if IDS[r[0]] == rel else f"❌ {IDS[r[0]]}")
    print(f"[{t[:5]}] BM25 {mark(s):<14} Dense {mark(d):<14} {q}")
```

📕 **Observe and interpret:**
- **BM25** should do very well on the **exact** questions (codes, names, form numbers), and **fail or return nothing** on paraphrases with no shared words ("misplaced my plastic... freeze it", "whom do I phone").
- **Dense** typically shows the **opposite** pattern: strong on paraphrases, with occasional misses on codes (for example, confusing the two branches, or the two UPI error codes).
- Look closely at *"Do I need to maintain some amount of money to avoid fees?"*: BM25 may be **lured to the wrong doc** by incidental words ("amount", "fee"). That's a lexical false positive.
- **Neither wins everywhere**, which is exactly the case for **hybrid search** (Day 13).

---

### ### Lab 6: Phrases, typos, and field boosts

```python
import difflib

VOCAB = list(bm25.postings)

def fix_typos(terms: list[str]) -> list[str]:
    """Map unknown query terms to the closest vocabulary term (fuzzy matching)."""
    fixed = []
    for t in terms:
        if t in bm25.postings or any(ch.isdigit() for ch in t):
            fixed.append(t)
        else:
            match = difflib.get_close_matches(t, VOCAB, n=1, cutoff=0.8)
            fixed.append(match[0] if match else t)
    return fixed

def phrase_filter(results: list[tuple[int, float]], phrase: str) -> list[tuple[int, float]]:
    return [(i, s) for i, s in results if phrase.lower() in FULL_TEXT[i].lower()]

# 1) Typos
typo_q = "procesing fee on hom loan"
print("Typo query terms :", analyze(typo_q))
print("Fixed terms       :", fix_typos(analyze(typo_q)))
print("Without fix       :", [(IDS[i], round(s, 2)) for i, s in bm25.search(analyze(typo_q))])
print("With fix          :", [(IDS[i], round(s, 2)) for i, s in bm25.search(fix_typos(analyze(typo_q)))])

# 2) Phrase: all words present is not enough, they must be adjacent and in order
q = "minimum balance"
cands = bm25.search(analyze(q), k=5)
print("\nBag-of-words     :", [IDS[i] for i, _ in cands])
print("Phrase-filtered  :", [IDS[i] for i, _ in phrase_filter(cands, "minimum balance")])

# 3) Field boosting (BM25F-lite): the title counts double
title_bm25 = BM25([analyze(title) for _, title, _ in DOCS])
body_bm25 = BM25([analyze(text) for _, _, text in DOCS])

def fielded_search(q: str, w_title: float = 2.0, k: int = 3):
    qt = analyze(q)
    scores = defaultdict(float)
    for i, s in title_bm25.search(qt, k=len(DOCS)):
        scores[i] += w_title * s
    for i, s in body_bm25.search(qt, k=len(DOCS)):
        scores[i] += s
    return sorted(scores.items(), key=lambda x: -x[1])[:k]

q = "home loan tax"
print("\nNo field boost   :", [(IDS[i], round(s, 2)) for i, s in bm25.search(analyze(q))])
print("Title boost x2   :", [(IDS[i], round(s, 2)) for i, s in fielded_search(q)])
```

📕 **Observe:**
- Fuzzy matching rescues `procesing` $\rightarrow$ `process` and `hom` $\rightarrow$ `home`. Use it carefully, because an aggressive cutoff can "fix" correct rare codes into wrong ones (that's why digits are excluded).
- Phrase matching removes the Platinum card doc, which contains "minimum" (spend) and "balance" (outstanding) but **not the phrase** "minimum balance".
- Title boosting helps when titles are informative (headings from Day 8/9 are perfect for this). Here it lifts *Home Loan Fees* into the top 3.

---

### ### Lab 7: Production-ish BM25 with zero dependencies: SQLite FTS5

```python
import sqlite3

con = sqlite3.connect(":memory:")
con.execute("CREATE VIRTUAL TABLE docs USING fts5(doc_id UNINDEXED, title, body, tokenize='porter unicode61')")
con.executemany("INSERT INTO docs (doc_id, title, body) VALUES (?, ?, ?)", DOCS)

def fts_search(question: str, k: int = 3, title_weight: float = 2.0):
    terms = [t for t in re.findall(r"[A-Za-z0-9]+", question) if t.lower() not in STOPWORDS]
    if not terms:
        return []
    match = " OR ".join(f'"{t}"' for t in terms)              # quote terms -> no FTS syntax injection
    sql = f"""SELECT doc_id, bm25(docs, {title_weight}, 1.0) AS score
              FROM docs WHERE docs MATCH ? ORDER BY score LIMIT ?"""  # bm25(): LOWER is better
    return [(d, round(-s, 2)) for d, s in con.execute(sql, (match, k))]

for q in ["What is the IFSC code of the Pune branch?", "What does UPI error E1043 mean?",
          "When should I submit Form 15H?", "I misplaced my plastic, how do I freeze it?"]:
    print(f"{q:<48} -> {fts_search(q)}")
```

📕 **Observe:**
- A persistent, fast BM25 engine (with a Porter stemmer and per-column weights) is built into Python. It's great for small-to-medium corpora, prototypes, and edge/offline apps.
- FTS5's `bm25()` returns **lower-is-better** scores (we negate them for display): another **score vs distance** trap (Day 5).
- Quoting each term prevents user input from being interpreted as FTS **query syntax** (`AND`, `NEAR`, `*`, `^`).
- `unicode61` splits `ZYN-HL-FLEX` into parts. For code-heavy corpora, configure `tokenchars` or pre-process with your own analyzer.

---

### ### Lab 8 (Optional): Learned sparse, SPLADE term expansion

```python
# pip install transformers torch
import torch
from transformers import AutoModelForMaskedLM, AutoTokenizer

name = "naver/splade-cocondenser-ensembledistil"
tok = AutoTokenizer.from_pretrained(name)
mlm = AutoModelForMaskedLM.from_pretrained(name).eval()

def splade_terms(text: str, top: int = 15) -> list[tuple[str, float]]:
    inputs = tok(text, return_tensors="pt", truncation=True)
    with torch.no_grad():
        logits = mlm(**inputs).logits                           # [1, seq_len, vocab]
    weights = torch.max(torch.log1p(torch.relu(logits)) * inputs["attention_mask"].unsqueeze(-1), dim=1).values[0]
    idx = torch.nonzero(weights).squeeze(1).tolist()
    pairs = [(tok.convert_ids_to_tokens(i), float(weights[i])) for i in idx]
    return sorted(pairs, key=lambda x: -x[1])[:top]

print(splade_terms("cost of borrowing to buy a house"))
print(splade_terms("block my lost card"))
```

📕 **Observe:** SPLADE activates **related terms that aren't in the text** (for example, loan/mortgage-like terms for "borrowing to buy a house"), which is how learned sparse retrieval reduces vocabulary mismatch while staying compatible with inverted indexes.

---

### **Reference: Elasticsearch/OpenSearch BM25 with field boosts and fuzziness**

```json
GET bank_docs/_search
{
  "query": {
    "multi_match": {
      "query": "procesing fee home loan",
      "fields": ["title^2", "body"],
      "fuzziness": "AUTO"
    }
  }
}
```

---

## ## ❓ Common Confusions

| ❌ Misconception | ✅ Reality |
|---|---|
| "Embeddings made keyword search obsolete." | Dense retrieval fails on exact tokens (IDs, codes, names). BM25 remains a strong baseline and a key part of hybrid search. |
| "BM25 understands meaning." | It matches **terms** only. "house" and "home" are different terms unless stemming or synonyms connect them. |
| "More occurrences of a word = proportionally higher score." | TF **saturates** (`k1`): the 10th occurrence adds little. |
| "BM25 scores are comparable across queries or indexes." | Scores are **unbounded** and depend on the corpus statistics. Compare **ranks**, or normalize (Day 13). |
| "Tokenization is a detail." | A bad analyzer silently breaks code/ID search (`ZYN-HL-FLEX` $\rightarrow$ `zyn hl flex`). It's often the #1 keyword-search bug. |
| "Stemming always helps." | It helps recall for words, but can hurt precision and must never touch codes and names. |
| "Learned sparse = dense embeddings." | Learned sparse vectors are **vocabulary-sized and interpretable** and use inverted indexes; dense vectors are compact and opaque. |

---

## ## 10. 🏋️ Exercises

1. **Synonym expansion:** Add a domain synonym map (`fd` $\rightarrow$ `fixed deposit`, `emi` $\rightarrow$ `instalment`, `house` $\rightarrow$ `home`, `freeze` $\rightarrow$ `block`, `elderly` $\rightarrow$ `senior citizen`, `phone` $\rightarrow$ `call, customer care`) applied at **query time**. Re-run Lab 5. Which paraphrase queries does BM25 now solve?
2. **Tune k1 and b:** Grid-search `k1` $\in \{0.9, 1.2, 1.5, 2.0\} \times b \in \{0.3, 0.75, 1.0\}$ on the `QUERIES` set. Does anything beat the defaults meaningfully? (Beware of overfitting 14 queries!)
3. **Stopword trap:** Remove `"no"` from the stopword list (if you added it) and test *"Is there no minimum balance?"* vs *"minimum balance charges"*. When do stopwords carry meaning?
4. **FTS5 tokenizer:** Recreate the FTS5 table with `tokenize="unicode61 tokenchars '-'"` and test `ZYN-HL-FLEX`. What changes?
5. **Explainability UI:** Write `explain_answer(q)` that returns the top doc **and** the matched terms with their contributions, formatted for a user-facing "Why this result?" tooltip.
6. **Doc expansion:** For 3 docs, write 3 "likely user questions" each (doc2query style) and append them to the indexed text. Re-run Lab 5 for paraphrases.
7. **Hybrid preview:** For each query, take the union of BM25 top-3 and dense top-3. What is the Recall@6 of the union vs each alone? (Tomorrow you'll merge them properly.)

---

## ## 11. 📝 Quiz (Self-Check)

1. Give three query types where BM25 beats dense retrieval, and two where it loses.
2. What is an inverted index, and why does it make keyword search fast?
3. What do IDF, `k1`, and `b` each control in BM25?
4. Compute the TF part for `f=2`, `k1=1.2`, and a doc of average length.
5. Why should codes like `ZYN-HL-FLEX` or `E1043` be protected by the analyzer?
6. Why must documents and queries use the same analyzer?
7. What is **vocabulary mismatch**, and name two ways to reduce it in sparse retrieval.
8. What does SPLADE output, and how does it differ from a dense embedding?
9. SQLite FTS5's `bm25()` returns -7.3 for doc A and -2.1 for doc B. Which is more relevant?
10. Why can't you directly add a BM25 score to a cosine similarity?

<details>
<summary>👉 Answers</summary>

1. **BM25 wins on:** **IDs/codes, names, legal/product references, rare or new jargon**. It loses on: **paraphrases/synonyms, conceptual or cross-lingual questions**.
2. **A map from each term to the list of documents containing it**. Queries only touch the postings of their own terms, never unrelated documents.
3. **IDF:** how rare (informative) a term is. **`k1`:** how quickly repeated occurrences saturate. **`b`:** how strongly long documents are penalized.
4. $2 \times 2.2 / (2 + 1.2) = \mathbf{1.375}$.
5. Naive tokenizers split them into common fragments (`zyn`, `hl`, `flex`), destroying their high IDF and exact-match power, which causes false matches.
6. Otherwise query terms won't match index terms (for example, `charges` vs stem `charg`).
7. The same meaning expressed with different words (house vs home loan). Fixes: **synonym expansion**, **stemming**, **learned sparse (SPLADE)**, **document expansion (doc2query)**, or **hybrid with dense**.
8. A **sparse, vocabulary-sized vector** of term weights, including **expansion terms** not in the text. Dense embeddings are compact, fixed-size, non-interpretable vectors.
9. **Doc A**: FTS5 `bm25()` is **lower-is-better**.
10. They live on **different scales** (BM25 is unbounded and corpus-dependent; cosine is roughly in $[-1, 1]$). You need rank-based fusion or normalization (Day 13).

</details>

---

## ## 12. 📚 Resources

### ### Papers and books
- *The Probabilistic Relevance Framework: BM25 and Beyond* (Robertson & Zaragoza, 2009): https://www.staff.city.ac.uk/~sbrp622/papers/foundations_bm25_review.pdf
- *SPLADE: Sparse Lexical and Expansion Model for First Stage Ranking* (Formal et al., 2021): https://arxiv.org/abs/2107.05720
- *Document Expansion by Query Prediction* (doc2query, Nogueira et al., 2019): https://arxiv.org/abs/1904.08375
- *BEIR: A Heterogeneous Benchmark for Zero-shot Evaluation of IR Models* (Thakur et al., 2021), showing BM25 as a strong zero-shot baseline: https://arxiv.org/abs/2104.08663
- *Introduction to Information Retrieval* (Manning, Raghavan, Schütze), free online: https://nlp.stanford.edu/IR-book/

### ### Tools and docs
- `rank_bm25`: https://github.com/dorianbrown/rank_bm25
- `bm25s`: https://github.com/xhluca/bm25s
- SQLite FTS5 (incl. `bm25()` and tokenizers): https://www.sqlite.org/fts5.html
- Elasticsearch: similarity (BM25) and analyzers: https://www.elastic.co/guide/en/elasticsearch/reference/current/index-modules-similarity.html
- Pyserini: https://github.com/castorini/pyserini
- LlamaIndex BM25 retriever: https://docs.llamaindex.ai/en/stable/examples/retrievers/bm25_retriever/

---

## ## 13. 💬 Key Takeaways

- **Keyword search catches what embeddings blur:** IDs, codes, names, legal references, and new jargon.
- **BM25 = rare terms matter more (IDF) + saturating TF (`k1`) + length normalization (`b`).** The defaults (`k1=1.2`, `b=0.75`) are strong.
- **The analyzer is half the battle:** protect codes, stem words (not IDs), handle stopwords with care, and use the same analyzer for docs and queries.
- BM25 is **explainable** and **cheap**, and available everywhere (even SQLite FTS5).
- **Learned sparse** (SPLADE, ELSER, BGE-M3) and **doc expansion** reduce vocabulary mismatch.
- Dense and sparse **fail differently**, so tomorrow you'll **fuse them** into hybrid search.

---

## ⏭️ Next: Day 13: Hybrid Search (Dense + Sparse)
Score normalization, **Reciprocal Rank Fusion (RRF)**, weighted fusion, and how to tune the dense/sparse balance with your eval set.