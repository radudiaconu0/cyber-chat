export default defineEventHandler(async (event) => {
  // This endpoint returns available models with their capabilities
  // In a production app, you might fetch this from OpenRouter's API
  
  const models = [
    {
      id: 'anthropic/claude-3.5-sonnet',
      name: 'Claude 3.5 Sonnet',
      provider: 'Anthropic',
      contextLength: 200000,
      pricing: { input: 3, output: 15 },
      capabilities: {
        reasoning: false,
        vision: true,
        webSearch: false,
        functions: false
      },
      description: 'Most intelligent model, great for analysis and coding'
    },
    {
      id: 'openai/gpt-4-turbo',
      name: 'GPT-4 Turbo',
      provider: 'OpenAI',
      contextLength: 128000,
      pricing: { input: 10, output: 30 },
      capabilities: {
        reasoning: false,
        vision: true,
        webSearch: true,
        functions: true
      },
      description: 'Powerful model with vision and tool support'
    },
    {
      id: 'perplexity/sonar-medium-online',
      name: 'Perplexity Sonar Medium',
      provider: 'Perplexity',
      contextLength: 16000,
      pricing: { input: 0.6, output: 1.8 },
      capabilities: {
        reasoning: false,
        vision: false,
        webSearch: true,
        functions: false
      },
      description: 'Optimized for web search with real-time information',
      webSearchNotes: 'Automatic web search with citations included'
    },
    {
      id: 'perplexity/sonar-small-online',
      name: 'Perplexity Sonar Small',
      provider: 'Perplexity',
      contextLength: 16000,
      pricing: { input: 0.2, output: 0.6 },
      capabilities: {
        reasoning: false,
        vision: false,
        webSearch: true,
        functions: false
      },
      description: 'Fast and economical with built-in web search',
      webSearchNotes: 'Automatic web search, best for quick current info'
    },
    {
      id: 'openai/o1-preview',
      name: 'O1 Preview',
      provider: 'OpenAI',
      contextLength: 128000,
      pricing: { input: 15, output: 60 },
      capabilities: {
        reasoning: true,
        vision: false,
        webSearch: false,
        functions: false
      },
      description: 'Advanced reasoning model for complex problems'
    },
    {
      id: 'google/gemini-pro-1.5',
      name: 'Gemini Pro 1.5',
      provider: 'Google',
      contextLength: 1000000,
      pricing: { input: 7, output: 21 },
      capabilities: {
        reasoning: false,
        vision: true,
        webSearch: false,
        functions: false
      },
      description: 'Massive context window for long documents'
    },
    {
      id: 'meta-llama/llama-3.1-405b-instruct',
      name: 'Llama 3.1 405B',
      provider: 'Meta',
      contextLength: 32000,
      pricing: { input: 5, output: 15 },
      capabilities: {
        reasoning: false,
        vision: false,
        webSearch: false,
        functions: false
      },
      description: 'Powerful open-source model'
    }
  ]

  // Filter models that support web search if requested
  const { webSearchOnly } = getQuery(event)
  
  if (webSearchOnly === 'true') {
    return models.filter(model => model.capabilities.webSearch)
  }

  return models
})