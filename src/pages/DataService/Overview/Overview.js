import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useRequest } from 'ahooks'
import axios from '../../../utils/axios'
import { Checkbox, Input, Select } from 'antd'
import StyledDateRangePicker from '../../../components/StyledDateRangePicker'
import moment from 'moment'
import cloneDeep from 'lodash/cloneDeep'
import EChartsReactCore from 'echarts-for-react/lib/core'
import * as echarts from 'echarts'
import fetchSql from '../../../utils/fetchSql'
import groupBy from 'lodash/groupBy'
import uniq from 'lodash/uniq'
import ApiCharts from './ApiCharts'
import { commonOptions } from './common'
import DetailTable from './DetailTable';

const apiStatistic = [
  ['TotalCount', '接口总数'],
  ['PcTerminal', '数据灯塔'],
  ['MobileTerminal', '移动灯塔'],
  ['LargeScreenTerminal', '数据大屏'],
  ['DataMessage', '数讯传送'],
  ['DigitalSupplier', '数字供应商'],
  ['Dashboard4BOSS', 'BOSS看板'],
  ['ExternalInterface', '业务系统'],
]

const defaultOptions = [{ label: '接口总数', value: 'all' }]

function Overview() {
  const [apiStatisticResult, setApiStatisticResult] = useState({})

  const [statisticType, setStatisticType] = useState('day')
  const [statisticRange, setStatisticRange] = useState([moment().subtract(30, 'day'), moment()])

  const handleStatisticTypeChange = (v) => {
    setStatisticType(v)
    if (v === 'day') {
      setStatisticRange([moment().subtract(30, 'day'), moment()])
    }
    if (v === 'month') {
      setStatisticRange([moment().subtract(12, 'month'), moment()])
    }
    if (v === 'year') {
      setStatisticRange([moment().subtract(3, 'year'), moment()])
    }
  }

  useRequest(() => {
    return axios.get('/bi-metadata/api/user/overview/getAPI').then(({ data: [ret] }) => {
      setApiStatisticResult(ret)
    })
  })

  const [apiOptions, setApiOptions] = useState(defaultOptions)

  const [checkedList, setCheckedList] = useState(['all'])

  const [chart1Option, setChart1Option] = useState({
    ...cloneDeep(commonOptions),
    xAxis: {
      axisTick: {
        alignWithLabel: true,
      },
      data: [],
    },
    series: [
      {
        type: 'line',
        name: '接口总数',
        color: '#ccc',
        data: [],
      },
    ],
  })

  const renderChart = useCallback(
    (data) => {
      setChart1Option((prevState) => ({
        ...prevState,
        xAxis: {
          ...prevState.xAxis,
          data: data.map((item) => item.date),
        },
        series: [
          ...(checkedList.includes('all')
            ? [
                {
                  type: 'line',
                  name: '接口总数',
                  color: '#ccc',
                  data: data.map((item) => item.totalInterfaceCount),
                },
              ]
            : []),
          ...checkedList
            .filter((item) => item !== 'all')
            .map((sysName) => {
              return {
                type: 'line',
                name: sysName + '调用次数',
                data: data.map((item) => {
                  return item.data.find((item) => item.sysName === sysName)?.interfaceVisitCount || 0
                }),
              }
            }),
        ],
      }))
    },
    [checkedList]
  )

  const parsedDataRef = useRef([])
  const { run: getList } = useRequest(
    (type, params) => {
      let interfaceName
      if (type === 'day') {
        interfaceName = 'getApiCountDaily'
      }
      if (type === 'month') {
        interfaceName = 'getApiCountMonthly'
      }
      if (type === 'year') {
        interfaceName = 'getApiCountYearly'
      }
      return fetchSql('ALL_US_API', interfaceName, {
        ...params,
      }).then(({ data }) => {
        const sysNames = uniq(data.map((item) => item.sysName))
        setApiOptions(
          defaultOptions.concat(
            sysNames.map((item) => ({
              label: item,
              value: item,
            }))
          )
        )
        const groupData = groupBy(data, (item) => {
          return item[{ day: 'tDate', month: 'mDate', year: 'yDate' }[type]]
        })
        const parsedData = Object.keys(groupData)
          .sort((a, b) => {
            return moment(a) - moment(b)
          })
          .map((key) => {
            return {
              date: key,
              data: groupData[key],
              totalInterfaceCount: groupData[key].reduce((acc, cur) => acc + cur.interfaceCount, 0),
            }
          })
        parsedDataRef.current = parsedData
        renderChart(parsedData)
      })
    },
    { manual: true, debounceInterval: 200 }
  )

  useEffect(() => {
    const str = { day: 'YYYY-MM-DD', month: 'YYYY-MM', year: 'YYYY' }[statisticType]
    getList(statisticType, {
      startDate: statisticRange[0].format(str),
      endDate: statisticRange[1].format(str),
    })
  }, [statisticType, getList, statisticRange])

  const handleChangeChecked = (v) => {
    setCheckedList(v)
  }

  useEffect(() => {
    renderChart(parsedDataRef.current)
  }, [checkedList, renderChart])

  const [defaultApi, setDefaultApi] = useState(null)
  const handleListChange = (list) => {
    setDefaultApi(list[0])
  }

  return (
    <div style={{ background: 'var(--content-section-bg-color)' }}>
      <div className={'bg-white'}>
        <div className={'common-section-head'}>API接口</div>
        <div className={'px-12 py-5'}>
          <div className={'grid grid-cols-7 gap-10 gap-x-20'}>
            {apiStatistic.map((item) => (
              <div className={'text-left'} key={item[0]}>
                <div className={'text-sm whitespace-nowrap'} style={{ color: 'rgba(0,0,0,0.65)' }}>
                  {item[1]}
                </div>
                <div className={'font-medium'} style={{ fontSize: 30 }}>
                  {apiStatisticResult[item[0]] || 0}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white mt-4">
        <div className={'common-section-head'}>
          <div className={'flex justify-between'}>
            <span>API调用情况</span>
            <div>
              <Input.Group compact>
                <Select value={statisticType} onChange={handleStatisticTypeChange}>
                  <Select.Option value="day">按日统计</Select.Option>
                  <Select.Option value="month">按月统计</Select.Option>
                  <Select.Option value="year">按年统计</Select.Option>
                </Select>

                <StyledDateRangePicker
                  allowClear={false}
                  value={statisticRange}
                  onChange={(v) => setStatisticRange(v)}
                  picker={statisticType}
                  disabledDate={(currentDate) => {
                    return currentDate.valueOf() > moment().valueOf()
                  }}
                />
              </Input.Group>
            </div>
          </div>
        </div>
        <div className={'px-12 py-5'}>
          <div className={'flex items-start mb-2'}>
            <span className={'flex-none'}>API选项：</span>
            <div className={'flex-1'}>
              <Checkbox.Group options={apiOptions} value={checkedList} onChange={(v) => handleChangeChecked(v)} />
            </div>
          </div>

          <EChartsReactCore option={chart1Option} notMerge={true} echarts={echarts} style={{ height: 320 }} />
        </div>
      </div>

      <ApiCharts onGetListSuccess={handleListChange} />

      <DetailTable defaultApi={defaultApi} />
    </div>
  )
}

export default Overview
