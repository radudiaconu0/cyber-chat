<template>
  <div class="min-h-screen bg-cyber-dark">
    <!-- Header -->
    <header class="bg-dark-100 border-b border-dark-300/50 px-6 py-4">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-white">Dashboard</h1>
          <p class="text-gray-400 text-sm mt-1">Your AI conversation analytics</p>
        </div>
        <NuxtLink to="/" class="cyber-button text-sm">
          <ArrowLeftIcon class="w-4 h-4 inline mr-2" />
          Back to Chat
        </NuxtLink>
      </div>
    </header>

    <!-- Main Content -->
    <main class="p-6">
      <div class="max-w-7xl mx-auto space-y-6">
        <!-- Stats Overview -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            v-for="stat in stats"
            :key="stat.id"
            :title="stat.title"
            :value="stat.value"
            :change="stat.change"
            :icon="stat.icon"
            :color="stat.color"
          />
        </div>

        <!-- Charts Row -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Usage Over Time -->
          <div class="bg-dark-100 rounded-xl border border-dark-300/50 p-6">
            <h2 class="text-lg font-semibold text-white mb-4">Usage Over Time</h2>
            <UsageChart :data="usageData" />
          </div>

          <!-- Model Distribution -->
          <div class="bg-dark-100 rounded-xl border border-dark-300/50 p-6">
            <h2 class="text-lg font-semibold text-white mb-4">Model Usage</h2>
            <ModelDistributionChart :data="modelData" />
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="bg-dark-100 rounded-xl border border-dark-300/50 p-6">
          <h2 class="text-lg font-semibold text-white mb-4">Recent Activity</h2>
          <RecentActivityList :activities="recentActivities" />
        </div>

        <!-- Token Usage Breakdown -->
        <div class="bg-dark-100 rounded-xl border border-dark-300/50 p-6">
          <h2 class="text-lg font-semibold text-white mb-4">Token Usage by Model</h2>
          <TokenUsageTable :data="tokenUsageData" />
        </div>

        <!-- Export Options -->
        <div class="bg-dark-100 rounded-xl border border-dark-300/50 p-6">
          <h2 class="text-lg font-semibold text-white mb-4">Export Data</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              @click="exportData('json')"
              class="p-4 bg-dark-200 rounded-lg hover:bg-dark-300 transition-colors border border-dark-300/50 hover:border-neon-green/50"
            >
              <DocumentTextIcon class="w-8 h-8 text-neon-green mx-auto mb-2" />
              <h3 class="text-white font-medium">Export as JSON</h3>
              <p class="text-gray-400 text-sm mt-1">Complete data export</p>
            </button>
            
            <button 
              @click="exportData('csv')"
              class="p-4 bg-dark-200 rounded-lg hover:bg-dark-300 transition-colors border border-dark-300/50 hover:border-neon-blue/50"
            >
              <TableCellsIcon class="w-8 h-8 text-neon-blue mx-auto mb-2" />
              <h3 class="text-white font-medium">Export as CSV</h3>
              <p class="text-gray-400 text-sm mt-1">For spreadsheets</p>
            </button>
            
            <button 
              @click="exportData('pdf')"
              class="p-4 bg-dark-200 rounded-lg hover:bg-dark-300 transition-colors border border-dark-300/50 hover:border-neon-purple/50"
            >
              <DocumentIcon class="w-8 h-8 text-neon-purple mx-auto mb-2" />
              <h3 class="text-white font-medium">Export as PDF</h3>
              <p class="text-gray-400 text-sm mt-1">Formatted report</p>
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useMainStore } from '~/stores/main'
import { 
  ArrowLeftIcon,
  DocumentTextIcon,
  TableCellsIcon,
  DocumentIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CpuChipIcon,
  ChartBarIcon
} from '@heroicons/vue/24/outline'

import TokenUsageTable from '~/components/dashboard/TokenUsageTable.vue'
import UsageChart from '~/components/dashboard/UsageChart.vue'
import StatCard from '~/components/dashboard/StatCard.vue'
import ModelDistributionChart from '~/components/dashboard/ModelDistributionChart.vue'
import RecentActivityList from '~/components/dashboard/RecentActivityList.vue'

const mainStore = useMainStore()
const toast = inject('toast')

// Computed stats
const stats = computed(() => {
  const sessions = mainStore.chatSessions
  const totalMessages = sessions.reduce((sum, s) => sum + s.messages.length, 0)
  const avgMessagesPerChat = sessions.length > 0 ? Math.round(totalMessages / sessions.length) : 0
  const totalTokens = mainStore.totalTokensUsed
  
  // Calculate 7-day change
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  
  const recentSessions = sessions.filter(s => s.createdAt > sevenDaysAgo).length
  const changePercent = sessions.length > 0 ? Math.round((recentSessions / sessions.length) * 100) : 0
  
  return [
    {
      id: 'total-chats',
      title: 'Total Chats',
      value: sessions.length.toString(),
      change: `+${changePercent}%`,
      icon: ChatBubbleLeftRightIcon,
      color: 'text-neon-green'
    },
    {
      id: 'total-messages',
      title: 'Total Messages',
      value: totalMessages.toString(),
      change: '+12%',
      icon: ChatBubbleLeftRightIcon,
      color: 'text-neon-blue'
    },
    {
      id: 'avg-messages',
      title: 'Avg Messages/Chat',
      value: avgMessagesPerChat.toString(),
      change: '+5%',
      icon: ChartBarIcon,
      color: 'text-neon-purple'
    },
    {
      id: 'total-tokens',
      title: 'Total Tokens',
      value: formatTokens(totalTokens),
      change: '+23%',
      icon: CpuChipIcon,
      color: 'text-neon-pink'
    }
  ]
})

// Usage data for chart
const usageData = computed(() => {
  const days = 30
  const data = []
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    const sessionsOnDay = mainStore.chatSessions.filter(s => {
      const sessionDate = new Date(s.createdAt).toISOString().split('T')[0]
      return sessionDate === dateStr
    })
    
    const messagesOnDay = sessionsOnDay.reduce((sum, s) => sum + s.messages.length, 0)
    
    data.push({
      date: dateStr,
      sessions: sessionsOnDay.length,
      messages: messagesOnDay
    })
  }
  
  return data
})

// Model distribution data
const modelData = computed(() => {
  const modelCounts: Record<string, number> = {}
  
  mainStore.chatSessions.forEach(session => {
    const modelName = mainStore.availableModels.find(m => m.id === session.model)?.name || 'Unknown'
    modelCounts[modelName] = (modelCounts[modelName] || 0) + 1
  })
  
  return Object.entries(modelCounts).map(([name, count]) => ({
    name,
    count,
    percentage: Math.round((count / mainStore.chatSessions.length) * 100)
  }))
})

// Recent activities
const recentActivities = computed(() => {
  const activities: any[] = []
  
  mainStore.chatSessions.slice(0, 10).forEach(session => {
    activities.push({
      id: `session-${session.id}`,
      type: 'session',
      title: `Created chat: ${session.title}`,
      timestamp: session.createdAt,
      icon: ChatBubbleLeftRightIcon
    })
    
    if (session.messages.length > 0) {
      const lastMessage = session.messages[session.messages.length - 1]
      activities.push({
        id: `message-${lastMessage.id}`,
        type: 'message',
        title: `New message in: ${session.title}`,
        timestamp: lastMessage.timestamp,
        icon: ChatBubbleLeftRightIcon
      })
    }
  })
  
  return activities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10)
})

// Token usage by model
const tokenUsageData = computed(() => {
  const usage: Record<string, { input: number; output: number; total: number }> = {}
  
  mainStore.chatSessions.forEach(session => {
    const model = mainStore.availableModels.find(m => m.id === session.model)
    if (model) {
      if (!usage[model.name]) {
        usage[model.name] = { input: 0, output: 0, total: 0 }
      }
      
      // Estimate token usage (simplified)
      const inputTokens = Math.floor(session.tokenCount * 0.4)
      const outputTokens = Math.floor(session.tokenCount * 0.6)
      
      usage[model.name].input += inputTokens
      usage[model.name].output += outputTokens
      usage[model.name].total += session.tokenCount
    }
  })
  
  return Object.entries(usage).map(([model, tokens]) => ({
    model,
    ...tokens,
    cost: calculateCost(model, tokens)
  }))
})

// Helper functions
const formatTokens = (tokens: number) => {
  if (tokens < 1000) return tokens.toString()
  if (tokens < 1000000) return `${(tokens / 1000).toFixed(1)}K`
  return `${(tokens / 1000000).toFixed(2)}M`
}

const calculateCost = (modelName: string, tokens: { input: number; output: number }) => {
  const model = mainStore.availableModels.find(m => m.name === modelName)
  if (!model) return '$0.00'
  
  const inputCost = (tokens.input / 1000000) * model.inputPrice
  const outputCost = (tokens.output / 1000000) * model.outputPrice
  
  return `$${(inputCost + outputCost).toFixed(3)}`
}

const exportData = async (format: 'json' | 'csv' | 'pdf') => {
  mainStore.setLoading(true, `Exporting as ${format.toUpperCase()}...`)
  
  try {
    // Simulate export delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    switch (format) {
      case 'json':
        const jsonData = {
          exportDate: new Date().toISOString(),
          stats: stats.value,
          sessions: mainStore.chatSessions,
          models: modelData.value,
          usage: usageData.value
        }
        
        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' })
        downloadFile(blob, `cyberchat-export-${Date.now()}.json`)
        break
        
      case 'csv':
        // Simplified CSV export
        const csvData = generateCSV()
        const csvBlob = new Blob([csvData], { type: 'text/csv' })
        downloadFile(csvBlob, `cyberchat-export-${Date.now()}.csv`)
        break
        
      case 'pdf':
        toast('info', 'Coming Soon', 'PDF export will be available soon!')
        break
    }
    
    toast('success', 'Export Complete', `Data exported as ${format.toUpperCase()}`)
  } catch (error) {
    console.error('Export error:', error)
    toast('error', 'Export Failed', 'Failed to export data')
  } finally {
    mainStore.setLoading(false)
  }
}

const generateCSV = () => {
  const headers = ['Session ID', 'Title', 'Created', 'Messages', 'Model', 'Tokens']
  const rows = mainStore.chatSessions.map(session => [
    session.id,
    session.title,
    new Date(session.createdAt).toISOString(),
    session.messages.length,
    session.model,
    session.tokenCount
  ])
  
  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')
  
  return csv
}

const downloadFile = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Page meta
useHead({
  title: 'Dashboard - CyberChat',
  meta: [
    { name: 'description', content: 'View your AI conversation analytics and statistics' }
  ]
})
</script>

<style scoped>
/* Custom animations for dashboard */
@keyframes countUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stat-value {
  animation: countUp 0.6s ease-out;
}
</style>