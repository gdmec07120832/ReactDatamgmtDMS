import React, { useEffect, useRef, useState } from 'react'
import axios from '../../../utils/axios'
import numeral from 'numeral'
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons'
import EChartsReactCore from 'echarts-for-react/lib/core'
import * as echarts from 'echarts'
import { Button, Input, Select } from 'antd'
import ScheduleTable from './ScheduleTable'
import moment from 'moment'
import styled from 'styled-components'
import StyledDateRangePicker from '../../../components/StyledDateRangePicker'
import { OVERVIEW_STATUS_LIST, ICON_MAP, STATUS } from '../../SchedulingCenter/Index/constants'
import { useStatisticCounts } from '../../SchedulingCenter/Index/hooks'

const GridItem = styled.div.attrs(({ active }) => ({
  className: `hover:bg-gray-50 ${
    active ? 'bg-gray-50 ' : ''
  }border-gray-200 border-solid border p-6 select-none cursor-pointer`,
}))`
  &:first-child {
    border-top-left-radius: 4px;
  }
  &:nth-child(3) {
    border-top-right-radius: 4px;
  }
  &:last-child {
    border-bottom-right-radius: 4px;
  }
  &:nth-child(4) {
    border-bottom-left-radius: 4px;
  }
  border-right-width: 0;
  &:nth-child(3n) {
    border-right-width: 1px;
  }
  border-bottom-width: 0;
  &:nth-child(4),&:nth-child(5),&:nth-child(6) {
    border-bottom-width: 1px;
  }
`

const Arrow = (props) => {
  const { value } = props
  if (value > 0) {
    return <ArrowUpOutlined className={'ml-1'} style={{ color: 'red' }} />
  } else if (value < 0) {
    return <ArrowDownOutlined className={'ml-1'} style={{ color: 'green' }} />
  } else {
    return null
  }
}

const sourceTypes = [
  ['NP', '新平台'],
  ['SCM', 'SCM'],
  ['ZD', '4PL'],
  ['FI', '财务中台'],
  ['OA', 'OA'],
  ['OTHER', '其他'],
]

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
function OverviewV2() {
  const chartRef = useRef(null)
  const [apiStatisticResult, setApiStatisticResult] = useState({})

  useEffect(() => {
    axios.get('/bi-metadata/api/admin/overview/getAPI').then(({ data: [ret] }) => {
      setApiStatisticResult(ret)
    })
  }, [])

  const [sourceData, setSourceData] = useState({})
  useEffect(() => {
    axios.get('/bi-metadata/api/user/overview/getSourceData').then(({ data: [ret] }) => {
      setSourceData(ret)
    })
  }, [])

  const [chartOption, setChartOption] = useState({
    legend: {},
    color: ['#74a0fa', '#f6c73a'],
    grid: {
      top: 30,
      left: 0,
      right: 0,
      bottom: 0,
      containLabel: true,
    },
    tooltip: {
      trigger: 'axis',
    },
    xAxis: {
      axisTick: {
        alignWithLabel: true,
      },
      data: Array.from({ length: 31 }, (item, index) => {
        return moment()
          .subtract(30 - index, 'days')
          .format('YYYY-MM-DD')
      }),
    },
    yAxis: [
      {
        splitLine: {
          show: true,
          lineStyle: {
            type: 'dashed'
          }
        },
        scale: true,
      },
      {
        splitLine: {
          show: false,
        },
      },
    ],
    series: [
      {
        type: 'line',
        name: '表数量（个）',
        z: 10,
        data: [],
      },
      {
        type: 'line',
        yAxisIndex: 1,
        name: '表体积（T）',
        data: [],
      },
    ],
  })

  const [currentSource, setCurrentSource] = useState(null)

  const [statisticType, setStatisticType] = useState('2')
  const [statisticRange, setStatisticRange] = useState([moment().subtract(30, 'days'), moment()])
  const [chartSourceData, setChartSourceData] = useState([])

  const [chartLoading, setChartLoading] = useState(false)

  useEffect(() => {
    let url
    if (statisticType === '1') {
      // 按月
      url = '/bi-metadata/api/user/overview/getSourceCnt'
    } else {
      // 按日
      url = '/bi-metadata/api/user/overview/getSourceCntDay'
    }
    const [_startDate, _endDate] = statisticRange || []
    const startDate = _startDate.format(statisticType === '1' ? 'YYYY-MM' : 'YYYY-MM-DD')
    const endDate = _endDate.format(statisticType === '1' ? 'YYYY-MM' : 'YYYY-MM-DD')
    setChartLoading(true)
    axios
      .get(url, {
        params: {
          startDate,
          endDate,
        },
      })
      .then(({ data }) => {
        /**
         * @property MDATE {string} 日期
         */
        const dates = data.map((item) => {
          return item.MDATE
        })

        setChartOption((prev) => {
          return {
            ...prev,
            xAxis: {
              ...prev.xAxis,
              data: dates,
            },
          }
        })
        const _data = data.map((item) => {
          const totalCnt = sourceTypes.reduce((acc, cur) => {
            return acc + (item[`${cur[0]}_TABLE_CNT`] || 0)
          }, 0)
          const totalVolume = sourceTypes.reduce((acc, cur) => {
            return acc + (item[`${cur[0]}_TABLE_VOLUME_T`] || 0)
          }, 0)
          return {
            ...item,
            TOTAL_TABLE_CNT: totalCnt,
            TOTAL_TABLE_VOLUME_T: totalVolume,
          }
        })
        chartRef.current?.getEchartsInstance()?.clear()
        setChartSourceData(_data)
      })
      .finally(() => {
        setChartLoading(false)
      })
  }, [statisticType, statisticRange])

  useEffect(() => {
    const currentShow = currentSource ? currentSource : 'TOTAL'
    setChartOption((prev) => {
      return {
        ...prev,
        key: Math.random(),
        series: [
          {
            ...prev.series[0],
            data: chartSourceData.map((item) => {
              return item[`${currentShow}_TABLE_CNT`]
            }),
          },
          {
            ...prev.series[1],
            data: chartSourceData.map((item) => {
              return (item[`${currentShow}_TABLE_VOLUME_T`] || 0).toFixed(2)
            }),
          },
        ],
      }
    })
  }, [chartSourceData, currentSource])

  const handleStatisticTypeChange = (v) => {
    setStatisticType(v)
    if (v === '1') {
      setStatisticRange([moment().subtract(12, 'month'), moment()])
    } else {
      setStatisticRange([moment().subtract(30, 'day'), moment()])
    }
  }

  const { statisticCounts, getStatistic } = useStatisticCounts()

  return (
    <div style={{ background: '#f0f2f5' }}>
      <div className={'bg-white'}>
        <div className={'common-section-head'}>
          <div className={'flex justify-between'}>
            <span>数据源概览</span>
            <div className={'mr-4'}>
              {currentSource && (
                <Button type={'link'} size={'small'} onClick={() => setCurrentSource(null)}>
                  清除所选
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className={'px-8 py-6'}>
          <div className={'grid grid-cols-3'}>
            {sourceTypes.map((item) => (
              <GridItem key={item[0]} active={item[0] === currentSource} onClick={() => setCurrentSource(item[0])}>
                <div className={'mb-0.5'} style={{ color: 'rgba(0,0,0, .64)' }}>
                  {item[1]}
                </div>
                <div className={'flex justify-between'}>
                  <div className={'flex-1'}>
                    <div className={'py-1'}>
                      <span className={'text-2xl font-medium'}>{sourceData[`${item[0]}_TABLE_CNT`] || 0}</span>个
                    </div>
                    <div className={'flex justify-start'}>
                      <span className={'text-xs text-gray-400 mr-2'}>较昨日</span>
                      <span className={'font-medium flex justify-start align-top'}>
                        {sourceData[`${item[0]}_TABLE_ADD_CNT`] || 0}
                        <Arrow value={sourceData[`${item[0]}_TABLE_ADD_CNT`]} />
                      </span>
                    </div>
                  </div>
                  <div className={'flex-1'}>
                    <div className={'py-1'}>
                      <span className={'text-2xl font-medium'}>
                        {numeral(sourceData[`${item[0]}_TABLE_VOLUME_T`]).format('0.00')}
                      </span>
                      T
                    </div>
                    <div className={'flex justify-start'}>
                      <span className={'text-xs text-gray-400 mr-2'}>较昨日</span>
                      <span className={'font-medium flex justify-start align-top'}>
                        {numeral(sourceData[`${item[0]}_TABLE_ADD_VOLUME_RATE`]).format('0.00')}
                        <Arrow value={sourceData[`${item[0]}_TABLE_ADD_VOLUME_RATE`]} />
                      </span>
                    </div>
                  </div>
                </div>
              </GridItem>
            ))}
          </div>
        </div>

        <div className={'pb-4 px-8'}>
          <div className={'flex justify-between'}>
            <div className={'flex justify-start items-baseline'}>
              <div className={'mr-2 font-medium'} style={{ color: '#333' }}>
                数据量趋势
              </div>
              <div className={'text-xs text-gray-400'}>抽取各个业务系统表数量</div>
            </div>
            <div>
              <Input.Group compact>
                <Select value={statisticType} onChange={handleStatisticTypeChange}>
                  <Select.Option value="2">按日统计</Select.Option>
                  <Select.Option value="1">按月统计</Select.Option>
                </Select>

                <StyledDateRangePicker
                  allowClear={false}
                  value={statisticRange}
                  onChange={(v) => setStatisticRange(v)}
                  picker={statisticType === '1' ? 'month' : undefined}
                  disabledDate={(currentDate) => {
                    return currentDate.valueOf() > moment().valueOf()
                  }}
                />
              </Input.Group>
            </div>
          </div>

          <EChartsReactCore
            ref={chartRef}
            option={chartOption}
            echarts={echarts}
            style={{ height: 300 }}
            showLoading={chartLoading}
          />
        </div>
      </div>

      <div className={'bg-white mt-4'}>
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

      <div className={'bg-white mt-4'}>
        <div className={'common-section-head'}>作业调度</div>
        <div className={'grid grid-cols-7 gap-x-4 p-6 bg-white'}>
          {OVERVIEW_STATUS_LIST.map((key) => {
            return (
              <div key={key} className={'relative flex justify-start items-start px-4 py-2.5'} style={{ background: '#f7f8f9' }}>
                <div className={'absolute'}>
                  <img
                    width={20}
                    style={{ height: 20, WebkitUserDrag: 'none' }}
                    className={'object-contain'}
                    src={ICON_MAP[key]}
                    alt="icon"
                  />
                </div>
                <div className={'flex-1 text-center'}>
                  <div style={{ color: '#848484' }}>{STATUS[key]}</div>
                  <div
                    className={'text-2xl pt-2'}
                    style={{
                      color: { TODAY_FAILED: '#0CBE0F', TODAY_SUCCESS: '#FF382C', TODAY_OVERTIME: '#EBA418' }[key],
                    }}>
                    {numeral(statisticCounts[key] || 0).format('0,0')}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <div className={'px-8 pb-4'}>
          <div style={{ color: '#333' }} className={'font-medium'}>
            分组调度情况
          </div>
          <ScheduleTable getStatistic={getStatistic} />
        </div>{' '}
      </div>
    </div>
  )
}

export default OverviewV2
