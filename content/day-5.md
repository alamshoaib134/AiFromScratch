---
title: "Knowledge Cutoff & Hallucinations"
day: 5
concept: "The confident guesser"
chapter: 1
chapterTitle: "Foundations & Demystification"
---

Day 5: The Knowledge Cutoff & Why AI “Hallucinates” Facts
=========================================================



![Day 5 Illustration](/images/ai_photos/day-5.png)

If you use Generative AI long enough, you will eventually experience a very strange phenomenon. You’ll ask it a highly specific question, and it will give you a beautifully written, perfectly formatted, and incredibly confident answer. The only problem? The answer is completely fake.


This behavior is known as a **Hallucination**, and it is one of the biggest hurdles preventing companies from trusting AI with critical tasks. To understand why AI makes things up, we first have to understand how an AI’s brain is frozen in time.

Under the Hood: The Frozen Student
----------------------------------

Building a Large Language Model (LLM) takes months of processing time and millions of dollars. The engineers gather a massive dataset (essentially a giant chunk of the internet) and train the model on it. The day that training finishes is known as the **Knowledge Cutoff**.

Imagine a genius student who has read every Wikipedia article, textbook, and news site published up until January 2025. Then, that student is locked in a room without a smartphone or internet connection. If you ask them a question about the Roman Empire, they will give you a flawless answer. But if you ask them who won the Super Bowl in 2026, they are stuck. They simply don’t have the data.

When faced with a question it doesn’t know, a standard LLM rarely says, “I don’t know.” Instead, it uses math to predict what a _plausible_ answer would look like. If it knows that a certain team was heavily favored to win, it might just declare them the winner, complete with a fabricated final score. It strings together words that statistically sound correct, even if they have no basis in reality.

Real-World Applications (And Failures)
--------------------------------------

When we forget about the knowledge cutoff and hallucinations, things go wrong in the real world:

1.  **Legal Disaster:** In a famous early case, a lawyer used ChatGPT to write a legal brief. The AI hallucinated several past court cases, complete with fake judges and fake quotes. The lawyer submitted the brief without checking, assuming the AI was a search engine, and faced severe professional penalties.
    
2.  **Medical Summaries:** If an AI is summarizing a patient’s history, it might hallucinate a medication name that sounds very similar to the real one, simply because the fake word statistically often appears next to the patient’s symptoms in its training data.
    
3.  **Coding Errors:** Programmers often ask AI for help writing code. Sometimes, the AI will confidently suggest using a software library or a specific command that literally does not exist. It just invented a command that _looks_ like a real programming phrase.
    

The Counter-Intuitive Nuance
----------------------------

A common misconception is that AI is “lying” or being deceptive when it hallucinates.

In reality, it’s an incentive problem. LLMs are mathematical prediction engines optimized to be helpful and conversational. Through their training, they are heavily rewarded for providing an answer and heavily penalized for leaving a prompt blank. They have literally been trained that guessing a plausible-sounding answer is “better” than admitting ignorance.

Tomorrow, we will explore the exact technology engineers use to solve this problem: giving the AI an open-book test.