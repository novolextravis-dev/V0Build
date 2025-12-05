"use client"

import { cn } from "@/lib/utils"

export function EditorSkeleton() {
  return (
    <div className="h-full w-full space-y-2 bg-[#0a0a0a] p-4">
      <div className="flex gap-2">
        {Array(3)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="h-8 w-24 animate-pulse rounded bg-muted" />
          ))}
      </div>
      <div className="space-y-1">
        {Array(10)
          .fill(0)
          .map((_, i) => (
            <div
              key={i}
              className="h-5 w-full animate-pulse rounded bg-muted"
              style={{ width: `${Math.random() * 100}%` }}
            />
          ))}
      </div>
    </div>
  )
}

export function ChatSkeleton() {
  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="flex-1 space-y-3">
        {Array(3)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="h-4 w-16 animate-pulse rounded bg-muted" />
              <div className="h-12 w-full animate-pulse rounded bg-muted" />
            </div>
          ))}
      </div>
      <div className="h-20 animate-pulse rounded bg-muted" />
    </div>
  )
}

export function FileTreeSkeleton() {
  return (
    <div className="space-y-2 p-2">
      {Array(5)
        .fill(0)
        .map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-4 w-4 animate-pulse rounded bg-muted" />
            <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
          </div>
        ))}
    </div>
  )
}

export function PanelSkeleton({ className }: { className?: string }) {
  return <div className={cn("h-full w-full animate-pulse rounded bg-muted", className)} />
}

export function MessageSkeleton() {
  return (
    <div className="flex gap-2">
      <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="h-20 w-full animate-pulse rounded bg-muted" />
      </div>
    </div>
  )
}
