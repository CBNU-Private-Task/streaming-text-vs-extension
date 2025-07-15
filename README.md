cle# Streaming Extension

A VS Code extension that streams AI responses from a local Ollama LLM API and displays the generated JavaScript code in real-time.

## Features

- **AI Code Generation**: Generate JavaScript code using Ollama LLM API
- **Real-time Streaming**: Watch code being generated line by line
- **File Management**: Automatically saves generated code to workspace files
- **Command Integration**: Easy access through VS Code command palette

## Requirements

- VS Code 1.74.0 or higher
- Access to an Ollama API endpoint
- Node.js for development

## Usage

1. Open a workspace folder in VS Code
2. Run the command "Hello World" from the command palette (Ctrl/Cmd + Shift + P)
3. Watch as JavaScript code is generated and streamed to a new file in real-time

## Extension Settings

This extension currently uses hardcoded settings. Future versions may include:

- Configurable API endpoints
- Custom prompts
- Different programming languages

## Development

To run this extension in development:

```bash
npm install
npm run compile
F5 to launch Extension Development Host
```

## Release Notes

### 0.0.1

Initial release with basic streaming functionality for JavaScript code generation.
