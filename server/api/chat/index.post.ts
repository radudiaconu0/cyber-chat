import { createError, readBody } from 'h3'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // Get authenticated user
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  // Get request body
  const body = await readBody(event)
  const { messages, model, settings, sessionId } = body

  if (!messages || !model || !sessionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields'
    })
  }

  // Get API key from runtime config
  const config = useRuntimeConfig()
  const apiKey = config.openRouterApiKey

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'OpenRouter API key not configured'
    })
  }

  try {
    // Prepare messages for OpenRouter API
    const formattedMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content
    }))

    // Add system message based on settings
    const systemMessages = []
    
    if (settings?.enableWebSearch) {
      systemMessages.push({
        role: 'system',
        content: 'You have access to web search. When appropriate, search for current information to provide accurate, up-to-date responses.'
      })
    }

    if (settings?.enableReasoning) {
      systemMessages.push({
        role: 'system',
        content: 'Think step-by-step through complex problems. Show your reasoning process clearly.'
      })
    }

    const allMessages = [...systemMessages, ...formattedMessages]

    // Prepare request body with web search if supported
    const requestBody: any = {
      model,
      messages: allMessages,
      temperature: settings?.temperature || 0.7,
      max_tokens: settings?.maxTokens || 4000,
      top_p: settings?.topP || 0.9,
      frequency_penalty: settings?.frequencyPenalty || 0,
      presence_penalty: settings?.presencePenalty || 0,
      stream: true
    }

    // Enable web search for models that support it
    if (settings?.enableWebSearch) {
      // Models that support web search through OpenRouter
      const webSearchModels = [
        'perplexity/pplx-7b-online',
        'perplexity/pplx-70b-online',
        'perplexity/sonar-small-online',
        'perplexity/sonar-medium-online',
        'openai/gpt-4-turbo-preview', // With tools/plugins
        'openai/gpt-4-1106-preview'    // With tools/plugins
      ]

      if (webSearchModels.includes(model)) {
        // For Perplexity models, web search is automatic
        // For OpenAI models, we can enable tools
        if (model.startsWith('openai/')) {
          requestBody.tools = [{
            type: 'web_search',
            function: {
              name: 'web_search',
              description: 'Search the web for current information'
            }
          }]
          requestBody.tool_choice = 'auto'
        }
      }
    }

    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': event.node.req.headers.referer || 'https://cyberchat.app',
        'X-Title': 'CyberChat',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const error = await response.text()
      throw createError({
        statusCode: response.status,
        statusMessage: `OpenRouter API error: ${error}`
      })
    }

    // Set up SSE headers for streaming
    event.node.res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    })

    // Stream the response
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    if (!reader) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to get response stream'
      })
    }

    while (true) {
      const { done, value } = await reader.read()
      
      if (done) {
        event.node.res.write('data: [DONE]\n\n')
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      
      // Keep the last incomplete line in the buffer
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.trim() === '') continue
        if (line.trim() === 'data: [DONE]') {
          event.node.res.write('data: [DONE]\n\n')
          continue
        }

        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6))
            
            // Extract content from the response
            const content = data.choices?.[0]?.delta?.content || ''
            
            // Check for web search results (Perplexity models include citations)
            const webSearchResults = data.choices?.[0]?.delta?.web_search_results || 
                                   data.web_search_results || 
                                   null
            
            if (content) {
              // Send the content to the client
              event.node.res.write(`data: ${JSON.stringify({ 
                content,
                webSearchResults 
              })}\n\n`)
            }

            // Check for finish reason
            if (data.choices?.[0]?.finish_reason) {
              // Save message to database
              const supabase = await serverSupabaseClient(event)
              
              // Get the complete message content
              const completeContent = data.choices?.[0]?.message?.content || ''
              
              await supabase.from('messages').insert({
                session_id: sessionId,
                user_id: user.id,
                role: 'assistant',
                content: completeContent,
                model,
                timestamp: new Date().toISOString(),
                metadata: {
                  usage: data.usage,
                  finish_reason: data.choices?.[0]?.finish_reason
                }
              })

              // Update session token count
              if (data.usage) {
                await supabase
                  .from('chat_sessions')
                  .update({
                    token_count: data.usage.total_tokens,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', sessionId)
              }
            }
          } catch (error) {
            console.error('Failed to parse SSE data:', error)
          }
        }
      }
    }

    event.node.res.end()

  } catch (error: any) {
    console.error('Chat API error:', error)
    
    // If headers haven't been sent, send error response
    if (!event.node.res.headersSent) {
      throw createError({
        statusCode: error.statusCode || 500,
        statusMessage: error.statusMessage || 'Internal server error'
      })
    } else {
      // If streaming has started, send error in stream
      event.node.res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`)
      event.node.res.end()
    }
  }
})