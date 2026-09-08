import { McpServerConfig, McpTool } from '../../../shared/types'

export function generateClientCode(
  lang: 'python' | 'typescript' | 'curl' | 'go' | 'rust',
  tool: McpTool,
  server?: McpServerConfig,
  args: Record<string, any> = {}
): string {
  const toolName = tool.name
  const argsJson = JSON.stringify(args, null, 2)
  const argsInline = JSON.stringify(args)

  switch (lang) {
    case 'python':
      return `# Python Client using MCP SDK / FastMCP
import asyncio
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def run_${toolName.replace(/[^a-zA-Z0-9_]/g, '_')}():
    # 1. Connect to MCP server
    server_params = StdioServerParameters(
        command="${server?.command || 'python'}",
        args=${JSON.stringify(server?.args || ['server.py'])},
        env=None
    )
    
    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            # 2. Initialize protocol handshake
            await session.initialize()
            
            # 3. Call tool with arguments
            result = await session.call_tool(
                name="${toolName}",
                arguments=${argsJson}
            )
            print("Tool Response:", result)

if __name__ == "__main__":
    asyncio.run(run_${toolName.replace(/[^a-zA-Z0-9_]/g, '_')}())`

    case 'typescript':
      return `// TypeScript / Node.js Client using @modelcontextprotocol/sdk
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
  // 1. Establish stdio transport
  const transport = new StdioClientTransport({
    command: "${server?.command || 'node'}",
    args: ${JSON.stringify(server?.args || ['dist/index.js'])}
  });

  const client = new Client(
    { name: "custom-client", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  await client.connect(transport);

  // 2. Invoke tool
  const response = await client.callTool({
    name: "${toolName}",
    arguments: ${argsJson}
  });

  console.log("Response:", response);
}

main().catch(console.error);`

    case 'curl':
      return `# JSON-RPC 2.0 Tool Call Payload
# Over SSE or HTTP POST gateway
curl -X POST http://localhost:8000/jsonrpc \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "${toolName}",
      "arguments": ${argsInline}
    }
  }'`

    case 'go':
      return `// Go Client using github.com/mark3labs/mcp-go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/mark3labs/mcp-go/client"
	"github.com/mark3labs/mcp-go/mcp"
)

func main() {
	ctx := context.Background()

	// 1. Start stdio client
	c, err := client.NewStdioMCPClient(
		"${server?.command || './server'}",
		[]string{${server?.args?.map((a) => `"${a}"`).join(', ') || ''}},
	)
	if err != nil {
		log.Fatalf("Failed to start client: %v", err)
	}
	defer c.Close()

	// 2. Initialize
	if _, err := c.Initialize(ctx, mcp.InitializeRequest{}); err != nil {
		log.Fatalf("Initialize error: %v", err)
	}

	// 3. Call tool
	args := map[string]interface{}${argsInline}
	res, err := c.CallTool(ctx, mcp.CallToolRequest{
		Params: struct {
			Name      string                 \`json:"name"\`
			Arguments map[string]interface{} \`json:"arguments,omitempty"\`
		}{
			Name:      "${toolName}",
			Arguments: args,
		},
	})
	if err != nil {
		log.Fatalf("Tool call error: %v", err)
	}

	fmt.Printf("Result: %+v\\n", res)
}`

    case 'rust':
      return `// Rust MCP Client
use serde_json::json;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let tool_name = "${toolName}";
    let arguments = json!(${argsJson});

    println!("Invoking MCP tool: {}", tool_name);
    println!("Arguments: {}", arguments);
    
    // Send JSON-RPC payload to MCP sub-process stdin
    let payload = json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": tool_name,
            "arguments": arguments
        }
    });
    
    println!("Payload:\\n{}", serde_json::to_string_pretty(&payload)?);
    Ok(())
}`

    default:
      return ''
  }
}
