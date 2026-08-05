---
title: "AI Ethics & Bias"
day: 21
concept: "The mirror of humanity"
chapter: 3
chapterTitle: "Agents & Modalities"
---

Day 21: AI Ethics & Bias — Why Algorithms Aren’t Neutral
========================================================




![Day 21 Illustration](/images/ai_photos/day-21.png)

Over the last 20 days, we have built a deep understanding of how AI works under the hood. We know how it reads, writes, sees, and uses tools. Now that we understand the mechanics, we must enter Phase 4: the consequences.



When you give a machine the ability to process millions of data points and make autonomous decisions, you immediately run into a profound philosophical problem. Mathematics might be objective, but the data fed into the mathematics is created by humans. And humans are deeply flawed.

Under the Hood: The Mirror and The Alignment
--------------------------------------------

How does a machine become biased? It happens during the training phase.

An AI’s “worldview” is entirely shaped by its training data. If you train an AI to screen resumes by feeding it 10 years of historical hiring data from a male-dominated tech company, the AI will mathematically calculate that being male is a strong predictor of success. It isn’t explicitly programmed to be sexist; it is simply optimizing for the historical pattern it was fed.

To combat this, AI labs use a process called **RLHF (Reinforcement Learning from Human Feedback)** — also known as **Alignment**.

After the AI reads the raw internet, thousands of human workers sit down and chat with it. If the AI says something toxic, biased, or dangerous, the human hits a “thumbs down” button. This physically alters the AI’s internal mathematical weights, teaching it “guardrails.” The AI is mathematically _aligned_ to act polite, harmless, and fair.

Real-World Applications (And Failures)
--------------------------------------

When alignment fails, the real-world consequences are severe:

1.  **Healthcare Algorithms:** A major hospital system used an AI to predict which patients needed extra medical care. Because the AI was trained on historical spending data (and minority patients historically had less money spent on them due to systemic inequities), the AI falsely concluded that minority patients were simply “healthier” and denied them critical care.
    
2.  **Facial Recognition:** Early computer vision models were trained primarily on photos of light-skinned individuals. When deployed in the real world by law enforcement, the AI had catastrophic failure rates when trying to identify people with darker skin tones, leading to false arrests.
    
3.  **Credit Scoring:** Financial AIs deciding who gets a mortgage have been caught giving lower credit limits to women than to their husbands, even when they share the exact same assets and bank accounts.
    

The Counter-Intuitive Nuance
----------------------------

A common misconception is that you can fix AI bias simply by removing sensitive data. People assume that if you delete the “Race” or “Gender” column from a dataset, the AI will be forced to be colorblind and gender-blind.

This completely fails. AI is an incredibly powerful pattern-matching engine. If you delete “Race,” the AI will act like a detective and find **Proxy Variables**. It will look at a person’s zip code, the clubs they belonged to in college, or their grocery shopping habits, and mathematically reconstruct their demographic profile anyway to make its decision. You cannot blindfold an AI; you have to actively train it to prioritize fairness.