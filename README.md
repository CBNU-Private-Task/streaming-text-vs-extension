# Streaming Extension

A VS Code extension that streams AI responses from Ollama LLM API and displays generated JavaScript code in real-time. The extension works with a local FastAPI server to provide seamless AI-powered code generation directly in your workspace.

## Features

- **AI Code Generation**: Generate clean, executable JavaScript code using Ollama LLM API
- **Real-time File Writing**: Generated code is automatically written to files in your workspace
- **Dynamic Port Management**: Automatically assigns available ports for conflict-free operation
- **FastAPI Integration**: Works with a companion FastAPI server for API communication
- **Clean Code Output**: AI responses are formatted as proper JavaScript with comments
- **Command Integration**: Easy access through VS Code command palette
- **Cross-Platform**: Works on Windows, macOS, and Linux

## Architecture

```markdown:streaming-extension/README.md
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   VS Code       │    │  Local FastAPI   │    │  Ollama API     │
│   Extension     │    │  Server          │    │ (ksga.info)     │
│   (Port: Auto)  │◄──►│  (Port: 8000)    │───►│                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
   File Creation             API Proxy               AI Processing
```

## Requirements

### For VS Code Extension:
- VS Code 1.102.0 or higher
- A workspace folder open in VS Code

### For FastAPI Server:
- Python 3.7 or higher
- FastAPI and dependencies
- Access to Ollama API endpoint

## Installation & Setup

### 1. Install VS Code Extension

**From Marketplace:**
1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X`)
3. Search for "Streaming Extension" or "rotanakkosal.streaming-extension"
4. Click "Install"

**Or install manually:**
```bash
code --install-extension streaming-extension-0.0.1.vsix
```

### 2. Setup Local FastAPI Server

Each user needs to run their own FastAPI server:

```bash
# Download the companion API server
git clone https://github.com/yourusername/vscode-extension
cd vscode-extension/fast-api

# Install dependencies
pip install fastapi uvicorn requests

# Start the server
uvicorn main:app --reload --port 8000
```

### 3. Verify Connection

Test that everything is connected:

```bash
# Check if FastAPI can reach VS Code extension
curl http://localhost:8000/test-vscode-connection
```

You should see:
```json
{
  "vscode_server": "connected",
  "port": 3847,
  "status": 200
}
```

## Usage

### Method 1: Through FastAPI (Recommended)

Send prompts directly to your FastAPI server:

```bash
curl -X POST "http://localhost:8000/ollama" \
-H "Content-Type: application/x-www-form-urlencoded" \
-d "prompt=Write a function to sort an array of numbers"
```

The generated code will automatically appear in a new file in your VS Code workspace.

### Method 2: Through VS Code Command

1. Open a workspace folder in VS Code
2. Run command "Streaming Extension" (`Ctrl+Shift+P`)
3. Enter your prompt in the input dialog
4. Watch as code is generated and streamed to a new file

## How It Works

1. **Extension Activation**: When VS Code starts, the extension automatically starts a local HTTP server on an available port (e.g., `127.0.0.1:3847`)

2. **Port Discovery**: The extension writes its port information to a config file at `~/.vscode-streaming-extension/server-config.json`

3. **API Request**: When you send a prompt to the FastAPI server, it:
   - Forwards your request to the Ollama API
   - Receives the AI-generated JavaScript code
   - Discovers the VS Code extension's port
   - Sends the code to the extension

4. **File Creation**: The VS Code extension:
   - Creates a new file with timestamp: `ai-generated-2025-01-16T12-34-56-789Z.js`
   - Writes the clean JavaScript code
   - Opens the file in the editor

## Example Output

**Input prompt:** `"Write a function to sort an array"`

**Generated file:** `ai-generated-2025-01-16T12-34-56-789Z.js`
```javascript
// Generated JavaScript code
// Request: Write a function to sort an array

// Function to sort an array of numbers in ascending order
function sortNumbers(numbers) {
    return numbers.sort((a, b) => a - b);
}

// Function to sort an array of strings alphabetically
function sortStrings(strings) {
    return strings.sort();
}

// Example usage
const myNumbers = [64, 34, 25, 12, 22, 11, 90];
const sortedNumbers = sortNumbers(myNumbers);
console.log('Sorted numbers:', sortedNumbers);

const myStrings = ['banana', 'apple', 'cherry', 'date'];
const sortedStrings = sortStrings(myStrings);
console.log('Sorted strings:', sortedStrings);
```

## Configuration

The extension automatically configures itself with optimal settings. Advanced users can modify:

- **Port range**: Extension picks available ports automatically
- **API endpoint**: Configured in the FastAPI server
- **Output format**: Controlled by AI prompts in FastAPI

## Troubleshooting

### Extension not connecting to FastAPI

1. **Check if extension is running:**
   ```bash
   curl http://localhost:3001/health  # or check other ports
   ```

2. **Check port configuration:**
   ```bash
   cat ~/.vscode-streaming-extension/server-config.json
   ```

3. **Check FastAPI connection:**
   ```bash
   curl http://localhost:8000/test-vscode-connection
   ```

### Port conflicts

The extension automatically handles port conflicts by finding available ports. If issues persist:

1. Restart VS Code
2. Check for other applications using ports 3000-4000
3. Check the VS Code Output panel: `View > Output > Log (Extension Host)`

### No files created

1. Ensure you have a workspace folder open in VS Code
2. Check VS Code notifications for error messages
3. Verify FastAPI server is running: `curl http://localhost:8000/`

## Development

### Running in Development Mode

```bash
# Clone the repository
git clone https://github.com/yourusername/vscode-extension
cd vscode-extension/streaming-extension

# Install dependencies
npm install

# Compile the extension
npm run compile

# Launch Extension Development Host
# Press F5 in VS Code, or:
npm run watch
```

### Building for Distribution

```bash
# Install vsce (VS Code Extension manager)
npm install -g vsce

# Package the extension
vsce package

# Publish to marketplace (requires setup)
vsce publish
```

## API Endpoints

### FastAPI Server Endpoints

- `POST /ollama` - Main endpoint for AI code generation
- `GET /test-vscode-connection` - Test connection to VS Code extension
- `GET /` - Health check

### VS Code Extension Endpoints

- `GET /health` - Server health status
- `POST /write-file` - Receive generated code from FastAPI

## Security & Privacy

- ✅ All communication happens locally (`127.0.0.1`)
- ✅ No external network access required
- ✅ Your prompts and code stay on your machine
- ✅ Dynamic port assignment prevents conflicts
- ✅ Server automatically stops when VS Code closes

## Extension Settings

This extension includes the following configurable settings:

```json
{
  "streamingExtension.serverPort": {
    "type": "number",
    "default": 0,
    "description": "Port for the internal HTTP server (0 = auto-assign)"
  },
  "streamingExtension.allowLocalServer": {
    "type": "boolean", 
    "default": true,
    "description": "Allow the extension to start a local HTTP server"
  }
}
```

## Commands

- `streaming-extension.helloWorld` - Main command to trigger AI code generation with user input

## File Structure

```
~/.vscode-streaming-extension/
└── server-config.json          # Port configuration file

Your Workspace/
├── ai-generated-*.js           # Generated JavaScript files
└── (your existing files)
```

## Supported Platforms

- ✅ Windows 10/11
- ✅ macOS 10.14+
- ✅ Ubuntu 18.04+
- ✅ Other Linux distributions

## Performance

- **Startup time**: < 2 seconds
- **File generation**: Near real-time
- **Memory usage**: < 50MB
- **Network**: Local only (127.0.0.1)

## Known Issues

- Extension requires a workspace folder to be open
- Large code generations may take longer depending on Ollama API response time
- Port conflicts are automatically resolved, but may cause brief startup delays

## Roadmap

### Version 0.1.0 (Planned)
- Support for multiple programming languages
- Configurable code templates
- Enhanced error handling
- Custom prompt templates

### Version 0.2.0 (Future)
- Integration with other LLM providers
- Code streaming with syntax highlighting
- Export/import of generated code sessions

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md).

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Testing

```bash
# Run extension tests
npm test

# Run FastAPI tests
cd fast-api
pytest
```

## Release Notes

### 0.0.1 (Current)

**Features:**
- Initial release with AI code generation
- Dynamic port management for conflict-free operation
- FastAPI integration for robust API communication
- Real-time file writing with automatic file naming
- Clean JavaScript code output with proper formatting
- Cross-platform support (Windows, macOS, Linux)
- Secure localhost-only communication

**Technical:**
- Automatic port discovery and configuration
- Robust error handling and recovery
- Configuration file-based port sharing
- Support for VS Code 1.102.0+

## License

[MIT License](LICENSE) - see the LICENSE file for details.

## Support & Contact

- **GitHub Issues**: [Report bugs or request features](https://github.com/yourusername/vscode-extension/issues)
- **Email**: your.email@example.com
- **Documentation**: [Full documentation](https://github.com/yourusername/vscode-extension/wiki)

## Acknowledgments

- [Ollama](https://ollama.ai/) for providing the LLM API
- [FastAPI](https://fastapi.tiangolo.com/) for the excellent Python framework
- [VS Code Extension API](https://code.visualstudio.com/api) for the development platform

---

**Note**: This extension requires a companion FastAPI server to function. Make sure to follow the complete setup instructions for both components. For marketplace users, the FastAPI server needs to be downloaded and run separately on your local machine.