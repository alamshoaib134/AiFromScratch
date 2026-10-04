import type { Metadata } from "next";
import Link from "next/link";

/* ─── SEO Metadata ─── */
const BASE_URL = "https://aieveryday.vercel.app";

export const metadata: Metadata = {
  title:
    "How to Learn AI from Scratch in 2025 — Complete Beginner Roadmap | AI Academy",
  description:
    "The ultimate free roadmap to learn Artificial Intelligence from scratch. Step-by-step guide covering Python, math fundamentals, machine learning, deep learning, NLP, and building real AI projects. No prior experience needed.",
  keywords: [
    "learn AI from scratch",
    "how to learn AI",
    "AI roadmap for beginners",
    "artificial intelligence beginner guide",
    "learn machine learning",
    "AI learning path",
    "AI tutorial for beginners",
    "start learning AI",
    "AI career roadmap",
    "learn deep learning",
  ],
  alternates: {
    canonical: `${BASE_URL}/learn-ai-roadmap`,
  },
  openGraph: {
    title: "How to Learn AI from Scratch — Complete Beginner Roadmap",
    description:
      "The ultimate free roadmap to learn AI from zero. Python, math, ML, deep learning, NLP — step by step.",
    url: `${BASE_URL}/learn-ai-roadmap`,
    siteName: "AI Academy",
    type: "article",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "How to Learn AI from Scratch — Complete Beginner Roadmap",
    description:
      "Free step-by-step roadmap: Python → Math → ML → Deep Learning → NLP → Real Projects. Start today.",
  },
};

/* ─── Roadmap Data ─── */
const phases = [
  {
    number: "01",
    title: "Learn Python (Weeks 1–2)",
    anchor: "python",
    subtitle: "Your foundation language for everything AI",
    why: "Python is the lingua franca of AI. Every major framework — TensorFlow, PyTorch, Hugging Face — is Python-first. You don't need to master it, but you need fluency in the basics.",
    topics: [
      "Variables, data types, and control flow (if/else, loops)",
      "Functions, classes, and object-oriented basics",
      "Working with files, JSON, and APIs",
      "List comprehensions and generators",
      "NumPy for numerical computing",
      "Pandas for data manipulation",
      "Matplotlib / Seaborn for visualization",
    ],
    resources: [
      { name: "Python.org Official Tutorial", url: "https://docs.python.org/3/tutorial/" },
      { name: "Automate the Boring Stuff (free)", url: "https://automatetheboringstuff.com/" },
      { name: "NumPy Quickstart", url: "https://numpy.org/doc/stable/user/quickstart.html" },
    ],
    milestone:
      "You can load a CSV, clean the data, compute statistics, and plot a chart — all in a Jupyter notebook.",
  },
  {
    number: "02",
    title: "Math You Actually Need (Weeks 3–4)",
    anchor: "math",
    subtitle: "Just enough math to understand what's happening under the hood",
    why: "You don't need a math degree. But you do need intuition for linear algebra (how data is represented), calculus (how models learn), probability (how models make decisions), and statistics (how you evaluate them).",
    topics: [
      "Linear Algebra — vectors, matrices, dot products, matrix multiplication",
      "Calculus — derivatives, partial derivatives, chain rule, gradients",
      "Probability — Bayes' theorem, conditional probability, distributions",
      "Statistics — mean, variance, standard deviation, hypothesis testing",
      "Optimization — gradient descent, learning rate, loss functions",
    ],
    resources: [
      { name: "3Blue1Brown: Essence of Linear Algebra", url: "https://www.3blue1brown.com/topics/linear-algebra" },
      { name: "Khan Academy: Calculus", url: "https://www.khanacademy.org/math/calculus-1" },
      { name: "StatQuest (YouTube)", url: "https://www.youtube.com/@statquest" },
    ],
    milestone:
      "You can explain what a gradient is, why we multiply matrices, and what Bayes' theorem means in plain English.",
  },
  {
    number: "03",
    title: "Classical Machine Learning (Weeks 5–8)",
    anchor: "machine-learning",
    subtitle: "The algorithms that started it all",
    why: "Before deep learning, there was machine learning. These algorithms are still used everywhere — in production systems, in feature engineering, and as baselines. Understanding them gives you the mental models to understand everything that comes after.",
    topics: [
      "Supervised learning: Linear Regression, Logistic Regression",
      "Decision Trees, Random Forests, Gradient Boosting (XGBoost)",
      "Support Vector Machines (SVMs)",
      "Unsupervised learning: K-Means, PCA, DBSCAN",
      "Model evaluation: accuracy, precision, recall, F1, AUC-ROC",
      "Cross-validation, overfitting, bias-variance tradeoff",
      "Feature engineering and feature selection",
      "Scikit-learn end to end",
    ],
    resources: [
      { name: "Scikit-learn Documentation", url: "https://scikit-learn.org/stable/user_guide.html" },
      { name: "Andrew Ng's ML Course (Coursera)", url: "https://www.coursera.org/learn/machine-learning" },
      { name: "Hands-On ML (Aurélien Géron)", url: "https://www.oreilly.com/library/view/hands-on-machine-learning/9781098125967/" },
    ],
    milestone:
      "You can build, train, evaluate, and tune a classification model on a real dataset using scikit-learn.",
  },
  {
    number: "04",
    title: "Deep Learning & Neural Networks (Weeks 9–14)",
    anchor: "deep-learning",
    subtitle: "The engine behind modern AI breakthroughs",
    why: "Deep learning is what powers GPT, DALL-E, AlphaFold, and self-driving cars. It's the single most important paradigm shift in AI. You need to understand it both conceptually and practically.",
    topics: [
      "Perceptrons, activation functions, forward/backward propagation",
      "Multi-layer neural networks (MLPs)",
      "Convolutional Neural Networks (CNNs) for images",
      "Recurrent Neural Networks (RNNs) and LSTMs for sequences",
      "Regularization: dropout, batch normalization, weight decay",
      "Optimizers: SGD, Adam, AdamW, learning rate schedulers",
      "Transfer learning and pre-trained models",
      "PyTorch: tensors, autograd, datasets, dataloaders, training loops",
    ],
    resources: [
      { name: "PyTorch Official Tutorials", url: "https://pytorch.org/tutorials/" },
      { name: "Fast.ai Practical Deep Learning", url: "https://course.fast.ai/" },
      { name: "Deep Learning Book (Goodfellow)", url: "https://www.deeplearningbook.org/" },
    ],
    milestone:
      "You can build and train a CNN from scratch in PyTorch, fine-tune a pre-trained model, and explain backpropagation.",
  },
  {
    number: "05",
    title: "NLP & Large Language Models (Weeks 15–20)",
    anchor: "nlp",
    subtitle: "The frontier: understanding and generating human language",
    why: "NLP is the hottest subfield of AI right now. Transformers, attention mechanisms, and LLMs (GPT, Claude, Gemini) have fundamentally changed what AI can do. This is where the industry is headed.",
    topics: [
      "Text preprocessing: tokenization, stemming, lemmatization",
      "Word embeddings: Word2Vec, GloVe, FastText",
      "The Transformer architecture: self-attention, multi-head attention",
      "BERT, GPT, T5 — understanding the architecture families",
      "Hugging Face Transformers library",
      "Prompt engineering and in-context learning",
      "Fine-tuning LLMs: LoRA, QLoRA, PEFT",
      "Retrieval-Augmented Generation (RAG) systems",
      "Evaluation: BLEU, ROUGE, perplexity, human evaluation",
    ],
    resources: [
      { name: "Hugging Face NLP Course (free)", url: "https://huggingface.co/learn/nlp-course" },
      { name: "Attention Is All You Need (paper)", url: "https://arxiv.org/abs/1706.03762" },
      { name: "AI Academy: Hybrid RAG Course", url: "/course/hybrid-rag", internal: true },
    ],
    milestone:
      "You can fine-tune a pre-trained transformer, build a basic RAG system, and explain how attention works.",
  },
  {
    number: "06",
    title: "Build Real Projects & Specialize (Weeks 21+)",
    anchor: "projects",
    subtitle: "The only way to truly learn is to build",
    why: "Theory without practice is empty. This is where you cement everything by building real, deployable AI systems. Pick a specialization and go deep.",
    topics: [
      "End-to-end ML pipelines: data → model → API → deployment",
      "Building AI-powered web apps with FastAPI / Next.js",
      "MLOps: model versioning, experiment tracking, CI/CD",
      "Deploying models: Docker, cloud platforms, serverless",
      "Contributing to open-source AI projects",
      "Reading and implementing research papers",
      "Building your portfolio and writing about your work",
    ],
    resources: [
      { name: "FastAPI Documentation", url: "https://fastapi.tiangolo.com/" },
      { name: "MLflow — Experiment Tracking", url: "https://mlflow.org/" },
      { name: "AI Academy: 30-Day AI Course", url: "/course/30-days-of-ai", internal: true },
    ],
    projectIdeas: [
      "Build a chatbot that answers questions about a PDF using RAG",
      "Create a sentiment analysis API with FastAPI + Hugging Face",
      "Build a research paper summarizer using an LLM",
      "Deploy an image classifier as a web app",
      "Implement a paper from scratch (e.g., Attention Is All You Need)",
    ],
    milestone:
      "You have 2–3 deployed projects on GitHub, a blog post explaining each one, and can talk about your AI work in an interview.",
  },
];

const toolsAndSetup = [
  {
    category: "Language & Environment",
    tools: [
      { name: "Python 3.10+", desc: "Core language" },
      { name: "Jupyter Notebooks", desc: "Interactive experimentation" },
      { name: "VS Code", desc: "Primary editor with Python + Copilot extensions" },
      { name: "Google Colab", desc: "Free GPU access for training" },
    ],
  },
  {
    category: "Core Libraries",
    tools: [
      { name: "NumPy", desc: "Numerical computing" },
      { name: "Pandas", desc: "Data manipulation" },
      { name: "Matplotlib / Seaborn", desc: "Visualization" },
      { name: "Scikit-learn", desc: "Classical ML algorithms" },
    ],
  },
  {
    category: "Deep Learning",
    tools: [
      { name: "PyTorch", desc: "The industry-standard DL framework" },
      { name: "Hugging Face Transformers", desc: "Pre-trained models & fine-tuning" },
      { name: "TensorBoard / W&B", desc: "Experiment tracking" },
    ],
  },
  {
    category: "Deployment",
    tools: [
      { name: "FastAPI", desc: "Build ML APIs" },
      { name: "Docker", desc: "Containerization" },
      { name: "Git & GitHub", desc: "Version control & portfolio" },
    ],
  },
];

/* ─── JSON-LD Structured Data ─── */
const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "How to Learn AI from Scratch in 2025 — Complete Beginner Roadmap",
  description:
    "The ultimate free roadmap to learn Artificial Intelligence from scratch. Step-by-step guide covering Python, math, ML, deep learning, NLP, and real projects.",
  url: `${BASE_URL}/learn-ai-roadmap`,
  author: {
    "@type": "Person",
    name: "Shoaib Alam",
    jobTitle: "AI Engineer & NLP Researcher",
    url: "https://shoaibalam.vercel.app/",
  },
  publisher: {
    "@type": "EducationalOrganization",
    name: "AI Academy",
    url: BASE_URL,
  },
  datePublished: "2025-01-15",
  dateModified: new Date().toISOString().split("T")[0],
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": `${BASE_URL}/learn-ai-roadmap`,
  },
};

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Learn AI from Scratch",
  description:
    "A step-by-step roadmap for beginners to learn artificial intelligence, from Python basics to building real AI projects.",
  totalTime: "PT3360H",
  step: phases.map((phase, i) => ({
    "@type": "HowToStep",
    position: i + 1,
    name: phase.title,
    text: phase.why,
    url: `${BASE_URL}/learn-ai-roadmap#${phase.anchor}`,
  })),
};

/* ─── Page Component ─── */
export default function LearnAIRoadmapPage() {
  const combinedSchema = {
    "@context": "https://schema.org",
    "@graph": [
      { ...articleSchema, "@context": undefined },
      { ...howToSchema, "@context": undefined },
    ],
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(combinedSchema) }}
      />

      <div className="mx-auto max-w-6xl px-6 py-16">
        {/* ─── Hero ─── */}
        <header className="mb-20 border-b-4 border-[var(--color-border)] pb-12">
          <div className="mb-4 flex items-center gap-3">
            <span className="bg-[var(--color-ink)] text-[var(--color-canvas)] text-xs px-2 py-0.5 border border-[var(--color-border)]">
              Free Guide
            </span>
            <span className="text-sm text-[var(--color-muted)]">
              Updated October 2025
            </span>
          </div>
          <h1 className="font-[family-name:var(--font-serif)] text-5xl font-medium leading-tight text-[var(--color-ink)] sm:text-7xl mb-6">
            How to Learn AI from Scratch:
            <br />
            The Complete Beginner Roadmap
          </h1>
          <p className="max-w-3xl text-xl leading-relaxed text-[var(--color-ink)] mb-8">
            A structured, no-fluff path from zero to building real AI systems.
            This guide covers exactly what to learn, in what order, what math
            you actually need, and the tools to use — whether you&apos;re a
            student, career-switcher, or curious builder.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="#phase-01"
              className="inline-flex items-center border-2 border-[var(--color-border)] bg-[var(--color-ink)] px-6 py-3 text-base font-medium text-[var(--color-canvas)] transition-colors hover:bg-[var(--color-accent)] hover:border-[var(--color-accent)]"
            >
              Start the Roadmap ↓
            </a>
            <Link
              href="/course/30-days-of-ai"
              className="inline-flex items-center border-2 border-[var(--color-border)] bg-[var(--color-canvas)] px-6 py-3 text-base font-medium text-[var(--color-ink)] transition-colors hover:bg-[var(--color-surface)]"
            >
              Or Start the 30-Day Course →
            </Link>
          </div>
        </header>

        {/* ─── Table of Contents ─── */}
        <nav className="mb-20" aria-label="Roadmap table of contents">
          <h2 className="font-[family-name:var(--font-serif)] text-2xl font-medium text-[var(--color-ink)] mb-6 border-b border-[var(--color-border)] pb-2">
            What You&apos;ll Learn
          </h2>
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {phases.map((phase) => (
              <li key={phase.anchor}>
                <a
                  href={`#phase-${phase.number}`}
                  className="flex items-start gap-3 border border-[var(--color-border)] p-4 transition-colors hover:bg-[var(--color-surface)] group"
                >
                  <span className="font-[family-name:var(--font-serif)] text-2xl font-medium text-[var(--color-muted)] group-hover:text-[var(--color-accent)] transition-colors">
                    {phase.number}
                  </span>
                  <div>
                    <span className="text-base font-medium text-[var(--color-ink)] block">
                      {phase.title}
                    </span>
                    <span className="text-sm text-[var(--color-muted)]">
                      {phase.subtitle}
                    </span>
                  </div>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* ─── Phases ─── */}
        <div className="flex flex-col gap-24">
          {phases.map((phase) => (
            <section
              key={phase.anchor}
              id={`phase-${phase.number}`}
              aria-labelledby={`heading-${phase.anchor}`}
              className="scroll-mt-24"
            >
              {/* Phase Header */}
              <div className="border-b-2 border-[var(--color-border)] pb-4 mb-8">
                <span className="font-[family-name:var(--font-serif)] text-6xl font-medium text-[var(--color-border-light)] sm:text-8xl block leading-none">
                  {phase.number}
                </span>
                <h2
                  id={`heading-${phase.anchor}`}
                  className="font-[family-name:var(--font-serif)] text-3xl font-medium text-[var(--color-ink)] mt-2 sm:text-4xl"
                >
                  {phase.title}
                </h2>
                <p className="text-base text-[var(--color-muted)] mt-1">
                  {phase.subtitle}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Main Content */}
                <div className="lg:col-span-8">
                  {/* Why */}
                  <div className="mb-8">
                    <h3 className="font-[family-name:var(--font-serif)] text-xl font-medium text-[var(--color-ink)] mb-3">
                      Why This Matters
                    </h3>
                    <p className="text-base leading-relaxed text-[var(--color-ink)]">
                      {phase.why}
                    </p>
                  </div>

                  {/* What to Learn */}
                  <div className="mb-8">
                    <h3 className="font-[family-name:var(--font-serif)] text-xl font-medium text-[var(--color-ink)] mb-3">
                      What to Learn
                    </h3>
                    <ul className="flex flex-col gap-2">
                      {phase.topics.map((topic, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 text-base text-[var(--color-ink)]"
                        >
                          <span className="text-[var(--color-muted)] font-medium min-w-[1.5rem] text-right">
                            {(i + 1).toString().padStart(2, "0")}
                          </span>
                          {topic}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Project Ideas (Phase 6 only) */}
                  {"projectIdeas" in phase && phase.projectIdeas && (
                    <div className="mb-8">
                      <h3 className="font-[family-name:var(--font-serif)] text-xl font-medium text-[var(--color-ink)] mb-3">
                        Project Ideas
                      </h3>
                      <ul className="flex flex-col gap-2">
                        {phase.projectIdeas.map(
                          (idea: string, i: number) => (
                            <li
                              key={i}
                              className="flex items-start gap-3 text-base text-[var(--color-ink)]"
                            >
                              <span className="text-[var(--color-accent)] font-medium">
                                →
                              </span>
                              {idea}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Milestone */}
                  <div className="border-l-4 border-[var(--color-border)] bg-[var(--color-surface)] p-6">
                    <h3 className="font-[family-name:var(--font-serif)] text-lg font-medium text-[var(--color-ink)] mb-2">
                      ✓ Milestone Check
                    </h3>
                    <p className="text-base text-[var(--color-ink)] leading-relaxed">
                      {phase.milestone}
                    </p>
                  </div>
                </div>

                {/* Sidebar — Resources */}
                <aside className="lg:col-span-4">
                  <div className="border border-[var(--color-border)] p-6 bg-[var(--color-surface)]">
                    <h3 className="font-[family-name:var(--font-serif)] text-lg font-medium text-[var(--color-ink)] mb-4 border-b border-[var(--color-border)] pb-2">
                      Recommended Resources
                    </h3>
                    <ul className="flex flex-col gap-3">
                      {phase.resources.map((r, i) => (
                        <li key={i}>
                          {"internal" in r && r.internal ? (
                            <Link
                              href={r.url}
                              className="text-base font-medium text-[var(--color-accent)] hover:underline underline-offset-4"
                            >
                              {r.name} →
                            </Link>
                          ) : (
                            <a
                              href={r.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-base font-medium text-[var(--color-accent)] hover:underline underline-offset-4"
                            >
                              {r.name} ↗
                            </a>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </aside>
              </div>
            </section>
          ))}
        </div>

        {/* ─── Tools & Setup ─── */}
        <section
          id="tools"
          className="mt-24 mb-24 scroll-mt-24"
          aria-labelledby="tools-heading"
        >
          <div className="border-b-2 border-[var(--color-border)] pb-4 mb-8">
            <h2
              id="tools-heading"
              className="font-[family-name:var(--font-serif)] text-3xl font-medium text-[var(--color-ink)] sm:text-4xl"
            >
              Your AI Toolkit
            </h2>
            <p className="text-base text-[var(--color-muted)] mt-1">
              Everything you need to install and set up
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {toolsAndSetup.map((group) => (
              <div
                key={group.category}
                className="border border-[var(--color-border)] p-6"
              >
                <h3 className="font-[family-name:var(--font-serif)] text-lg font-medium text-[var(--color-ink)] mb-4 border-b border-[var(--color-border)] pb-2">
                  {group.category}
                </h3>
                <ul className="flex flex-col gap-3">
                  {group.tools.map((tool) => (
                    <li key={tool.name}>
                      <span className="text-base font-medium text-[var(--color-ink)] block">
                        {tool.name}
                      </span>
                      <span className="text-sm text-[var(--color-muted)]">
                        {tool.desc}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ─── CTA: 30-Day Course ─── */}
        <section
          id="course-cta"
          className="border-2 border-[var(--color-border)] bg-[var(--color-surface)] p-8 sm:p-12 mb-24"
          aria-labelledby="cta-heading"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="flex-1">
              <span className="bg-[var(--color-ink)] text-[var(--color-canvas)] text-xs px-2 py-0.5 border border-[var(--color-border)] inline-block mb-4">
                87% off — Limited Time
              </span>
              <h2
                id="cta-heading"
                className="font-[family-name:var(--font-serif)] text-3xl font-medium text-[var(--color-ink)] mb-4 sm:text-4xl"
              >
                Want a structured path?
                <br />
                Try the 30-Day AI Course.
              </h2>
              <p className="text-base leading-relaxed text-[var(--color-ink)] max-w-2xl mb-6">
                This free roadmap gives you the &ldquo;what.&rdquo; The 30-Day
                Course gives you the &ldquo;how&rdquo; — structured daily
                lessons, hands-on exercises, and a clear path from absolute
                beginner to building real AI systems. 30 lessons across 4
                chapters, from NLP fundamentals to AGI concepts.
              </p>
              <div className="flex items-center gap-4 mb-2">
                <span className="text-[var(--color-muted)] line-through text-lg">
                  ₹14,999
                </span>
                <span className="text-3xl font-medium text-[var(--color-ink)]">
                  ₹1,999
                </span>
              </div>
              <p className="text-sm text-[var(--color-muted)]">
                30 lessons • 4 chapters • No programming required
              </p>
            </div>
            <div className="flex flex-col gap-3 min-w-[200px]">
              <Link
                href="/course/30-days-of-ai"
                className="inline-flex items-center justify-center border-2 border-[var(--color-border)] bg-[var(--color-ink)] px-8 py-4 text-base font-medium text-[var(--color-canvas)] transition-colors hover:bg-[var(--color-accent)] hover:border-[var(--color-accent)] text-center"
              >
                Start the 30-Day Course →
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center border-2 border-[var(--color-border)] bg-[var(--color-canvas)] px-8 py-4 text-base font-medium text-[var(--color-ink)] transition-colors hover:bg-[var(--color-surface)] text-center"
              >
                View All Courses
              </Link>
            </div>
          </div>
        </section>

        {/* ─── FAQ Section (SEO: People Also Ask) ─── */}
        <section
          id="faq"
          className="mb-16 scroll-mt-24"
          aria-labelledby="faq-heading"
        >
          <div className="border-b-2 border-[var(--color-border)] pb-4 mb-8">
            <h2
              id="faq-heading"
              className="font-[family-name:var(--font-serif)] text-3xl font-medium text-[var(--color-ink)] sm:text-4xl"
            >
              Frequently Asked Questions
            </h2>
          </div>

          <div className="flex flex-col border-b border-[var(--color-border)]">
            {[
              {
                q: "How do I start learning AI from scratch?",
                a: 'Start with Python — it\'s the essential programming language for AI. Then build your math intuition (linear algebra, calculus, probability). Move to classical machine learning with scikit-learn, then deep learning with PyTorch, and finally NLP and large language models. This roadmap above breaks each step into specific weeks with concrete milestones.',
              },
              {
                q: "Do I need to know Python to learn AI?",
                a: "Yes, Python is practically required. It's the primary language for every major AI framework (PyTorch, TensorFlow, Hugging Face). The good news: you don't need to be an expert. Basic proficiency — variables, loops, functions, and working with libraries like NumPy and Pandas — is enough to get started. You can learn Python in 1–2 weeks.",
              },
              {
                q: "How much math do I need to learn AI?",
                a: "Less than you think. You need intuition, not proof-writing ability. Focus on four areas: linear algebra (vectors and matrices), calculus (derivatives and gradients), probability (Bayes' theorem, distributions), and basic statistics. You can learn these in 2–3 weeks. The key is understanding *why* gradient descent works, not deriving it from scratch.",
              },
              {
                q: "Can I learn AI without a computer science degree?",
                a: "Absolutely. Many successful AI practitioners are self-taught or come from non-CS backgrounds (physics, math, biology, even humanities). What matters is your willingness to learn systematically and build real projects. This roadmap is designed for exactly that — a structured path that anyone can follow.",
              },
              {
                q: "How long does it take to learn AI?",
                a: "With consistent daily study (1–2 hours/day), you can go from zero to building real AI projects in about 5–6 months. This roadmap is structured as a 20+ week journey. Phase 1–2 (Python + Math) takes about 4 weeks. Phase 3–4 (ML + Deep Learning) takes about 10 weeks. Phase 5–6 (NLP + Projects) takes 6+ weeks. The key is consistency, not speed.",
              },
              {
                q: "What is the best AI course for beginners?",
                a: "For a structured, step-by-step approach, our 30-Day AI Course covers everything from NLP fundamentals to AGI concepts in daily bite-sized lessons — no programming required. For a more hands-on, code-heavy path, Fast.ai and Andrew Ng's Coursera courses are excellent free alternatives. The best course is the one you'll actually finish.",
              },
            ].map((faq, i) => (
              <details
                key={i}
                className="border-t border-[var(--color-border)] group"
              >
                <summary className="flex items-center justify-between py-5 cursor-pointer text-base font-medium text-[var(--color-ink)] hover:text-[var(--color-accent)] transition-colors list-none [&::-webkit-details-marker]:hidden">
                  <span>{faq.q}</span>
                  <span className="text-[var(--color-muted)] text-xl ml-4 group-open:rotate-45 transition-transform">
                    +
                  </span>
                </summary>
                <div className="pb-6 pr-8">
                  <p className="text-base leading-relaxed text-[var(--color-ink)]">
                    {faq.a}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
