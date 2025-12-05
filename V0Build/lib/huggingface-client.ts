import { HfInference } from "@huggingface/inference"

export interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
}

interface StreamChunkData {
  type: "thinking" | "content" | "file" | "complete" | "error"
  content?: string
  file?: {
    path: string
    action: "create" | "update" | "delete"
    content?: string
    language?: string
  }
  error?: string
}

const HF_TOKEN = process.env.HF_TOKEN
const DEFAULT_MODEL = "deepseek-ai/DeepSeek-V3.2"

const client = new HfInference(HF_TOKEN || "")

export async function* generateWithModel(
  modelId: string,
  messages: ChatMessage[],
): AsyncGenerator<StreamChunkData> {
  if (!HF_TOKEN) {
    yield {
      type: "error",
      error: "HF_TOKEN environment variable is not set. Please configure it in your .env file.",
    }
    return
  }

  const model = modelId || DEFAULT_MODEL

  try {
    const systemPrompt = `You are an expert AI code generator that creates complete, production-ready code for full-stack applications.

When generating code, you MUST:
1. Generate only TypeScript/JavaScript files
2. Use modern React patterns with hooks
3. Follow best practices for code organization
4. Provide complete, working implementations
5. Include necessary imports and dependencies
6. Add comments for complex logic

When you need to create or modify files, output them in the following format:
FILE_START:path/to/file.tsx
<complete file content>
FILE_END

For file operations, use these markers:
- CREATE: for new files
- UPDATE: for modified files
- DELETE: for files to remove (just the path)`

    const systemMessage: ChatMessage = {
      role: "system",
      content: systemPrompt,
    }

    const messagesForApi: ChatMessage[] = [systemMessage, ...messages]

    const stream = await client.textGenerationStream({
      model,
      inputs: messagesForApi.map((m) => `${m.role}: ${m.content}`).join("\n"),
      parameters: {
        max_new_tokens: 2048,
        temperature: 0.7,
        top_p: 0.9,
        do_sample: true,
      },
      stream: true,
    })

    let buffer = ""
    let thinkingBuffer = ""
    let inThinking = false

    for await (const event of stream) {
      const text = event.token.text || ""
      buffer += text

      if (text.includes("<think>")) {
        inThinking = true
        thinkingBuffer = ""
      }

      if (inThinking) {
        thinkingBuffer += text

        if (text.includes("</think>")) {
          inThinking = false

          yield {
            type: "thinking",
            content: thinkingBuffer.replace(/<\/?think>/g, "").trim(),
          }
          thinkingBuffer = ""
        }
        continue
      }

      if (buffer.includes("FILE_START:")) {
        const fileMatch = buffer.match(/FILE_START:([\w\-./]+)\n([\s\S]*?)FILE_END/)

        if (fileMatch) {
          const filePath = fileMatch[1]
          const fileContent = fileMatch[2].trim()
          const ext = filePath.split(".").pop() || "txt"

          const languageMap: Record<string, string> = {
            ts: "typescript",
            tsx: "typescript",
            js: "javascript",
            jsx: "javascript",
            json: "json",
            css: "css",
            html: "html",
            md: "markdown",
          }

          yield {
            type: "file",
            file: {
              path: filePath,
              action: "create",
              content: fileContent,
              language: languageMap[ext] || "plaintext",
            },
          }

          buffer = buffer.replace(fileMatch[0], "")
        }
      }

      const contentWithoutFiles = buffer.replace(/FILE_START:[\w\-./]+\n[\s\S]*?FILE_END/g, "")

      if (contentWithoutFiles.length > 100) {
        yield {
          type: "content",
          content: contentWithoutFiles.slice(0, 100),
        }
        buffer = buffer.slice(100)
      }
    }

    if (buffer.trim()) {
      yield {
        type: "content",
        content: buffer,
      }
    }

    yield {
      type: "complete",
      content: "Code generation completed successfully",
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

    yield {
      type: "error",
      error: `Failed to generate code: ${errorMessage}`,
    }
  }
}
