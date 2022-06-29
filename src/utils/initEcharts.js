import * as echarts from 'echarts/core'

import { BarChart, PieChart, LineChart } from 'echarts/charts'

import {
  GridComponent,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent
} from 'echarts/components'

import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  TitleComponent, TooltipComponent, GridComponent, LegendComponent, DataZoomComponent,
  BarChart, PieChart, LineChart,
  CanvasRenderer
])


