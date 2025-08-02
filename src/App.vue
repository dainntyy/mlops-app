<script setup>
import Papa from 'papaparse'
import { ref } from 'vue'
const rawData = ref([])
const onFileUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      console.log('✅ CSV parsed:', results)

      const requiredColumns = ['experiment_id', 'metric_name', 'step', 'value']
      const firstRow = results.data[0]

      const isValid = requiredColumns.every((col) => col in firstRow)

      if (!isValid) {
        alert('❌ CSV має містити колонки: experiment_id, metric_name, step, value')
        return
      }

      rawData.value = results.data
      extractData()
    },
  })
}

const experimentList = ref([])
const selectedExperiments = ref([])

const extractData = () => {
  const exps = [...new Set(rawData.value.map((row) => row.experiment_id))]
  const metrics = [...new Set(rawData.value.map((row) => row.metric_name))]

  experimentList.value = exps.map((id) => ({ label: id, value: id }))
  metricList.value = metrics.map((m) => ({ label: m, value: m }))
}

const chartData = ref(null)

const updateChart = () => {
  const data = buildChartData()
  if (data.datasets.length === 0) {
    alert('⚠️ Немає даних для побудови графіку. Перевір експерименти або метрики.')
    return
  }
  chartData.value = data
}
function downsample(data, maxPoints = 300) {
  if (data.length <= maxPoints) return data
  const step = Math.floor(data.length / maxPoints)
  return data.filter((_, index) => index % step === 0)
}

const buildChartData = () => {
  const datasets = []

  const metricsToUse = selectedMetrics.value.length
    ? selectedMetrics.value
    : [...new Set(rawData.value.map((row) => row.metric_name))]

  for (const metric of metricsToUse) {
    for (const expId of selectedExperiments.value) {
      const dataPoints = rawData.value
        .filter((r) => r.experiment_id === expId && r.metric_name === metric)
        .map((r) => ({ x: Number(r.step), y: Number(r.value) }))

      const sampledPoints = downsample(dataPoints, 300)

      if (sampledPoints.length > 0) {
        datasets.push({
          label: `${expId} - ${metric}`,
          data: sampledPoints,
          fill: false,
          borderColor: randomColor(),
          tension: 0.1,
        })
      }
    }
  }

  return { datasets }
}


const chartOptions = {
  responsive: true,
  plugins: {
    legend: { position: 'bottom' },
  },
  scales: {
    x: {
      title: { display: true, text: 'Step' },
      type: 'linear',
    },
    y: {
      title: { display: true, text: 'Value' },
    },
  },
}

function randomColor() {
  const r = Math.floor(Math.random() * 255)
  const g = Math.floor(Math.random() * 255)
  const b = Math.floor(Math.random() * 255)
  return `rgb(${r},${g},${b})`
}

const metricList = ref([])
const selectedMetrics = ref([])
</script>

<template>
  <div class="container">
    <h2 class="title">MLOps Experiment Viewer</h2>
    <input type="file" @change="onFileUpload" accept=".csv" />

    <!-- <div>
      <h3>DEBUG: experimentList</h3>
      <pre>{{ experimentList }}</pre>
    </div> -->

    <div v-if="experimentList.length" class="mt-4">
      <MultiSelect
        v-model="selectedExperiments"
        :options="experimentList"
        optionLabel="label"
        optionValue="value"
        filter
        placeholder="Select experiments"
        class="w-full card"
      />
    </div>
    <div v-if="metricList.length" class="mt-4">
      <MultiSelect
        v-model="selectedMetrics"
        :options="metricList"
        optionLabel="label"
        optionValue="value"
        placeholder="Оберіть метрики"
        class="w-full"
      />
    </div>

    <div v-if="selectedExperiments.length" class="mt-4">
      <Button label="Побудувати графік" @click="updateChart" />
    </div>

    <div v-if="chartData" class="mt-6">
      <Chart
        :key="selectedExperiments.join(',')"
        type="line"
        :data="buildChartData()"
        :options="chartOptions"
      />
    </div>
  </div>
</template>

<style>
body {
  font-family: 'Segoe UI', sans-serif;
  background-color: #f9fafb;
  margin: 0;
  padding: 0;
}

.container {
  max-width: 960px;
  margin: 0 auto;
  padding: 2rem;
}

.title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.w-full {
  width: 100%;
}

.mt-4 {
  margin-top: 1rem;
}

.mt-6 {
  margin-top: 1.5rem;
}
</style>
