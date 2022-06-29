import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Button, Checkbox, DatePicker, Table} from 'antd';
import moment from 'moment';
import axios from '../../../../utils/axios';
import EChartsReactCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import echartsLoadingOption from '../../../../utils/echartsLoadingOption';
import styled from 'styled-components';
import {useRequest} from 'ahooks';
import useTable from '../../../../hooks/useTable';
import DraggableModal from '../../../../components/DraggableModal';
import OverflowTooltip from '../../../../components/OverflowTooltip';
import numeral from 'numeral';
import {keyBy} from 'lodash';
import groupBy from 'lodash/groupBy';

function formatterTooltip(params, format='0,0', rto) {
  const name = params[0].name
  const month = name.replace('-', '')
  const releaseTypeRto = rto[month]
  const rows = params
      .map((item) => {
        return `<div style="display: flex; width: 320px; line-height: 1.8">
                      <div style="flex: 0">${item.marker.replace(/border-radius:10px/, 'margin-right: 5px')}${item.seriesName}</div>
                    <div style="flex: 1; text-align: right; font-size: 12px">
                                        <span style="font-size: 14px">${numeral((item.value)).format(format).replace(/\.0+$/, '')}</span>
                                        （常规:<span style="display: inline-block; width: 20px">${releaseTypeRto[item.seriesName]?.cnt1 || 0}</span> 
                                        <span style="display: inline-block; width: 10px"></span>
                                        紧急:<span style="display: inline-block; width: 20px">${releaseTypeRto[item.seriesName]?.cnt2 || 0}</span>）
                    </div>
                  </div>`
      })
      .join('')
  const total = params.reduce((acc, cur) => {
    return acc + cur.value
  }, 0)
  const totalHtml = `<div style="display: flex; width: 320px; line-height: 1.8">
                                <div style="flex: 0">合计</div>
                                <div style="flex: 1; text-align: right; font-size: 12px">
                                            <span style="font-size: 14px">${numeral(total).format(format).replace(/\.0+$/, '')}</span>
                                             （常规:<span style="display: inline-block; width: 20px">${releaseTypeRto['__total__']?.cnt1 || 0}</span> 
                                        <span style="display: inline-block; width: 10px"></span>
                                        紧急:<span style="display: inline-block; width: 20px">${releaseTypeRto['__total__']?.cnt2 || 0}</span>）
                                </div></div>`
  return `${name}${rows}${totalHtml}`
}


const colors = ['#80d1f3', '#f984b3', '#f9c73c', '#8696b7', '#89e4d6', '#75a0f9', '#9489fa', '#71c16f']

const releaseLevelList = ['常规发版', '紧急发版']

const StyledTable = styled(Table)`
  .ant-table-thead th {
    font-weight: normal !important;
    background-color: #f6f3f7 !important;
    padding-top: 12px !important;
    padding-bottom: 12px !important;
    font-size: 15px;
    color: rgba(0, 0, 0, .85);
  }
`

const DetailModal = (props) => {
  const {currentDetail, setCurrentDetail} = props
  const close = () => {
    setCurrentDetail(null)
  }
  useEffect(() => {
  }, [currentDetail])
  const classes = {
    infoItem: 'flex justify-start items-start pt-1 pb-2',
    divideDash: 'border border-b border-dashed mt-4 mb-2',
  }
  return <DraggableModal width={960}
                         bodyStyle={{maxHeight: 640, overflowY: 'auto'}}
                         destroyOnClose
                         footer={[
                           <Button key={'back'} onClick={close}>
                             返回
                           </Button>,
                         ]}
                         title={'详情'}
                         visible={!!currentDetail}
                         onCancel={close}>
    <div style={{ marginTop: -10 }}>
      <div className={'mb-4'} style={{ color: 'rgba(0,0,0,.65)' }}>
        <div className={'font-bold text-sm pb-2'} style={{ color: 'rgba(0,0,0,.88)' }}>
          基本信息
        </div>
        <div className={'grid grid-cols-2 gap-x-8'}>
          <div className={classes.infoItem}>
            <span className={'flex-none'}>所在部门：</span>
            <span className={'flex-1'}>
                <OverflowTooltip>{currentDetail?.DEPARTMENT}</OverflowTooltip>
              </span>
          </div>
          <div className={classes.infoItem}>
            <span className={'flex-none'}>所属系统：</span>
            <span className={'flex-1'}>
                <OverflowTooltip>{currentDetail?.sysName}</OverflowTooltip>
              </span>
          </div>

        </div>
      </div>
      <div className={classes.divideDash} style={{ color: 'rgba(217,217,217)' }} />
      <div className={'mb-4'} style={{ color: 'rgba(0,0,0,.65)' }}>
        <div className={'font-bold text-sm pb-2'} style={{ color: 'rgba(0,0,0,.88)' }}>
          申请信息
        </div>
        <div className={'grid grid-cols-2 gap-x-8'}>
          <div className={classes.infoItem}>
            <span className={'flex-none'}>申请标题：</span>
            <span className={'flex-1'}>
                <OverflowTooltip>{currentDetail?.TITLE}</OverflowTooltip>
              </span>
          </div>
          <div className={classes.infoItem}>
            <span className={'flex-none'}>申请时间：</span>
            <span className={'flex-1'}>
                <OverflowTooltip>{currentDetail?.APPLYDT ? moment(currentDetail?.APPLYDT).format('YYYY-MM-DD HH:mm:ss') : '--'}</OverflowTooltip>
              </span>
          </div>
          <div className={classes.infoItem}>
            <span className={'flex-none'}>申请人岗位：</span>
            <span className={'flex-1'}>
                <OverflowTooltip>{currentDetail?.POSITION}</OverflowTooltip>
              </span>
          </div>
        </div>
      </div>
      <div className={classes.divideDash} style={{ color: 'rgba(217,217,217)' }} />
      <div className={'mb-4'} style={{ color: 'rgba(0,0,0,.65)' }}>
        <div className={'font-bold text-sm pb-2'} style={{ color: 'rgba(0,0,0,.88)' }}>
          发布信息
        </div>
        <div className={'grid grid-cols-2 gap-x-8'}>
          <div className={classes.infoItem}>
            <span className={'flex-none'}>发布主题：</span>
            <span className={'flex-1'}>
                <OverflowTooltip>{currentDetail?.SUBJECT}</OverflowTooltip>
              </span>
          </div>
          <div className={classes.infoItem}>
            <span className={'flex-none'}>发布类型：</span>
            <span className={'flex-1'}>
                <OverflowTooltip>{currentDetail?.releaseType}</OverflowTooltip>
              </span>
          </div>
          <div className={classes.infoItem}>
            <span className={'flex-none'}>发布时间：</span>
            <span className={'flex-1'}>
                <OverflowTooltip>{currentDetail?.publish_date ? moment(currentDetail?.publish_date).format('YYYY-MM-DD') : '--'}</OverflowTooltip>
              </span>
          </div>
        </div>
        <div className={'grid grid-cols-1'}>
          <div className={classes.infoItem}>
            <span className={'flex-none'}>发布详情：</span>
            <span className={'flex-1 whitespace-pre-wrap'}
                  dangerouslySetInnerHTML={{ __html: currentDetail?.PUBLISH_DETAIL }}>

              </span>
          </div>
        </div>
      </div>
    </div>
  </DraggableModal>
}

const ListTable = (props) => {
  const {year, sysNames, releaseTypes, filterMonth} = props
  const {table, setTable} = useTable({
    scroll: {x: 1300},
    pagination: {
      total: 0,
      pageSize: 10,
      current: 1,
      pageSizeOptions: [10],
      size: 'default',
      showTotal: (total) => `共${total}条记录`,
      hideOnSinglePage: true,
    },
    rowKey: (row) => String(row.NO),
    columns: [
      {dataIndex: 'DEPARTMENT', title: '所在部门',},
      {dataIndex: 'sysName', title: '所属应用系统',},
      {dataIndex: 'SUBJECT', title: '发布主题'},
      {dataIndex: 'releaseType', title: '发布类型',},
      {dataIndex: 'publish_date', title: '发布日期', render: (v) => moment(v).format('YYYY-MM-DD')},
      {
        dataIndex: 'actions', title: '操作', render(text, row) {
          return (
              <span className={'cursor-pointer text-blue-500'} onClick={() => checkDetail(row)}>
              查看详情
            </span>
          )
        },
      }
    ],
  })

  const {current: page, pageSize} = table.pagination
  const {run: getList, loading} = useRequest(
      () => {
        if (!sysNames?.length || !releaseTypes.length) {
          setTable((prevState) => ({
            ...prevState,
            dataSource: [],
            pagination: {
              ...prevState.pagination,
              total: 0,
            },
          }))
          return Promise.resolve()
        }
        return axios
            .get('/bi-sys/api/user/systemMonitor/getReleaseTheDetail', {
              params: {
                page,
                pageSize,
                year: year.year(),
                sysNames: (sysNames || []).join(','),
                releaseTypes: (releaseTypes || []).join(','),
                month: filterMonth ? moment(filterMonth).format('MM') : undefined
              },
            })
            .then(({data: {list, totalRows: total}}) => {
              setTable((prevState) => ({
                ...prevState,
                dataSource: list,
                pagination: {
                  ...prevState.pagination,
                  total,
                },
              }))
            })
      },
      {manual: true, debounceInterval: 200}
  )


  const [currentDetail, setCurrentDetail] = useState(null)
  const checkDetail = (row) => {
    setCurrentDetail(row)
  }

  useEffect(() => {
    getList()
  }, [getList, page, pageSize])

  useEffect(() => {
    setTable(prevState => ({...prevState, pagination: {...prevState.pagination, current: 1}}))
    getList()
  }, [year, sysNames, releaseTypes, filterMonth, getList, setTable])

  return <div>
    <StyledTable {...props} {...table} loading={loading}/>
    <DetailModal currentDetail={currentDetail} setCurrentDetail={setCurrentDetail}/>
  </div>
}


function ReleaseStat() {
  const [selectYear, setSelectYear] = useState(moment())
  const onYearChange = (y) => {
    setSelectYear(y)
  }

  const [sysIndeterminate, setSysIndeterminate] = useState(false)
  const [sysCheckedList, setSysCheckedList] = useState([])
  const [sysCheckAll, setSysCheckAll] = useState(true)
  const [sysNameList, setSysNameList] = useState([])


  const [releaseIndeterminate, setReleaseIndeterminate] = useState(false)
  const [releaseCheckedList, setReleaseCheckedList] = useState(['常规发版', '紧急发版'])
  const [releaseCheckAll, setReleaseCheckAll] = useState(true)

  const [allData, setAllData] = useState([])

  useEffect(() => {
    axios.get('/bi-sys/api/user/systemMonitor/getReleaseStatisticsSystemType').then(({data}) => {
      const list = data.map((item) => item.sysName)
      setSysNameList(list)
      setSysCheckedList(list)
    })
  }, [])

  const onSysChange = (list) => {
    setSysCheckedList(list)
    setSysIndeterminate(!!list.length && list.length < sysNameList.length)
    setSysCheckAll(list.length === sysNameList.length)
  }

  const onSysCheckAllChange = (e) => {
    setSysCheckedList(e.target.checked ? sysNameList : [])
    setSysIndeterminate(false)
    setSysCheckAll(e.target.checked)
  }

  const onReleaseChange = (list) => {
    setReleaseCheckedList(list)
    setReleaseIndeterminate(!!list.length && list.length < releaseLevelList.length)
    setReleaseCheckAll(list.length === releaseLevelList.length)
  }

  const onReleaseCheckAllChange = (e) => {
    setReleaseCheckedList(e.target.checked ? releaseLevelList : [])
    setReleaseIndeterminate(false)
    setReleaseCheckAll(e.target.checked)
  }

  const releaseTypeRto = useRef({})
  const [chart1Option, setChart1Option] = useState({
    tooltip: {
      trigger: 'axis',
      appendToBody: true,
      extraCssText: 'z-index: 999',
      axisPointer: {
        type: 'shadow',
      },
      formatter(params) {
        return formatterTooltip(params, '0,0', releaseTypeRto.current)
      },
    },
    legend: {
      left: 'center',
      bottom: 0,
      icon: 'rect',
      itemWidth: 12,
      itemHeight: 12,
      data: [],
    },
    grid: {
      top: 20,
      bottom: 30,
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
      splitLine: {
        lineStyle: {
          type: 'line',
        },
      },
    },
    series: [],
  })

  const setOptions = useCallback(() => {
    setChart1Option((prev) => {
      const series = sysCheckedList.map((item) => {
        return {
          type: 'bar',
          color: colors[sysNameList.indexOf(item)],
          barWidth: 32,
          stack: '事故数',
          name: item,
          data: allData.map((_) => {
            const theItem = _.items.filter((n) => n['sysName'] === item)
            return theItem.length ? theItem.reduce((acc, cur) => acc + cur['cnt'], 0) : 0
          }),
        }
      })
      return {
        ...prev,
        xAxis: {
          ...prev.xAxis,
          data: allData.map((_) => _['mDate'].slice(0, 4) + '-' + _['mDate'].slice(4)),
        },
        legend: {
          ...prev.legend,
          data: sysCheckedList,
        },
        series,
      }
    })
  }, [sysCheckedList, allData, sysNameList])

  useEffect(() => {
    setTimeout(() => {
      if (!sysCheckedList.length || !releaseCheckedList.length) {
        setAllData([])
        return
      }
      axios
          .get('/bi-sys/api/admin/systemMonitor/getReleaseStatistics', {
            params: {
              year: selectYear.year(),
              sysNames: sysCheckedList.join(','),
              releaseTypes: releaseCheckedList.join(','),
            },
          })
          .then(({data}) => {
            const months = Array.from(new Set(data.map((_) => _['mDate']))).sort((a, b) => a - b)
            const ret = months.map((mDate) => {
              return {
                mDate,
                items: data.filter((_) => _['mDate'] === mDate),
              }
            })

            const groupByMonth = groupBy(data, 'mDate')

            const rto = Object.keys(groupByMonth).reduce((acc, month) => {
              const items = groupByMonth[month]
              // const totalCnt = items.reduce((acc, cur) => acc + cur.cnt, 0)
              const normalCnt = items.filter(item => item['releaseType'] === '常规发版').reduce((acc, cur) => acc + cur.cnt, 0)
              const emergencyCnt = items.filter(item => item['releaseType'] === '紧急发版').reduce((acc, cur) => acc + cur.cnt, 0)
              acc[month] = {
                ...keyBy(items, 'sysName'),
                __total__: {
                  cnt1: normalCnt,
                  cnt2: emergencyCnt
                }
              }
              return acc
            }, {})
            releaseTypeRto.current = rto
            setAllData(ret)
          })
    }, 300)
  }, [selectYear, sysCheckedList, releaseCheckedList])

  useEffect(() => {
    setOptions()
  }, [setOptions])


  const [filterMonth, setFilterMonth] = useState()
  const onChartClick = useCallback((param, echarts) => {
    console.log(param, echarts)
    const {name} = param
    setFilterMonth(name)
  }, [setFilterMonth])

  return (
      <div>
        <div className={'common-section-head'}>中心各系统发布统计</div>
        <div className={'px-8 pt-4'}>
          <div className={'flex justify-between items-start mb-1'}>
            <div>
              <div className={'flex justify-start mb-2'}>
                <span className={'mr-2 w-20'}>所属系统：</span>
                <Checkbox className={'mr-4'} indeterminate={sysIndeterminate} onChange={onSysCheckAllChange}
                          checked={sysCheckAll}>
                  全部
                </Checkbox>
                <Checkbox.Group options={sysNameList} value={sysCheckedList} onChange={onSysChange}/>
              </div>

              <div className={'flex justify-start mb-2'}>
                <span className={'mr-2 w-20'}>发布类型：</span>
                <Checkbox className={'mr-4'} indeterminate={releaseIndeterminate} onChange={onReleaseCheckAllChange}
                          checked={releaseCheckAll}>
                  全部
                </Checkbox>
                <Checkbox.Group options={releaseLevelList} value={releaseCheckedList} onChange={onReleaseChange}/>
              </div>
            </div>
            <div className={'flex-none'}>
              <DatePicker
                  disabledDate={(date) => date.year() > moment().year()}
                  format={'YYYY年'}
                  picker={'year'}
                  value={selectYear}
                  onChange={onYearChange}
                  allowClear={false}
                  style={{width: 100}}
              />
            </div>
          </div>

          <div>
            <EChartsReactCore
                notMerge={true}
                onEvents={{
                  click: onChartClick,
                }}
                echarts={echarts}
                option={chart1Option}
                loadingOption={echartsLoadingOption}
                style={{height: 300}}
            />
          </div>

          {
            filterMonth ?
                <div className={'h-6'}>
                  以下为{filterMonth}的数据：<Button size={'small'} type={'link'}
                                              onClick={() => setFilterMonth(null)}>重置</Button>
                </div> : <div className={'h-6'}/>
          }
          <ListTable
              className={'mt-2 pb-6'}
              year={selectYear}
              filterMonth={filterMonth}
              sysNames={sysCheckedList}
              releaseTypes={releaseCheckedList}
          />
        </div>
      </div>
  );
}

export default ReleaseStat;