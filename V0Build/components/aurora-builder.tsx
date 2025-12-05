"use client"

import { useState, useCallback } from "react"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"
import { Code2, Eye, MessageSquare, Settings, Zap, Download, Github, RotateCcw } from "lucide-react"
import { FileTree } from "@/components/file-tree"
import { CodeEditor } from "@/components/code-editor"
import { LivePreview } from "@/components/live-preview"
import { ChatInterface } from "@/components/chat-interface"
import { GenerationPanel } from "@/components/generation-panel"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import type { FileNode, Message, FileChange, GenerationStep, StreamChunk } from "@/lib/types"
import {
  getDefaultProject,
  applyFileChanges,
  addFileToTree,
  deleteFileFromTree,
  generateId,
  flattenFileTree,
} from "@/lib/file-system"
import type { ChatMessage } from "@/lib/huggingface-client"

export function AuroraBuilder() {
  const [files, setFiles] = useState<FileNode[]>(getDefaultProject())
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentThinking, setCurrentThinking] = useState<string>("")
  const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([])
  const [generatedFiles, setGeneratedFiles] = useState<FileChange[]>([])
  const [activeTab, setActiveTab] = useState<"code" | "preview">("code")
  const [showChat, setShowChat] = useState(true)
  const [streamingContent, setStreamingContent] = useState<string>("")

  const handleSelectFile = (file: FileNode) => {
    if (file.type === "file") {
      setSelectedFile(file)
      setActiveTab("code")
    }
  }

  const handleFileChange = (content: string) => {
    if (!selectedFile) return

    setFiles((prev) => {
      const newFiles = JSON.parse(JSON.stringify(prev)) as FileNode[]
      const updateNode = (nodes: FileNode[]): boolean => {
        for (const node of nodes) {
          if (node.path === selectedFile.path) {
            node.content = content
            return true
          }
          if (node.children && updateNode(node.children)) {
            return true
          }
        }
        return false
      }
      updateNode(newFiles)
      return newFiles
    })

    setSelectedFile((prev) => (prev ? { ...prev, content } : null))
  }

  const handleCreateFile = (parentPath: string, name: string, type: "file" | "folder") => {
    const path = parentPath ? `${parentPath}/${name}` : name
    if (type === "file") {
      setFiles((prev) => addFileToTree(prev, path, "", "typescript"))
    } else {
      setFiles((prev) => addFileToTree(prev, `${path}/.gitkeep`, "", "plaintext"))
    }
  }

  const handleDeleteFile = (path: string) => {
    setFiles((prev) => deleteFileFromTree(prev, path))
    if (selectedFile?.path === path) {
      setSelectedFile(null)
    }
  }

  const handleResetProject = () => {
    setFiles(getDefaultProject())
    setSelectedFile(null)
    setMessages([])
    setGenerationSteps([])
    setGeneratedFiles([])
    setStreamingContent("")
  }

  const handleExportProject = async () => {
    const flatFiles = flattenFileTree(files)
    const projectData = {
      name: "aurora-generated-project",
      files: flatFiles,
      generatedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "aurora-project.json"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleSendMessage = useCallback(
    async (content: string, modelId: string) => {
      const userMessage: Message = {
        id: generateId(),
        role: "user",
        content,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMessage])
      setIsGenerating(true)
      setCurrentThinking("")
      setGenerationSteps([])
      setGeneratedFiles([])
      setStreamingContent("")

      const chatMessages: ChatMessage[] = messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }))
      chatMessages.push({ role: "user", content })

      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: chatMessages, modelId }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`API Error: ${response.status} - ${errorText}`)
        }

        const reader = response.body?.getReader()
        if (!reader) throw new Error("No response body")

        const decoder = new TextDecoder()
        let fullContent = ""
        let thinkingContent = ""
        const collectedFiles: FileChange[] = []
        let buffer = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() || ""

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue

            const data = line.slice(6).trim()
            if (data === "[DONE]") continue
            if (!data) continue

            try {
              const chunk: StreamChunk = JSON.parse(data)

              switch (chunk.type) {
                case "thinking":
                  if (chunk.content) {
                    thinkingContent = chunk.content
                    setCurrentThinking(thinkingContent)
                    setGenerationSteps((prev) => {
                      const filtered = prev.filter((s) => s.type !== "thinking")
                      return [
                        ...filtered,
                        {
                          id: generateId(),
                          type: "thinking",
                          content: thinkingContent.slice(0, 300) + (thinkingContent.length > 300 ? "..." : ""),
                          timestamp: new Date(),
                        },
                      ]
                    })
                  }
                  break

                case "content":
                  if (chunk.content) {
                    fullContent += chunk.content
                    setStreamingContent(fullContent)
                  }
                  break

                case "file":
                  if (chunk.file) {
                    collectedFiles.push(chunk.file)
                    setGeneratedFiles([...collectedFiles])

                    setFiles((prev) => applyFileChanges(prev, [chunk.file!]))

                    setGenerationSteps((prev) => [
                      ...prev,
                      {
                        id: generateId(),
                        type: "coding",
                        content: `Generated ${chunk.file.path}`,
                        files: [chunk.file],
                        timestamp: new Date(),
                      },
                    ])

                    // Auto-select the newly generated file
                    setSelectedFile({
                      id: generateId(),
                      name: chunk.file.path.split("/").pop() || chunk.file.path,
                      type: "file",
                      path: chunk.file.path,
                      content: chunk.file.content,
                      language: chunk.file.language,
                    })
                  }
                  break

                case "complete":
                  setGenerationSteps((prev) => [
                    ...prev,
                    {
                      id: generateId(),
                      type: "complete",
                      content: chunk.content || `Generation complete - ${collectedFiles.length} file(s) created`,
                      timestamp: new Date(),
                    },
                  ])
                  break

                case "error":
                  throw new Error(chunk.error || "Unknown error")
              }
            } catch (parseError) {
              if (parseError instanceof SyntaxError) continue
              throw parseError
            }
          }
        }

        // Switch to preview after generation completes
        if (collectedFiles.length > 0) {
          setActiveTab("preview")
        }

        const assistantMessage: Message = {
          id: generateId(),
          role: "assistant",
          content:
            fullContent ||
            `I have generated ${collectedFiles.length} file(s). Check the file tree and preview to see the results.`,
          thinking: thinkingContent || undefined,
          files: collectedFiles.length > 0 ? collectedFiles : undefined,
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, assistantMessage])
      } catch (error) {
        console.error("Generation error:", error)
        const errorMessage: Message = {
          id: generateId(),
          role: "assistant",
          content: `Error: ${error instanceof Error ? error.message : "Unknown error occurred"}. Please check your HF_TOKEN environment variable is set correctly.`,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
      } finally {
        setIsGenerating(false)
        setCurrentThinking("")
        setStreamingContent("")
      }
    },
    [messages],
  )

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/25">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Aurora AI Builder</h1>
            <p className="text-xs text-muted-foreground">Powered by DeepSeek V3.2 & Kimi K2</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={showChat ? "secondary" : "ghost"} size="sm" onClick={() => setShowChat(!showChat)}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Chat
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportProject}>
                <Download className="mr-2 h-4 w-4" />
                Export Project
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Github className="mr-2 h-4 w-4" />
                Push to GitHub (Coming Soon)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleResetProject} className="text-destructive focus:text-destructive">
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* File Tree */}
          <Panel defaultSize={15} minSize={10} maxSize={25}>
            <FileTree
              files={files}
              selectedPath={selectedFile?.path || null}
              onSelectFile={handleSelectFile}
              onCreateFile={handleCreateFile}
              onDeleteFile={handleDeleteFile}
            />
          </Panel>

          <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />

          {/* Code Editor / Preview */}
          <Panel defaultSize={showChat ? 45 : 60} minSize={30}>
            <div className="flex h-full flex-col">
              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as "code" | "preview")}
                className="flex h-full flex-col"
              >
                <div className="flex items-center border-b px-2">
                  <TabsList className="h-10">
                    <TabsTrigger value="code" className="gap-2">
                      <Code2 className="h-4 w-4" />
                      Code
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="gap-2">
                      <Eye className="h-4 w-4" />
                      Preview
                    </TabsTrigger>
                  </TabsList>
                  {selectedFile && (
                    <div className="ml-4 flex items-center gap-2 text-sm text-muted-foreground">
                      <Code2 className="h-3.5 w-3.5" />
                      <span className="truncate max-w-[200px]">{selectedFile.path}</span>
                    </div>
                  )}
                  {isGenerating && streamingContent && (
                    <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span>Streaming...</span>
                    </div>
                  )}
                </div>
                <TabsContent value="code" className="flex-1 m-0 data-[state=inactive]:hidden">
                  <CodeEditor file={selectedFile} onChange={handleFileChange} />
                </TabsContent>
                <TabsContent value="preview" className="flex-1 m-0 data-[state=inactive]:hidden">
                  <LivePreview files={files} />
                </TabsContent>
              </Tabs>
            </div>
          </Panel>

          {showChat && (
            <>
              <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />

              {/* Chat + Generation Panel */}
              <Panel defaultSize={40} minSize={25}>
                <PanelGroup direction="horizontal">
                  <Panel defaultSize={70} minSize={50}>
                    <ChatInterface
                      messages={messages}
                      onSendMessage={handleSendMessage}
                      isGenerating={isGenerating}
                      currentThinking={currentThinking}
                      generationSteps={generationSteps.map((s) => ({ type: s.type, content: s.content }))}
                    />
                  </Panel>
                  <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />
                  <Panel defaultSize={30} minSize={20}>
                    <GenerationPanel steps={generationSteps} isGenerating={isGenerating} files={generatedFiles} />
                  </Panel>
                </PanelGroup>
              </Panel>
            </>
          )}
        </PanelGroup>
      </div>
    </div>
  )
}
