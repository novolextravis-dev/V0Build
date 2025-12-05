"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, Loader2, Brain, Sparkles, Code2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { Message, FileChange } from "@/lib/types"
import { AI_MODELS } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ChatInterfaceProps {
  messages: Message[]
  onSendMessage: (content: string, modelId: string) => void
  isGenerating: boolean
  currentThinking?: string
  generationSteps?: { type: string; content: string }[]
  onFilesGenerated?: (files: FileChange[]) => void
}

export function ChatInterface({
  messages,
  onSendMessage,
  isGenerating,
  currentThinking,
  generationSteps = [],
}: ChatInterfaceProps) {
  const [input, setInput] = useState("")
  const [selectedModel, setSelectedModel] = useState<string>(AI_MODELS[0].id)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, currentThinking, generationSteps])

  const handleSubmit = () => {
    if (!input.trim() || isGenerating) return
    onSendMessage(input.trim(), selectedModel)
    setInput("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const getStepIcon = (type: string) => {
    switch (type) {
      case "thinking":
        return <Brain className="h-4 w-4 text-purple-400" />
      case "planning":
        return <Sparkles className="h-4 w-4 text-amber-400" />
      case "coding":
        return <Code2 className="h-4 w-4 text-blue-400" />
      case "complete":
        return <CheckCircle2 className="h-4 w-4 text-green-400" />
      default:
        return <Loader2 className="h-4 w-4 animate-spin" />
    }
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">AI Builder</h2>
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              {AI_MODELS.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex items-center gap-2">
                    <span>{model.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 rounded-full bg-primary/10 p-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Aurora AI Builder</h3>
              <p className="mb-4 max-w-sm text-muted-foreground">
                Describe the application you want to build and I will generate complete, working code using cutting-edge
                AI models.
              </p>
              <div className="grid gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-400" />
                  <span>DeepSeek V3.2 - Efficient reasoning & tool use</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <span>Kimi K2 Thinking - Deep multi-step reasoning</span>
                </div>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[80%] rounded-lg px-4 py-3",
                  message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
                )}
              >
                {message.thinking && (
                  <div className="mb-2 rounded border border-purple-500/20 bg-purple-500/10 p-2 text-sm">
                    <div className="mb-1 flex items-center gap-2 text-purple-400">
                      <Brain className="h-3 w-3" />
                      <span className="font-medium">Thinking</span>
                    </div>
                    <p className="text-muted-foreground">{message.thinking}</p>
                  </div>
                )}
                <div className="whitespace-pre-wrap">{message.content}</div>
                {message.files && message.files.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">Generated Files:</div>
                    {message.files.map((file, i) => (
                      <div key={i} className="flex items-center gap-2 rounded bg-background/50 px-2 py-1 text-xs">
                        <Code2 className="h-3 w-3" />
                        <span>{file.path}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isGenerating && (
            <div className="space-y-3">
              {generationSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-sm">
                  {getStepIcon(step.type)}
                  <div className="flex-1">
                    <span className="font-medium capitalize">{step.type}</span>
                    <p className="mt-1 text-muted-foreground">{step.content}</p>
                  </div>
                </div>
              ))}
              {currentThinking && (
                <div className="flex items-start gap-2 rounded-lg border border-purple-500/20 bg-purple-500/10 p-3 text-sm">
                  <Brain className="h-4 w-4 animate-pulse text-purple-400" />
                  <div className="flex-1">
                    <span className="font-medium text-purple-400">Thinking...</span>
                    <p className="mt-1 text-muted-foreground">{currentThinking}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Generating code...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            placeholder="Describe the application you want to build..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isGenerating}
            className="min-h-[80px] resize-none"
            rows={3}
          />
          <Button
            onClick={handleSubmit}
            disabled={!input.trim() || isGenerating}
            size="icon"
            className="h-[80px] w-[80px]"
          >
            {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Press Enter to send, Shift+Enter for new line</p>
      </div>
    </div>
  )
}
