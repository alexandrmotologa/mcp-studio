/**
 * Smart Mock Data / Faker Engine for JSON Schema parameters
 * Analyzes property names, types, formats, and constraints to generate realistic dummy data.
 */

export function generateMockDataForSchema(schema: any): Record<string, any> {
  if (!schema || typeof schema !== 'object') return {}

  const properties = schema.properties || {}
  const result: Record<string, any> = {}

  for (const [key, propDef] of Object.entries<any>(properties)) {
    result[key] = generateValueForProperty(key, propDef)
  }

  return result
}

function generateValueForProperty(propName: string, prop: any): any {
  if (!prop || typeof prop !== 'object') return 'sample'

  // 1. Enum check
  if (Array.isArray(prop.enum) && prop.enum.length > 0) {
    return prop.enum[0]
  }

  // 2. Default check
  if (prop.default !== undefined) {
    return prop.default
  }

  const name = propName.toLowerCase()
  const type = prop.type

  // 3. String Type with Semantic Keyword Heuristics
  if (type === 'string') {
    if (prop.format === 'date-time' || name.includes('date') || name.includes('time') || name.includes('timestamp')) {
      return new Date().toISOString()
    }
    if (prop.format === 'email' || name.includes('email') || name.includes('mail')) {
      return 'developer@example.com'
    }
    if (prop.format === 'uri' || prop.format === 'url' || name.includes('url') || name.includes('uri') || name.includes('endpoint') || name.includes('link')) {
      return 'https://api.github.com/v1/repos'
    }
    if (name.includes('sql') || name.includes('query')) {
      return 'SELECT id, name, status, created_at FROM records LIMIT 10;'
    }
    if (name.includes('uuid') || name.includes('guid')) {
      return 'e4eaaaf2-d142-11e1-b3e4-080027620cdd'
    }
    if (name.includes('id') || name.includes('key')) {
      return `usr_${crypto.randomUUID().slice(0, 8)}`
    }
    if (name.includes('path') || name.includes('file') || name.includes('dir')) {
      return '/workspace/project/config.json'
    }
    if (name.includes('name') || name.includes('author') || name.includes('user') || name.includes('creator')) {
      return 'Alex Vance'
    }
    if (name.includes('phone') || name.includes('mobile')) {
      return '+1-555-0199'
    }
    if (name.includes('city') || name.includes('location')) {
      return 'San Francisco, CA'
    }
    if (name.includes('country')) {
      return 'United States'
    }
    if (name.includes('ip') || name.includes('host')) {
      return '127.0.0.1'
    }
    if (name.includes('status')) {
      return 'active'
    }
    if (name.includes('title')) {
      return 'Sample Production Task'
    }
    if (name.includes('description') || name.includes('content') || name.includes('summary') || name.includes('message')) {
      return 'This is a sample payload generated for MCP tool testing and automated verification.'
    }
    if (name.includes('selector')) {
      return 'body'
    }
    if (name.includes('code') || name.includes('script')) {
      return 'console.log("Hello from MCP Studio");'
    }

    return `sample_${propName}`
  }

  // 4. Number / Integer Type
  if (type === 'number' || type === 'integer') {
    if (name.includes('width')) return 800
    if (name.includes('height')) return 600
    if (name.includes('port')) return 8080
    if (name.includes('limit') || name.includes('size') || name.includes('count') || name.includes('max')) return 10
    if (name.includes('page') || name.includes('offset')) return 1
    if (name.includes('timeout')) return 5000
    if (name.includes('duration') || name.includes('delay')) return 1000
    if (name.includes('age')) return 30
    if (name.includes('price') || name.includes('amount') || name.includes('cost')) return 99.99

    if (prop.minimum !== undefined && prop.maximum !== undefined) {
      return Math.round((prop.minimum + prop.maximum) / 2)
    }
    if (prop.minimum !== undefined) return prop.minimum
    if (prop.maximum !== undefined) return prop.maximum

    return 42
  }

  // 5. Boolean Type
  if (type === 'boolean') {
    return true
  }

  // 6. Array Type
  if (type === 'array') {
    const itemProp = prop.items || {}
    if (name.includes('tags') || name.includes('categories') || name.includes('labels')) {
      return ['production', 'backend', 'v1.0']
    }
    if (name.includes('ids') || name.includes('keys')) {
      return ['id_101', 'id_102']
    }
    if (itemProp.type === 'string') {
      return ['sample-item-1', 'sample-item-2']
    }
    if (itemProp.type === 'number' || itemProp.type === 'integer') {
      return [1, 2, 3]
    }
    if (itemProp.type === 'object') {
      return [generateMockDataForSchema(itemProp)]
    }
    return ['item-1', 'item-2']
  }

  // 7. Nested Object Type
  if (type === 'object') {
    if (prop.properties && Object.keys(prop.properties).length > 0) {
      return generateMockDataForSchema(prop)
    }
    if (name.includes('launch') || name.includes('puppeteer')) {
      return { headless: true }
    }
    if (name.includes('header')) {
      return { 'Content-Type': 'application/json' }
    }
    if (name.includes('metadata') || name.includes('meta')) {
      return { env: 'production' }
    }
    return { key: 'value' }
  }

  return 'sample'
}
