---
title: "Hallucinations & RAG"
day: 2
concept: "Grounding fluent guesses with verifiable external truth"
chapter: 1
chapterTitle: "Foundations"
---

# Day 2: Why LLMs Hallucinate and How RAG Helps

> **30-Day RAG Course, Week 1: Foundations**  
> **Date:** Sep 30, 2026 | **Estimated time:** 3-4 hours  
> **Prerequisite:** [Day 1: LLM Basics](./day01_llm_basics.md)

---

## 🎯 Learning Objectives

By the end of today, you should be able to:

1. Define **hallucination** and tell apart its main types.
2. Explain the **root causes** of why LLMs hallucinate.
3. Recognize real-world risks of hallucination, especially in **finance, legal, and healthcare**.
4. Compare mitigation strategies: **prompting, fine-tuning, long context, tool use, RAG**.
5. Explain **how RAG reduces hallucination**, and where it still **fails**.
6. Build a **tiny keyword-based RAG** (no vector DB yet) and measure the difference with and without context.

---

## 📅 Suggested Schedule

| Time | Activity |
|---|---|
| 0:00 - 0:40 | Section 1-2: What hallucination is and its types |
| 0:40 - 1:20 | Section 3-4: Root causes and real-world cases |
| 1:20 - 2:00 | Section 5-6: Mitigation strategies and RAG vs alternatives |
| 2:00 - 2:30 | Section 7: How RAG helps, and where it fails |
| 2:30 - 3:30 | Section 8: Hands-on (tiny RAG, hallucination tests) |
| 3:30 - 4:00 | Exercises and quiz |

---

## 1. What is Hallucination?

> **Hallucination** is when an LLM produces output that is **fluent and confident but false, made up, or not supported** by its input or by real-world facts.

```
User: Who won the 2019 Nobel Prize in Finance?
LLM:  The 2019 Nobel Prize in Finance was awarded to Dr. Mark Ellison
      for his work on algorithmic risk models.   ❌ (no such prize or person)
```

**What makes it dangerous:**
- It **sounds correct**: good grammar and a confident tone.
- It is **hard to detect** without checking an outside source.
- The model **doesn't "know" it is wrong**, because it has no built-in truth check.

---

## 2. Types of Hallucination

### 2.1 By source of the error

| Type | Definition | Example |
|---|---|---|
| **Intrinsic** | Output **contradicts** the given input or context | Context says "revenue $5B"; the model says "$3B" |
| **Extrinsic** | Output adds info that **can't be verified** from the input | The model adds a CEO quote that isn't in the document |

### 2.2 By what goes wrong

| Type | Description | Example |
|---|---|---|
| **Factual (factuality)** | Wrong about real-world facts | "The Eiffel Tower is in Rome" |
| **Faithfulness** | Doesn't follow the given context or instructions | Summary includes facts not in the source |
| **Fabricated citations** | Made-up papers, URLs, legal cases | "See Smith v. Jones (2015)" (doesn't exist) |
| **Numerical / reasoning** | Wrong math or wrong logic steps | Miscalculates compound interest |
| **Entity confusion** | Mixes up people, companies, dates | Attributes one bank's earnings to another |
| **Temporal** | Presents old info as current | Reports a CEO who left 2 years ago |
| **Instruction** | Ignores the requested format or constraints | Asked for JSON, returns prose |

> 💡 **In RAG, you care most about faithfulness:** *is the answer supported by the retrieved context?*

---

## 3. Root Causes: Why Do LLMs Hallucinate?

### 3.1 Training-level causes

| Cause | Explanation |
|---|---|
| **Next-token objective** | LLMs are trained to produce **plausible** text, not **true** text |
| **Imperfect training data** | The web contains errors, myths, outdated info, and contradictions |
| **Knowledge cutoff** | The model has never seen events after its training date |
| **Long-tail facts** | Rare facts (a small company's revenue) appear too rarely to be memorized |
| **Compression** | Billions of facts are squeezed into weights, like a "lossy zip file" of the internet |
| **Rewarding guessing** | Training and benchmarks often reward a confident guess more than "I don't know" |

### 3.2 Inference-level causes

| Cause | Explanation |
|---|---|
| **Sampling randomness** | High temperature makes unlikely (wrong) tokens more likely to be picked |
| **Snowballing** | One wrong token early on $\rightarrow$ the model keeps "justifying" it |
| **Ambiguous prompts** | Vague questions $\rightarrow$ the model fills gaps with assumptions |
| **Sycophancy** | The model agrees with false premises in the question |
| **Long context issues** | Misses relevant info ("Lost in the Middle", Day 1) |

### 3.3 False-premise example (sycophancy)

```
User: Why did Apple acquire Netflix in 2021?
LLM:  Apple acquired Netflix in 2021 to strengthen its streaming... ❌
```

The question assumes something false, and the model "goes along" with it.

### 🧠 Mental model

> An LLM is like a **brilliant student taking a closed-book exam** who never leaves an answer blank.  
> **RAG turns it into an open-book exam.**

---

## 4. Real-World Impact

| Case | What happened | Lesson |
|---|---|---|
| **Legal: Mata v. Avianca (US, 2023)** | Lawyers submitted a brief with **fake case citations** generated by ChatGPT and were sanctioned by the court | Never trust citations without checking them |
| **Airline chatbot: Air Canada (2024)** | A chatbot made up a refund policy, and a tribunal held the airline responsible | Companies are **liable** for what their bots say |
| **Product demo: Google Bard (2023)** | A launch demo had a wrong fact about the James Webb telescope, and it made headlines | Even big labs hit this problem |

### Why finance is especially sensitive

| Risk | Example |
|---|---|
| **Regulatory / compliance** | Wrong info in customer advice $\rightarrow$ regulatory breach |
| **Financial loss** | Wrong numbers in a report $\rightarrow$ bad investment decisions |
| **Reputational** | A public chatbot gives false product or rate info |
| **Auditability** | Regulators require traceable, explainable answers |

> That's why enterprise GenAI in banking and finance usually needs **grounded answers + citations + human review**.

---

## 5. Mitigation Strategies (Overview)

| Strategy | How it helps | Limitations |
|---|---|---|
| **Better prompting** | "Answer only if sure", "Say I don't know" | Doesn't add missing knowledge |
| **Low temperature** | Reduces random wrong tokens | Doesn't fix wrong knowledge |
| **Fine-tuning** | Teaches domain style or behavior | Expensive; knowledge goes stale; can *increase* hallucination on new facts |
| **Long-context stuffing** | Paste whole documents into the prompt | Costly, slow, "lost in the middle", doesn't scale |
| **Tool use / function calling** | Calls APIs, calculators, databases for exact data | Needs integration work |
| **RAG** | Retrieves relevant, up-to-date facts at query time | Only as good as the retrieval (see Section 7) |
| **Self-consistency / verification** | Generate several answers, check they agree; use an LLM-as-judge | Adds cost and latency |
| **Guardrails** | Rule- or model-based output checks | Can't catch everything |
| **Human-in-the-loop** | A human reviews high-risk outputs | Doesn't scale to every query |

> 💡 **In practice: RAG + good prompting + low temperature + citations + evaluation + guardrails.**

---

## 6. RAG vs Fine-Tuning vs Long Context

| Criterion | RAG | Fine-Tuning | Long Context |
|---|---|---|---|
| **Adds new knowledge** | ✅ Excellent | ⚠️ Poor/unreliable | ✅ Good (if it fits) |
| **Keeps knowledge fresh** | ✅ Just update the index | ❌ Must retrain | ✅ Per request |
| **Citations / traceability** | ✅ Yes | ❌ No | ⚠️ Hard |
| **Cost per query** | 💲 Low–Medium | 💲 Low | 💲💲💲 High |
| **Upfront cost** | 💲 Medium (pipeline) | 💲💲 High (training) | 💲 Low |
| **Scales to millions of docs** | ✅ Yes | ❌ No | ❌ No |
| **Access control (per user)** | ✅ Filter at retrieval | ❌ No | ⚠️ Manual |
| **Changes style / format / tone** | ⚠️ Limited | ✅ Excellent | ⚠️ Limited |

### Rule of thumb
> - **Fine-tuning** $\rightarrow$ teach the model **how** to respond (style, format, domain language).
> - **RAG** $\rightarrow$ give the model **what** to know (facts, documents, data).
> - **Both together** work best for many enterprise use cases.

---

## 7. How RAG Helps, and Where It Still Fails

### 7.1 The RAG idea (Lewis et al., 2020)

**Retrieval-Augmented Generation** combines:
- **Parametric memory**: knowledge stored in the model weights.
- **Non-parametric memory**: an external knowledge base that the model searches at query time.

```
User Question ──► ┌──────────┐ ──► Top-K relevant chunks
                  │Retriever │             │
                  └──────────┘             ▼
                  ┌─────────────────────────────────────┐
                  │ Prompt = Instructions + Context + Q │
                  └─────────────────────────────────────┘
                                           │
                                           ▼
                  ┌──────────┐ ──► Grounded answer + citations
                  │   LLM    │
                  └──────────┘
```

### 7.2 How RAG reduces hallucination

| LLM problem | RAG solution |
|---|---|
| Knowledge cutoff | Retrieves the latest documents |
| Long-tail facts | Retrieves the exact document containing the fact |
| No private data | Indexes internal docs (policies, reports, tickets) |
| Made-up sources | Returns **real** source chunks with IDs/links |
| Guessing | The prompt says to answer **only from context**, else "I don't know" |
| Auditability | Every answer is traceable to its source documents |

### 7.3 ⚠️ RAG is NOT a silver bullet: common failure points

| # | Failure point | Description | Covered on |
|---|---|---|---|
| 1 | **Missing content** | The answer isn't in the knowledge base | Day 8 |
| 2 | **Bad chunking** | Relevant info is split across chunks or mixed with noise | Day 9 |
| 3 | **Missed top-ranked docs** | The right chunk exists but isn't retrieved in the top-K | Days 12–14 |
| 4 | **Query mismatch** | The user's wording differs from the document wording | Days 15–17 |
| 5 | **Too much / noisy context** | Irrelevant chunks confuse the model | Days 14, 19 |
| 6 | **Conflicting sources** | Old vs new policy documents disagree | Day 10 (metadata) |
| 7 | **Unfaithful generation** | The model ignores the context or mixes in its own knowledge | Days 25–27 |
| 8 | **Wrong format / incomplete** | The answer misses parts or ignores the format | Day 27 |

📖 *Reference: "Seven Failure Points When Engineering a Retrieval Augmented Generation System" (Barnett et al., 2024)*

> 🔑 **Key insight:** In RAG, hallucination often becomes a **retrieval problem**. If you retrieve the right context, most of the battle is won.

---

## 8. ✍️ Hands-On

### Setup

```bash
pip install openai
```

```python
import os
from openai import OpenAI

client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
MODEL = "gpt-4o-mini"

def ask(prompt: str, system: str = "You are a helpful assistant.", temperature: float = 0.0) -> str:
    resp = client.chat.completions.create(
        model=MODEL,
        temperature=temperature,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
    )
    return resp.choices[0].message.content
```

> Using Ollama instead? Replace `ask()` with an `ollama.chat(...)` call (see Day 1).

---

### Lab 1: Make the model hallucinate

```python
questions = [
    "What was ZyntraCorp Bank's net profit in Q2 2026?",              # fictional
    "Summarize the paper 'Quantum Ledger Networks' by R. Patel (2021).", # likely fictional
    "Why did Apple acquire Netflix in 2021?",                         # false premise
    "List 3 court cases about AI chatbots in India with citations.",
]

for q in questions:
    print("Q:", q)
    print("A:", ask(q, temperature=0.9), "\n" + "-" * 80)
```

> 📝 **Observe:** Which answers are made up? Did the model push back on the false premise?

---

### Lab 2: Reduce hallucination with prompting only

```python
SAFE_SYSTEM = """You are a careful assistant.
- If you are not certain a fact is true, say "I'm not sure."
- Never invent names, numbers, citations, or URLs.
- If a question contains a false assumption, point it out."""

for q in questions:
    print("Q:", q)
    print("A:", ask(q, system=SAFE_SYSTEM), "\n" + "-" * 80)
```

> 📝 **Observe:** Better, but the model still **can't answer** questions about private or new data. That's where RAG comes in.

---

### Lab 3: Build a tiny RAG (keyword retrieval, no vector DB yet)

```python
import re
from collections import Counter

# 1) Knowledge base (pretend these are your company docs)
DOCS = [
    {"id": "DOC-1", "text": "ZyntraCorp Bank reported a net profit of $1.8 billion in Q2 2026, up 9% year over year."},
    {"id": "DOC-2", "text": "ZyntraCorp Bank's CEO is Priya Menon, appointed in March 2025."},
    {"id": "DOC-3", "text": "The ZyntraCorp Savings Plus account offers 4.25% annual interest with no minimum balance."},
    {"id": "DOC-4", "text": "ZyntraCorp Bank's home loan interest rate starts at 7.9% for salaried customers."},
    {"id": "DOC-5", "text": "Customer support is available 24/7 via phone at 1800-000-000 and in-app chat."},
]

STOPWORDS = {"the", "is", "a", "an", "of", "in", "what", "who", "for", "and", "to", "at", "with", "s"}

def tokenize(text: str) -> list[str]:
    return [w for w in re.findall(r"[a-z0-9.%]+", text.lower()) if w not in STOPWORDS]

# 2) Retriever: simple keyword-overlap score
def retrieve(query: str, k: int = 2) -> list[dict]:
    q_tokens = Counter(tokenize(query))
    scored = []
    for doc in DOCS:
        d_tokens = Counter(tokenize(doc["text"]))
        score = sum((q_tokens & d_tokens).values())
        scored.append((score, doc))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [doc for score, doc in scored[:k] if score > 0]

# 3) Augment + Generate
RAG_SYSTEM = """Answer ONLY using the provided context.
If the answer is not in the context, reply exactly: "I don't know based on the provided documents."
Cite the document ID(s) in square brackets, e.g., [DOC-1]."""

def rag_answer(query: str, k: int = 2) -> str:
    hits = retrieve(query, k)
    context = "\n".join([f"[{d['id']}] {d['text']}" for d in hits]) or "(no relevant documents)"
    prompt = f'CONTEXT:\n"""\n{context}\n"""\n\nQUESTION: {query}'
    return ask(prompt, system=RAG_SYSTEM)

# 4) Compare with and without RAG
tests = [
    "What was ZyntraCorp Bank's net profit in Q2 2026?",
    "Who is the CEO of ZyntraCorp Bank?",
    "What is the savings account interest rate at ZyntraCorp?",
    "What is ZyntraCorp Bank's stock price today?",  # not in the KB
]

for q in tests:
    print("Q:", q)
    print("  ❌ No RAG :", ask(q))
    print("  ✅ RAG    :", rag_answer(q))
    print("-" * 80)
```

> 📝 **Observe:**
> - Without RAG, the model guesses or refuses.
> - With RAG, it gives correct, **cited** answers, and says "I don't know" for the stock price.

---

### Lab 4: See RAG fail (retrieval miss)

```python
# The user's wording doesn't match the document wording
q = "Who runs ZyntraCorp?"          # the doc says "CEO", not "runs"
print("Retrieved:", [d["id"] for d in retrieve(q)])
print("Answer   :", rag_answer(q))
```

> 📝 **Observe:** Keyword retrieval may miss "runs" $\approx$ "CEO". This is why you'll learn **embeddings and semantic search** (Days 4–6) and **query rewriting** (Day 15).

---

### Lab 5: Detect hallucination with self-consistency

Idea (from *SelfCheckGPT*): if the model **really knows** a fact, repeated samples tend to **agree**. If it's making things up, the answers **vary**.

```python
def self_consistency(question: str, n: int = 5) -> list[str]:
    return [ask(question + " Answer in one short sentence.", temperature=1.0) for _ in range(n)]

for q in ["What is the capital of Australia?", "What was ZyntraCorp Bank's Q2 2026 net profit?"]:
    print("Q:", q)
    for a in self_consistency(q):
        print("  -", a)
    print()
```

> 📝 **Observe:** Stable answers suggest knowledge. Answers that change each time suggest hallucination.

---

### Lab 6 (Bonus): LLM-as-a-judge faithfulness check

```python
JUDGE_SYSTEM = """You are a strict fact-checker.
Given CONTEXT and ANSWER, reply with JSON only:
{"faithful": true|false, "unsupported_claims": ["..."]}"""

def check_faithfulness(context: str, answer: str) -> str:
    prompt = f'CONTEXT:\n"""{context}"""\n\nANSWER:\n"""{answer}"""'
    return ask(prompt, system=JUDGE_SYSTEM)

ctx = DOCS[0]["text"]
print(check_faithfulness(ctx, "ZyntraCorp's Q2 2026 profit was $1.8B, up 9%."))              # faithful
print(check_faithfulness(ctx, "ZyntraCorp's Q2 2026 profit was $1.8B, driven by crypto."))   # unsupported
```

> This is a preview of **RAG evaluation** (Days 25–26: RAGAS, Trulens, DeepEval).

---

## 9. 🏋️ Exercises

1. **Hallucination hunt:** Write 10 questions (3 real facts, 3 fictional entities, 2 false premises, 2 about recent events). Record which ones the LLM hallucinates on.
2. **Temperature study:** Run Lab 1 at `temperature = 0, 0.7, 1.5`. Does the hallucination rate change?
3. **Extend the KB:** Add 10 more docs to Lab 3 (for example, the credit card fees policy and FD rates). Ask 10 questions and count correct, "I don't know", and wrong answers.
4. **Break the retriever:** Find 3 questions where keyword retrieval fails because of synonyms or paraphrasing. Save them; you'll fix them on Day 4–6.
5. **Conflicting docs:** Add `DOC-6: "ZyntraCorp's CEO is Rahul Shah (appointed 2022)."` Ask who the CEO is. How does the model handle the conflict? How could metadata such as dates help?
6. **Compare strategies:** For one fictional-company question, compare the answers from (a) no prompt rules, (b) the safe prompt, and (c) RAG. Write a 3-line conclusion.

---

## 10. 📄 Quiz (Self-Check)

1. What is the difference between **intrinsic** and **extrinsic** hallucination?
2. Why does the **next-token prediction** objective lead to hallucination?
3. Give 2 reasons why **fine-tuning** is not ideal for adding new factual knowledge.
4. What is **sycophancy** in LLMs? Give an example.
5. Name the two types of memory in the original RAG paper.
6. List 4 ways RAG can still fail.
7. What does **faithfulness** mean in the context of RAG?
8. How does **self-consistency** help detect hallucinations?
9. In one line: when should you use RAG, and when fine-tuning?
10. Why are **citations** important in a banking or finance RAG system?

<details>
<summary>✅ Answers</summary>

1. **Intrinsic** contradicts the given input or context. **Extrinsic** adds info that can't be verified from the input.
2. The model is optimized to produce *plausible* continuations, not *true* ones, and there's no built-in fact-check step.
3. Any two of: it is expensive, it has to be redone for every update, knowledge goes stale, it gives no citations, and it can *increase* hallucination when the model learns new facts poorly.
4. The model agrees with the user's false assumptions. For example, it explains "why Apple acquired Netflix" even though that never happened.
5. **Parametric** memory (model weights) and **non-parametric** memory (an external retrievable index).
6. Any four of: missing content, bad chunking, the right doc not retrieved in the top-K, query/document wording mismatch, noisy context, conflicting sources, unfaithful generation.
7. Every claim in the answer is **supported by the retrieved context**.
8. Sample several answers at high temperature. Consistent answers suggest real knowledge; answers that vary suggest fabrication.
9. **RAG** is for *what to know* (facts, fresh or private data). **Fine-tuning** is for *how to respond* (style, format, domain behavior).
10. They give auditability, regulatory compliance, user trust, and a way to check answers.

</details>

---

## 11. 📚 Resources

### Papers
- *Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks* (Lewis et al., 2020), **the original RAG paper**: https://arxiv.org/abs/2005.11401
- *A Survey on Hallucination in Large Language Models* (Huang et al., 2023): https://arxiv.org/abs/2311.05232
- *Survey of Hallucination in Natural Language Generation* (Ji et al., 2022): https://arxiv.org/abs/2202.03629
- *Why Language Models Hallucinate* (Kalai et al., OpenAI, 2025): https://arxiv.org/abs/2509.04664
- *Retrieval-Augmented Generation for Large Language Models: A Survey* (Gao et al., 2023): https://arxiv.org/abs/2312.10997
- *Seven Failure Points When Engineering a RAG System* (Barnett et al., 2024): https://arxiv.org/abs/2401.05856
- *SelfCheckGPT* (Manakul et al., 2023): https://arxiv.org/abs/2303.08896
- *TruthfulQA* (Lin et al., 2021): https://arxiv.org/abs/2109.07958

### Articles and guides
- Prompt Engineering Guide, RAG section: https://www.promptingguide.ai/techniques/rag
- Pinecone Learning Center, RAG articles: https://www.pinecone.io/learn/
- LangChain RAG tutorial (preview for Day 7): https://python.langchain.com/docs/tutorials/rag/

### Videos (search on YouTube)
- *"What is Retrieval-Augmented Generation (RAG)?"* by IBM Technology
- *"RAG vs Fine-Tuning"* by IBM Technology
- Andrej Karpathy: *Intro to Large Language Models* (the hallucination segment)

---

## 12. 💬 Key Takeaways

- **Hallucination = fluent, confident, but false or unsupported output.**
- LLMs hallucinate because they're trained to be **plausible, not truthful**, and they have **knowledge gaps** (cutoff, long-tail facts, private data).
- In **finance and other regulated domains**, hallucinations carry **legal, financial, and reputational risk**.
- **RAG grounds answers in real, retrievable, citable sources**. It's the #1 practical fix for knowledge-related hallucination.
- **RAG isn't perfect**: many failures come from **retrieval**, which is what the rest of this course fixes (embeddings, chunking, hybrid search, re-ranking, evaluation).
- Use **fine-tuning for "how"**, **RAG for "what"**.

---

## ➡️ Next: Day 3: RAG Architecture (Retriever, Generator, Pipeline Flow)