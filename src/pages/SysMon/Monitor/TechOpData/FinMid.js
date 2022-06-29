import React, { useEffect, useState } from 'react'
import EChartsReactCore from 'echarts-for-react/lib/core'
import * as echarts from 'echarts/core'
import echartsLoadingOption from '../../../../utils/echartsLoadingOption'
// import axios from '../../../../utils/axios'
import jsonData from './data.json'
import groupBy from 'lodash/groupBy'
import numeral from 'numeral';

const gen = (params, format, name) => {
  const rows = params
      .map((item) => {
        return `<div style="display: flex; width: 150px; line-height: 1.8">
                      <div style="flex: 0">${item.marker.replace(/border-radius:10px/, 'margin-right: 5px')}${item.seriesName}</div>
                    <div style="flex: 1; text-align: right">${numeral((item.value)).format(format).replace(/\.0+$/, '')}</div></div>`
      })
      .join('')
  const total = params.reduce((acc, cur) => {
    return acc + cur.value
  }, 0)
  const totalHtml = `<div style="display: flex; width: 150px; line-height: 1.8">
                                <div style="flex: 0">合计</div>
                                <div style="flex: 1; text-align: right">${numeral(total).format(format).replace(/\.0+$/, '')}</div></div>`
  return `${name}${rows}${totalHtml}`
}

function formatterTooltip(params, format='0,0') {
  const name = params[0].name
  const len = params.length / 2

  const part1 = gen(params.slice(0, len), format, '2021年' + name)
  const part2 = gen(params.slice(len), format, '2022年' + name)


  return `${part1}<br/> ${part2}`
}

const type = ['核算库存单据量', '每秒处理核算量', '核算时间（分钟）']
const typeProps = ['inventory', 'inventoryPerSec', 'time']
function FinMid() {
  const [chart1Option, setChart1Option] = useState({
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      formatter(params) {
        return formatterTooltip(params, '0,0.00')
      },
    },
    color: ['#74a0fa', '#f6c73a', '#8999b5', '#9489fa'],
    legend: {
      icon: 'rect',
      itemWidth: 12,
      itemHeight: 12,
      textStyle: {
        fontSize: 12,
      },
      top: 20,
      right: 0,
    },
    title: [
      { top: 80, left: 0, text: '核算库存单据量', textStyle: { fontSize: 15, fontWeight: 'normal' } },
      { top: 80, left: '53%', text: '每秒处理核算量', textStyle: { fontSize: 15, fontWeight: 'normal' } },
      { top: '57%', left: 0, text: '核算时间（分钟）', textStyle: { fontSize: 15, fontWeight: 'normal' } },
    ],
    grid: [
      { top: 130, left: 0, bottom: '50%', right: '53%', containLabel: true },
      { top: 130, right: 0, bottom: '50%', left: '53%', containLabel: true },
      { bottom: 1, top: '64%', left: 0, right: '53%', containLabel: true },
    ],
    xAxis: [
      {
        type: 'category',
        gridIndex: 0,
        data: [],
      },
      {
        type: 'category',
        gridIndex: 1,
        data: [],
      },
      {
        type: 'category',
        gridIndex: 2,
        data: [],
      },
    ],
    yAxis: [
      { type: 'value', gridIndex: 0 },
      { type: 'value', gridIndex: 1 },
      { type: 'value', gridIndex: 2 },
    ],
    series: [],
  })

  useEffect(() => {
    // axios
    //   .get('/bi-sys/api/admin/systemMonitor/getFINSystemMonitorDataDaily')

     Promise.resolve(jsonData).then(({ data }) => {
        /**@property {string} org */
        data = data.map(item => ({
          ...item,
          inventoryPerSec: Math.round(item.inventory / item.time / 60)
        }))
        const organizations = Array.from(new Set(data.map((item) => item.org)))
        const periods = Array.from(new Set(data.map((item) => item.period)))
        const _periods = Array.from({length: 12}, (_, i) => `${i+1}期`)
        const normalizedData = data.reduce((acc, cur) => {
          if (acc[cur.org]) {
            acc[cur.org][cur.period] = cur
          } else {
            acc[cur.org] = {
              [cur.period]: cur,
            }
          }
          return acc
        }, {})

        console.log(normalizedData)

        const newData = Object.keys(normalizedData).reduce((acc, cur) => {
          acc[cur] = groupBy(Object.values(normalizedData[cur]), (item) => {
            item['_period'] = item['period'].slice(5)
            return item['period'].slice(0, 4)
          })
            return acc
        }, {})

       console.log(newData)

        setChart1Option((prev) => {
          return {
            ...prev,
            xAxis: prev.xAxis.map((xAxis) => ({ ...xAxis, data: _periods })),
            series: [2021, 2022].map( y => {
              return organizations
                  .map((org) => {
                    return type.map((t, index) => {
                      return {
                        type: 'bar',
                        barWidth: 18,
                        barGap: '10%',
                        name: org,
                        stack: `${t}-${y}`,
                        xAxisIndex: index,
                        yAxisIndex: index,
                        data: _periods.map((p,i) => {
                          // return normalizedData?.[org]?.[p]?.[typeProps[index]]
                          return newData?.[org]?.[y]?.[i]?.[typeProps[index]]
                        }),
                      }
                    })
                  })
            })
              .flat(3),
          }
        })
      })
      .finally(() => {

      })
  }, [])

  return (
    <div>
      <div className={'relative px-8 pb-4'} style={{height: 790}}>
        <div className={'common-section-head w-full select-none'} style={{ position: 'absolute', top: 0, left: 0 }}>
          财务中台指标监控
        </div>
        {(
          <EChartsReactCore
            notMerge={true}
            echarts={echarts}
            option={chart1Option}
            loadingOption={echartsLoadingOption}
            style={{ height: 760 }}
          />
        )}
      </div>
    </div>
  )
}

export default FinMid
