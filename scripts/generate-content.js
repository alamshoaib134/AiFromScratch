const fs = require('fs');
const path = require('path');

const contentDir = path.join(process.cwd(), 'content');
if (!fs.existsSync(contentDir)) {
  fs.mkdirSync(contentDir, { recursive: true });
}

const chapters = [
  { chapter: 1, title: "Foundations of AI", days: [
    { day: 1, title: "What is Artificial Intelligence?", concept: "Defining AI and its scope" },
    { day: 2, title: "A Brief History of AI", concept: "From Turing to modern deep learning" },
    { day: 3, title: "Types of AI Systems", concept: "Narrow AI, General AI, and Super AI" },
    { day: 4, title: "How Machines Learn", concept: "The fundamentals of machine learning" },
    { day: 5, title: "Data — The Fuel of AI", concept: "Understanding training data and datasets" },
    { day: 6, title: "Your First AI Interaction", concept: "Hands-on with language models" },
  ]},
  { chapter: 2, title: "Core Concepts", days: [
    { day: 7, title: "Neural Networks Explained", concept: "Neurons, layers, and activation functions" },
    { day: 8, title: "Training & Loss Functions", concept: "How models learn from mistakes" },
    { day: 9, title: "Supervised vs Unsupervised Learning", concept: "Two paradigms of machine learning" },
    { day: 10, title: "Natural Language Processing", concept: "Teaching machines to understand text" },
    { day: 11, title: "Computer Vision Basics", concept: "How AI sees and interprets images" },
    { day: 12, title: "Reinforcement Learning", concept: "Learning through trial and reward" },
  ]},
  { chapter: 3, title: "Modern AI Tools", days: [
    { day: 13, title: "Introduction to Large Language Models", concept: "GPT, Claude, and the transformer revolution" },
    { day: 14, title: "Prompt Engineering Fundamentals", concept: "Crafting effective AI prompts" },
    { day: 15, title: "Advanced Prompt Techniques", concept: "Chain-of-thought, few-shot, and more" },
    { day: 16, title: "AI-Powered Code Generation", concept: "Using AI to write and debug code" },
    { day: 17, title: "Image Generation with AI", concept: "DALL-E, Midjourney, and Stable Diffusion" },
    { day: 18, title: "AI for Audio & Music", concept: "Speech synthesis and music generation" },
  ]},
  { chapter: 4, title: "Building with AI", days: [
    { day: 19, title: "APIs and AI Integration", concept: "Connecting AI services to your apps" },
    { day: 20, title: "Building a Chatbot", concept: "Create your own conversational AI" },
    { day: 21, title: "RAG: Retrieval-Augmented Generation", concept: "Grounding AI in your own data" },
    { day: 22, title: "Fine-Tuning Models", concept: "Customizing AI for specific tasks" },
    { day: 23, title: "AI Agents and Autonomy", concept: "Building AI that takes actions" },
    { day: 24, title: "Evaluating AI Output", concept: "Measuring quality and reliability" },
  ]},
  { chapter: 5, title: "AI in Practice", days: [
    { day: 25, title: "AI Ethics and Bias", concept: "Responsible AI development" },
    { day: 26, title: "AI in Business", concept: "Real-world applications and case studies" },
    { day: 27, title: "AI Security & Privacy", concept: "Protecting data in the age of AI" },
    { day: 28, title: "The Future of AI", concept: "Trends, predictions, and possibilities" },
    { day: 29, title: "Building Your AI Portfolio", concept: "Showcasing your AI skills" },
    { day: 30, title: "Your AI Journey Continues", concept: "Resources and next steps" },
  ]},
];

for (const chapter of chapters) {
  for (const day of chapter.days) {
    const content = `---
title: "${day.title}"
day: ${day.day}
concept: "${day.concept}"
chapter: ${chapter.chapter}
chapterTitle: "${chapter.title}"
---

# Day ${day.day}: ${day.title}

## Overview

Welcome to **Day ${day.day}** of the 30-Day AI Challenge! Today we're exploring *${day.concept}*.

This lesson is part of **Chapter ${chapter.chapter}: ${chapter.title}**, where we build a comprehensive understanding of this crucial area of artificial intelligence.

## What You'll Learn

- Understand the core principles behind ${day.title.toLowerCase()}
- Explore real-world examples and applications
- Build practical skills you can apply immediately
- Connect this concept to the broader AI landscape

## Key Concepts

### Understanding the Basics

${day.concept} is a fundamental topic in modern AI. As the field continues to evolve at a rapid pace, having a solid grasp of these fundamentals becomes increasingly important.

> "The question of whether a computer can think is no more interesting than the question of whether a submarine can swim." — Edsger W. Dijkstra

### Diving Deeper

When we talk about ${day.title.toLowerCase()}, we need to consider several important aspects:

1. **Theoretical Foundation** — The mathematical and logical principles that underpin this concept
2. **Practical Applications** — How this is used in real-world AI systems today
3. **Current Limitations** — What challenges remain and how researchers are addressing them
4. **Future Directions** — Where this area of AI is headed next

### Practical Example

Here's a simple example to illustrate the concept:

\`\`\`python
# Example: ${day.title}
def explore_concept():
    """
    A simple demonstration of ${day.concept.toLowerCase()}.
    """
    print("Welcome to Day ${day.day}!")
    print("Today's topic: ${day.title}")
    
    # Your exploration starts here
    concepts = ["foundation", "application", "practice"]
    for concept in concepts:
        print(f"  → Exploring: {concept}")
    
    return "Ready for tomorrow!"

# Run the exploration
result = explore_concept()
print(result)
\`\`\`

## Hands-On Exercise

Now it's your turn! Try the following:

1. **Research** — Find one real-world application of ${day.title.toLowerCase()}
2. **Experiment** — Try interacting with an AI tool related to today's concept
3. **Reflect** — Write 2-3 sentences about what surprised you most

## Summary

Today we covered the essentials of ${day.title.toLowerCase()}. Remember, the goal isn't to master everything in one day — it's to build a foundation that you can continue to grow.

---

*Tomorrow in Day ${day.day < 30 ? day.day + 1 : '—'}: We'll continue our journey with even more exciting AI concepts!*
`;

    const filename = `day-${day.day}.md`;
    fs.writeFileSync(path.join(contentDir, filename), content, 'utf-8');
    console.log(`Created ${filename}`);
  }
}

console.log('\\nAll 30 days created successfully!');
