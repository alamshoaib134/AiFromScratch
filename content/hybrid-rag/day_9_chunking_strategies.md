---
title: "Chunking Strategies (Fixed, Recursive, Semantic)"
day: 9
concept: "Breaking documents into optimal context units"
chapter: 2
chapterTitle: "Data Ingestion and Retrieval"
---

# Day 9: Chunking Strategies (Fixed, Recursive, Semantic)

> **30-Day RAG Course, Week 2: Data Ingestion and Retrieval**
> **Date:** Oct 7, 2026 | **Estimated time:** 4 hours
> **Prerequisites:** [Day 4](./day04_text_embeddings.md) (embeddings), [Day 8](./day08_document_loaders.md) (clean, section-aware documents)

---

## 📌 Cheat Sheet (1-Minute Revision)

| Concept | Remember this |
|---|---|
| **Chunk** | The unit of **retrieval** *and* the unit of **context**. It must make sense **on its own**. |
| **Size trade-off** | Too small $\rightarrow$ loses context ("it", "this category"). Too large $\rightarrow$ blurry embeddings, noise, cost. |
| **Starting point** | **200-500 tokens**, **10-20% overlap**, respect structure. Tune with evaluation. |
| **Fixed-size** | Every N tokens. Simple and predictable, but **cuts mid-sentence**. |
| **Sentence-based** | Pack whole sentences up to N tokens. Clean boundaries. |
| **Recursive** | Split on `\n\n` $\rightarrow$ `\n` $\rightarrow$ `.` $\rightarrow$ ` ` until it fits. **The default for most text.** |
| **Structure-aware** | Split by **headings/sections**; keep **tables and lists whole**; prefix the **section path**. Often best for structured docs. |
| **Semantic** | Break where **embedding similarity drops** between sentences. Topic-coherent, but costlier and needs tuning. |
| **Advanced** | Propositions (LLM), contextual chunk headers, late chunking, parent-child / small-to-big (Day 18). |
| **Evaluate** | **Answer-containment Recall@K** + **context tokens per query** + chunk statistics. Let the numbers decide. |

---

## 🎯 Learning Objectives

By the end of today, you should be able to:

1. Explain why chunking affects **both retrieval quality and answer quality**.
2. Reason about the **chunk size and overlap** trade-offs.
3. Implement **fixed-size, sentence, recursive, structure-aware, and semantic** chunkers from scratch.
4. Keep **tables and lists intact** and add **contextual headers** (section paths) to chunks.
5. Use framework splitters (LangChain `MarkdownHeaderTextSplitter`, token-based recursive splitters; LlamaIndex node parsers).
6. **Evaluate** chunking strategies with answer-containment Recall@K and context-token cost.
7. Pick a chunking strategy and size for a given document type and query style.

---

## 📅 Suggested Schedule

| Time | Activity |
|---|---|
| 0:00 - 0:30 | Section 1-3: Why chunking matters; size and overlap trade-offs |
| 0:30 - 1:15 | Section 4: The strategies |
| 1:15 - 1:40 | Section 5-7: Enrichment, choosing sizes, evaluation |
| 1:40 - 3:40 | Section 9: Hands-on (build 5 chunkers, evaluate, sweep sizes) |
| 3:40 - 4:00 | Exercises and quiz |

---

## 1. Why Chunking Matters

> 💡 **Intuition:** Think of chunking as **cutting a textbook into index cards** for an open-book exam where you may bring only **three cards** into the room. Cut them badly and you're doomed: a card that says *"Customers in this category earn 7.4%"* without saying *which* category, or a card that stops mid-sentence right before the number you need, or a card so crammed with five topics that you can't find it when you need it. A chunk plays **two roles at once**: it's the thing the retriever **matches against the question** (so it should be focused), and it's the thing the LLM **reads to answer** (so it should be self-contained). Good chunking balances those two jobs.

| Role | What the chunk needs | What goes wrong |
|---|---|---|
| **Unit of retrieval** (embedding) | A **focused** meaning $\rightarrow$ a sharp vector | Too many topics $\rightarrow$ a "blurry average" vector that matches nothing well |
| **Unit of context** (LLM input) | Enough **surrounding context** to be understood | Pronouns without referents ("it", "this category"), cut-off sentences, split tables |

> ⚡ Chunking is one of the **highest-leverage, lowest-cost** knobs in RAG. It's cheaper to fix than your embedding model, and often has a bigger effect.

---

## 2. The Chunk-Size Trade-off

> 💡 **Intuition:** Small chunks are like **sticky notes**: precise and easy to find, but they often lack the context to be understood alone. Large chunks are like **whole chapters**: full of context, but when embedded into a single vector their meaning gets averaged into mush, they're harder to match to a specific question, and each one eats a big slice of your token budget. The sweet spot is usually **a paragraph or a small section**: roughly 200-500 tokens for prose.

| Small chunks ($\approx$ 50-150 tokens) | Medium ($\approx$ 200-500 tokens) | Large ($\approx$ 800-2,000 tokens) |
|---|---|---|
| Embedding focus | ✅ Sharp | ✅ Good | ❌ Blurry (many topics averaged) |
| Self-contained context | ❌ Often missing | ✅ Usually enough | ✅ Rich |
| Precision (relevant fraction) | ✅ High | ✅ Good | ❌ Low (lots of filler) |
| Tokens sent to the LLM (top-K) | ✅ Few | ✅ Moderate | ❌ Many $\rightarrow$ cost, latency, lost-in-the-middle |
| Number of vectors | ❌ Many (storage, index size) | ✅ Moderate | ✅ Few |
| Good for | FAQs, definitions, fact lookups | **Most documents** | Summaries, long reasoning (often via parent-child, Day 18) |

### Hard constraints
* **Embedding model max tokens** (Day 4): for example, 256 for `all-MiniLM-L6-v2` and 512 for many BGE/E5 models. Longer chunks are **silently truncated**.
* **LLM context budget** (Day 3): `top_k * chunk_size` must fit alongside the system prompt, history, and answer.

---

## 3. Overlap

> 💡 **Intuition:** Overlap is the **seam allowance** in tailoring: a little extra fabric so the pieces still join correctly. If a key sentence falls right on a chunk boundary, overlap ensures it appears **whole** in at least one chunk. Too little overlap loses boundary facts; too much creates near-duplicate chunks that waste storage and crowd the top-K with repeats.

| Overlap | Effect |
|---|---|
| 0% | Smallest index; boundary facts can be split |
| **10-20%** | ✅ Common default; protects boundary sentences |
| 30-50% | Many near-duplicates; top-K filled with repeats (use MMR/dedup, Day 5) |

> 💡 Structure-aware and sentence-based chunkers need **less** overlap, because they already cut at natural boundaries.

---

## 4. Chunking Strategies

### 4.1 Fixed-size (characters or tokens)

> 💡 **Intuition:** A **paper guillotine**: every N tokens, chop. Fast, simple, predictable sizes, and completely blind to meaning. It will happily cut "7.4" | "% for senior citizens" in half.

* ✅ Simple, fast, uniform sizes, easy cost planning.
* ❌ Cuts mid-sentence, mid-table, mid-word (character-based).
* Use for: quick baselines, very uniform text (logs, transcripts).

### 4.2 Sentence-based

> 💡 **Intuition:** Instead of chopping at arbitrary points, **pack whole sentences** into a chunk until the next one would overflow. Boundaries are always clean, although a chunk may still mix the end of one topic with the start of another.

* ✅ No broken sentences; readable chunks.
* ❌ Sentence splitting is tricky ("Dr.", "e.g.", "7.9% p.a."); ignores topic shifts.
* Use for: narrative text, FAQs, transcripts.

### 4.3 Recursive (hierarchical separators)

> 💡 **Intuition:** A careful editor tries the **gentlest cut first**: between paragraphs; if a piece is still too long, between lines; then between sentences; then between words; and only chops raw tokens as a last resort. This is `RecursiveCharacterTextSplitter` (Day 7), the most widely used default because it respects natural structure without needing any document-specific rules.

* ✅ Good default for most text; keeps paragraphs together when possible.
* ❌ Doesn't know about headings or tables as *semantic* units; sizes vary.
* Use for: general prose, mixed documents without reliable structure.

### 4.4 Structure-aware (document-based)

> 💡 **Intuition:** If the author already organized the document into sections, **use their organization**. A section titled "2.2 Senior Citizens" is a ready-made, topic-coherent chunk, and its heading tells you what "this category" means. Structure-aware chunking splits on headings (Markdown `#`, HTML `h1-h3`, DOCX heading styles from Day 8), keeps **tables and lists whole**, recursively splits only sections that are too long, and **prefixes each chunk with its section path** so the chunk carries its own context.

* ✅ Topic-coherent chunks; natural citations ("Section 2.2"); tables stay intact; resolves "this category"-style references via headings.
* ❌ Needs reliable structure (good parsing, Day 8); sections vary a lot in size.
* Use for: policies, manuals, contracts, reports, documentation, **most enterprise documents**.
* Variants: **Markdown/HTML header splitters**, **code splitters** (by function/class), **JSON/record splitters**.

### 4.5 Semantic chunking

> 💡 **Intuition:** Read the document sentence by sentence and **watch the topic**. As long as consecutive sentences are about the same thing, their embeddings stay close; when the topic changes (from "FD rates" to "premature withdrawal"), the similarity **drops**. Semantic chunking places boundaries at those drops. It's like a reader who says "new topic starts here" without needing headings. The cost: you must embed every sentence during ingestion, and the breakpoint threshold needs tuning.

**Algorithm:**
1. Split into sentences.
2. (Optional) Combine each sentence with its neighbors (a window) for more stable embeddings.
3. Embed each window; compute the **cosine distance** between consecutive windows.
4. Mark a breakpoint where the distance exceeds a threshold (for example, the **90th percentile** of all distances).
5. Merge sentences between breakpoints into chunks (with a max-token guard).

* ✅ Topic-coherent chunks even without headings.
* ❌ Extra embedding cost; sensitive to the threshold; small gains are common in benchmarks vs a good recursive/structure baseline; sizes can vary wildly.
* Use for: unstructured long text (transcripts, articles, emails) where headings are missing.

### 4.6 LLM-based and advanced approaches (awareness)

| Approach | Idea | Trade-off |
|---|---|---|
| **Proposition chunking** | An LLM rewrites text into atomic, self-contained facts ("ZyntraCorp's senior-citizen FD rate for 1-2 years is 7.4%.") | Excellent precision; LLM cost at ingestion; may drop nuance |
| **Contextual chunk headers / contextual retrieval** | Prepend a short, document-aware context to each chunk (a section path, or an LLM-written 1-2 sentence summary) before embedding | Big win for ambiguous chunks; LLM cost if generated |
| **Late chunking** | Embed the **whole document** with a long-context model, *then* pool token embeddings per chunk, so each chunk vector "knows" its surroundings | Needs a long-context embedder; newer technique |
| **Parent-child / small-to-big** | Retrieve small chunks, return their larger parent section to the LLM | Best of both sizes; more complex (Day 18) |
| **Agentic chunking** | An LLM decides chunk boundaries and groupings | Flexible but slow and costly |

### 4.7 Strategy comparison

| Strategy | Boundary quality | Context | Cost | Needs structure? | Typical use |
|---|---|---|---|---|---|
| Fixed | ❌ \| ⚠️ \| ❌ | Lowest | No | Baselines, logs |
| Sentence | ✅ \| ⚠️ \| ⬇️ Low | No | Prose, FAQs |
| Recursive | ✅ \| ✅ \| ⬇️ Low | No | **General default** |
| Structure-aware | ✅ \| ✅ ✅ (with section prefix) | ⬇️ Low | **Yes** | **Enterprise docs** |
| Semantic | ✅ \| ⚠️ \| ⚠️ Embeds every sentence | No | Unstructured long text |
| Propositions / LLM | ✅ \| ✅ ✅ \| ❌ LLM calls | No | High-value corpora |

---

## 5. Enriching Chunks

> 💡 **Intuition:** A chunk should carry a small **"return address"**: where it came from and what it's about. Prepending `[Handbook > Fixed Deposits > Senior Citizens]` costs a few tokens but turns an orphaned sentence into a self-explanatory one, for the embedding model *and* the LLM.

| Enrichment | Example | Benefit |
|---|---|---|
| **Section path prefix** (in text) | `[Handbook > 2. Fixed Deposits > 2.2 Senior Citizens]` | Resolves ambiguous references; better embeddings |
| **Document title prefix** | `Product Guide 2026:` | Distinguishes similar chunks from different docs |
| **Metadata** (not embedded) | `source, page, section, chunk_index, doc_id` | Filters, citations, updates (Days 6, 10) |
| **Neighbor links** | `prev_id`, `next_id` | Expand context at answer time (Day 18) |
| **LLM-generated context** | "This chunk describes FD penalties for early withdrawal." | Stronger disambiguation (cost!) |

> ⚠️ Keep what's **embedded** (chunk text + short prefix) separate from what's **stored as metadata**. Don't stuff long metadata into the embedded text (recall the LlamaIndex metadata warning from Day 7).

---

## 6. Choosing a Chunk Size

| Content / query type | Suggested strategy | Starting size |
|---|---|---|
| FAQs, glossaries (one Q&A per item) | One item per chunk | Natural size |
| Policies, manuals, handbooks | Structure-aware + recursive fallback | 200-400 tokens |
| Research papers, reports | Structure-aware (sections) | 300-600 tokens |
| Legal contracts | Clause-level (structure) | 200-500 tokens |
| Transcripts, chats, emails | Sentence or semantic | 150-300 tokens |
| Code | By function/class | Function-sized |
| Tables | Whole table (if it fits) or row groups with header repeated | $\le$ embedding max |

> 💡 **Process:** pick 2-3 candidates $\rightarrow$ run an **answer-containment eval** (Lab 6) $\rightarrow$ sweep sizes (Lab 7) $\rightarrow$ choose the **smallest context cost that achieves the best recall**.

---

## 7. How to Evaluate Chunking

> 💡 **Intuition:** Chunks can't be evaluated by *doc-level* recall alone (Day 3), because many chunks come from the same doc. What matters is **whether the retrieved chunks actually contain the answer**, and how many tokens you had to send to get it. Think **"did the three index cards contain the fact, and how much reading did it take?"**

| Metric | Definition | Why |
|---|---|---|
| **Answer-containment Recall@K** | % of questions where $\ge 1$ of the top-K chunks contains the answer string | Directly measures "is the fact in the context?" |
| **Context tokens per query** | Sum of tokens in the top-K chunks | Cost, latency, noise |
| **Chunk count / size distribution** | n, mean, min, max | Detects tiny or huge outliers |
| **Boundary quality** | % of chunks ending mid-sentence; tables split | Readability, faithfulness |
| **End-to-end answer quality** | Faithfulness/correctness (Days 25-26) | The ultimate test |

---

## 8. ⚠️ Pitfalls

| Pitfall | Symptom | Fix |
|---|---|---|
| Chunks exceed the embedder's max tokens | Facts at chunk ends never retrieved | Measure in **tokens**; cap below the model limit |
| Tables split across chunks | Numbers separated from headers | Treat tables as atomic blocks; repeat headers when splitting rows |
| Orphan chunks ("It is waived if...") | Retrieved but uninterpretable | Section prefixes, sentence overlap, parent-child |
| Heading-only chunks | Tiny chunks like "## 3. Savings Accounts" | Attach headings to the following content |
| Huge overlap | Top-K full of near-duplicates | 10-20% overlap; MMR/dedup |
| Different chunking at index vs update time | Duplicate/stale chunks | Deterministic chunker + IDs (Day 6) |
| Tuning chunk size by intuition | Unmeasured regressions | Answer-containment eval + size sweep |

---

## 9. 🧪 Hands-On

### Setup

```bash
pip install tiktoken numpy sentence-transformers
# Optional (framework splitters):
pip install langchain-text-splitters llama-index-core
```

> Run the labs **in order in one notebook or script**.

---

### Lab 0: The handbook, a token counter, and helpers

```python
import re
from dataclasses import dataclass, field

import numpy as np
import tiktoken

enc = tiktoken.get_encoding("cl100k_base")


def ntok(text: str) -> int:
  return len(enc.encode(text))


@dataclass
class Chunk:
  text: str
  metadata: dict = field(default_factory=dict)


HANDBOOK = """# ZyntraCorp Retail Banking Handbook 2026

This handbook summarises the key retail banking products of ZyntraCorp Bank for the financial year 2026. It is intended for customers and branch staff. Where this handbook conflicts with a signed loan agreement, the agreement prevails.

## 1. Home Loans

ZyntraCorp offers home loans for purchasing, constructing, or renovating residential property in India. Loans are available on floating and fixed interest rates.

### 1.1 Interest Rates

Floating home loan interest rates start at 7.9% per annum for salaried customers. Self-employed customers are offered rates starting at 8.3% per annum. The final rate depends on the applicant's credit score, loan amount, and loan-to-value ratio. Rates are reset every quarter based on the bank's external benchmark.

### 1.2 Fees and Charges

A processing fee of 0.5% of the loan amount is charged, capped at 10,000 rupees. There are no prepayment charges on floating rate loans for individual borrowers. Fixed rate loans attract a prepayment charge of 2% of the prepaid amount. Late EMI payments attract a penalty of 2% per month on the overdue amount.

### 1.3 Tenure, Eligibility and Documents

The maximum tenure is 30 years, or until the borrower turns 70, whichever is earlier. Applicants must be between 21 and 65 years old at the time of application. Salaried applicants must submit the last three salary slips, six months of bank statements, and Form 16. Self-employed applicants must submit two years of income tax returns and audited financial statements.

## 2. Fixed Deposits

Fixed deposits (FDs) can be opened online or at any branch with a minimum amount of 5,000 rupees. Interest can be paid out monthly or reinvested until maturity.

### 2.1 Standard Rates

The table below lists standard FD rates for resident individuals.

| Tenure | Rate (per annum) |
|---|---|
| 7 days to 1 year | 6.2% |
| 1 to 2 years | 7.1% |
| 2 to 5 years | 6.9% |
| 5 to 10 years | 6.5% |

### 2.2 Senior Citizens

Customers aged 60 and above receive an additional benefit. Customers in this category earn 7.4% on deposits of 1 to 2 years, and 0.5 percentage points above the standard rate for other tenures.

### 2.3 Premature Withdrawal

Deposits can be withdrawn before maturity. A penalty of 1.25% is deducted from the applicable interest rate. No interest is paid on deposits withdrawn within seven days of opening.

## 3. Savings Accounts

The Savings Plus account is our flagship savings product. It offers 4.25% annual interest, credited quarterly, on the daily closing balance. There is no minimum balance requirement. UPI transfers are free and unlimited. The first debit card is issued free of charge; replacement cards cost 200 rupees.

## 4. Credit Cards

### 4.1 Platinum Card

The Platinum credit card carries an annual fee of 2,500 rupees. It is waived if total spends in the previous card year exceed 3 lakh rupees. Cardholders earn 2% cashback on online purchases and 1% on all other purchases. The card includes four complimentary airport lounge visits per year.

### 4.2 Lost or Stolen Cards

If your card is lost or stolen, open the mobile app, go to Cards, and tap Block Card. The card is blocked instantly and a replacement is dispatched within five working days. You are not liable for fraudulent transactions reported within three days.

## 5. Customer Support and Grievances

Customer support is available 24/7 by phone at 1800-000-000 and through in-app chat. Complaints can be raised through the app, by email, or at any branch. The bank aims to resolve every complaint within 15 working days. If a complaint is not resolved within 30 days, or the customer is not satisfied with the response, the customer may escalate it to the Banking Ombudsman under the Reserve Bank's Integrated Ombudsman Scheme.
"""

# (question, answer string that must appear in a retrieved chunk)
EVAL = [
    (
        "What is the home loan interest rate for salaried customers?",
        "7.9%",
    ),
    ("What is the processing fee on a home loan?", "0.5%"),
    (
        "Are there prepayment charges on floating rate home loans?",
        "no prepayment charges",
    ),
    ("What is the maximum home loan tenure?", "30 years"),
    (
        "What documents does a salaried person need for a home loan?",
        "salary slips",
    ),
    ("What is the FD rate for senior citizens?", "7.4%"),
    ("What is the FD rate for 2 to 5 years?", "6.9%"),
    (
        "What is the penalty for breaking a fixed deposit early?",
        "1.25%",
    ),
    (
        "Do I need to maintain a minimum balance in Savings Plus?",
        "no minimum balance",
    ),
    ("How often is savings interest credited?", "quarterly"),
    ("What is the Platinum card annual fee?", "2,500 rupees"),
    ("When is the Platinum card fee waived?", "3 lakh"),
    (
        "How many lounge visits does the Platinum card give?",
        "four complimentary",
    ),
    ("How do I block a lost card?", "Block Card"),
    ("What is the customer care phone number?", "1800-000-000"),
    (
        "How long does the bank take to resolve complaints?",
        "15 working days",
    ),
    (
        "Where can I escalate an unresolved complaint?",
        "Banking Ombudsman",
    ),
]


def chunk_stats(chunks: list[Chunk], name: str) -> None:
  sizes = [ntok(c.text) for c in chunks]
  last_lines = [c.text.strip().splitlines()[-1].strip() for c in chunks]
  dangling = sum(1 for ln in last_lines if ln.startswith("#"))
  mid = sum(
      1
      for ln in last_lines
      if not ln.startswith("#") and not re.search(r"[.!?]$", ln)
  )
  print(
      f"{name:<18} n={len(chunks):>3} avg={np.mean(sizes):6.1f}"
      f" min={min(sizes):>4} max={max(sizes):>4} "
      f"mid_sentence={mid / len(chunks):4.0%} "
      f"dangling_heading={dangling / len(chunks):4.0%}"
  )


print("Handbook tokens:", ntok(HANDBOOK))
```

---

### Lab 1: Fixed-size token chunking

```python
def fixed_token_chunks(
    text: str, size: int = 100, overlap: int = 20
) -> list[Chunk]:
  ids = enc.encode(text)
  step = size - overlap
  chunks = []
  for i, start in enumerate(range(0, len(ids), step)):
    chunks.append(
        Chunk(
            enc.decode(ids[start : start + size]),
            {"strategy": "fixed", "idx": i},
        )
    )
    if start + size >= len(ids):
      break
  return chunks


fixed = fixed_token_chunks(HANDBOOK, size=100, overlap=20)
chunk_stats(fixed, "fixed(100, 20)")
for c in fixed[4:6]:
  print("\n---", c.metadata, "---\n", c.text)
```

📰 **Observe:** Chunks start and end at **arbitrary points**, mid-sentence and sometimes mid-table, and headings get separated from their content.

---

### Lab 2: Sentence-based chunking

```python
SENT_BOUNDARY = re.compile(r"(?<=[.!?])\s+(?=[A-Z0-9\"(])")


def split_sentences(text: str) -> list[str]:
  """Sentences for prose; headings, list items, and whole tables are kept as single units."""
  units = []
  for block in re.split(r"\n\s*\n", text):
    block = block.strip()
    if not block:
      continue
    if block.startswith("|"):  # a table stays whole
      units.append(block)
    elif block.startswith(("#", "-", "* ")):
      units.extend(ln.strip() for ln in block.splitlines() if ln.strip())
    else:
      units.extend(
          SENT_BOUNDARY.split(block.replace("\n", " "))
      )
  return [u.strip() for u in units if u.strip()]


def sentence_chunks(
    text: str, max_tokens: int = 100, overlap_sentences: int = 1
) -> list[Chunk]:
  chunks, cur = [], []
  for s in split_sentences(text):
    if cur and ntok(" ".join(cur + [s])) > max_tokens:
      chunks.append(" ".join(cur))
      cur = cur[-overlap_sentences:] if overlap_sentences else []
    cur.append(s)
  if cur:
    chunks.append(" ".join(cur))
  return [
      Chunk(t, {"strategy": "sentence", "idx": i})
      for i, t in enumerate(chunks)
  ]


sent = sentence_chunks(HANDBOOK, max_tokens=100)
chunk_stats(sent, "sentence(100)")
print("\n", sent[5].text)
```

📰 **Observe:** No broken sentences, but chunks still **mix the end of one section with the start of the next**, and headings get glued to the **end** of the previous chunk (for example, a chunk ending in `*... 6.5% | ### 2.2 Senior Citizens*`). Check the `dangling_heading` stat.

---

### Lab 3: Recursive chunking (from scratch)

```python
def recursive_split(
    text: str,
    max_tokens: int = 100,
    separators: tuple = ("\n\n", "\n", ". ", " "),
) -> list[str]:
  if ntok(text) <= max_tokens:
    return [text.strip()] if text.strip() else []
  sep = next((s for s in separators if s in text), None)
  if sep is None:  # last resort: hard token cut
    ids = enc.encode(text)
    return [
        enc.decode(ids[i : i + max_tokens])
        for i in range(0, len(ids), max_tokens)
    ]
  parts = text.split(sep)
  pieces = [p + sep for p in parts[:-1]] + [parts[-1]]
  finer = separators[separators.index(sep) + 1 :]
  out, cur = [], ""
  for p in pieces:
    if ntok(p) > max_tokens:  # piece too big: recurse with finer separators
      if cur.strip():
        out.append(cur.strip())
      cur = ""
      out.extend(recursive_split(p, max_tokens, finer))
    elif ntok(cur + p) <= max_tokens:  # greedily merge small pieces
      cur += p
    else:
      if cur.strip():
        out.append(cur.strip())
      cur = p
  if cur.strip():
    out.append(cur.strip())
  return out


rec = [
    Chunk(t, {"strategy": "recursive", "idx": i})
    for i, t in enumerate(recursive_split(HANDBOOK, 100))
]
chunk_stats(rec, "recursive(100)")
for c in rec[:3]:
  print("\n---\n", c.text)
```

📰 **Observe:** Paragraphs stay together when they fit, and the table stays intact (it's a single `\n\n` block under 100 tokens). But headings frequently **dangle at the end of the previous chunk**: a chunk about interest rates ends with `### 1.2 Fees and Charges`, while the fee text starts the *next* chunk without its heading. Chunks also carry no section context.

> Framework equivalent: `RecursiveCharacterTextSplitter.from_tiktoken_encoder(chunk_size=100, chunk_overlap=20)` (see Lab 8).

---

### Lab 4: Structure-aware chunking with section-path prefixes

```python
def markdown_sections(text: str) -> list[tuple[str, str]]:
  """Return (section_path, body) pairs, using Markdown headings."""
  sections, path, buf = [], [], []

  def flush():
    body = "\n".join(buf).strip()
    if body:
      sections.append((" > ".join(path), body))
    buf.clear()

  for line in text.splitlines():
    m = re.match(r"^(#{1,6})\s+(.*)", line)
    if m:
      flush()
      level = len(m.group(1))
      path[:] = path[: level - 1] + [m.group(2).strip()]
    else:
      buf.append(line)
  flush()
  return sections


def structure_chunks(
    text: str, max_tokens: int = 150
) -> list[Chunk]:
  chunks = []
  for section, body in markdown_sections(text):
    pieces = []
    for block in [
        b.strip() for b in re.split(r"\n\s*\n", body) if b.strip()
    ]:
      if block.startswith("|") or ntok(block) <= max_tokens:
        pieces.append(block)  # tables and small paragraphs stay whole
      else:
        pieces.extend(recursive_split(block, max_tokens))
    cur = ""
    for p in pieces:  # pack blocks within the section
      if cur and ntok(cur + "\n\n" + p) > max_tokens:
        chunks.append((section, cur))
        cur = p
      else:
        cur = f"{cur}\n\n{p}" if cur else p
    if cur:
      chunks.append((section, cur))
  return [
      Chunk(
          f"[{sec}]\n{body}",
          {"strategy": "structure", "section": sec, "idx": i},
      )
      for i, (sec, body) in enumerate(chunks)
  ]


struct = structure_chunks(HANDBOOK, max_tokens=150)
chunk_stats(struct, "structure(150)")
for c in struct:
  if "Senior" in c.metadata["section"]:
    print("\n", c.text)
```

📰 **Observe:**
* Every chunk = **one section** (or part of one) and starts with its **section path**.
* The senior-citizen chunk now reads `*[... > 2. Fixed Deposits > 2.2 Senior Citizens] Customers in this category earn 7.4%...*`, so **"this category" is resolved by the heading**.
* The FD table stays whole and is labeled **"2.1 Standard Rates"**.

---

### Lab 5: Semantic chunking (from scratch)

```python
from sentence_transformers import SentenceTransformer

_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")


def embed(texts: list[str]) -> np.ndarray:
  return np.asarray(
      _model.encode(texts, normalize_embeddings=True), dtype="float32"
  )


def semantic_chunks(
    text: str,
    percentile: float = 80,
    window: int = 1,
    max_tokens: int = 200,
):
  sents = [
      s
      for s in split_sentences(text)
      if not s.startswith("#")
  ]  # headings aren't sentences
  windows = [
      " ".join(sents[max(0, i - window) : i + window + 1])
      for i in range(len(sents))
  ]
  vecs = embed(windows)
  dists = np.array(
      [1 - float(vecs[i] @ vecs[i + 1]) for i in range(len(vecs) - 1)]
  )
  threshold = float(np.percentile(dists, percentile))

  chunks, cur = [], [sents[0]]
  for i, d in enumerate(dists):
    nxt = sents[i + 1]
    if (
        d > threshold
        or ntok(" ".join(cur + [nxt])) > max_tokens
    ):
      chunks.append(" ".join(cur))
      cur = [nxt]
    else:
      cur.append(nxt)
  chunks.append(" ".join(cur))
  return [
      Chunk(
          t,
          {
              "strategy": "semantic",
              "idx": i,
          },
      )
      for i, t in enumerate(chunks)
  ], sents, dists, threshold


sem, sents, dists, thr = semantic_chunks(
    HANDBOOK, percentile=80
)
chunk_stats(sem, "semantic(p80)")

print(f"\nBreakpoint threshold (80th percentile distance): {thr:.3f}")
for i, d in enumerate(dists[:14]):
  mark = " <-- BREAK" if d > thr else ""
  print(f"{d:.3f} | {sents[i][:55]:<55} -> {sents[i + 1][:30]}{mark}")
```

📰 **Observe:**
* Look for breaks at **topic shifts** (for example, from loan rates to fees, or from savings to credit cards).
* Change `percentile` (70 / 80 / 90) and watch the chunk count change: this is the knob you must tune.
* Semantic chunking ignores the headings we dropped; combining it **with** structure (semantic splitting *within* long sections) is often better than either alone.

---

### Lab 6: Evaluate all strategies (answer containment + context cost)

```python
def evaluate_chunks(
    chunks: list[Chunk], k: int = 3
) -> dict:
  vecs = embed([c.text for c in chunks])
  hits, ctx_tokens = 0, 0
  for question, answer in EVAL:
    top = np.argsort(-(vecs @ embed([question])[0]))[:k]
    context = [chunks[i].text for i in top]
    ctx_tokens += sum(ntok(t) for t in context)
    hits += any(answer.lower() in t.lower() for t in context)
  return {
      "recall": hits / len(EVAL),
      "ctx_tokens": ctx_tokens / len(EVAL),
  }


# Sanity check: every answer string really exists in the handbook
assert all(a.lower() in HANDBOOK.lower() for _, a in EVAL)

strategies = {
    "fixed(100,20)": fixed,
    "sentence(100)": sent,
    "recursive(100)": rec,
    "structure(150)": struct,
    "semantic(p80)": sem,
}
print(
    f"{'strategy':<16} {'chunks':>6} {'avg tok':>8} {'R@1':>6}"
    f" {'R@3':>6} {'ctx tok@3':>10}"
)
for name, chunks in strategies.items():
  r1, r3 = evaluate_chunks(chunks, k=1), evaluate_chunks(chunks, k=3)
  avg = np.mean([ntok(c.text) for c in chunks])
  print(
      f"{name:<16} {len(chunks):>6} {avg:>8.1f}"
      f" {r1['recall']:>6.2f} {r3['recall']:>6.2f}"
      f" {r3['ctx_tokens']:>10.0f}"
  )
```

📰 **Observe and interpret:**
* Compare **Recall@1** (was the *best* chunk right?) and **Recall@3** (was the answer anywhere in the context?).
* Compare **context tokens**: a strategy with the same recall but fewer tokens is **cheaper and less noisy**.
* Check which questions each strategy misses (print them!). Questions like *"FD rate for senior citizens"* depend on **heading context**, which is exactly where structure-aware chunks with section prefixes tend to help.
* ⚠️ With only 17 questions, a difference of 1 question is 6 percentage points. Treat small gaps as **noise**; real decisions need 50-200+ questions (Day 25).

---

### Lab 7: Chunk-size sweep

```python
print(f"{'strategy':<12} {'size':>5} {'chunks':>6} {'R@3':>6} {'ctx tok@3':>10}")
for size in (50, 100, 200, 400):
  for name, chunker in [
      (
          "recursive",
          lambda s: [
              Chunk(t) for t in recursive_split(HANDBOOK, s)
          ],
      ),
      (
          "structure",
          lambda s: structure_chunks(HANDBOOK, s),
      ),
  ]:
    chunks = chunker(size)
    r = evaluate_chunks(chunks, k=3)
    print(
        f"{name:<12} {size:>5} {len(chunks):>6}"
        f" {r['recall']:>6.2f} {r['ctx_tokens']:>10.0f}"
    )
```

📰 **Observe:**
* For recursive chunks, **context tokens grow roughly linearly** with size.
* ⚠️ **The degenerate case:** the handbook is only $\approx 900$ tokens. At size 400 there are just $\approx 3$ chunks, so the **top-3 is the entire handbook**. Recall@3 becomes trivially 1.0, and you pay $\approx 900$ tokens per query. On a real corpus (thousands of documents) this can't happen, and large chunks' blurry embeddings usually **hurt** ranking. **Never read recall without context tokens next to it.**
* Structure-aware chunks **never merge across sections**, so once `max_tokens` exceeds the largest section ($\approx 120$ tokens here), nothing changes. Sections act as natural size caps, which is usually what you want.
* Pick the **smallest size that reaches your recall target** at an acceptable context cost.
* `all-MiniLM-L6-v2` truncates input beyond **256 tokens**, so above that size part of each chunk is **invisible to the embedder**. That's another reason to check the model limits (Day 4).

---

### Lab 8 (Optional): Framework splitters

```python
# LangChain: header-aware split, then token-based recursive split inside sections
from langchain_text_splitters import (
    MarkdownHeaderTextSplitter,
    RecursiveCharacterTextSplitter,
)

md_splitter = MarkdownHeaderTextSplitter(
    headers_to_split_on=[
        ("#", "h1"),
        ("##", "h2"),
        ("###", "h3"),
    ],
    strip_headers=False,
)
sections = md_splitter.split_text(HANDBOOK)
token_splitter = (
    RecursiveCharacterTextSplitter.from_tiktoken_encoder(
        encoding_name="cl100k_base",
        chunk_size=150,
        chunk_overlap=20,
    )
)
lc_chunks = token_splitter.split_documents(sections)
print("LangChain chunks:", len(lc_chunks))
print(
    lc_chunks[6].metadata,
    "\n",
    lc_chunks[6].page_content[:200],
)
```

```python
# LlamaIndex: Markdown-aware node parser (and a semantic splitter)
from llama_index.core import Document
from llama_index.core.node_parser import (
    MarkdownNodeParser,
    SemanticSplitterNodeParser,
)

md_nodes = MarkdownNodeParser().get_nodes_from_documents(
    [Document(text=HANDBOOK)]
)
print("LlamaIndex markdown nodes:", len(md_nodes))
print(
    md_nodes[6].metadata,
    "\n",
    md_nodes[6].get_content()[:200],
)

# Semantic splitter (needs a real embedding model, e.g., HuggingFaceEmbedding from Day 7):
# from llama_index.embeddings.huggingface import HuggingFaceEmbedding
# splitter = SemanticSplitterNodeParser(buffer_size=1, breakpoint_percentile_threshold=90,
#                                       embed_model=HuggingFaceEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2"))
# sem_nodes = splitter.get_nodes_from_documents([Document(text=HANDBOOK)])
```

📰 **Observe:** Both frameworks store the **heading path as metadata** (`h1`/`h2`/`h3` in LangChain; `header_path` in LlamaIndex). Decide whether to also **prefix it into the chunk text** so the embedding benefits (as in Lab 4).

---

## ❓ Common Confusions

| ❌ Misconception | ✅ Reality |
|---|---|
| "There's one best chunk size." | It depends on the **documents, queries, embedder limit, and budget**. Measure with a sweep. |
| "Bigger chunks = more context = better answers." | Bigger chunks blur embeddings, add noise, cost more, and may exceed the embedder's limit (truncation). |
| "Semantic chunking is always the best." | It's often competitive, but frequently **not clearly better** than a good recursive/structure-aware baseline, and it costs more. |
| "More overlap is always safer." | Heavy overlap creates **near-duplicates** that crowd the top-K and inflate the index. |
| "`chunk_size` is always in tokens." | Many splitters count **characters** by default (Day 7). Check the unit. |
| "Metadata alone gives chunks their context." | Metadata isn't embedded unless you put it in the text. A short **section prefix** in the chunk text helps retrieval. |
| "Doc-level recall is enough to evaluate chunking." | You need **chunk-level answer containment**: the right doc can still yield the wrong chunk. |

---

## 10. 🏋️ Exercises

1. **Miss analysis:** For each strategy in Lab 6, print the questions it **missed** at K=3. Explain each miss (split fact? missing context? blurry chunk?).
2. **Overlap study:** Run `fixed_token_chunks` with overlap 0, 10, 20, and 40 at size 100. Plot Recall@3 and index size.
3. **Hybrid chunker:** Combine structure-aware and semantic: split by headings, then use semantic breakpoints only inside sections longer than 200 tokens.
4. **Prefix ablation:** Run `structure_chunks` with and without the `[section path]` prefix. How much does the prefix change Recall@1?
5. **Table rows:** Change `structure_chunks` so that large tables are split into row groups of 3, **repeating the header row** in each group. Test with a 30-row table.
6. **Sentence splitter edge cases:** Test `split_sentences` on *"Dr. Rao approved the loan at 7.9% p.a. on 1 Jan. The EMI is 25,000 rupees."* Fix what breaks.
7. **Your data:** Take one Day 8 document, run Labs 6-7 with 15 questions of your own, and write down your chosen strategy and size with evidence.

---

## 11. 📝 Quiz (Self-Check)

1. What two roles does a chunk play in RAG, and how do they pull chunk size in opposite directions?
2. Why can very large chunks hurt retrieval even if they contain the answer?
3. What is overlap for, and what's a common range?
4. Describe the recursive splitting algorithm in two sentences.
5. Why do structure-aware chunks with section prefixes help questions like "FD rate for senior citizens"?
6. Outline the semantic chunking algorithm. What is its main tuning knob?
7. What is **answer-containment Recall@K**, and why use it instead of doc-level recall?
8. Your recall is flat from chunk size 150 to 400, but context tokens double. Which size do you pick?
9. Why does the embedding model's max input length matter for chunking?
10. Name two advanced chunking ideas beyond the five implemented today.

<details>
<summary>✅ Answers</summary>

1. **Unit of retrieval** (wants small, focused chunks for sharp embeddings) and **unit of context** (wants larger, self-contained chunks the LLM can understand).
2. Their embedding **averages many topics** (blurry), so they match specific questions poorly. They also add noise and cost when retrieved.
3. It ensures facts near boundaries appear **whole** in at least one chunk. It's commonly **10-20%**.
4. Try to split on the coarsest separator (paragraphs), then recursively split pieces that are still too big with finer separators (lines $\rightarrow$ sentences $\rightarrow$ words $\rightarrow$ tokens), merging small pieces up to the size limit.
5. The heading ("2.2 Senior Citizens") travels **inside the chunk text**, so the embedding captures "senior citizens" even though the sentence only says "this category", and the LLM sees the context too.
6. Split into sentences $\rightarrow$ embed (with windows) $\rightarrow$ compute the distances between consecutive sentences $\rightarrow$ break where the distance exceeds a **percentile threshold** $\rightarrow$ merge. The **threshold/percentile** is the main knob.
7. The % of questions where at least one top-K chunk **contains the answer string**. Doc-level recall can be "correct" even when the retrieved chunk from that doc doesn't contain the answer.
8. **150**: the same recall at about half the cost and noise (the smallest size on the plateau). (And check you're not in the degenerate case where top-K covers the whole corpus.)
9. Text beyond the limit is **truncated** before embedding, so part of the chunk is invisible to retrieval.
10. Any two of: proposition chunking, contextual chunk headers/contextual retrieval, late chunking, parent-child/small-to-big, agentic chunking.
</details>

---

## 12. 📚 Resources

### Articles and reports
* Chroma Research: *Evaluating Chunking Strategies for Retrieval* (2024): https://research.trychroma.com/evaluating-chunking
* Anthropic: *Introducing Contextual Retrieval* (2024): https://www.anthropic.com/news/contextual-retrieval
* Pinecone: *Chunking Strategies for LLM Applications*: https://www.pinecone.io/learn/chunking-strategies/
* Greg Kamradt: *5 Levels of Text Splitting* (notebook/video; origin of the popular semantic chunking recipe): https://github.com/FullStackRetrieval-com/RetrievalTutorials

### Papers
* *Dense X Retrieval: What Retrieval Granularity Should We Use?* (propositions, Chen et al., 2023): https://arxiv.org/abs/2312.06648
* *Late Chunking: Contextual Chunk Embeddings Using Long-Context Embedding Models* (Günther et al., 2024): https://arxiv.org/abs/2409.04701
* *Is Semantic Chunking Worth the Computational Cost?* (Qu et al., 2024): https://arxiv.org/abs/2410.13070

### Docs
* LangChain text splitters (see the docs home $\rightarrow$ text splitters): https://docs.langchain.com/oss/python/
* LlamaIndex node parsers: https://docs.llamaindex.ai/en/stable/module_guides/loading/node_parsers/

---

## 13. 🔑 Key Takeaways

* A chunk is **both** what you search **and** what the LLM reads. It must be **focused** *and* **self-contained**.
* Start with **recursive** (general text) or **structure-aware** (documents with headings), at **200–500 tokens** and **10–20% overlap**.
* Keep **tables and lists whole**, and **prefix chunks with their section path**. It's cheap and often a big win.
* **Semantic chunking** helps unstructured text but costs more. Combine it with structure rather than replacing it.
* **Measure in tokens** and respect the **embedder's max length**.
* Evaluate with **answer-containment Recall@K + context tokens**, sweep sizes, and pick the **smallest size on the recall plateau**.

---

## 🚀 Next: Day 10: Metadata and Filtering

You'll design a metadata schema (dates, versions, departments, access levels), use it to filter retrieval, resolve conflicting document versions, and enforce access control.