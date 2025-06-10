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
    date: string
    sessions: number
    messages: number
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
  
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: props.data.map(d => new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })),
      datasets: [
        {
          label: 'Sessions',
          data: props.data.map(d => d.sessions),
          borderColor: '#39ff14',
          backgroundColor: 'rgba(57, 255, 20, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Messages',
          data: props.data.map(d => d.messages),
          borderColor: '#00d4ff',
          backgroundColor: 'rgba(0, 212, 255, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#ffffff',
            font: {
              family: 'JetBrains Mono'
            },
            usePointStyle: true,
            pointStyle: 'circle'
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
            weight: 'bold'
          },
          bodyFont: {
            family: 'JetBrains Mono'
          },
          padding: 12,
          cornerRadius: 8
        }
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
            drawBorder: false
          },
          ticks: {
            color: '#666666',
            font: {
              family: 'JetBrains Mono',
              size: 11
            }
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
            drawBorder: false
          },
          ticks: {
            color: '#666666',
            font: {
              family: 'JetBrains Mono',
              size: 11
            }
          }
        }
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