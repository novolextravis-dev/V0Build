export interface FileNode {
  id: string
  name: string
  type: "file" | "folder"
  content?: string
  language?: string
  children?: FileNode[]
  path: string
}

export interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
  thinking?: string
  files?: FileChange[]
}

export interface FileChange {
  path: string
  action: "create" | "update" | "delete"
  content?: string
  language?: string
}

export interface GenerationStep {
  id: string
  type: "thinking" | "planning" | "coding" | "reviewing" | "complete"
  content: string
  files?: FileChange[]
  timestamp: Date
}

export interface Project {
  id: string
  name: string
  description: string
  files: FileNode[]
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

export interface AIModel {
  id: string
  name: string
  provider: "deepseek" | "kimi"
  model: string
  description: string
  capabilities: string[]
}

export const AI_MODELS: AIModel[] = [
  {
    id: "deepseek-v3.2",
    name: "DeepSeek V3.2",
    provider: "deepseek",
    model: "deepseek-ai/DeepSeek-V3.2",
    description: "Efficient reasoning & agentic AI with gold-medal performance",
    capabilities: ["reasoning", "tool-use", "code-generation", "long-context"],
  },
  {
    id: "kimi-k2-thinking",
    name: "Kimi K2 Thinking",
    provider: "kimi",
    model: "moonshotai/Kimi-K2-Thinking",
    description: "Deep thinking with 200-300 step tool orchestration",
    capabilities: ["deep-thinking", "tool-orchestration", "code-generation", "agentic"],
  },
]

export interface StreamChunk {
  type: "thinking" | "content" | "file" | "complete" | "error"
  content?: string
  file?: FileChange
  error?: string
}
