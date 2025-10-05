#!/usr/bin/env node
/**
 * Markdown MCP Server
 * Extracts clean markdown content from web pages using Playwright
 * Following the official MCP documentation pattern
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const { chromium } = require('playwright');

// Create the server instance
const server = new Server(
  {
    name: 'markdown-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

let browser = null;

// Helper function to ensure browser is available
async function ensureBrowser() {
  if (!browser) {
    browser = await chromium.launch({
      headless: true,
    });
  }
  return browser;
}

// Helper function to extract markdown content
async function extractMarkdownContent(url, options = {}) {
  const {
    includeImages = true,
    includeLinks = true,
    waitForSelector,
    timeout = 30000,
  } = options;

  const browserInstance = await ensureBrowser();
  const context = await browserInstance.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout });

    if (waitForSelector) {
      await page.waitForSelector(waitForSelector, { timeout: 10000 });
    } else {
      // Wait for content to load - especially important for JS-heavy sites
      await page.waitForTimeout(5000);
    }

    const markdown = await page.evaluate(
      ({ includeImages, includeLinks }) => {
        function extractMainContent() {
          // Confluence-specific selectors first, then general ones
          const mainSelectors = [
            '#main-content',
            '.wiki-content',
            '[data-test-id="wiki-content"]',
            'main[role="main"]',
            'main',
            'article',
            '[role="main"]',
            '.main-content',
            '.content',
            '#content',
            '.post-content',
            '.article-content',
            'body',
          ];

          for (const selector of mainSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim().length > 100) {
              return element;
            }
          }

          return document.body;
        }

        function shouldSkipElement(element) {
          if (!element || !element.tagName) return true;

          const tagName = element.tagName.toLowerCase();
          
          // Never skip these content elements
          if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'table', 'pre', 'code', 'blockquote'].includes(tagName)) {
            return false;
          }

          // Check for hidden elements
          if (element.offsetParent === null && tagName !== 'script' && tagName !== 'style') {
            const style = window.getComputedStyle(element);
            if (style.display === 'none' || style.visibility === 'hidden') {
              return true;
            }
          }

          // Skip technical elements
          if (['script', 'style', 'noscript', 'iframe'].includes(tagName)) {
            return true;
          }

          // Check role attributes
          const role = element.getAttribute('role');
          if (['navigation', 'banner', 'contentinfo', 'complementary'].includes(role)) {
            return true;
          }

          // Check specific element types
          if (tagName === 'nav' || tagName === 'header' || tagName === 'footer' || tagName === 'aside') {
            return true;
          }

          // Check class and id for common patterns (but be less aggressive)
          const className = (element.className || '').toString().toLowerCase();
          const id = (element.id || '').toLowerCase();
          const combined = className + ' ' + id;

          const strictSkipPatterns = [
            'cookie-banner',
            'gdpr',
            'advertisement',
            'sponsored',
          ];

          return strictSkipPatterns.some(pattern => combined.includes(pattern));
        }

        function getTextContent(node) {
          let text = '';
          for (const child of node.childNodes) {
            if (child.nodeType === Node.TEXT_NODE) {
              text += child.textContent;
            } else if (child.nodeType === Node.ELEMENT_NODE) {
              const tag = child.tagName.toLowerCase();
              if (tag === 'br') {
                text += '\n';
              } else if (!shouldSkipElement(child)) {
                text += getTextContent(child);
              }
            }
          }
          return text;
        }

        function convertToMarkdown(node, depth = 0, inList = false) {
          if (!node || shouldSkipElement(node)) return '';

          let markdown = '';
          const tagName = node.tagName?.toLowerCase();

          // Headings
          if (tagName?.match(/^h[1-6]$/)) {
            const level = parseInt(tagName[1]);
            const text = getTextContent(node).trim();
            if (text) {
              markdown += '\n' + '#'.repeat(level) + ' ' + text + '\n\n';
            }
            return markdown;
          }

          // Paragraphs
          if (tagName === 'p') {
            let content = '';
            for (const child of node.childNodes) {
              if (child.nodeType === Node.TEXT_NODE) {
                content += child.textContent;
              } else if (child.nodeType === Node.ELEMENT_NODE) {
                content += convertToMarkdown(child, depth + 1);
              }
            }
            const text = content.trim();
            if (text) {
              markdown += text + '\n\n';
            }
            return markdown;
          }

          // Code blocks
          if (tagName === 'pre') {
            const code = node.querySelector('code');
            const text = (code || node).textContent.trim();
            if (text) {
              const language = code?.className.match(/language-(\w+)/)?.[1] || '';
              markdown += '\n```' + language + '\n' + text + '\n```\n\n';
            }
            return markdown;
          }

          // Inline code
          if (tagName === 'code' && node.parentElement?.tagName !== 'PRE') {
            return '`' + node.textContent.trim() + '`';
          }

          // Blockquotes
          if (tagName === 'blockquote') {
            const text = getTextContent(node).trim();
            if (text) {
              const lines = text.split('\n').filter(l => l.trim());
              markdown += '\n' + lines.map(line => '> ' + line.trim()).join('\n') + '\n\n';
            }
            return markdown;
          }

          // Lists
          if (tagName === 'ul' || tagName === 'ol') {
            const items = Array.from(node.children).filter(child => child.tagName === 'LI');
            items.forEach((li, idx) => {
              const prefix = tagName === 'ol' ? `${idx + 1}. ` : '- ';
              let itemContent = '';
              for (const child of li.childNodes) {
                if (child.nodeType === Node.TEXT_NODE) {
                  itemContent += child.textContent;
                } else if (child.nodeType === Node.ELEMENT_NODE) {
                  itemContent += convertToMarkdown(child, depth + 1, true);
                }
              }
              const text = itemContent.trim();
              if (text) {
                markdown += prefix + text + '\n';
              }
            });
            if (!inList) markdown += '\n';
            return markdown;
          }

          // Strong/Bold
          if (tagName === 'strong' || tagName === 'b') {
            const text = getTextContent(node).trim();
            return text ? `**${text}**` : '';
          }

          // Emphasis/Italic
          if (tagName === 'em' || tagName === 'i') {
            const text = getTextContent(node).trim();
            return text ? `*${text}*` : '';
          }

          // Horizontal rule
          if (tagName === 'hr') {
            return '\n---\n\n';
          }

          // Tables
          if (tagName === 'table') {
            const rows = Array.from(node.querySelectorAll('tr'));
            if (rows.length > 0) {
              rows.forEach((row, rowIdx) => {
                const cells = Array.from(row.querySelectorAll('th, td'));
                const cellTexts = cells.map(cell => getTextContent(cell).trim().replace(/\n/g, ' '));
                if (cellTexts.some(t => t)) {
                  markdown += '| ' + cellTexts.join(' | ') + ' |\n';
                  if (rowIdx === 0) {
                    markdown += '| ' + cells.map(() => '---').join(' | ') + ' |\n';
                  }
                }
              });
              markdown += '\n';
            }
            return markdown;
          }

          // Line break
          if (tagName === 'br') {
            return '\n';
          }

          // Container elements - process children
          if (['div', 'section', 'article', 'main', 'span', 'td', 'th', 'li'].includes(tagName)) {
            for (const child of node.childNodes) {
              if (child.nodeType === Node.ELEMENT_NODE) {
                markdown += convertToMarkdown(child, depth + 1, inList);
              } else if (child.nodeType === Node.TEXT_NODE && depth === 0 && !inList) {
                const text = child.textContent.trim();
                if (text && text.length > 0) {
                  markdown += text + ' ';
                }
              }
            }
            return markdown;
          }

          // For any other element, try to extract text from children
          if (node.childNodes && node.childNodes.length > 0) {
            for (const child of node.childNodes) {
              if (child.nodeType === Node.ELEMENT_NODE) {
                markdown += convertToMarkdown(child, depth + 1, inList);
              }
            }
          }

          return markdown;
        }

        const mainContent = extractMainContent();
        let result = convertToMarkdown(mainContent);

        // Clean up excessive newlines and spaces
        result = result
          .replace(/ +/g, ' ')  // Multiple spaces to single
          .replace(/\n\n\n+/g, '\n\n')  // Multiple newlines to double
          .trim();

        // If still empty, use fallback
        if (!result || result.length < 50) {
          const allText = mainContent.textContent.trim();
          if (allText) {
            result = allText
              .split('\n')
              .map(line => line.trim())
              .filter(line => line.length > 0)
              .join('\n\n');
          }
        }

        return result;
      },
      { includeImages, includeLinks }
    );

    await context.close();
    return markdown || 'No content could be extracted from this page.';

  } catch (error) {
    await context.close();
    throw new Error(`Error extracting markdown: ${error.message}`);
  }
}

// Set up the tools list handler
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'get_page_markdown',
      description: 'Extract clean markdown content from a URL. Returns only the main content without navigation, headers, footers, or sidebars.',
      inputSchema: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The URL to extract markdown from',
          },
          includeImages: {
            type: 'boolean',
            description: 'Whether to include image references in markdown (default: true)',
            default: true,
          },
          includeLinks: {
            type: 'boolean',
            description: 'Whether to include hyperlinks in markdown (default: true)',
            default: true,
          },
          waitForSelector: {
            type: 'string',
            description: 'Optional CSS selector to wait for before extracting content',
          },
          timeout: {
            type: 'number',
            description: 'Navigation timeout in milliseconds (default: 30000)',
            default: 30000,
          },
        },
        required: ['url'],
      },
    },
  ],
}));

// Set up the tool call handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'get_page_markdown') {
    try {
      const markdown = await extractMarkdownContent(request.params.arguments.url, request.params.arguments);
      
      return {
        content: [
          {
            type: 'text',
            text: markdown,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error extracting markdown: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
  
  throw new Error(`Unknown tool: ${request.params.name}`);
});

// Cleanup on exit
process.on('SIGINT', async () => {
  if (browser) {
    await browser.close();
  }
  process.exit(0);
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
