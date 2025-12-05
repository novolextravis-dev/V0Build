"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { FileNode } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"

interface FileTreeProps {
  files: FileNode[]
  selectedPath: string | null
  onSelectFile: (file: FileNode) => void
  onCreateFile?: (parentPath: string, name: string, type: "file" | "folder") => void
  onDeleteFile?: (path: string) => void
}

export function FileTree({ files, selectedPath, onSelectFile, onCreateFile, onDeleteFile }: FileTreeProps) {
  return (
    <div className="h-full overflow-auto bg-sidebar p-2">
      <div className="mb-2 flex items-center justify-between px-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Explorer</span>
        {onCreateFile && (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={() => onCreateFile("", "new-file.ts", "file")}
          >
            <Plus className="h-3 w-3" />
          </Button>
        )}
      </div>
      <div className="space-y-0.5">
        {files.map((node) => (
          <FileTreeNode
            key={node.id}
            node={node}
            depth={0}
            selectedPath={selectedPath}
            onSelectFile={onSelectFile}
            onCreateFile={onCreateFile}
            onDeleteFile={onDeleteFile}
          />
        ))}
      </div>
    </div>
  )
}

interface FileTreeNodeProps {
  node: FileNode
  depth: number
  selectedPath: string | null
  onSelectFile: (file: FileNode) => void
  onCreateFile?: (parentPath: string, name: string, type: "file" | "folder") => void
  onDeleteFile?: (path: string) => void
}

function FileTreeNode({ node, depth, selectedPath, onSelectFile, onCreateFile, onDeleteFile }: FileTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const isSelected = node.path === selectedPath
  const isFolder = node.type === "folder"

  const handleClick = () => {
    if (isFolder) {
      setIsExpanded(!isExpanded)
    } else {
      onSelectFile(node)
    }
  }

  const getFileIcon = () => {
    if (isFolder) {
      return isExpanded ? (
        <FolderOpen className="h-4 w-4 text-amber-400" />
      ) : (
        <Folder className="h-4 w-4 text-amber-400" />
      )
    }

    // Get icon based on file extension
    const ext = node.name.split(".").pop()?.toLowerCase()
    const iconColors: Record<string, string> = {
      ts: "text-blue-400",
      tsx: "text-blue-400",
      js: "text-yellow-400",
      jsx: "text-yellow-400",
      json: "text-yellow-600",
      css: "text-pink-400",
      scss: "text-pink-400",
      html: "text-orange-400",
      md: "text-gray-400",
      py: "text-green-400",
      sql: "text-purple-400",
    }

    return <File className={cn("h-4 w-4", iconColors[ext || ""] || "text-gray-400")} />
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div>
          <div
            className={cn(
              "flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-sm transition-colors hover:bg-sidebar-accent",
              isSelected && "bg-sidebar-accent text-sidebar-accent-foreground",
            )}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
            onClick={handleClick}
          >
            {isFolder && (
              <span className="flex h-4 w-4 items-center justify-center">
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                )}
              </span>
            )}
            {!isFolder && <span className="w-4" />}
            {getFileIcon()}
            <span className="truncate">{node.name}</span>
          </div>
          {isFolder && isExpanded && node.children && (
            <div>
              {node.children.map((child) => (
                <FileTreeNode
                  key={child.id}
                  node={child}
                  depth={depth + 1}
                  selectedPath={selectedPath}
                  onSelectFile={onSelectFile}
                  onCreateFile={onCreateFile}
                  onDeleteFile={onDeleteFile}
                />
              ))}
            </div>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        {isFolder && onCreateFile && (
          <>
            <ContextMenuItem onClick={() => onCreateFile(node.path, "new-file.ts", "file")}>
              <File className="mr-2 h-4 w-4" />
              New File
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onCreateFile(node.path, "new-folder", "folder")}>
              <Folder className="mr-2 h-4 w-4" />
              New Folder
            </ContextMenuItem>
          </>
        )}
        {onDeleteFile && (
          <ContextMenuItem onClick={() => onDeleteFile(node.path)} className="text-destructive focus:text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
}
