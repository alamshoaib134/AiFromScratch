---
title: "LLM Basics"
day: 1
concept: "The engine under the hood: tokens, context windows, and prompts"
chapter: 1
chapterTitle: "Foundations"
---

# Day 1: LLM Basics (Tokens, Context Window, Prompting)

> **30-Day RAG Course, Week 1: Foundations**
> **Date:** Sep 29, 2026 | **Estimated time:** 3-4 hours

---

## 🎯 Learning Objectives

By the end of today, you should be able to:

1. Explain what a Large Language Model (LLM) is and how it generates text.
2. Understand **tokens** and **tokenization**, and count tokens in code.
3. Explain the **context window** and why it matters for RAG.
4. Understand key generation parameters (temperature, top-p, max tokens).
5. Write effective prompts (zero-shot, few-shot, system prompts, chain-of-thought).
6. Make your first LLM API call in Python.

---

## 📅 Suggested Schedule

| Time | Activity |
| --- | --- |
| 0:00 – 0:45 | Section 1-2: What is an LLM and how it works |
| 0:45 – 1:30 | Section 3: Tokens and tokenization (with code) |
| 1:30 – 2:00 | Section 4-5: Context window and generation parameters |
| 2:00 – 3:00 | Section 6: Prompt engineering (with code) |
| 3:00 – 3:30 | Hands-on exercises and quiz |

---

## 1. What is a Large Language Model?

An **LLM** is a neural network (usually a **Transformer**) trained on huge amounts of text to **predict the next token** in a sequence.

```
Input: "The capital of France is"
Model: predicts the next token -> "Paris"
```

The model repeats this next-token prediction many times, one token at a time, to produce whole sentences and paragraphs. This is called **autoregressive generation**.

### Key terms

| Term | Meaning |
| --- | --- |
| **Parameters** | Learned weights of the model (for example, 7B = 7 billion) |
| **Pre-training** | Training on massive raw text to learn language patterns |
| **Fine-tuning** | Further training on specific data/tasks |
| **Instruction tuning / RLHF** | Training the model to follow instructions and be helpful |
| **Inference** | Using the trained model to generate outputs |
| **Base model vs Chat model** | Base = raw text completion; Chat = tuned for conversation |

### Popular LLM families

| Type | Examples |
| --- | --- |
| Closed / API | GPT-4o / GPT-4.1 (OpenAI), Claude (Anthropic), Gemini (Google) |
| Open weights | Llama (Meta), Mistral / Mixtral, Qwen, Gemma, Phi |

---

## 2. How an LLM Works (High-Level)

```
Text -> Tokenizer -> Token IDs -> Embeddings -> Transformer Layers (Self-Attention) -> Probabilities -> Next Token
```

1. **Tokenizer:** splits the text into tokens and maps them to IDs.
2. **Embedding layer:** turns each token ID into a vector of numbers.
3. **Transformer layers:** use **self-attention**, so every token can "look at" the other tokens and learn context.
4. **Output layer:** produces a probability for every token in the vocabulary.
5. **Sampling:** picks the next token based on those probabilities.

### Self-attention in one line

> Each word decides **how much attention to pay to every other word** in the sentence when building its meaning.

Example: in *"The bank of the river"*, attention helps the model see that "bank" means a riverbank, not a financial bank.

### ⚠️ Key limitations of LLMs (why RAG exists)

| Limitation | Description | How RAG helps |
| --- | --- | --- |
| **Knowledge cutoff** | Doesn't know events after training | Retrieves fresh data |
| **Hallucination** | Confidently makes up facts | Grounds answers in sources |
| **No private data** | Doesn't know your company docs | Retrieves your documents |
| **No citations** | Can't show where info came from | Returns source chunks |
| **Limited context** | Can't read millions of documents at once | Retrieves only the relevant parts |

---

## 3. Tokens and Tokenization

### What is a token?

A **token** is a piece of text: it can be a whole word, part of a word, a character, or punctuation.

```
"Tokenization is powerful!"
-> ["Token", "ization", " is", " powerful", "!"]   (5 tokens)
```

### Rules of thumb (English, OpenAI tokenizers)

- 1 token $\approx$ **4 characters**
- 1 token $\approx$ **0.75 words**
- 100 tokens $\approx$ **75 words**
- 1 page of text $\approx$ **500-700 tokens**

### Common tokenization algorithms

| Algorithm | Used by |
| --- | --- |
| **BPE (Byte Pair Encoding)** | GPT models (tiktoken), Llama 3 |
| **WordPiece** | BERT |
| **SentencePiece / Unigram** | T5, Llama 2, Mistral |

### Why tokens matter for RAG

- **Cost:** API pricing is per token (input + output).
- **Context limits:** retrieved chunks + prompt + answer must fit in the context window.
- **Chunking:** later you'll split documents into chunks measured in tokens.
- **Non-English text, numbers, and code** often use **more tokens**.

### 🧪 Code: Count tokens with `tiktoken`

```bash
pip install tiktoken
```

```python
import tiktoken

enc = tiktoken.get_encoding("o200k_base") # used by GPT-4o family

text = "Retrieval-Augmented Generation improves LLM accuracy."
tokens = enc.encode(text)

print("Token count:", len(tokens))
print("Token IDs:", tokens)
print("Tokens:", [enc.decode([t]) for t in tokens])
```

### 🧪 Code: Tokenize with Hugging Face (open models)

```bash
pip install transformers
```

```python
from transformers import AutoTokenizer

tok = AutoTokenizer.from_pretrained("bert-base-uncased")
print(tok.tokenize("Tokenization is powerful!"))
# ['token', '##ization', 'is', 'powerful', '!']
```

---

## 4. Context Window

The **context window** is the **maximum number of tokens** the model can handle at once, **input + output combined**.

```
+--------------------------------- Context Window (e.g., 128K tokens) ----------------------------------+
| System Prompt | Chat History | Retrieved Documents (RAG) | User Question | Answer |
+-------------------------------------------------------------------------------------------------------+
```

### Typical context window sizes (approximate)

| Model | Context window |
| --- | --- |
| GPT-3.5 (original) | 4K |
| GPT-4o | 128K |
| Claude (recent) | 200K+ |
| Gemini 1.5 / 2.x | 1M+ |
| Llama 3.1+ | 128K |

> Check each provider's current docs; these limits change often.

### "If context windows are huge, why do we need RAG?"

| Issue | Explanation |
| --- | --- |
| **Cost** | Sending 1M tokens per query is expensive |
| **Latency** | More tokens $\rightarrow$ slower responses |
| **Lost in the Middle** | Models pay less attention to info placed in the middle of long contexts |
| **Scale** | Enterprise data is often **billions** of tokens, far beyond any window |
| **Freshness** | RAG lets you update data without retraining |

📄 Research: *"Lost in the Middle: How Language Models Use Long Contexts"* (Liu et al., 2023)

---

## 5. Generation Parameters

| Parameter | What it does | Typical RAG setting |
| --- | --- | --- |
| **temperature** | Randomness ($0$ = deterministic, $1+$ = creative) | **0 – 0.3** (factual) |
| **top_p** | Nucleus sampling; pick from the top tokens that add up to probability $p$ | **0.9 – 1.0** |
| **top_k** | Pick from the $k$ most likely tokens | 40 – 50 (open models) |
| **max_tokens** | Maximum output length | Based on the answer size |
| **stop** | Sequences that stop generation | Optional |
| **frequency / presence penalty** | Reduce repetition | 0 – 0.5 |

> 💡 **For RAG, use a low temperature**, because you want answers grounded in the retrieved facts, not creative ones.

---

## 6. Prompt Engineering Basics

A **prompt** is the input you give an LLM. In RAG, **prompt design is critical** because you tell the model *how to use* the retrieved context.

### Message roles (Chat APIs)

| Role | Purpose |
| --- | --- |
| `system` | Sets behavior, persona, rules |
| `user` | The question or task |
| `assistant` | The model's previous replies |

### Prompting techniques

#### 6.1 Zero-shot
```
Classify the sentiment of this review as Positive, Negative, or Neutral:
"The loan approval process was quick and easy."
```

#### 6.2 Few-shot (give examples)
```
Review: "Terrible customer service." -> Negative
Review: "Average experience." -> Neutral
Review: "Loved the low interest rates!" -> Positive
Review: "The app keeps crashing." ->
```

#### 6.3 Chain-of-Thought (CoT)
```
A bank charges 2% monthly interest on $1,000. What is the total after 3 months with compounding?
Let's think step by step.
```

#### 6.4 Role / persona prompting
```
You are a senior financial analyst. Explain EBITDA to a beginner in 3 bullet points.
```

#### 6.5 Structured output
```
Extract the company name, revenue, and year from the text. Return JSON:
{"company": "", "revenue": "", "year": ""}
```

### 💡 Prompting best practices

1. **Be specific and clear:** say exactly what you want.
2. **Give context:** who the audience is and what the purpose is.
3. **Use delimiters** (`"""`, `###`, XML tags) to separate instructions from data.
4. **Specify the output format:** JSON, bullet list, table, word limit.
5. **Tell the model what to do when it doesn't know:** *"If the answer is not in the context, say 'I don't know'."*
6. **Iterate:** test and refine.

### 🔑 Preview: A basic RAG prompt template

You will use this pattern throughout the course:

```text
SYSTEM:
You are a helpful assistant. Answer ONLY using the context below.
If the answer is not in the context, reply: "I don't know based on the provided documents."
Cite the source ID for each fact.

CONTEXT:
"""
[Doc 1] ...retrieved chunk...
[Doc 2] ...retrieved chunk...
"""

QUESTION:
{user_question}

ANSWER:
```

---

## 7. Hands-On: Your First LLM API Call

### Option A: OpenAI API

```bash
pip install openai
```

```python
import os
from openai import OpenAI

client = OpenAI(api_key=os.environ["OPENAI_API_KEY"]) # never hard-code keys

response = client.chat.completions.create(
    model="gpt-4o-mini",
    temperature=0.2,
    max_tokens=200,
    messages=[
        {"role": "system", "content": "You are a concise financial tutor."},
        {"role": "user", "content": "Explain what an ETF is in 3 sentences."},
    ],
)

print(response.choices[0].message.content)
print("Tokens used:", response.usage)
```

### Option B: Free, local model with Ollama

```bash
# Install from https://ollama.com, then:
ollama pull llama3.2
pip install ollama
```

```python
import ollama

resp = ollama.chat(
    model="llama3.2",
    messages=[{"role": "user", "content": "Explain what an ETF is in 3 sentences."}],
    options={"temperature": 0.2},
)
print(resp["message"]["content"])
```

### Option C: Simulate "RAG" manually (no retrieval yet)

```python
context = """
[Doc 1] Acme Bank's Q2 2026 net profit was $4.2 billion, up 12% YoY.
[Doc 2] Acme Bank's CEO is Jane Doe, appointed in 2024.
"""

question = "What was Acme Bank's Q2 2026 net profit and who is the CEO?"

prompt = f"""Answer ONLY from the context. If not found, say "I don't know".
Cite the doc IDs.

CONTEXT:
\"\"\"{context}\"\"\"

QUESTION: {question}
"""

response = client.chat.completions.create(
    model="gpt-4o-mini",
    temperature=0,
    messages=[{"role": "user", "content": prompt}],
)
print(response.choices[0].message.content)
```

> 👉 **Now ask a question that is \*\*not\*\* in the context** (for example, *"What is Acme's stock price?"*) and check that the model says "I don't know". This is the core idea of RAG.

---

## 8. 🏋️ Exercises

1. **Token counting:** Count the tokens in 3 texts: an English sentence, a Hindi sentence, and a Python code snippet. Compare the counts.
2. **Temperature test:** Ask the same question 3 times at `temperature=0` and 3 times at `temperature=1.2`. Note the differences.
3. **Prompt comparison:** Write a zero-shot, a few-shot, and a CoT prompt for the same task. Compare the output quality.
4. **Hallucination test:** Ask the LLM about a fictional company (for example, *"What was ZyntraCorp's 2025 revenue?"*). Does it make up an answer?
5. **Mini-RAG:** Use Option C above with your own 3-4 fact paragraphs. Ask 5 questions: 3 answerable and 2 not answerable.
6. **Cost calculator:** Write a function that estimates the API cost given the input text, the expected output tokens, and the price per 1M tokens.

---

## 9. 📄 Quiz (Self-Check)

1. What does "autoregressive" mean in LLM generation?
2. Roughly how many tokens are in 1,500 English words?
3. Does the context window include the output tokens?
4. Name 3 limitations of LLMs that RAG solves.
5. What temperature should you use for a factual RAG chatbot, and why?
6. What is the "Lost in the Middle" problem?
7. Which role in a chat API is best for setting rules like "answer only from the context"?
8. Why do non-English languages often cost more tokens?

<details>
<summary>✅ Answers</summary>

1. The model generates one token at a time, and each new token depends on the tokens before it.
2. $\sim 2,000$ tokens ($1,500 \div 0.75$).
3. Yes. Input + output together must fit in the context window.
4. Knowledge cutoff, hallucination, no access to private data (also: no citations).
5. Low (0-0.3), for deterministic, grounded, factual answers.
6. LLMs tend to miss or underuse information placed in the middle of long contexts.
7. The `system` role.
8. Tokenizers are trained mostly on English text, so other scripts get split into more (smaller) pieces.
</details>

---

## 10. 📚 Resources

### Videos
- Andrej Karpathy: *Intro to Large Language Models* (YouTube, 1 hr): best overview
- Andrej Karpathy: *Let's build the GPT Tokenizer* (YouTube): deep dive on tokens
- 3Blue1Brown: *But what is a GPT? / Attention in transformers* (YouTube)

### Reading
- Jay Alammar: *The Illustrated Transformer*: https://jalammar.github.io/illustrated-transformer/
- Prompt Engineering Guide: https://www.promptingguide.ai/
- OpenAI Prompt Engineering Guide: https://platform.openai.com/docs/guides/prompt-engineering
- Anthropic Prompt Engineering Docs: https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview

### Tools
- OpenAI Tokenizer (visual): https://platform.openai.com/tokenizer
- tiktoken library: https://github.com/openai/tiktoken
- Ollama (run LLMs locally): https://ollama.com

### Papers (optional)
- *Attention Is All You Need* (Vaswani et al., 2017): https://arxiv.org/abs/1706.03762
- *Lost in the Middle* (Liu et al., 2023): https://arxiv.org/abs/2307.03172
- *Chain-of-Thought Prompting* (Wei et al., 2022): https://arxiv.org/abs/2201.11903

---

## 11. 🧠 Key Takeaways

- LLMs **predict the next token**. They are powerful but **don't truly "know" facts**.
- **Tokens** drive **cost, speed, and context limits**. Always measure them.
- The **context window** is limited and has "attention blind spots". Even huge windows don't replace RAG.
- Use a **low temperature** and **clear, grounded prompts** for factual tasks.
- **RAG = give the LLM the right context at the right time**, and prompting is how you tell it to use that context.

---

## ⏭️ Next: Day 2: Why LLMs Hallucinate and How RAG Helps