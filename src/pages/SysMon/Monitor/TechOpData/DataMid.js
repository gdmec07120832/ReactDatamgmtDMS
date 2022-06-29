import React, { useEffect, useRef, useState } from 'react'
import numeral from 'numeral'
import EChartsReactCore from 'echarts-for-react/lib/core'
import * as echarts from 'echarts/core'
import echartsLoadingOption from '../../../../utils/echartsLoadingOption'
import axios from '../../../../utils/axios'
import cloneDeep from 'lodash/cloneDeep'
import { Empty, Input, Select } from 'antd'
import moment from 'moment'
import makeTooltipRow from './makeToolTipRow'
import StyledDateRangePicker from '../../../../components/StyledDateRangePicker';

export const chartCommonOptions = {
  legend: {
    left: 0,
    top: 10,
    icon: 'rect',
    itemWidth: 12,
    itemHeight: 12,
    formatter: (name) => {
      return `{text|${name}}`
    },
    textStyle: {
      rich: {
        text: {
          padding: [1.5, 0, 0, 0],
        },
      },
    },
  },
  grid: {
    top: 60,
    bottom: 10,
    left: 0,
    right: 0,
    containLabel: true,
  },
  xAxis: {
    axisLine: {
      lineStyle: {
        width: 0,
      },
    },
    axisTick: {
      show: false,
    },
    data: [],
  },
  yAxis: {
    minInterval: 1,
    splitLine: {
      lineStyle: {
        type: 'line',
      },
    },
  },
}

const defaultDateRange = [moment().subtract(1, 'month'), moment()]
const urlMap = {
  // 日
  1: '/bi-sys/api/admin/systemMonitor/getBISystemMonitorDataDaily',
  // 月
  2: '/bi-sys/api/user/systemMonitor/getBISystemMonitorDataMonthly',
}
function DataMid() {
  const [dateRange, setDateRange] = useState(defaultDateRange)
  const [type, setType] = useState(1)
  const [chart1Option, setChart1Option] = useState({
    tooltip: {
      show: true,
      trigger: 'axis',
      axisPointer: {
        type: 'line',
      },
      formatter: (params) => {
        return `
        <div>${params[0].name}</div>
        ${params
          .map((row) => {
            return makeTooltipRow(
              {
                ...row,
                value: row.seriesName.indexOf('占比') > -1 ? row.value + '%' : numeral(row.value).format('0,0'),
              },
              '150px'
            )
          })
          .join('')}
        `
      },
    },
    color: ['#74a0fa', '#f6c73a', '#f984b3', '#89e4d6'],
    ...cloneDeep(chartCommonOptions),
    yAxis: [
      {
        minInterval: 1,
        splitLine: {
          lineStyle: {
            type: 'line',
          },
        },
      },
      {
        splitLine: {
          show: false,
        },
        axisLabel: {
          formatter: (v) => `${v}%`,
        },
      },
    ],
    series: [
      {
        name: '作业失败数',
        type: 'line',
      },
      {
        name: '数据同步失败数',
        type: 'line',
      },
      {
        name: '作业失败占比',
        type: 'line',
        yAxisIndex: 1,
      },
      {
        name: '数据同步失败占比',
        type: 'line',
        yAxisIndex: 1,
      },
    ],
  })

  const [chart2Option, setChart2Option] = useState({
    tooltip: {
      show: true,
      trigger: 'axis',
      axisPointer: {
        type: 'line',
      },
      formatter: (params) => {
        return `
        <div>${params[0].name}</div>
        ${params
          .map((row) => {
            return makeTooltipRow(
              {
                ...row,
                value: row.seriesName.indexOf('占比') > -1 ? row.value + '%' : numeral(row.value).format('0,0'),
              },
              '150px'
            )
          })
          .join('')}
        `
      },
    },
    color: ['#74a0fa', '#f6c73a'],
    ...cloneDeep(chartCommonOptions),
    yAxis: [
      {
        minInterval: 1,
        splitLine: {
          lineStyle: {
            type: 'line',
          },
        },
      },
      {
        splitLine: {
          show: false,
        },
        axisLabel: {
          formatter: (v) => `${v}%`,
        },
      },
    ],
    series: [
      {
        name: '超5秒报表次数',
        type: 'line',
      },
      {
        name: '超10秒报表次数',
        type: 'line',
      },
    ],
  })

  const [chart3Option, setChart3Option] = useState({
    tooltip: {
      show: true,
      trigger: 'axis',
      axisPointer: {
        type: 'line',
      },
      formatter: (params) => {
        return `
        <div>${params[0].name}</div>
        ${params
          .map((row) => {
            return makeTooltipRow(
              {
                ...row,
                value: row.seriesName.indexOf('占比') > -1 ? row.value + '%' : numeral(row.value).format('0,0'),
              },
              '150px'
            )
          })
          .join('')}
        `
      },
    },
    color: ['#74a0fa', '#f6c73a', '#ccc'],
    ...cloneDeep(chartCommonOptions),
    yAxis: [
      {
        minInterval: 1,
        splitLine: {
          lineStyle: {
            type: 'line',
          },
        },
      },
      {
        splitLine: {
          show: false,
        },
        axisLabel: {
          formatter: (v) => `${v}%`,
        },
      },
    ],
    series: [
      {
        name: '超5秒报表占比',
        type: 'line',
        yAxisIndex: 1,
      },
      {
        name: '超10秒报表占比',
        type: 'line',
        yAxisIndex: 1,
      },
      {
        name: '报表访问总次数',
        type: 'line',
      },
    ],
  })

  const echartsRef1 = useRef(null)
  const echartsRef2 = useRef(null)
  const echartsRef3 = useRef(null)

  const isEmpty = useRef(false)

  useEffect(() => {
    const url = urlMap[type]
    const [_startDate, _endDate] = dateRange || []
    axios
      .get(url, {
        params: {
          startDate: _startDate.format(type === 1 ? 'YYYY-MM-DD' : 'YYYY-MM'),
          endDate: _endDate.format(type === 1 ? 'YYYY-MM-DD' : 'YYYY-MM'),
        },
      })
      .then(({ data }) => {
        echartsRef1.current?.getEchartsInstance()?.clear()
        echartsRef2.current?.getEchartsInstance()?.clear()
        echartsRef3.current?.getEchartsInstance()?.clear()
        isEmpty.current = !data?.length

        setTimeout(() => {
          setChart1Option((prevState) => ({
            ...prevState,
            key: Math.random(),
            xAxis: {
              ...prevState.xAxis,
              data: data.map((_) => moment(_['tDate']).format(type === 1 ? 'YYYY-MM-DD' : 'YYYY-MM')),
            },
            series: [
              {
                ...prevState.series[0],
                data: data.map((_) => _['excuteFailCnt']),
              },
              {
                ...prevState.series[1],
                data: data.map((_) => _['odsExcuteFailCnt']),
              },
              {
                ...prevState.series[2],
                data: data.map((_) => ((_['excuteFailRate'] || 0) * 100).toFixed(2).replace(/\.0+$/, '')),
              },
              {
                ...prevState.series[3],
                data: data.map((_) => ((_['odsExcuteFailRate'] || 0) * 100).toFixed(2).replace(/\.0+$/, '')),
              },
            ],
          }))
          setChart2Option((prevState) => ({
            ...prevState,
            key: Math.random(),
            xAxis: {
              ...prevState.xAxis,
              data: data.map((_) => moment(_['tDate']).format(type === 1 ? 'YYYY-MM-DD' : 'YYYY-MM')),
            },
            series: [
              {
                ...prevState.series[0],
                data: data.map((_) => _['outTimeFiveCnt']),
              },
              {
                ...prevState.series[1],
                data: data.map((_) => _['outTimeTenCnt']),
              },
            ],
          }))

          setChart3Option((prevState) => ({
            ...prevState,
            key: Math.random(),
            xAxis: {
              ...prevState.xAxis,
              data: data.map((_) => moment(_['tDate']).format(type === 1 ? 'YYYY-MM-DD' : 'YYYY-MM')),
            },
            series: [
              {
                ...prevState.series[0],
                data: data.map((_) => ((_['outTimeFiveRate'] || 0) * 100).toFixed(2).replace(/\.0+$/, '')),
              },
              {
                ...prevState.series[1],
                data: data.map((_) => ((_['outTimeTenRate'] || 0) * 100).toFixed(2).replace(/\.0+$/, '')),
              },
              {
                ...prevState.series[2],
                data: data.map((_) => _['optRepordCnt']),
              },
            ],
          }))
        }, 100)
      })
  }, [type, dateRange])

  return (
    <div>
      <div className={'common-section-head flex justify-between'}>
        <span>数据中台指标监控</span>
        <div>
          <Input.Group compact>
            <Select className={'w-18'} value={type} onChange={(v) => setType(v)}>
              <Select.Option value={1}>按日</Select.Option>
              <Select.Option value={2}>按月</Select.Option>
            </Select>
            <StyledDateRangePicker
              allowClear={false}
              value={dateRange}
              onChange={(v) => setDateRange(v)}
              picker={type === 1 ? undefined : 'month'}
            />
          </Input.Group>
        </div>
      </div>
      <div className={'px-8'}>
        <div className={'mt-4'}>
          <span style={{ fontSize: 15 }}>报表访问超5/10秒占比</span>
          <div>
            {isEmpty.current ? (
                <div className={'pt-20'} style={{ height: 300 }}>
                  <Empty description={'所选时间范围暂无数据'} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                </div>
            ) : (
                <EChartsReactCore
                    ref={echartsRef3}
                    notMerge={true}
                    echarts={echarts}
                    option={chart3Option}
                    loadingOption={echartsLoadingOption}
                    style={{ height: 320 }}
                />
            )}
          </div>
        </div>
        <div className={'mt-10 pb-4'}>
          <span style={{ fontSize: 15 }}>报表访问超5/10秒次数</span>
          <div>
            {isEmpty.current ? (
              <div className={'pt-20'} style={{ height: 300 }}>
                <Empty description={'所选时间范围暂无数据'} image={Empty.PRESENTED_IMAGE_SIMPLE} />
              </div>
            ) : (
              <EChartsReactCore
                ref={echartsRef2}
                notMerge={true}
                echarts={echarts}
                option={chart2Option}
                loadingOption={echartsLoadingOption}
                style={{ height: 320 }}
              />
            )}
          </div>
        </div>
        <div className={'mt-10 pb-4'}>
          <span style={{ fontSize: 15 }}>数据平台作业监控</span>
          <div>
            {isEmpty.current ? (
                <div className={'pt-20'} style={{ height: 300 }}>
                  <Empty description={'所选时间范围暂无数据'} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                </div>
            ) : (
                <EChartsReactCore
                    ref={echartsRef1}
                    echarts={echarts}
                    option={chart1Option}
                    loadingOption={echartsLoadingOption}
                    style={{ height: 320 }}
                />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DataMid
