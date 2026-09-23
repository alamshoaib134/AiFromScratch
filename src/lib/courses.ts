
export interface Course {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  status: "available" | "coming-soon";
  badge: string;
  iconName: string;
  chapters: number;
  lessons: number;
  duration: string;
  localStorageKey: string;
  originalPrice: number;
  discountPrice: number;
  discountPercentage: number;
}

export const courses: Course[] = [
  {
    id: "30-days-of-ai",
    title: "30 Days of AI Challenge",
    subtitle: "AI From Scratch",
    description:
      "The ultimate 30-day guide to the vocabulary, mechanics, and future of Artificial Intelligence. From NLP fundamentals to AGI — no programming required.",
    status: "available",
    badge: "Active",
    iconName: "Brain",
    chapters: 4,
    lessons: 30,
    duration: "30 days",
    localStorageKey: "course_30_days_unlocked",
    originalPrice: 14999,
    discountPrice: 1999,
    discountPercentage: 87,
  },
  {
    id: "hybrid-rag",
    title: "Hybrid RAG Systems",
    subtitle: "Advanced Retrieval",
    description:
      "Master retrieval-augmented generation with hybrid search, re-ranking, multi-hop reasoning, and production-grade RAG pipelines.",
    status: "available",
    badge: "Active",
    iconName: "Database",
    chapters: 1,
    lessons: 2,
    duration: "2 days",
    localStorageKey: "course_hybrid_rag_unlocked",
    originalPrice: 19999,
    discountPrice: 5999,
    discountPercentage: 70,
  },
  {
    id: "agentic-ai",
    title: "Agentic AI & Multi-Agent Workflows",
    subtitle: "Autonomous Systems",
    description:
      "Build autonomous AI agents that plan, reason, and collaborate. Multi-agent orchestration, tool use, and real-world deployment.",
    status: "coming-soon",
    badge: "Coming Soon",
    iconName: "Robot",
    chapters: 0,
    lessons: 0,
    duration: "TBA",
    localStorageKey: "course_agentic_ai_unlocked",
    originalPrice: 24999,
    discountPrice: 7999,
    discountPercentage: 68,
  },
  {
    id: "fine-tuning",
    title: "Fine-Tuning & LLMOps",
    subtitle: "Model Customization",
    description:
      "Learn to fine-tune foundation models, build evaluation pipelines, and deploy custom LLMs at scale with modern MLOps practices.",
    status: "coming-soon",
    badge: "Coming Soon",
    iconName: "Wrench",
    chapters: 0,
    lessons: 0,
    duration: "TBA",
    localStorageKey: "course_fine_tuning_unlocked",
    originalPrice: 14999,
    discountPrice: 4999,
    discountPercentage: 67,
  },
  {
    id: "multimodal-ai",
    title: "Multimodal AI & Computer Vision",
    subtitle: "Beyond Text",
    description:
      "Explore image generation, video understanding, spatial intelligence, and building applications that see, hear, and understand the world.",
    status: "coming-soon",
    badge: "Coming Soon",
    iconName: "Eye",
    chapters: 0,
    lessons: 0,
    duration: "TBA",
    localStorageKey: "course_multimodal_unlocked",
    originalPrice: 11999,
    discountPrice: 2999,
    discountPercentage: 75,
  },
];


export function getCourseById(id: string): Course | undefined {
  return courses.find((c) => c.id === id);
}
