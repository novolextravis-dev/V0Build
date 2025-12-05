# Aurora AI Builder

An advanced full-stack web application for autonomous code generation powered by cutting-edge AI models. Generate complete, production-ready applications through natural language descriptions.

## Features

- **AI-Powered Code Generation**: Use DeepSeek V3.2 and Kimi K2 Thinking models for intelligent code generation
- **Real-time Preview**: Live preview of generated React applications
- **Multi-file Projects**: Manage complete project structures with file trees
- **Code Editor**: Monaco Editor integration with syntax highlighting and intelligent editing
- **Project Persistence**: Save and load projects with Supabase
- **Rate Limiting**: Built-in API rate limiting to prevent abuse
- **Error Boundaries**: Graceful error handling with recovery options
- **Responsive Design**: Full responsive UI for all screen sizes

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Editor**: Monaco Editor with custom themes
- **UI Components**: Radix UI, Tailwind CSS 4
- **Database**: Supabase with PostgreSQL
- **AI Integration**: Hugging Face Inference API
- **Streaming**: Server-Sent Events (SSE) for real-time generation

## Prerequisites

Before you begin, ensure you have:

- Node.js 18+ and npm/pnpm/yarn
- A Hugging Face account with API access
- A Supabase project

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd V0Build
npm install
# or
pnpm install
```

### 2. Environment Variables

Create a `.env` file in the V0Build directory with:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Hugging Face API Token
HF_TOKEN=your_hugging_face_token
```

Get these values from:
- **Supabase**: https://app.supabase.com/ → Project Settings → API
- **Hugging Face**: https://huggingface.co/settings/tokens

### 3. Database Setup

The database schema is automatically created on first migration. To manually apply migrations:

```bash
npm run migrate
```

### 4. Development Server

```bash
npm run dev
```

Visit http://localhost:3000 to start building.

### 5. Production Build

```bash
npm run build
npm run start
```

## Project Structure

```
V0Build/
├── app/
│   ├── api/
│   │   └── generate/          # AI generation endpoint
│   ├── layout.tsx              # Root layout with error boundary
│   └── page.tsx                # Home page
├── components/
│   ├── aurora-builder.tsx       # Main application component
│   ├── chat-interface.tsx       # AI chat interface
│   ├── code-editor.tsx          # Monaco editor wrapper
│   ├── live-preview.tsx         # React preview component
│   ├── file-tree.tsx            # Project file tree
│   ├── error-boundary.tsx       # Error boundary component
│   ├── loading-skeletons.tsx    # Loading UI components
│   └── ui/                      # Radix UI components
├── lib/
│   ├── huggingface-client.ts    # AI model integration
│   ├── supabase.ts              # Supabase client
│   ├── project-service.ts       # Project CRUD operations
│   ├── rate-limit.ts            # Rate limiting utility
│   ├── file-system.ts           # File tree utilities
│   ├── types.ts                 # TypeScript types
│   └── utils.ts                 # Utility functions
├── hooks/
│   ├── use-toast.ts             # Toast notifications
│   └── use-mobile.ts            # Mobile detection
├── styles/
│   └── globals.css              # Global styles
└── public/                      # Static assets
```

## Usage

### Basic Workflow

1. **Describe Your Application**: Enter a description of what you want to build in the chat interface
2. **Select AI Model**: Choose between DeepSeek V3.2 or Kimi K2 Thinking
3. **Generate Code**: Send your prompt and watch the AI generate code in real-time
4. **Preview**: See your generated application in the live preview panel
5. **Edit**: Modify generated files directly in the code editor
6. **Save Project**: Save your project for later use

### Keyboard Shortcuts

- `Enter` - Send message in chat
- `Shift + Enter` - New line in chat input
- `Ctrl/Cmd + S` - Save project (when implemented)

## API Endpoints

### POST /api/generate

Generates code using AI models with streaming response.

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "Build a todo app" }
  ],
  "modelId": "deepseek-v3.2"
}
```

**Response:** Server-Sent Events stream with chunks:
```json
{
  "type": "thinking|content|file|complete|error",
  "content": "...",
  "file": {
    "path": "src/App.tsx",
    "action": "create",
    "content": "...",
    "language": "typescript"
  }
}
```

**Rate Limiting:**
- 10 requests per minute per IP
- Returns 429 status when limit exceeded

## Configuration

### Models

Available AI models can be configured in `lib/types.ts`:

```typescript
const AI_MODELS: AIModel[] = [
  {
    id: "deepseek-v3.2",
    name: "DeepSeek V3.2",
    provider: "deepseek",
    model: "deepseek-ai/DeepSeek-V3.2",
    description: "Efficient reasoning & agentic AI",
    capabilities: ["reasoning", "tool-use", "code-generation"],
  },
  // Add more models here
]
```

### Themes

Customize the Monaco editor theme in `components/code-editor.tsx`.

## Troubleshooting

### "HF_TOKEN not set" Error
Ensure your Hugging Face API token is set in the `.env` file and the server is restarted after changes.

### "Rate limit exceeded"
Wait for the reset time (displayed in error message) before making another request.

### Supabase Connection Error
Verify your Supabase credentials in `.env` and ensure your Supabase project is active.

### Preview Not Loading
- Check browser console for errors
- Ensure React and React DOM scripts load correctly
- Verify generated code doesn't have syntax errors

## Database Schema

### Projects Table
```sql
CREATE TABLE projects (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users,
  name text NOT NULL,
  description text,
  files_data jsonb,
  messages_data jsonb,
  created_at timestamptz,
  updated_at timestamptz
);
```

All data is protected with Row Level Security (RLS) policies ensuring users can only access their own projects.

## Performance Optimization Tips

1. **Lazy Load Monaco Editor**: Editor loads on-demand when a file is selected
2. **Debounce Code Changes**: Editor changes are debounced to reduce re-renders
3. **Memoize Components**: Heavy components use React.memo for optimization
4. **Virtual Scrolling**: Large file trees use virtual scrolling (when implemented)

## Security Considerations

- All API keys should be kept in `.env` and never committed to version control
- Database access is protected with RLS policies
- Input validation is performed on all API endpoints
- XSS protection through React's built-in sanitization

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Future Roadmap

- [ ] GitHub integration for pushing generated code
- [ ] User authentication and project sharing
- [ ] Advanced syntax analysis and code suggestions
- [ ] Multi-language support (Python, Go, Rust)
- [ ] Custom code templates
- [ ] Collaborative editing
- [ ] CI/CD pipeline integration
- [ ] Performance monitoring and analytics

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or feedback:
- Open an issue on GitHub
- Check existing documentation
- Review troubleshooting guide

## Credits

- **AI Models**: DeepSeek and Moonshot AI
- **Editor**: Monaco Editor by Microsoft
- **UI Components**: Radix UI and shadcn/ui
- **Database**: Supabase
- **Styling**: Tailwind CSS

---

**Built with ❤️ for developers who dream in code**
