import React, { useEffect, useRef, useState } from 'react'
import numeral from 'numeral'
import EChartsReactCore from 'echarts-for-react/lib/core'
import * as echarts from 'echarts/core'
import echartsLoadingOption from '../../../../utils/echartsLoadingOption'
import { Input, Select } from 'antd'
import moment from 'moment'
import cloneDeep from 'lodash/cloneDeep'
import { chartCommonOptions } from './DataMid'
import axios from '../../../../utils/axios'
import makeTooltipRow from './makeToolTipRow'
import { Tooltip } from '@material-ui/core'
import { InfoCircleOutlined } from '@ant-design/icons'
import StyledDateRangePicker from '../../../../components/StyledDateRangePicker';

const defaultDateRange = [moment().subtract(1, 'month'), moment()]

const urlMap = {
  // 日
  1: '/bi-sys/api/admin/systemMonitor/getMPMSystemMonitorDataDaily',
  // 月
  2: '/bi-sys/api/user/systemMonitor/getMPMSystemMonitorDataMonthly',
}

function MpmMid() {
  const [dateRange, setDateRange] = useState(defaultDateRange)
  const [type, setType] = useState(1)

  const [chart1Options, setChart1Options] = useState({
    tooltip: {
      show: true,
      trigger: 'axis',
      axisPointer: {
        type: 'line',
      },
    },
    color: ['#74a0fa', '#f6c73a'],
    ...cloneDeep(chartCommonOptions),
    series: [
      {
        name: '访问超5秒次数',
        type: 'line',
      },
      {
        name: '访问超10秒次数',
        type: 'line',
      },
    ],
  })

  const [chart2Options, setChart2Options] = useState({
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
        axisLabel: {
          formatter: (v) => `${v}%`,
        },
      },
      {
        minInterval: 1,
        splitLine: {
          show: false,
        },
      },
    ],
    series: [
      {
        name: '访问超5秒占比',
        type: 'line',
      },
      {
        name: '访问超10秒占比',
        type: 'line',
      },
      {
        name: '访问总数',
        type: 'line',
        yAxisIndex: 1,
      },
    ],
  })

  const [chart3Options, setChart3Options] = useState({
    tooltip: {
      show: true,
      trigger: 'axis',
      axisPointer: {
        type: 'line',
      },
      formatter: (params) => {
        const width = '130px'
        return `
           <div>${params[0].name}</div>
           ${makeTooltipRow({ ...params[0], title: params[0].seriesName, value: params[0].value + '‱' }, width)}
        `
      },
    },
    color: ['#74a0fa'],
    ...cloneDeep(chartCommonOptions),
    series: [
      {
        name: '接口访问超时率',
        type: 'line',
      },
    ],
  })

  const echartsRef1 = useRef(null)
  const echartsRef2 = useRef(null)
  const echartsRef3 = useRef(null)

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

        const aCode = type === 1 ? '52' : '57'
        const bCode = type === 1 ? '53' : '60'
        const cCode = type === 1 ? '32' : '56'

        const dataA = data[aCode] || []
        const dataB = data[bCode] || []
        const dataC = data[cCode] || []
        setTimeout(() => {
          setChart1Options((prevState) => ({
            ...prevState,
            key: Math.random(),
            xAxis: {
              ...prevState.xAxis,
              data: dataA.map((_) => moment(_['date']).format(type === 1 ? 'YYYY-MM-DD' : 'YYYY-MM')),
            },
            series: [
              {
                ...prevState.series[0],
                data: dataA.map((_) => _['valueOf5s']),
              },
              {
                ...prevState.series[1],
                data: dataA.map((_) => _['valueOf10s']),
              },
            ],
          }))
          setChart2Options((prevState) => ({
            ...prevState,
            key: Math.random(),
            xAxis: {
              ...prevState.xAxis,
              data: dataB.map((_) => moment(_['date']).format(type === 1 ? 'YYYY-MM-DD' : 'YYYY-MM')),
            },
            series: [
              {
                ...prevState.series[0],
                data: dataB.map((_) => (_['valueOf5s'] || 0)),
              },
              {
                ...prevState.series[1],
                data: dataB.map((_) => (_['valueOf10s'] || 0)),
              },
              {
                ...prevState.series[2],
                data: dataB.map((_) => _['valueOfTotal']),
              },
            ],
          }))

          setChart3Options((prevState) => ({
            ...prevState,
            key: Math.random(),
            xAxis: {
              ...prevState.xAxis,
              data: dataC.map((_) => moment(_['date']).format(type === 1 ? 'YYYY-MM-DD' : 'YYYY-MM')),
            },
            series: [
              {
                ...prevState.series[0],
                data: dataC.map((_) => _['value']),
              },
            ],
          }))
        }, 100)
      })
  }, [type, dateRange])

  return (
    <div>
      <div className={'common-section-head flex justify-between'}>
        <span>研供中台指标监控</span>
        <div>
          <Input.Group compact>
            <Select className={'w-18'} value={type} onChange={(v) => setType(v)}>
              <Select.Option value={1}>按日</Select.Option>
              <Select.Option value={2}>按月</Select.Option>
            </Select>
            <StyledDateRangePicker
              value={dateRange}
              onChange={(v) => setDateRange(v)}
              picker={type === 1 ? undefined : 'month'}
              allowClear={false}
            />
          </Input.Group>
        </div>
      </div>
      <div className={'px-8'}>
        <div className={'mt-4'}>
          <span style={{ fontSize: 15 }} className={'align-bottom'}>
            研供访问超5/10秒数
            <Tooltip title={'一段时间内超过10秒和超过5秒的接口情况'} className={'text-gray-500'}>
              <InfoCircleOutlined className={'text-sm ml-1'} />
            </Tooltip>
          </span>
          <div>
            <EChartsReactCore
              ref={echartsRef1}
              notMerge={true}
              option={chart1Options}
              echarts={echarts}
              loadingOption={echartsLoadingOption}
              style={{ height: 320 }}
            />
          </div>
        </div>

        <div className={'mt-10 pb-4'}>
          <span style={{ fontSize: 15 }} className={'align-bottom'}>
            研供访问超5/10秒占比率
            <Tooltip title={'一段时间内接口访问超5秒和10秒的占比'} className={'text-gray-500'}>
              <InfoCircleOutlined className={'text-sm ml-1'} />
            </Tooltip>
          </span>
          <div>
            <EChartsReactCore
              ref={echartsRef2}
              notMerge={true}
              option={chart2Options}
              echarts={echarts}
              loadingOption={echartsLoadingOption}
              style={{ height: 320 }}
            />
          </div>
        </div>

        <div className={'mt-10 pb-4'}>
          <span style={{ fontSize: 15 }} className={'align-bottom'}>
            接口访问超时率（超3秒，单位：‱）
            <Tooltip title={'一段时间内超过3秒的接口与接口总数的比例，正常应低于万分之一'} className={'text-gray-500'}>
              <InfoCircleOutlined className={'text-sm'} />
            </Tooltip>
          </span>
          <div>
            <EChartsReactCore
              ref={echartsRef3}
              notMerge={true}
              option={chart3Options}
              echarts={echarts}
              loadingOption={echartsLoadingOption}
              style={{ height: 320 }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default MpmMid
