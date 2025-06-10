// server/api/models/index.get.ts
import { createError } from 'h3'

interface OpenRouterArchitecture {
  input_modalities: string[]
  output_modalities: string[]
  tokenizer: string
  instruct_type: string | null
}

interface OpenRouterPricing {
  prompt: string
  completion: string
  request: string
  image: string
  web_search: string
  internal_reasoning: string
  input_cache_read: string
  input_cache_write: string
}

interface OpenRouterTopProvider {
  context_length: number
  max_completion_tokens: number
  is_moderated: boolean
}

interface OpenRouterModel {
  id: string
  name: string
  created: number
  description: string
  context_length: number
  architecture: OpenRouterArchitecture
  pricing: OpenRouterPricing
  top_provider: OpenRouterTopProvider
  per_request_limits: any
  supported_parameters: string[]
}

interface OpenRouterResponse {
  data: OpenRouterModel[]
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const forceRefresh = query.refresh === 'true'
    
    // Check cache first (unless force refresh)
    const storage = useStorage('redis') // or 'memory' if no Redis
    const cacheKey = 'openrouter-models'
    const cacheExpiry = 60 * 60 * 1000 // 1 hour
    
    if (!forceRefresh) {
      try {
        const cached = await storage.getItem(cacheKey)
        if (cached && typeof cached === 'object' && 'timestamp' in cached) {
          const cachedData = cached as { data: any[], timestamp: number }
          if (Date.now() - cachedData.timestamp < cacheExpiry) {
            return {
              success: true,
              data: cachedData.data,
              cached: true,
              timestamp: cachedData.timestamp
            }
          }
        }
      } catch (cacheError) {
        console.warn('Cache read error:', cacheError)
      }
    }

    // Fetch from OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CyberChat/2.0.0'
      }
    })

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        statusMessage: `OpenRouter API error: ${response.statusText}`
      })
    }

    const openRouterData: OpenRouterResponse = await response.json()
    
    // Transform models to our format
    const transformedModels = openRouterData.data
      .filter(model => {
        // Filter out models that are not suitable for chat
        return model.architecture.output_modalities.includes('text') &&
               model.architecture.input_modalities.includes('text') &&
               !model.id.includes('embedding') &&
               !model.id.includes('moderation') &&
               !model.id.includes('whisper') &&
               !model.id.includes('tts') &&
               !model.id.includes('dall-e') &&
               !model.id.includes('stable-diffusion')
      })
      .map(model => {
        // Extract capabilities from supported parameters and architecture
        const capabilities = []
        
        if (model.architecture.input_modalities.includes('text')) capabilities.push('text')
        if (model.architecture.input_modalities.includes('image')) capabilities.push('vision')
        if (model.supported_parameters.includes('tools')) capabilities.push('tools')
        if (model.supported_parameters.includes('reasoning')) capabilities.push('reasoning')
        if (model.pricing.web_search !== '0') capabilities.push('web-search')
        if (model.architecture.instruct_type) capabilities.push('instruct')
        
        // Categorize model type
        let category = 'general'
        const modelId = model.id.toLowerCase()
        const modelName = model.name.toLowerCase()
        
        if (modelId.includes('code') || modelName.includes('code')) {
          category = 'code'
        } else if (modelId.includes('reasoning') || capabilities.includes('reasoning')) {
          category = 'reasoning'
        } else if (capabilities.includes('vision')) {
          category = 'multimodal'
        } else if (capabilities.includes('web-search')) {
          category = 'search'
        }

        // Determine if it's a popular/featured model
        const featured = [
          'openai/gpt-4o',
          'openai/gpt-4o-mini',
          'anthropic/claude-3.5-sonnet',
          'anthropic/claude-3.5-haiku',
          'google/gemini-2.0-flash-exp',
          'meta-llama/llama-3.3-70b-instruct',
          'qwen/qwen-2.5-72b-instruct',
          'deepseek/deepseek-chat'
        ].includes(model.id)

        return {
          id: model.id,
          name: model.name,
          description: model.description,
          contextLength: model.context_length,
          maxCompletionTokens: model.top_provider.max_completion_tokens,
          pricing: {
            prompt: parseFloat(model.pricing.prompt) * 1000000, // Convert to per 1M tokens
            completion: parseFloat(model.pricing.completion) * 1000000,
            image: parseFloat(model.pricing.image),
            webSearch: parseFloat(model.pricing.web_search),
            request: parseFloat(model.pricing.request)
          },
          capabilities,
          category,
          featured,
          architecture: {
            tokenizer: model.architecture.tokenizer,
            instructType: model.architecture.instruct_type,
            inputModalities: model.architecture.input_modalities,
            outputModalities: model.architecture.output_modalities
          },
          provider: {
            contextLength: model.top_provider.context_length,
            maxCompletionTokens: model.top_provider.max_completion_tokens,
            isModerated: model.top_provider.is_moderated
          },
          supportedParameters: model.supported_parameters,
          created: model.created,
          perRequestLimits: model.per_request_limits
        }
      })
      .sort((a, b) => {
        // Sort by: featured first, then by name
        if (a.featured && !b.featured) return -1
        if (!a.featured && b.featured) return 1
        return a.name.localeCompare(b.name)
      })

    // Cache the result
    try {
      await storage.setItem(cacheKey, {
        data: transformedModels,
        timestamp: Date.now()
      })
    } catch (cacheError) {
      console.warn('Cache write error:', cacheError)
    }

    return {
      success: true,
      data: transformedModels,
      cached: false,
      timestamp: Date.now(),
      total: transformedModels.length
    }

  } catch (error: any) {
    console.error('Models API error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch models'
    })
  }
})