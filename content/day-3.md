---
title: ""
day: 3
concept: "Narrow AI, General AI, and Super AI"
chapter: 1
chapterTitle: "How AI understands meaning"
---

Day 3: Text Embeddings — Giving Words a Map
===========================================

Have you ever wondered how an AI tool can read a sentence you wrote, understand your underlying mood, and reply with the perfect tone? It feels like magic, or at least like the machine possesses a human-like grasp of language.

The reality is far more fascinating. Computers are fundamentally incapable of understanding words, alphabet letters, or grammar rules. They only understand numbers. To bridge this gap, AI researchers created a concept called **Text Embeddings**. This is the foundational technology that allows machines to turn human language into a mathematical map where meaning can be calculated.

Under the Hood: The Multi-Dimensional Supermarket
-------------------------------------------------

To understand embeddings, let’s scale down the math into a relatable reality. Imagine a regular, two-dimensional map with an X-axis (horizontal) and a Y-axis (vertical).

If we wanted to map out animals, we might decide that the X-axis represents **Size** (from tiny to massive) and the Y-axis represents **Domesticity** (from wild to household pet).

*   A **Mouse** would score low on size, but high on wildness.
    
*   A **Golden Retriever** would score medium on size, but maximum on domesticity.
    
*   A **Lion** would score high on size, and maximum on wildness.
    

By giving these traits numeric values, the computer can see that a Golden Retriever and a House Cat have coordinates that sit very close to one another, while a Lion sits far away.

In actual AI models like GPT-4, the computer doesn’t just use two axes (Size and Domesticity). It uses hundreds or even thousands of different dimensions — subtle characteristics like tense, gender, emotional weight, and functional use. This massive digital map is called a **Vector Space**, and the specific coordinates assigned to a word or sentence are its **Embedding**.

Real-World Applications
-----------------------

You encounter text embeddings every single day, often without realizing it:

1.  **Search Engine Intelligence:** When you search Google for “how to fix a flat tire,” the system uses embeddings to show you articles about “changing a punctured rubber casing,” even though you didn’t type those exact words. It matches the _meaning_, not just the spelling.
    
2.  **Streaming Recommendations:** Netflix and Spotify analyze the text descriptions, genres, and user reviews of the media you like, turn them into embeddings, and find other content whose mathematical coordinates sit closest to your favorites.
    
3.  **Plagiarism & Copy Checking:** Modern plagiarism tools don’t just look for copied and pasted text. They look for sentences that have been rephrased but still generate the exact same embedding coordinates.
    

The Counter-Intuitive Nuance
----------------------------

A common misconception is that an embedding map is permanent and universally true. In reality, **embeddings inherit the biases of the data they are trained on.**

If an AI model is trained entirely on historical books from the 1800s, its embedding map might place the word “Doctor” mathematically closer to “Man” and “Nurse” closer to “Woman.” Because the map is built purely by observing how humans have written in the past, it maps our cultural flaws right along with our vocabulary. Understanding this limitation is crucial as we rely more on AI to make decisions for us.