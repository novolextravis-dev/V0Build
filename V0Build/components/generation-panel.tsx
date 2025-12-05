"use client"
import { Brain, Code2, FileCode, CheckCircle2, Loader2, Sparkles } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import type { GenerationStep, FileChange } from "@/lib/types"

interface GenerationPanelProps {
  steps: GenerationStep[]
  isGenerating: boolean
  files: FileChange[]
}

export function GenerationPanel({ steps, isGenerating, files }: GenerationPanelProps) {
  const codingSteps = steps.filter((s) => s.type === "coding").length
  const isComplete = steps.some((s) => s.type === "complete")
  const progress = isComplete ? 100 : isGenerating ? Math.min(90, codingSteps * 15 + 10) : 0

  const getStepIcon = (type: string, isActive: boolean) => {
    const iconClass = cn("h-4 w-4", isActive && "animate-pulse")

    switch (type) {
      case "thinking":
        return <Brain className={cn(iconClass, "text-purple-400")} />
      case "planning":
        return <FileCode className={cn(iconClass, "text-amber-400")} />
      case "coding":
        return <Code2 className={cn(iconClass, "text-blue-400")} />
      case "reviewing":
        return <CheckCircle2 className={cn(iconClass, "text-green-400")} />
      case "complete":
        return <Sparkles className={cn(iconClass, "text-green-500")} />
      default:
        return <Loader2 className={cn(iconClass, "animate-spin")} />
    }
  }

  return (
    <div className="flex h-full flex-col border-l bg-sidebar">
      <div className="border-b p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold">Generation Progress</h3>
          {isGenerating && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Processing...</span>
            </div>
          )}
        </div>
        <Progress value={progress} className="h-2" />
        <p className="mt-2 text-xs text-muted-foreground">
          {files.length} file{files.length !== 1 ? "s" : ""} generated
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          <h4 className="mb-3 text-sm font-medium text-muted-foreground">Activity</h4>
          <div className="space-y-3">
            {steps.length === 0 && !isGenerating && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Sparkles className="h-8 w-8 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">Send a message to start generating</p>
              </div>
            )}
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "rounded-lg border p-3 transition-all",
                  index === steps.length - 1 && isGenerating
                    ? "border-primary/50 bg-primary/5 shadow-sm"
                    : "border-border bg-background",
                )}
              >
                <div className="flex items-center gap-2">
                  {getStepIcon(step.type, index === steps.length - 1 && isGenerating)}
                  <span className="text-sm font-medium capitalize">{step.type}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {step.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{step.content}</p>
              </div>
            ))}
          </div>

          {files.length > 0 && (
            <>
              <h4 className="mb-3 mt-6 text-sm font-medium text-muted-foreground">Generated Files ({files.length})</h4>
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 rounded-lg border bg-background p-2 hover:bg-accent/50 transition-colors"
                  >
                    <Code2 className="h-4 w-4 text-blue-400 shrink-0" />
                    <span className="flex-1 truncate text-sm font-mono">{file.path}</span>
                    {file.action === "create" && (
                      <span className="rounded bg-green-500/10 px-1.5 py-0.5 text-xs text-green-500 shrink-0">new</span>
                    )}
                    {file.action === "update" && (
                      <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-xs text-amber-500 shrink-0">
                        modified
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
