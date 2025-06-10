<template>
  <div class="overflow-x-auto -mx-6 px-6">
    <table class="w-full">
      <thead>
        <tr class="border-b border-dark-300/50">
          <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
            Model
          </th>
          <th class="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
            Input Tokens
          </th>
          <th class="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
            Output Tokens
          </th>
          <th class="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
            Total Tokens
          </th>
          <th class="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
            Est. Cost
          </th>
        </tr>
      </thead>
      <tbody>
        <tr 
          v-for="(row, index) in data"
          :key="row.model"
          :class="[
            'border-b border-dark-300/30 hover:bg-dark-200/50 transition-colors',
            index % 2 === 0 ? 'bg-dark-100/30' : ''
          ]"
        >
          <td class="px-4 py-4 text-sm text-white font-medium">
            {{ row.model }}
          </td>
          <td class="px-4 py-4 text-sm text-gray-300 text-right font-mono">
            {{ formatNumber(row.input) }}
          </td>
          <td class="px-4 py-4 text-sm text-gray-300 text-right font-mono">
            {{ formatNumber(row.output) }}
          </td>
          <td class="px-4 py-4 text-sm text-white text-right font-mono font-medium">
            {{ formatNumber(row.total) }}
          </td>
          <td class="px-4 py-4 text-sm text-right font-mono">
            <span class="text-neon-green font-medium">{{ row.cost }}</span>
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr class="border-t-2 border-neon-green/50">
          <td class="px-4 py-4 text-sm font-bold text-white">
            Total
          </td>
          <td class="px-4 py-4 text-sm text-white text-right font-mono font-bold">
            {{ formatNumber(totals.input) }}
          </td>
          <td class="px-4 py-4 text-sm text-white text-right font-mono font-bold">
            {{ formatNumber(totals.output) }}
          </td>
          <td class="px-4 py-4 text-sm text-white text-right font-mono font-bold">
            {{ formatNumber(totals.total) }}
          </td>
          <td class="px-4 py-4 text-sm text-right font-mono">
            <span class="text-neon-green font-bold text-base">{{ totals.cost }}</span>
          </td>
        </tr>
      </tfoot>
    </table>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  data: Array<{
    model: string
    input: number
    output: number
    total: number
    cost: string
  }>
}>()

// Calculate totals
const totals = computed(() => {
  const input = props.data.reduce((sum, row) => sum + row.input, 0)
  const output = props.data.reduce((sum, row) => sum + row.output, 0)
  const total = props.data.reduce((sum, row) => sum + row.total, 0)
  
  // Parse and sum costs
  const totalCost = props.data.reduce((sum, row) => {
    const cost = parseFloat(row.cost.replace('$', ''))
    return sum + cost
  }, 0)
  
  return {
    input,
    output,
    total,
    cost: `$${totalCost.toFixed(3)}`
  }
})

// Format numbers with commas
const formatNumber = (num: number) => {
  return num.toLocaleString()
}
</script>

<style scoped>
/* Table hover effects */
tbody tr {
  transition: all 0.2s ease;
}

tbody tr:hover {
  transform: translateX(2px);
}

/* Responsive table */
@media (max-width: 768px) {
  table {
    font-size: 0.875rem;
  }
  
  th, td {
    padding: 0.5rem;
  }
}
</style>