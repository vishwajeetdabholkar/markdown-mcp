# Markdown MCP Server

A Model Context Protocol (MCP) server that extracts clean markdown content from web pages using Playwright. This server provides a `get_page_markdown` tool that can extract the main content from any URL while filtering out navigation, headers, footers, and other non-content elements.

## Features

- 🎯 **Smart Content Extraction**: Automatically identifies and extracts main content from web pages
- 🧹 **Clean Output**: Filters out navigation, headers, footers, sidebars, and advertisements
- 🎨 **Rich Markdown**: Preserves formatting including headings, bold, italic, code blocks, lists, and tables
- 🖼️ **Image Support**: Optionally includes image references in markdown
- 🔗 **Link Support**: Optionally includes hyperlinks in markdown
- ⚡ **Fast & Reliable**: Uses Playwright for robust web scraping
- 🔄 **Dynamic Content**: Handles JavaScript-heavy sites and dynamic content loading
- 🛡️ **Error Handling**: Robust error handling with fallback extraction methods

## Installation

1. **Clone or download this repository:**
   ```bash
   git clone <repository-url>
   cd markdown-mcp
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Install Playwright browsers:**
   ```bash
   npx playwright install chromium
   ```

4. **Make the script executable (optional):**
   ```bash
   chmod +x markdown-mcp.js
   ```

## Usage

### As an MCP Server

Start the server:
```bash
node markdown-mcp.js
```

The server provides one tool: `get_page_markdown`

#### Tool Parameters

- `url` (required): The URL to extract markdown from
- `includeImages` (optional, default: true): Whether to include image references in markdown
- `includeLinks` (optional, default: true): Whether to include hyperlinks in markdown
- `waitForSelector` (optional): CSS selector to wait for before extracting content (useful for dynamic content)
- `timeout` (optional, default: 30000): Navigation timeout in milliseconds

#### Example Usage

```json
{
  "name": "get_page_markdown",
  "arguments": {
    "url": "https://docs.confluent.io/cloud/current/flink/operate-and-deploy/monitor-statements.html",
    "includeImages": true,
    "includeLinks": true,
    "timeout": 30000
  }
}
```

#### Advanced Usage Examples

**Extract content from a specific section:**
```json
{
  "name": "get_page_markdown",
  "arguments": {
    "url": "https://example.com/article",
    "waitForSelector": ".main-content",
    "includeImages": false,
    "includeLinks": true
  }
}
```

**Extract content with custom timeout:**
```json
{
  "name": "get_page_markdown",
  "arguments": {
    "url": "https://slow-loading-site.com",
    "timeout": 60000
  }
}
```

## File Structure

This project includes two MCP server files optimized for different clients:

- **`markdown-mcp.js`** - Optimized for Claude Desktop
- **`markdown-mcp-gemini.js`** - Optimized for Gemini CLI

Both files provide the same `get_page_markdown` tool but are configured differently for optimal performance with each client.

## Adding to AI Clients

This MCP server can be used with multiple AI clients that support the Model Context Protocol. Below are instructions for the most popular clients.

## Claude Desktop Integration

To use this MCP server with Claude Desktop, you need to add it to your Claude Desktop configuration file.

### Step 1: Locate Claude Desktop Configuration

**macOS:**
- Configuration file: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows:**
- Configuration file: `%APPDATA%\Claude\claude_desktop_config.json`

**Linux:**
- Configuration file: `~/.config/claude/claude_desktop_config.json`

### Step 2: Edit Configuration File

1. **Open the configuration file** in a text editor
2. **Add the markdown-mcp server** to the `mcpServers` section
3. **Update the path** to point to your `markdown-mcp.js` file

### Step 3: Configuration Examples

#### macOS Configuration

```json
{
  "mcpServers": {
    "markdown-mcp": {
      "command": "node",
      "args": ["/Users/yourusername/path/to/markdown-mcp/markdown-mcp.js"],
      "env": {}
    }
  }
}
```

#### Windows Configuration

```json
{
  "mcpServers": {
    "markdown-mcp": {
      "command": "node",
      "args": ["C:\\Users\\YourUsername\\path\\to\\markdown-mcp\\markdown-mcp.js"],
      "env": {}
    }
  }
}
```

#### Linux Configuration

```json
{
  "mcpServers": {
    "markdown-mcp": {
      "command": "node",
      "args": ["/home/yourusername/path/to/markdown-mcp/markdown-mcp.js"],
      "env": {}
    }
  }
}
```

### Step 4: Restart Claude Desktop

After updating the configuration file, restart Claude Desktop for the changes to take effect.

### Step 5: Verify Installation

1. Open Claude Desktop
2. Start a new conversation
3. Try asking Claude to extract content from a webpage using the markdown-mcp tool
4. Example: "Use markdown-mcp to extract content from https://example.com"

### Troubleshooting

**If the MCP server doesn't work:**

1. **Check the file path** - Make sure the path to `markdown-mcp.js` is correct and the file exists
2. **Verify Node.js** - Ensure Node.js is installed and accessible from the command line
3. **Check permissions** - Make sure the script has execute permissions
4. **Test manually** - Try running `node markdown-mcp.js` in the terminal to see if there are any errors
5. **Check Claude Desktop logs** - Look for error messages in Claude Desktop's developer console

**Common Issues:**

- **Path not found**: Double-check the file path in the configuration
- **Node.js not found**: Make sure Node.js is installed and in your PATH
- **Permission denied**: Run `chmod +x markdown-mcp.js` to make the script executable
- **Dependencies missing**: Run `npm install` in the markdown-mcp directory

## Gemini CLI Integration

To use this MCP server with Gemini CLI, follow these steps:

### Step 1: Install Gemini CLI

If you haven't already installed Gemini CLI:

```bash
npm install -g @google/gemini-cli
```

Verify the installation:

```bash
gemini --version
```

### Step 2: Add MCP Server to Gemini CLI

Add your markdown-mcp server to Gemini CLI:

```bash
gemini mcp add markdown-mcp /Users/yourusername/path/to/markdown-mcp/markdown-mcp-gemini.js
```

**Important:** Replace `/Users/yourusername/path/to/markdown-mcp/markdown-mcp-gemini.js` with the actual path to your `markdown-mcp-gemini.js` file.

### Step 3: Verify Integration

List all configured MCP servers to verify the integration:

```bash
gemini mcp list
```

You should see `markdown-mcp` listed among the servers.

### Step 4: Test the Integration

Test the markdown-mcp server with Gemini CLI:

```bash
# Example: Extract content from a webpage
gemini "Use the markdown-mcp tool to extract content from https://example.com"
```

Or you can use the tool directly:

```bash
# If the tool is exposed as a command
gemini get_page_markdown "https://example.com"
```

### Step 5: Complete Example - Extract and Save Markdown

Here's a complete example that extracts markdown content and saves it to a file:

```bash
# Extract content from a webpage and save to result.md
gemini "Use get_page_markdown to extract content from https://www.confluent.io/blog/event-driven-flink-agents-enterprise-ai/ and save the response as result.md"
```

This command will:
1. Use the `get_page_markdown` tool to extract clean markdown content from the Confluent blog post
2. Save the extracted markdown content to a file named `result.md` in your current directory
3. Provide you with a clean, readable markdown version of the webpage content

**Additional Examples:**

```bash
# Extract content from documentation and save with custom filename
gemini "Use get_page_markdown to extract content from https://docs.confluent.io/cloud/current/flink/operate-and-deploy/monitor-statements.html and save it as flink-docs.md"

# Extract content from a GitHub repository README
gemini "Use get_page_markdown to extract content from https://github.com/microsoft/vscode and save as vscode-readme.md"

# Extract content with specific options
gemini "Use get_page_markdown with includeImages=false to extract content from https://example.com and save as clean-content.md"
```

### Gemini CLI Troubleshooting

**If the MCP server doesn't work with Gemini CLI:**

1. **Check the file path** - Ensure the path to `markdown-mcp-gemini.js` is correct and absolute
2. **Verify Node.js** - Make sure Node.js is accessible from the command line
3. **Check permissions** - Ensure the script has execute permissions (`chmod +x markdown-mcp-gemini.js`)
4. **Test the server manually** - Run `node markdown-mcp-gemini.js` to check for errors
5. **Check Gemini CLI logs** - Look for error messages in the Gemini CLI output

**Common Gemini CLI Issues:**

- **Path not found**: Use absolute paths when adding the MCP server
- **Permission denied**: Run `chmod +x markdown-mcp-gemini.js` to make the script executable
- **Node.js not found**: Ensure Node.js is installed and in your PATH
- **Server not responding**: Check if the server starts correctly with `node markdown-mcp-gemini.js`

## Using with Multiple AI Clients

You can use the same markdown-mcp server with multiple AI clients simultaneously. The MCP server is designed to handle multiple concurrent requests efficiently.

### Benefits of Multi-Client Setup

- **Flexibility**: Use the same tool with different AI models
- **Efficiency**: Share the same server instance across clients
- **Consistency**: Get the same extraction quality regardless of the AI client
- **Resource optimization**: No need to run multiple server instances

### Setup for Multiple Clients

1. **Set up Claude Desktop** using `markdown-mcp.js` (as described above)
2. **Set up Gemini CLI** using `markdown-mcp-gemini.js` (as described above)
3. **Both clients can use their respective server files** - optimized for each client

### Usage Examples

**With Claude Desktop:**
```
Use markdown-mcp to extract content from https://docs.confluent.io/cloud/current/flink/operate-and-deploy/monitor-statements.html
```

**With Gemini CLI:**
```bash
# Extract and save to file
gemini "Use get_page_markdown to extract content from https://docs.confluent.io/cloud/current/flink/operate-and-deploy/monitor-statements.html and save as result.md"

# Or just extract without saving
gemini "Use get_page_markdown to extract content from https://docs.confluent.io/cloud/current/flink/operate-and-deploy/monitor-statements.html"
```

### Performance Considerations

- The server handles multiple concurrent requests efficiently
- Each request uses a fresh browser context for security
- Memory usage scales with the number of concurrent requests
- Typical response time: 5-15 seconds per request

## Testing

The server has been tested and verified to work correctly with various websites including:

- ✅ **Documentation sites** (Confluent, GitHub, etc.)
- ✅ **News articles** and blog posts
- ✅ **Technical documentation** with code examples
- ✅ **E-commerce pages** and product descriptions
- ✅ **JavaScript-heavy sites** with dynamic content

### Tested Features

- ✅ Extracts headings, paragraphs, and text content
- ✅ Preserves bold and italic formatting
- ✅ Handles code blocks and inline code
- ✅ Processes lists (ordered and unordered)
- ✅ Extracts tables with proper formatting
- ✅ Filters out navigation and footer content
- ✅ Handles images and links (when enabled)
- ✅ Responds to MCP protocol requests
- ✅ Works with dynamic content and JavaScript-heavy sites

### Manual Testing

You can test the server manually by running:

```bash
# Test with a simple URL
node -e "
const { spawn } = require('child_process');
const server = spawn('node', ['markdown-mcp.js'], { stdio: ['pipe', 'pipe', 'pipe'] });
const request = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/call',
  params: {
    name: 'get_page_markdown',
    arguments: { url: 'https://example.com' }
  }
};
server.stdin.write(JSON.stringify(request) + '\n');
setTimeout(() => {
  server.kill();
  console.log('Test completed');
}, 10000);
"
```

## Supported Websites

This MCP server works well with:

- **Documentation sites**: Confluent, GitHub, GitLab, etc.
- **News and blogs**: Most major news sites and blogs
- **Technical content**: Stack Overflow, Medium, Dev.to
- **E-commerce**: Product pages and descriptions
- **Academic content**: Research papers and articles
- **Social media**: Twitter threads, LinkedIn articles

## Performance

- **Typical extraction time**: 5-15 seconds depending on page complexity
- **Memory usage**: ~50-100MB per extraction
- **Supported content size**: Up to several MB of text content
- **Concurrent requests**: Handles multiple requests efficiently

## Requirements

- **Node.js**: Version 18 or higher
- **Playwright**: Chromium browser (installed automatically)
- **Memory**: At least 512MB available RAM
- **Disk space**: ~200MB for Playwright browser

## Security Considerations

- The server runs in headless mode for security
- No cookies or persistent data is stored
- Each request uses a fresh browser context
- Network requests are limited by timeout settings
- No sensitive data is logged or stored


## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify all requirements are met
3. Test with a simple URL first
4. Check Claude Desktop logs for error messages
5. Open an issue with detailed error information
