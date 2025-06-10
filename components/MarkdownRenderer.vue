<template>
  <div class="markdown-content">
    <div v-html="renderedContent" ref="contentRef"></div>
    <span v-if="streaming" class="typing-cursor"></span>
  </div>
</template>

<script setup lang="ts">
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'

const props = defineProps<{
  content: string
  streaming?: boolean
}>()

const contentRef = ref<HTMLElement>()
const toast = inject('toast')

// Configure marked with syntax highlighting
marked.use({
  renderer: {
    code(code, language) {
      const validLanguage = hljs.getLanguage(language) ? language : 'plaintext'
      const highlighted = hljs.highlight(code, { language: validLanguage }).value
      
      return `
        <div class="code-block group relative">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-gray-500 uppercase">${validLanguage}</span>
            <button class="copy-button opacity-0 group-hover:opacity-100 transition-opacity">
              Copy
            </button>
          </div>
          <pre><code class="hljs language-${validLanguage}">${highlighted}</code></pre>
        </div>
      `
    },
    
    link(href, title, text) {
      return `<a href="${href}" title="${title || ''}" target="_blank" rel="noopener noreferrer" class="text-neon-green hover:text-neon-blue transition-colors underline">${text}</a>`
    },
    
    image(href, title, text) {
      return `<img src="${href}" alt="${text}" title="${title || ''}" class="max-w-full h-auto rounded-lg my-4" loading="lazy" />`
    },
    
    table(header, body) {
      return `
        <div class="table-container overflow-x-auto my-4">
          <table class="custom-table">
            <thead>${header}</thead>
            <tbody>${body}</tbody>
          </table>
        </div>
      `
    },
    
    listitem(text) {
      return `<li class="ml-4">${text}</li>`
    },
    
    paragraph(text) {
      return `<p class="mb-4 leading-relaxed">${text}</p>`
    },
    
    heading(text, level) {
      const sizes = {
        1: 'text-2xl',
        2: 'text-xl',
        3: 'text-lg',
        4: 'text-base',
        5: 'text-sm',
        6: 'text-xs'
      }
      
      const id = text.toLowerCase().replace(/[^\w]+/g, '-')
      
      return `
        <h${level} id="${id}" class="${sizes[level]} font-bold mb-4 mt-6 text-white group">
          ${text}
          <a href="#${id}" class="heading-anchor opacity-0 group-hover:opacity-100 ml-2 text-gray-500 hover:text-neon-green transition-all">#</a>
        </h${level}>
      `
    },
    
    blockquote(quote) {
      return `<blockquote class="border-l-4 border-neon-green/50 pl-4 my-4 italic text-gray-400">${quote}</blockquote>`
    },
    
    codespan(code) {
      return `<code class="px-1.5 py-0.5 bg-dark-200 rounded text-neon-green text-sm">${code}</code>`
    },
    
    hr() {
      return '<hr class="my-8 border-t border-dark-300/50" />'
    }
  }
})

// Computed rendered content
const renderedContent = computed(() => {
  try {
    return marked.parse(props.content || '')
  } catch (error) {
    console.error('Markdown parsing error:', error)
    return props.content || ''
  }
})

// Handle copy button clicks
const handleCopyButtons = () => {
  if (!contentRef.value) return
  
  const copyButtons = contentRef.value.querySelectorAll('.copy-button')
  
  copyButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
      e.preventDefault()
      const codeBlock = button.closest('.code-block')
      const code = codeBlock?.querySelector('code')?.textContent || ''
      
      try {
        await navigator.clipboard.writeText(code)
        button.textContent = 'Copied!'
        toast('success', 'Copied', 'Code copied to clipboard')
        
        setTimeout(() => {
          button.textContent = 'Copy'
        }, 2000)
      } catch (error) {
        console.error('Copy failed:', error)
        toast('error', 'Error', 'Failed to copy code')
      }
    })
  })
}

// Handle smooth scrolling for anchor links
const handleAnchorLinks = () => {
  if (!contentRef.value) return
  
  const links = contentRef.value.querySelectorAll('a[href^="#"]')
  
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault()
      const targetId = link.getAttribute('href')?.substring(1)
      const targetElement = document.getElementById(targetId || '')
      
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    })
  })
}

// Apply interactive features after content updates
watch(renderedContent, () => {
  nextTick(() => {
    handleCopyButtons()
    handleAnchorLinks()
  })
})

onMounted(() => {
  handleCopyButtons()
  handleAnchorLinks()
})
</script>

<style scoped>
/* Base markdown styles */
.markdown-content {
  @apply text-gray-300 leading-relaxed;
}

/* Deep styles for rendered content */
.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  @apply font-display;
}

.markdown-content :deep(ul) {
  @apply list-disc pl-6 mb-4 space-y-2;
}

.markdown-content :deep(ol) {
  @apply list-decimal pl-6 mb-4 space-y-2;
}

.markdown-content :deep(li) {
  @apply text-gray-300;
}

.markdown-content :deep(pre) {
  @apply overflow-x-auto;
}

.markdown-content :deep(.code-block) {
  @apply relative rounded-lg p-4 my-4;
  background: linear-gradient(135deg, rgba(26, 26, 26, 0.95), rgba(45, 45, 48, 0.8));
  border: 1px solid rgba(57, 255, 20, 0.2);
}

.markdown-content :deep(.copy-button) {
  @apply absolute top-2 right-2 px-2 py-1 text-xs rounded transition-all;
  background: rgba(57, 255, 20, 0.1);
  border: 1px solid rgba(57, 255, 20, 0.2);
  color: #39ff14;
}

.markdown-content :deep(.copy-button:hover) {
  background: rgba(57, 255, 20, 0.2);
}

.markdown-content :deep(.heading-anchor) {
  @apply text-gray-500 no-underline;
  font-weight: normal;
}

/* Table styles */
.markdown-content :deep(.table-container) {
  @apply overflow-x-auto my-4 -mx-4;
}

.markdown-content :deep(.custom-table) {
  @apply w-full min-w-full;
  border-collapse: collapse;
}

.markdown-content :deep(.custom-table th) {
  padding: 0.75rem 1rem;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 500;
  color: white;
  border-bottom: 1px solid rgba(57, 255, 20, 0.2);
}

.markdown-content :deep(.custom-table td) {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  color: #d1d5db;
  border-bottom: 1px solid rgba(57, 255, 20, 0.1);
}

.markdown-content :deep(.custom-table tbody tr:hover) {
  background-color: rgba(57, 255, 20, 0.05);
}

/* Horizontal rules */
.markdown-content :deep(hr) {
  margin: 2rem 0;
  border: 0;
  height: 2px;
  background: linear-gradient(to right, transparent, #39ff14, transparent);
}

/* Images */
.markdown-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  border: 1px solid rgba(57, 255, 20, 0.2);
  margin: 1rem 0;
}

/* Strong and emphasis */
.markdown-content :deep(strong) {
  font-weight: 700;
  color: white;
}

.markdown-content :deep(em) {
  font-style: italic;
  color: #d1d5db;
}

/* Typing indicator for streaming */
.markdown-content :deep(.typing-indicator) {
  color: #39ff14;
  animation: typing-pulse 1s infinite;
}

@keyframes typing-pulse {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* Math expressions (if needed) */
.markdown-content :deep(.math) {
  color: #00d4ff;
}

/* Syntax highlighting customization */
.markdown-content :deep(.hljs) {
  background: transparent;
}

.markdown-content :deep(.hljs-comment) {
  color: #6b7280;
}

.markdown-content :deep(.hljs-keyword) {
  color: #bf00ff;
}

.markdown-content :deep(.hljs-string) {
  color: #ff9f00;
}

.markdown-content :deep(.hljs-number) {
  color: #00d4ff;
}

.markdown-content :deep(.hljs-function) {
  color: #39ff14;
}

.markdown-content :deep(.hljs-class) {
  color: #ff073a;
}

.markdown-content :deep(.hljs-variable) {
  color: white;
}

.markdown-content :deep(.hljs-operator) {
  color: #d1d5db;
}

/* Responsive design */
@media (max-width: 768px) {
  .markdown-content :deep(.code-block) {
    margin-left: 0;
    margin-right: 0;
  }
  
  .markdown-content :deep(.table-container) {
    margin-left: -1rem;
    margin-right: -1rem;
  }
  
  .markdown-content :deep(.heading-anchor) {
    display: none;
  }
}
</style>