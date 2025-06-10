// server/api/test-connection.post.ts
import { createError, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { apiKey } = body

    if (!apiKey) {
      throw createError({
        statusCode: 400,
        statusMessage: 'API key is required'
      })
    }

    // Test the OpenRouter API connection
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw createError({
          statusCode: 401,
          statusMessage: 'Invalid API key'
        })
      } else if (response.status === 429) {
        throw createError({
          statusCode: 429,
          statusMessage: 'Rate limit exceeded'
        })
      } else {
        throw createError({
          statusCode: response.status,
          statusMessage: `API error: ${response.statusText}`
        })
      }
    }

    const data = await response.json()
    
    return {
      success: true,
      message: 'Connection successful',
      modelCount: data.data?.length || 0
    }

  } catch (error: any) {
    console.error('Test connection error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to test connection'
    })
  }
})