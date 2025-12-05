"use client"

import type React from "react"
import { useEffect, useRef, useState, useMemo } from "react"
import { RefreshCw, ExternalLink, Smartphone, Monitor, Tablet } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { FileNode } from "@/lib/types"
import { flattenFileTree } from "@/lib/file-system"
import { cn } from "@/lib/utils"

interface LivePreviewProps {
  files: FileNode[]
}

type ViewportSize = "mobile" | "tablet" | "desktop"

const VIEWPORT_SIZES: Record<ViewportSize, { width: string; icon: React.ReactNode; label: string }> = {
  mobile: { width: "375px", icon: <Smartphone className="h-4 w-4" />, label: "Mobile" },
  tablet: { width: "768px", icon: <Tablet className="h-4 w-4" />, label: "Tablet" },
  desktop: { width: "100%", icon: <Monitor className="h-4 w-4" />, label: "Desktop" },
}

export function LivePreview({ files }: LivePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [viewport, setViewport] = useState<ViewportSize>("desktop")
  const [error, setError] = useState<string | null>(null)
  const [previewKey, setPreviewKey] = useState(0)

  const flatFiles = useMemo(() => flattenFileTree(files), [files])

  const generatePreviewHtml = useMemo(() => {
    // Find main entry points
    const indexHtml = flatFiles.find((f) => f.path.endsWith("index.html"))
    const appTsx = flatFiles.find(
      (f) => f.path.toLowerCase().includes("app.tsx") || f.path.toLowerCase().includes("app.jsx"),
    )
    const pageTsx = flatFiles.find((f) => f.path.includes("page.tsx") || f.path.includes("page.jsx"))
    const indexTsx = flatFiles.find(
      (f) =>
        f.path.endsWith("index.tsx") ||
        f.path.endsWith("index.jsx") ||
        f.path.endsWith("main.tsx") ||
        f.path.endsWith("main.jsx"),
    )
    const cssFiles = flatFiles.filter((f) => f.path.endsWith(".css"))

    // Combine all CSS
    const allCss = cssFiles.map((f) => f.content).join("\n")

    // If we have an HTML file, use it directly
    if (indexHtml) {
      let html = indexHtml.content
      if (allCss) {
        html = html.replace("</head>", `<style>${allCss}</style></head>`)
      }
      return html
    }

    // Find the main React component
    const mainComponent = appTsx || pageTsx || indexTsx

    if (!mainComponent) {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
              color: #888;
            }
            .message {
              text-align: center;
              padding: 2rem;
            }
            .icon {
              font-size: 4rem;
              margin-bottom: 1.5rem;
              opacity: 0.4;
            }
            h2 { 
              color: #ccc; 
              margin-bottom: 0.5rem;
              font-weight: 500;
            }
            p { 
              color: #666;
              font-size: 0.95rem;
            }
          </style>
        </head>
        <body>
          <div class="message">
            <div class="icon">🚀</div>
            <h2>Ready to Preview</h2>
            <p>Generate some code to see the preview</p>
          </div>
        </body>
        </html>
      `
    }

    // Preprocess the React code for browser execution
    const componentCode = preprocessReactCode(mainComponent.content)

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
        <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: system-ui, -apple-system, sans-serif; }
          ${allCss}
        </style>
        <script>
          tailwind.config = {
            darkMode: 'class',
            theme: {
              extend: {
                colors: {
                  border: 'hsl(var(--border))',
                  background: 'hsl(var(--background))',
                  foreground: 'hsl(var(--foreground))',
                  primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
                  secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
                  muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
                  accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
                  destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
                  card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
                }
              }
            }
          }
        </script>
        <style>
          :root {
            --background: 0 0% 100%;
            --foreground: 0 0% 3.9%;
            --card: 0 0% 100%;
            --card-foreground: 0 0% 3.9%;
            --primary: 0 0% 9%;
            --primary-foreground: 0 0% 98%;
            --secondary: 0 0% 96.1%;
            --secondary-foreground: 0 0% 9%;
            --muted: 0 0% 96.1%;
            --muted-foreground: 0 0% 45.1%;
            --accent: 0 0% 96.1%;
            --accent-foreground: 0 0% 9%;
            --destructive: 0 84.2% 60.2%;
            --destructive-foreground: 0 0% 98%;
            --border: 0 0% 89.8%;
            --ring: 0 0% 3.9%;
            --radius: 0.5rem;
          }
          .dark {
            --background: 0 0% 3.9%;
            --foreground: 0 0% 98%;
            --card: 0 0% 3.9%;
            --card-foreground: 0 0% 98%;
            --primary: 0 0% 98%;
            --primary-foreground: 0 0% 9%;
            --secondary: 0 0% 14.9%;
            --secondary-foreground: 0 0% 98%;
            --muted: 0 0% 14.9%;
            --muted-foreground: 0 0% 63.9%;
            --accent: 0 0% 14.9%;
            --accent-foreground: 0 0% 98%;
            --destructive: 0 62.8% 30.6%;
            --destructive-foreground: 0 0% 98%;
            --border: 0 0% 14.9%;
            --ring: 0 0% 83.1%;
          }
        </style>
      </head>
      <body>
        <div id="root"></div>
        <script type="text/babel" data-presets="react,typescript">
          // Mock common imports
          const { useState, useEffect, useRef, useCallback, useMemo, useContext, createContext } = React;
          
          // Mock lucide-react icons as simple spans
          const createIcon = (name) => (props) => React.createElement('span', { 
            ...props, 
            className: \`inline-block \${props?.className || ''}\`,
            children: '●'
          });
          
          const LucideIcons = new Proxy({}, {
            get: (target, prop) => createIcon(prop)
          });
          
          // Mock cn utility
          const cn = (...classes) => classes.filter(Boolean).join(' ');
          
          ${componentCode}
          
          try {
            const root = ReactDOM.createRoot(document.getElementById('root'));
            root.render(React.createElement(App));
          } catch (e) {
            document.getElementById('root').innerHTML = '<div style="padding: 20px; color: #ef4444;"><h3>Render Error</h3><pre>' + e.message + '</pre></div>';
          }
        </script>
      </body>
      </html>
    `
  }, [flatFiles])

  function preprocessReactCode(code: string): string {
    let processed = code
      // Remove imports
      .replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, "")
      .replace(/^import\s+['"].*?['"];?\s*$/gm, "")
      // Remove exports
      .replace(/^export\s+default\s+/gm, "")
      .replace(/^export\s+(?:const|function|class|interface|type)\s+/gm, "const ")
      .replace(/^export\s+\{[^}]*\};?\s*$/gm, "")
      // Remove use client/server directives
      .replace(/^['"]use client['"];?\s*$/gm, "")
      .replace(/^['"]use server['"];?\s*$/gm, "")
      // Handle TypeScript type annotations in function parameters (basic)
      .replace(/:\s*React\.FC\s*(<[^>]*>)?/g, "")

    // Ensure we have an App component
    if (!processed.includes("function App") && !processed.includes("const App")) {
      // Find the first component definition
      const functionMatch = processed.match(/(?:function|const)\s+([A-Z]\w*)\s*[=(]/)
      if (functionMatch) {
        const mainComponent = functionMatch[1]
        if (mainComponent !== "App") {
          processed += `\nconst App = ${mainComponent};`
        }
      } else {
        // Wrap everything in an App component if no component found
        processed = `function App() {\n  return (\n    <div className="p-4">\n      <p>Could not find a React component to render</p>\n    </div>\n  );\n}\n`
      }
    }

    return processed
  }

  const refreshPreview = () => {
    setIsLoading(true)
    setError(null)
    setPreviewKey((prev) => prev + 1)
    setTimeout(() => setIsLoading(false), 300)
  }

  useEffect(() => {
    if (iframeRef.current) {
      try {
        iframeRef.current.srcdoc = generatePreviewHtml
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Preview error")
      }
    }
  }, [generatePreviewHtml, previewKey])

  const openInNewTab = () => {
    const blob = new Blob([generatePreviewHtml], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    window.open(url, "_blank")
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-1">
          {(Object.keys(VIEWPORT_SIZES) as ViewportSize[]).map((size) => (
            <Button
              key={size}
              variant={viewport === size ? "secondary" : "ghost"}
              size="sm"
              className="h-8 gap-2"
              onClick={() => setViewport(size)}
              title={VIEWPORT_SIZES[size].label}
            >
              {VIEWPORT_SIZES[size].icon}
              <span className="hidden sm:inline text-xs">{VIEWPORT_SIZES[size].label}</span>
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={refreshPreview} title="Refresh preview">
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={openInNewTab} title="Open in new tab">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center overflow-auto bg-muted/30 p-4">
        {error ? (
          <div className="max-w-md rounded-lg bg-destructive/10 p-6 text-destructive">
            <p className="font-medium mb-2">Preview Error</p>
            <p className="text-sm opacity-80">{error}</p>
            <Button variant="outline" size="sm" className="mt-4 bg-transparent" onClick={refreshPreview}>
              Try Again
            </Button>
          </div>
        ) : (
          <div
            className="h-full overflow-hidden rounded-lg border bg-white shadow-2xl transition-all duration-300"
            style={{ width: VIEWPORT_SIZES[viewport].width, maxWidth: "100%" }}
          >
            {isLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
            <iframe
              key={previewKey}
              ref={iframeRef}
              className="h-full w-full"
              sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
              title="Live Preview"
            />
          </div>
        )}
      </div>
    </div>
  )
}
