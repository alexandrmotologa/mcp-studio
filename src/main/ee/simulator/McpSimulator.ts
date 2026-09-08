export class McpSimulator {
  constructor(_cm?: any) {}
  public async runSimulation(_config: any, _tools: any): Promise<{ success: boolean; messages: any[]; error?: string }> {
    return { success: false, messages: [], error: 'Multi-LLM Simulation is available in MCP Studio Pro.' }
  }
}
