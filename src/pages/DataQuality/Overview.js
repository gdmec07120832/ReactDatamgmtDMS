import React, { useEffect, useState } from 'react'
import cloneDeep from 'lodash/cloneDeep'
import { Empty, Input, Pagination, Select } from 'antd'
import '../../assets/styles/os-theme-thick-dark.css'

import EChartsReactCore from 'echarts-for-react/lib/core'
import * as echarts from 'echarts/core'
import styles from './overview.module.less'
import echartsLoadingOption from '../../utils/echartsLoadingOption'
import OverflowTooltip from '../../components/OverflowTooltip'
import axios from '../../utils/axios'
import { useHistory } from 'react-router-dom'
import Search from 'antd/es/input/Search'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'
import classNames from 'classnames'

function Overview() {
  const [chart1Option, setChart1Option] = useState({
    legend: {
      top: 15,
      left: 20,
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
    tooltip: {
      show: true,
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    grid: {
      top: 50,
      bottom: 12,
      left: 20,
      right: 20,
      containLabel: true,
    },
    xAxis: {
      type: "category",
      axisLine: {
        lineStyle: {
          width: 0,
        },
      },
      axisLabel: {
        interval: 0,
        formatter: (text) => {
          return text.length > 6 ? text.slice(0, 6) + '...' : text
        },
      },
      axisTick: {
        show: false,
      },
      data: [],
    },
    yAxis: {
      type: "value",
      splitLine: {
        lineStyle: {
          type: 'dashed',
        },
      },
    },
    series: [
      {
        name: '规则总数',
        itemStyle: {
          color: '#73A0FA',
        },
        type: 'bar',
        barWidth: 20,
        data: [],
      },
      {
        name: '校验失败数',
        itemStyle: {
          color: '#FAC858',
        },
        type: 'bar',
        barGap: 0,
        barWidth: 20,
        data: [],
      },
    ],
    dataZoom: [
      {
        type: 'inside',
        startValue: 0,
        endValue: 7,
        zoomLock: true,
      },
    ],
  })

  const [chart2Option, setChart2Option] = useState({
    color: ['#7585A2', '#73A0FA', '#FAC858'],
    tooltip: {
      show: true,
      trigger: 'item',
    },
    legend: [
      {
        bottom: 10,
        left: 'center',
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
      {
        icon: 'circle',
        selectedMode: false,
        itemGap: 20,
        orient: 'vertical',
        top: '20%',
        left: '60%',
        formatter: function (name) {
          return name
        },
      },
    ],
    grid: {
      top: 0,
      bottom: 40,
      left: 0,
      right: 0,
      containLabel: true,
    },
    series: [
      {
        name: '方案得分分布',
        type: 'pie',
        roseType: 'radius',
        center: ['30%', '40%'],
        label: {
          show: false,
          position: 'center',
        },
        labelLine: {
          show: false,
        },
        radius: ['30%', '50%'],
        data: [],
      },
    ],
  })

  const [chart3Option, setChart3Option] = useState({
    color: ['#7585A2', '#73A0FA', '#FAC858'],
    tooltip: {
      show: true,
      trigger: 'item',
    },
    legend: [
      {
        bottom: 10,
        left: 'center',
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
      {
        icon: 'circle',
        selectedMode: false,
        itemGap: 20,
        orient: 'vertical',
        top: '20%',
        left: '60%',
        formatter: function (name) {
          return name
        },
      },
    ],
    grid: {
      top: 0,
      bottom: 40,
      left: 0,
      right: 0,
      containLabel: true,
    },
    series: [
      {
        name: '规则严重等级分布',
        type: 'pie',
        roseType: 'radius',
        center: ['30%', '40%'],
        label: {
          show: false,
          position: 'center',
        },
        labelLine: {
          show: false,
        },
        radius: ['30%', '50%'],
        data: [],
      },
    ],
  })
  const [query, setQuery] = useState({
    schemeName: '',
    businessModeId: undefined,
  })

  const [basicInfo, setBasicInfo] = useState({})

  const [rankList, setRankList] = useState([])
  const [bizModeList, setBizModeList] = useState([])
  useEffect(() => {
    axios.get('/bi-data-quality/api/user/businessMode/findAllInfoAndRuleTotalCountSort').then(({ data }) => {
      setBizModeList(data)
    })
  }, [])
  useEffect(() => {
    axios.get('/bi-data-quality/api/user/home/selectSchemeImplementationWeekRank').then(({ data }) => {
      setRankList(
        data.map((_, i) => {
          return {
            ..._,
            _rank: i + 1,
          }
        })
      )
    })
  }, [])
  useEffect(() => {
    axios
      .get('/bi-data-quality/api/user/home/selectSchemeImplementation', {
        params: {
          businessModeId: query.businessModeId,
          schemeName: query.schemeName,
        },
      })
      .then(({ data }) => {
        setChart1Option((prevState) => {
          const newOption = cloneDeep(prevState)
          newOption.dataZoom[0].startValue = 0
          newOption.dataZoom[0].endValue = 7
          newOption.xAxis.data = data.map((_) => _['schemeName'])
          newOption.series[0].data = data.map((_) => _['totalCount'])
          newOption.series[1].data = data.map((_) => _['failureCount'])
          return newOption
        })
      })
  }, [query.businessModeId, query.schemeName])

  const handleChartSlide = (val) => {
    setChart1Option(prevState => {
      const newOption = cloneDeep(prevState)
      newOption.dataZoom[0].startValue = newOption.dataZoom[0].startValue + val
      newOption.dataZoom[0].endValue = newOption.dataZoom[0].endValue + val
      return newOption
    })
  }

  useEffect(() => {
    axios.get('/bi-data-quality/api/user/home/getHomeStatistics').then(({ data }) => {
      setBasicInfo(data)
    })

    axios.get('/bi-data-quality/api/user/home/selectSchemeScoreDistributionAreaWeek').then(({ data }) => {
      setChart2Option((prevState) => {
        const newOption = cloneDeep(prevState)
        newOption.series[0].data = data.map((_) => ({ value: _['num'], name: _['rank'] }))
        newOption.legend[1].formatter = function (name) {
          const item = data.find((_) => _['rank'] === name)
          return `${name}    ${item['num']}`
        }
        return newOption
      })
    })
    axios.get('/bi-data-quality/api/user/home/selectRulePLDistributionArea').then(({ data }) => {
      setChart3Option((prevState) => {
        const newOption = cloneDeep(prevState)
        newOption.series[0].data = data.map((_) => ({ value: _['num'], name: _['rank'] }))
        newOption.legend[1].formatter = function (name) {
          const item = data.find((_) => _['rank'] === name)
          return `${name}    ${item['num']}`
        }
        return newOption
      })
    })
  }, [])
  const onChartReady = (echarts) => {
    setTimeout(() => {
      echarts.hideLoading()
    }, 1000)
  }

  const history = useHistory()
  const jumpToList = (status) => {
    history.push(`/dataQuality/plan?status=${status}`)
  }

  const [pageCurrent, setPageCurrent] = useState(1)
  const handlePageChange = (page) => {
    setPageCurrent(page)
  }

  const currentShowRankList = rankList.slice((pageCurrent - 1) * 5, pageCurrent * 5)

  return (
    <div className={styles.overview}>
      <div className={'grid gap-x-4 h-full'} style={{ gridTemplateColumns: '1fr 2fr' }}>
        <div className={'h-full'}>
          <div className={'bg-white mb-4'} style={{ height: 'calc(25% - 12px)' }}>
            <div className={styles.cardHead}>方案调度情况</div>
            <div className="flex justify-between text-center px-5" style={{ height: 'calc(100% - 52px)' }}>
              <div>
                <div className={'text-left'}>
                  <div>运行中</div>
                  <div
                    onClick={() => {
                      jumpToList(0)
                    }}
                    className={`${styles.fontNum} cursor-pointer underline`}
                    style={{
                      color: `#327bf8`,
                    }}>
                    {basicInfo['runningRuleCount'] || 0}
                  </div>
                </div>
              </div>
              <div>
                <div className={'text-left'}>
                  <div>运行成功数</div>
                  <div
                    onClick={() => {
                      jumpToList(1)
                    }}
                    className={`${styles.fontNum} cursor-pointer underline`}
                    style={{
                      color: `#327bf8`,
                    }}>
                    {basicInfo['successRuleCount'] || 0}
                  </div>
                </div>
              </div>
              <div>
                <div className={'text-left'}>
                  <div>运行失败数</div>
                  <div
                    onClick={() => {
                      jumpToList(-1)
                    }}
                    className={`${styles.fontNum} cursor-pointer underline`}
                    style={{
                      color: `#327bf8`,
                    }}>
                    {basicInfo['failureRuleCount'] || 0}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={'bg-white mb-4'} style={{ height: 'calc(25% - 12px)' }}>
            <div className={styles.cardHead}>数据质检情况</div>
            <div className="flex justify-between text-center px-5" style={{ height: 'calc(100% - 52px)' }}>
              <div>
                <div className={'text-left'}>
                  <div>方案数</div>
                  <div className={styles.fontNum}>{basicInfo['activeSchemeCount'] || 0}</div>
                </div>
              </div>
              <div>
                <div className={'text-left'}>
                  <div>规则数</div>
                  <div className={styles.fontNum}>{basicInfo['activeRuleCount'] || 0}</div>
                </div>
              </div>
              <div>
                <div className={'text-left'}>
                  <div>启用规则数</div>
                  <div className={styles.fontNum}>{basicInfo['enableRuleCount'] || 0}</div>
                </div>
              </div>
            </div>
          </div>
          <div className={'bg-white'} style={{ height: 'calc(50% - 8px)' }}>
            <div className={styles.cardHead}>近7天方案执行分数排名</div>
            <div
              className={'w-full px-4 pt-3'}
              style={{ height: rankList.length === 0 ? '100px' : 'calc(100% - 100px)' }}>
              <table className={`${styles.table}`}>
                <thead>
                  <tr>
                    <td width={'40%'}>
                      <OverflowTooltip>方案名</OverflowTooltip>
                    </td>
                    <td width={'30%'} className="text-center">
                      <OverflowTooltip>平均异常数</OverflowTooltip>
                    </td>
                    <td width={'30%'} className="text-center">
                      <OverflowTooltip>近7天平均得分</OverflowTooltip>
                    </td>
                  </tr>
                </thead>
              </table>
              {!!rankList.length && (
                <>
                  <table
                    className={styles.table}
                    style={{ height: `calc((100% - 32px) * ${currentShowRankList.length} / 5)` }}>
                    <tbody>
                      {currentShowRankList.map((item, index) => {
                        return (
                          <tr key={index} style={{ borderBottom: '1px solid #f1f1f1' }}>
                            <td width={'40%'}>
                              <OverflowTooltip title={item['schemeName']}>
                                <div style={{ color: 'rgba(0,0,0, 0.65)', lineHeight: '24px' }}>
                                  <span
                                    style={{ width: 20, height: 20, borderRadius: 20 }}
                                    className={classNames({
                                      [styles.rankTop3]: item._rank < 4,
                                      [styles.rankElse]: item._rank >= 4,
                                    })}>
                                    {item._rank}
                                  </span>{' '}
                                  {item['schemeName']}
                                </div>
                              </OverflowTooltip>
                            </td>
                            <td width={'30%'} className="text-center">
                              {item['errorNumAvgWeek'].toFixed(0)}
                            </td>
                            <td width={'30%'} className="text-center">
                              {item['scoreAvgWeek'].toFixed(0)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  <Pagination
                    current={pageCurrent}
                    onChange={handlePageChange}
                    pageSize={5}
                    total={rankList.length}
                    size={'default'}
                    style={{
                      transform: 'scale(0.88)',
                      transformOrigin: 'right center',
                      float: 'right',
                      padding: '8px 0',
                    }}
                  />
                </>
              )}
            </div>
            {rankList.length === 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
          </div>
        </div>

        <div className={'overflow-hidden h-full'}>
          <div className={'grid grid-cols-2 gap-x-4 mb-4'} style={{ height: 'calc(50% - 8px)' }}>
            <div className={'bg-white h-full overflow-hidden'}>
              <div className={styles.cardHead}>方案得分分布</div>
              {chart2Option.series[0].data.length ? (
                <EChartsReactCore
                  echarts={echarts}
                  option={chart2Option}
                  showLoading={false}
                  loadingOption={echartsLoadingOption}
                  onChartReady={onChartReady}
                  style={{ height: 'calc(100% - 52px)', width: '100%' }}
                />
              ) : (
                <Empty style={{ padding: '20px 0' }} image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </div>
            <div className={'bg-white'}>
              <div className={styles.cardHead}>规则严重等级分布</div>
              {chart3Option.series[0].data.length ? (
                <EChartsReactCore
                  echarts={echarts}
                  option={chart3Option}
                  showLoading={false}
                  loadingOption={echartsLoadingOption}
                  onChartReady={onChartReady}
                  style={{ height: 'calc(100% - 52px)', width: '100%' }}
                />
              ) : (
                <Empty style={{ padding: '20px 0' }} image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </div>
          </div>
          <div className={'bg-white h-full'}>
            <div
              className={'flex justify-between border-0 border-solid border-b border-gray-200'}
              style={{ padding: '10px 24px', height: 52 }}>
              <div className={styles.cardHead2}>方案执行情况</div>
              <div className="flex">
                <Input.Group compact>
                  <Select
                    value={query.businessModeId}
                    onChange={(value) => setQuery((prevState) => ({ ...prevState, businessModeId: value }))}
                    placeholder="业务类型"
                    style={{ flex: '0 0 120px', width: 120 }}
                    allowClear>
                    {bizModeList.map((item) => (
                      <Select.Option value={item.id} key={item.id}>
                        {item['modeName']}
                      </Select.Option>
                    ))}
                  </Select>
                  <Search
                    placeholder="方案名称"
                    allowClear
                    style={{ width: 200 }}
                    onSearch={(value) => setQuery((prevState) => ({ ...prevState, schemeName: value }))}
                  />
                </Input.Group>
              </div>
            </div>
            <OverlayScrollbarsComponent
              options={{
                sizeAutoCapable: false,
                className: 'os-theme-thick-dark',
              }}
              className={styles.chart1Wrapper}
              style={{ width: '100%', height: 'calc(50% - 60px)', overflow: 'auto hidden' }}>
              <div className={'relative'} style={{ width: '100%', height: '100%', minWidth: '100%', overflow: 'hidden' }}>
                {
                  chart1Option.series[0].data.length > 6 &&
                  <div className={'absolute flex space-x-2 right-4 top-4 text-gray-400 z-10'}>
                    {
                      chart1Option.dataZoom[0].startValue > 0 &&
                      <div style={{lineHeight: 1}} onClick={() => {handleChartSlide(-1)}} className={'cursor-pointer p-1 rounded bg-gray-100 hover:bg-gray-200'}>
                      <svg viewBox="64 64 896 896" focusable="false" fill="currentColor"
                           width="18px" height="18px" data-icon="left" aria-hidden="true">
                        <path d="M724 218.3V141c0-6.7-7.7-10.4-12.9-6.3L260.3 486.8a31.86 31.86 0 000 50.3l450.8 352.1c5.3 4.1 12.9.4 12.9-6.3v-77.3c0-4.9-2.3-9.6-6.1-12.6l-360-281 360-281.1c3.8-3 6.1-7.7 6.1-12.6z"/>
                      </svg>
                    </div>
                    }
                    {
                      chart1Option.dataZoom[0].endValue < chart1Option.series[0].data.length - 1 &&
                      <div style={{lineHeight: 1}} onClick={() => {handleChartSlide(1)}} className={'cursor-pointer p-1 rounded bg-gray-100 hover:bg-gray-200'}>
                      <svg viewBox="64 64 896 896" focusable="false" fill="currentColor"
                           width="18px" height="18px" data-icon="right" aria-hidden="true">
                        <path
                            d="M765.7 486.8L314.9 134.7A7.97 7.97 0 00302 141v77.3c0 4.9 2.3 9.6 6.1 12.6l360 281.1-360 281.1c-3.9 3-6.1 7.7-6.1 12.6V883c0 6.7 7.7 10.4 12.9 6.3l450.8-352.1a31.96 31.96 0 000-50.4z">
                        </path>
                      </svg>
                    </div>
                    }
                  </div>
                }
                {chart1Option.series[0].data.length ? (
                  <EChartsReactCore
                    echarts={echarts}
                    option={chart1Option}
                    showLoading={false}
                    loadingOption={echartsLoadingOption}
                    onChartReady={onChartReady}
                    style={{ height: '100%' }}
                  />
                ) : (
                  <Empty style={{ padding: '82px 0' }} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
              </div>
            </OverlayScrollbarsComponent>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Overview
