<template>
  <div class="relative h-64">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const props = defineProps<{
  data: Array<{
    name: string
    count: number
    percentage: number
  }>
}>()

const chartCanvas = ref<HTMLCanvasElement>()
let chartInstance: Chart | null = null

const createChart = () => {
  if (!chartCanvas.value) return
  
  const ctx = chartCanvas.value.getContext('2d')
  if (!ctx) return
  
  // Destroy existing chart
  if (chartInstance) {
    chartInstance.destroy()
  }
  
  // Define colors for each model
  const colors = [
    '#39ff14', // Neon green
    '#00d4ff', // Neon blue
    '#bf00ff', // Neon purple
    '#ff073a', // Neon red
    '#ffff00', // Neon yellow
    '#ff00ff', // Neon magenta
  ]
  
  chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: props.data.map(d => d.name),
      datasets: [{
        data: props.data.map(d => d.count),
        backgroundColor: colors.map(color => color + '33'), // 20% opacity
        borderColor: colors,
        borderWidth: 2,
        hoverBackgroundColor: colors.map(color => color + '66'), // 40% opacity
        hoverBorderWidth: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#ffffff',
            font: {
              family: 'JetBrains Mono',
              size: 12
            },
            padding: 20,
            generateLabels: (chart) => {
              const data = chart.data
              if (data.labels && data.datasets) {
                return data.labels.map((label, i) => {
                  const dataset = data.datasets[0]
                  const value = dataset.data[i] as number
                  const percentage = props.data[i].percentage
                  
                  return {
                    text: `${label} (${percentage}%)`,
                    fillStyle: dataset.backgroundColor?.[i] || '#fff',
                    strokeStyle: dataset.borderColor?.[i] || '#fff',
                    lineWidth: 2,
                    hidden: false,
                    index: i
                  }
                })
              }
              return []
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(26, 26, 26, 0.9)',
          borderColor: '#39ff14',
          borderWidth: 1,
          titleColor: '#ffffff',
          bodyColor: '#cccccc',
          titleFont: {
            family: 'JetBrains Mono',
            weight: 'bold',
            size: 14
          },
          bodyFont: {
            family: 'JetBrains Mono',
            size: 12
          },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (context) => {
              const label = context.label || ''
              const value = context.parsed || 0
              const percentage = props.data[context.dataIndex].percentage
              return `${label}: ${value} chats (${percentage}%)`
            }
          }
        }
      },
      animation: {
        animateRotate: true,
        animateScale: false
      }
    }
  })
}

// Create chart on mount
onMounted(() => {
  createChart()
})

// Update chart when data changes
watch(() => props.data, () => {
  createChart()
}, { deep: true })

// Cleanup on unmount
onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy()
  }
})
</script>