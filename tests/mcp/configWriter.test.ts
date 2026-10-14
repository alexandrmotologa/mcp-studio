import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { McpConfigWriter } from '../../src/main/mcp/McpConfigWriter'
import { McpServerConfig } from '../../src/shared/types'

describe('McpConfigWriter Unit Tests', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-config-test-'))
  })

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })

  describe('formatServerForTarget', () => {
    it('should format stdio server correctly for claude_mcpServers format', () => {
      const server: McpServerConfig = {
        id: 's1',
        name: 'File System',
        transport: 'stdio',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
        env: { DEBUG: 'true' },
        status: 'connected',
        createdAt: Date.now()
      }

      const formatted = McpConfigWriter.formatServerForTarget(server, 'claude_mcpServers')
      expect(formatted).toEqual({
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
        env: { DEBUG: 'true' }
      })
    })

    it('should format sse server correctly for claude_mcpServers format', () => {
      const server: McpServerConfig = {
        id: 's2',
        name: 'Remote API',
        transport: 'sse',
        url: 'https://example.com/sse',
        headers: { Authorization: 'Bearer token' },
        status: 'connected',
        createdAt: Date.now()
      }

      const formatted = McpConfigWriter.formatServerForTarget(server, 'claude_mcpServers')
      expect(formatted).toEqual({
        url: 'https://example.com/sse',
        headers: { Authorization: 'Bearer token' }
      })
    })

    it('should format stdio server correctly for zed_contextServers format', () => {
      const server: McpServerConfig = {
        id: 's3',
        name: 'Zed Tool',
        transport: 'stdio',
        command: 'zed-mcp',
        args: ['--debug'],
        status: 'connected',
        createdAt: Date.now()
      }

      const formatted = McpConfigWriter.formatServerForTarget(server, 'zed_contextServers')
      expect(formatted).toEqual({
        command: 'zed-mcp',
        args: ['--debug'],
        env: {}
      })
    })
  })

  describe('previewClientConfigDiff and syncConfigToClient', () => {
    it('should compute diff and perform atomic sync with backup', async () => {
      const testConfigFile = path.join(tempDir, 'claude_desktop_config.json')

      // Initial config with an existing external server
      const initialContent = {
        mcpServers: {
          'existing-external-server': {
            command: 'node',
            args: ['external.js']
          }
        }
      }
      fs.writeFileSync(testConfigFile, JSON.stringify(initialContent, null, 2), 'utf8')

      const studioServers: McpServerConfig[] = [
        {
          id: 'server-1',
          name: 'Studio Tool',
          transport: 'stdio',
          command: 'npx',
          args: ['-y', 'studio-tool'],
          status: 'connected',
          createdAt: Date.now()
        }
      ]

      // Preview diff
      const diff = await McpConfigWriter.previewClientConfigDiff('claude-desktop', studioServers, testConfigFile)
      expect(diff.serversToAdd).toContain('Studio Tool')
      expect(diff.serversToUpdate).toHaveLength(0)

      // Perform sync
      const result = await McpConfigWriter.syncConfigToClient('claude-desktop', studioServers, testConfigFile)
      expect(result.success).toBe(true)
      expect(result.syncedServerCount).toBe(1)
      expect(result.backupFilePath).toBeDefined()
      expect(fs.existsSync(result.backupFilePath!)).toBe(true)

      // Verify backup preserved original content
      const backupData = JSON.parse(fs.readFileSync(result.backupFilePath!, 'utf8'))
      expect(backupData.mcpServers['existing-external-server']).toBeDefined()
      expect(backupData.mcpServers['studio-tool']).toBeUndefined()

      // Verify written file contains both preserved external server and new studio server
      const updatedData = JSON.parse(fs.readFileSync(testConfigFile, 'utf8'))
      expect(updatedData.mcpServers['existing-external-server']).toBeDefined()
      expect(updatedData.mcpServers['studio-tool']).toBeDefined()
      expect(updatedData.mcpServers['studio-tool'].command).toBe('npx')
    })
  })
})
