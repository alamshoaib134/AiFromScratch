---
title: "AI Agents"
day: 15
concept: "The autonomous worker"
chapter: 3
chapterTitle: "Agents & Modalities"
---

Day 15: AI Agents — When Machines Stop Talking and Start Doing
==============================================================




![Day 15 Illustration](/images/ai_photos/day-15.png)

If you have been following this 30-day challenge, you now have a solid understanding of how Generative AI works. You know how it reads text, generates images, and searches databases. But for all of its brilliance, a standard Large Language Model (LLM) is fundamentally lazy. It sits in a chat box waiting for your command, outputs some text, and then goes back to sleep.

The next massive leap in technology — the one happening right now — is the transition from passive chatbots to active, autonomous systems. These are called **AI Agents**.



An AI Agent is an LLM that has been given a goal, a memory, and a digital toolbelt, allowing it to navigate the internet and execute tasks on your behalf.

Under the Hood: The “Thought-Action” Loop
-----------------------------------------

How does a text-generating AI suddenly learn how to click buttons on a website or send an email? It uses a framework often called the **Thought-Action-Observation Loop** (or ReAct).

Instead of just predicting the next word in a conversation, the AI is prompted to talk to _itself_ through a step-by-step process. Imagine you ask an AI Agent to “Research the top 3 competitors in our industry and put them in a spreadsheet.”

1.  **Thought:** The AI reasons with itself. _“To do this, I first need to know who the competitors are. I should use the Web Search tool.”_
    
2.  **Action:** The AI reaches into its digital toolbelt and activates a script that runs a Google Search.
    
3.  **Observation:** The AI reads the search results.
    
4.  **Thought:** _“Okay, I found the top 3. Now I need to put them in a spreadsheet. I will use the Excel Tool.”_
    
5.  **Action:** The AI activates a tool that writes data into your Microsoft Excel account.
    

The LLM is acting as the “brain,” but it has been connected to digital “hands” (APIs and software scripts) that let it interact with the outside world.

Real-World Applications
-----------------------

We are in the very early days of AI Agents, but the applications are already rolling out:

1.  **Autonomous Software Engineers:** Tools like “Devin” are AI agents designed for coding. A human manager gives Devin a goal (“Build a website that tracks the weather in London”). Devin writes the code, tests it, finds its own errors, opens a web browser to read the documentation to figure out how to fix the error, and finalizes the website.
    
2.  **Next-Gen Customer Support:** Instead of a chatbot that just hands you a link to a return policy, an Agentic chatbot can check your account, verify your shipping address, physically process the refund in the company’s billing software, and generate the return shipping label for you.
    
3.  **Sales Development Representatives (SDRs):** AI agents are being deployed to research potential clients on LinkedIn, write highly personalized outreach emails, send them, and automatically log the interaction in the company’s Salesforce database.
    

The Counter-Intuitive Nuance
----------------------------

A major limitation of AI Agents today is the risk of **Infinite Loops**.

When a human tries to book a flight and the “Checkout” button is broken, we realize there is a glitch, give up, and try a different airline. AI Agents lack this physical common sense. If an Agent is instructed to click “Checkout,” and the website returns an unexpected error, the Agent might reason: _“The task is not complete. I must click Checkout again.”_ It can get stuck in a repetitive loop, clicking a broken button thousands of times a minute, racking up massive server computing costs, simply because it doesn’t know when to “give up.”