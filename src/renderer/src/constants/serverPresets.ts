export interface ServerPreset {
  id: string
  name: string
  category: 'Database' | 'Filesystem' | 'Developer Tools' | 'Web & Search' | 'Communication' | 'Cloud & DevOps' | 'Custom'
  description: string
  icon: string
  command: string
  args: string[]
  envKeys?: { key: string; label: string; placeholder: string; required?: boolean; isSecret?: boolean }[]
  argInputs?: { label: string; placeholder: string; defaultVal: string }[]
  isCustom?: boolean
  createdAt?: number
}

export const OFFICIAL_PRESETS: ServerPreset[] = [
  // Database
  {
    id: 'postgres',
    name: 'PostgreSQL Server',
    category: 'Database',
    description: 'Inspect schemas, tables, and execute safe read-only queries against PostgreSQL databases.',
    icon: 'database',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-postgres'],
    argInputs: [
      {
        label: 'Database Connection URL',
        placeholder: 'postgresql://user:password@localhost:5432/mydb',
        defaultVal: 'postgresql://postgres:postgres@localhost:5432/postgres'
      }
    ]
  },
  {
    id: 'sqlite',
    name: 'SQLite Database Explorer',
    category: 'Database',
    description: 'Zero-config local relational database queries, table creation, and fast schema introspection.',
    icon: 'database',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-sqlite'],
    argInputs: [
      {
        label: 'Database File Path',
        placeholder: 'B:/workgit/data.db',
        defaultVal: 'sample.db'
      }
    ]
  },
  {
    id: 'mysql',
    name: 'MySQL Database Server',
    category: 'Database',
    description: 'Connect to MySQL instances to inspect database schemas and run analytical SQL statements.',
    icon: 'database',
    command: 'npx',
    args: ['-y', 'mcp-server-mysql'],
    argInputs: [
      {
        label: 'MySQL Connection String',
        placeholder: 'mysql://root:password@localhost:3306/db',
        defaultVal: 'mysql://root:password@localhost:3306/test'
      }
    ]
  },
  {
    id: 'redis',
    name: 'Redis In-Memory Store',
    category: 'Database',
    description: 'Inspect keys, hashes, lists, and perform sub-millisecond Redis read/write operations.',
    icon: 'database',
    command: 'npx',
    args: ['-y', 'mcp-server-redis'],
    argInputs: [
      {
        label: 'Redis Connection URL',
        placeholder: 'redis://127.0.0.1:6379',
        defaultVal: 'redis://localhost:6379'
      }
    ]
  },

  // Filesystem & Code
  {
    id: 'filesystem',
    name: 'Local Filesystem',
    category: 'Filesystem',
    description: 'Allow AI agents to read, list, and write files safely within allowed sandboxed directories.',
    icon: 'folder',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem'],
    argInputs: [
      {
        label: 'Allowed Root Directory',
        placeholder: 'C:/Users/username/Projects',
        defaultVal: 'B:/workgit'
      }
    ]
  },
  {
    id: 'git',
    name: 'Local Git Repository Tools',
    category: 'Filesystem',
    description: 'Inspect commit history, diffs, branch operations, and log messages across local repos.',
    icon: 'github',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-git'],
    argInputs: [
      {
        label: 'Git Repository Path',
        placeholder: 'B:/workgit/my-repo',
        defaultVal: 'B:/workgit/mcp-studio-core'
      }
    ]
  },

  // Developer Tools
  {
    id: 'github',
    name: 'GitHub API Server',
    category: 'Developer Tools',
    description: 'Interact with repositories, read file contents, search issues, and create pull requests.',
    icon: 'github',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    envKeys: [
      {
        key: 'GITHUB_PERSONAL_ACCESS_TOKEN',
        label: 'GitHub Personal Access Token',
        placeholder: 'ghp_...',
        required: true,
        isSecret: true
      }
    ]
  },
  {
    id: 'everything',
    name: 'Anthropic Server Everything',
    category: 'Developer Tools',
    description: 'Official Anthropic reference MCP server exposing 13+ tools, dynamic resources, and prompt templates.',
    icon: 'cpu',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-everything']
  },
  {
    id: 'memory',
    name: 'Knowledge Graph Memory',
    category: 'Developer Tools',
    description: 'Persistent graph-based entity memory for AI agents across long-term sessions.',
    icon: 'cpu',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-memory']
  },
  {
    id: 'sentry',
    name: 'Sentry Error & Crash Monitor',
    category: 'Developer Tools',
    description: 'Retrieve live production crash reports, stack traces, and issue trends via Sentry API.',
    icon: 'cpu',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-sentry'],
    envKeys: [
      {
        key: 'SENTRY_AUTH_TOKEN',
        label: 'Sentry Auth Token',
        placeholder: 'sntrys_...',
        required: true,
        isSecret: true
      }
    ]
  },
  {
    id: 'linear',
    name: 'Linear Project Tracker',
    category: 'Developer Tools',
    description: 'Query projects, create and update Linear issues, search tickets and sprint cycles.',
    icon: 'cpu',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-linear'],
    envKeys: [
      {
        key: 'LINEAR_API_KEY',
        label: 'Linear API Key',
        placeholder: 'lin_api_...',
        required: true,
        isSecret: true
      }
    ]
  },
  {
    id: 'docker',
    name: 'Docker Container Manager',
    category: 'Cloud & DevOps',
    description: 'Inspect active Docker containers, images, volumes, and stream live container logs.',
    icon: 'terminal',
    command: 'npx',
    args: ['-y', 'mcp-server-docker']
  },

  // Web & Search
  {
    id: 'puppeteer',
    name: 'Puppeteer Web Browser',
    category: 'Web & Search',
    description: 'Headless Chrome browser automation to navigate pages, take screenshots, and evaluate scripts.',
    icon: 'globe',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-puppeteer']
  },
  {
    id: 'brave-search',
    name: 'Brave Web Search',
    category: 'Web & Search',
    description: 'High quality web and local search results powered by the privacy-focused Brave Search API.',
    icon: 'search',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-brave-search'],
    envKeys: [
      {
        key: 'BRAVE_API_KEY',
        label: 'Brave Search API Key',
        placeholder: 'BSA...',
        required: true,
        isSecret: true
      }
    ]
  },
  {
    id: 'fetch',
    name: 'Markdown Web Content Fetcher',
    category: 'Web & Search',
    description: 'Fetches any public URL and converts HTML directly into clean, token-efficient Markdown.',
    icon: 'globe',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-fetch']
  },
  {
    id: 'google-maps',
    name: 'Google Maps Geocoding & Places',
    category: 'Web & Search',
    description: 'Geocoding, directions calculation, place search, and local business discovery.',
    icon: 'globe',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-google-maps'],
    envKeys: [
      {
        key: 'GOOGLE_MAPS_API_KEY',
        label: 'Google Maps API Key',
        placeholder: 'AIzaSy...',
        required: true,
        isSecret: true
      }
    ]
  },

  // Communication
  {
    id: 'slack',
    name: 'Slack Workspace Integration',
    category: 'Communication',
    description: 'Allow AI agents to query channels, search message archives, and send automated notifications.',
    icon: 'message',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-slack'],
    envKeys: [
      {
        key: 'SLACK_BOT_TOKEN',
        label: 'Slack Bot User Token',
        placeholder: 'xoxb-...',
        required: true,
        isSecret: true
      }
    ]
  },
  {
    id: 'gdrive',
    name: 'Google Drive File Explorer',
    category: 'Developer Tools',
    description: 'Search, preview, and read Google Docs, Spreadsheets, and Drive files. Requires initial OAuth setup via npx @modelcontextprotocol/server-gdrive auth.',
    icon: 'folder',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-gdrive']
  }
]
