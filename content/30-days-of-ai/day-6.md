---
title: "RAG"
day: 6
concept: "The open-book test"
chapter: 1
chapterTitle: "Foundations & Demystification"
---

Day 6: RAG — Giving AI an Open-Book Test
========================================


![Day 6 Illustration](/images/ai_photos/day-6.png)

Yesterday, we learned that AI models suffer from a fundamental flaw: the Knowledge Cutoff. When asked a question they don't know the answer to, they tend to guess confidently, leading to "hallucinations."

To solve this, AI engineers developed one of the most important architectural patterns in modern AI: **Retrieval-Augmented Generation**, or **RAG** for short.

Under the Hood: The Open-Book Test
----------------------------------

If you were a student taking a history exam and didn't know an answer, you might try to guess. But if the teacher suddenly allowed you to use the textbook, you wouldn't guess anymore—you would look up the exact page, read the facts, and write down the correct answer.

RAG does exactly this for AI. It breaks the AI's workflow into two distinct steps:

1.  **Retrieval:** Before the AI is allowed to answer your question, a secondary system takes your prompt and searches a private, up-to-date database for the exact documents needed to answer it.
2.  **Augmentation & Generation:** The system then takes those retrieved documents, attaches them to your original prompt, and says to the AI: *"Answer the user's question, but ONLY use the information contained in these documents."*

Instead of relying on its frozen internal memory, the AI becomes a summarizer and processor of the fresh, accurate data you just handed it.

Real-World Applications
-----------------------

RAG is the secret sauce behind almost every enterprise AI tool today:

*   **Corporate Chatbots:** When you ask a company's internal chatbot for the latest HR policy, it isn't reciting from its original training. It is using RAG to pull the exact PDF from the company intranet and summarizing it for you.
*   **Customer Support Agents:** Instead of hallucinating return policies, support AIs retrieve the exact customer's order history and the company's official return rules before generating a response.
*   **Medical Research:** Doctors can use RAG systems to query thousands of newly published medical journals that were written *after* the AI's knowledge cutoff.

The Counter-Intuitive Nuance
----------------------------

A common misconception is that RAG requires the AI model to "learn" or permanently memorize the new information you give it.

It does not. RAG provides the information purely in the AI's short-term memory (the prompt). As soon as the conversation ends, the AI forgets the documents entirely. This is actually a massive security benefit—it means a company can safely feed highly confidential financial data into a RAG system without worrying that the AI will accidentally "memorize" it and leak it to a competitor in a future conversation.
