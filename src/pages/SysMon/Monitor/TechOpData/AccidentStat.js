import React, { useCallback, useEffect, useState } from 'react'
import { Button, Checkbox, DatePicker, Table } from 'antd'
import moment from 'moment'
import EChartsReactCore from 'echarts-for-react/lib/core'
import * as echarts from 'echarts/core'
import echartsLoadingOption from '../../../../utils/echartsLoadingOption'
import formatterTooltip from './formatterTooltip'
import useTable from '../../../../hooks/useTable'
import { makeStyles } from '@material-ui/core/styles'
import classNames from 'classnames'
import axios from '../../../../utils/axios'
import { useRequest } from 'ahooks'
import DraggableModal from '../../../../components/DraggableModal'
import OverflowTooltip from '../../../../components/OverflowTooltip'

const useStyle = makeStyles({
  root: {
    '& .ant-table-thead th': {
      fontWeight: 'normal!important',
      backgroundColor: '#f6f3f7!important',
      paddingTop: '12px!important',
      paddingBottom: '12px!important',
      fontSize: 15,
      color: 'rgba(0, 0, 0, .85)',
    },
  },
})

const DetailModal = (props) => {
  const { currentDetail, setCurrentDetail } = props
  const close = () => {
    setCurrentDetail(null)
  }
  useEffect(() => {}, [currentDetail])
  const classes = {
    infoItem: 'flex justify-start items-start pt-1 pb-2',
    divideDash: 'border border-b border-dashed mt-4 mb-2',
  }

  return (
    <DraggableModal
      width={960}
      bodyStyle={{ maxHeight: 640, overflowY: 'auto' }}
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
                <OverflowTooltip>{currentDetail?.empDept}</OverflowTooltip>
              </span>
            </div>
            <div className={classes.infoItem}>
              <span className={'flex-none'}>故障名称：</span>
              <span className={'flex-1'}>
                <OverflowTooltip>{currentDetail?.faultName}</OverflowTooltip>
              </span>
            </div>
            <div className={classes.infoItem}>
              <span className={'flex-none'}>所属系统：</span>
              <span className={'flex-1'}>
                <OverflowTooltip>{currentDetail?.sysName}</OverflowTooltip>
              </span>
            </div>
            <div className={classes.infoItem}>
              <span className={'flex-none'}>故障时间：</span>
              <span className={'flex-1'}>
                <OverflowTooltip>{currentDetail?.faultStartTime}</OverflowTooltip>
              </span>
            </div>

            <div className={classes.infoItem}>
              <span className={'flex-none'}>故障时长：</span>
              <span className={'flex-1'}>
                <OverflowTooltip>{currentDetail?.faultConsumingTime}（分钟）</OverflowTooltip>
              </span>
            </div>
            <div className={classes.infoItem}>
              <span className={'flex-none'}>故障等级：</span>
              <span className={'flex-1'}>
                <OverflowTooltip>{currentDetail?.faultLevel}</OverflowTooltip>
              </span>
            </div>
            <div className={classes.infoItem}>
              <span className={'flex-none'}>影响故障：</span>
              <span className={'flex-1'}>
                <OverflowTooltip>{currentDetail?.influenceDesc}</OverflowTooltip>
              </span>
            </div>
          </div>
        </div>
        <div className={classes.divideDash} style={{ color: 'rgba(217,217,217)' }} />
        <div className={'mb-2'} style={{ color: 'rgba(0,0,0,.65)' }}>
          <div className={'font-bold text-sm py-2'} style={{ color: 'rgba(0,0,0,.88)' }}>
            事故处理
          </div>
          <div className={'grid grid-cols-2 gap-x-8'}>
            <div className={classes.infoItem}>
              <span className={'flex-none'}>处理单号：</span>
              <span className={'flex-1 text-gray-600'}>{currentDetail?.orderNo}</span>
            </div>
            <div className={classes.infoItem}>
              <span className={'flex-none'}>处理人：</span>
              <span className={'flex-1'}>{currentDetail?.handler}</span>
            </div>
            <div className={classes.infoItem}>
              <span className={'flex-none'}>标题：</span>
              <span className={'flex-1'}>{currentDetail?.title}</span>
            </div>
            <div className={classes.infoItem}>
              <span className={'flex-none'}>状态：</span>
              <span className={'flex-1'}>{currentDetail?.status}</span>
            </div>
            <div className={'flex justify-start items-start pt-1 pb-2'} style={{ gridColumnStart: 'span 2' }}>
              <span className={'flex-none'}>工单记录：</span>
              <span
                className={'flex-1 whitespace-pre-wrap'}
                dangerouslySetInnerHTML={{ __html: currentDetail?.appRecord }}
              />
            </div>
          </div>
        </div>
        <div className={classes.divideDash} style={{ color: 'rgba(217,217,217)' }} />
        <div style={{ color: 'rgba(0,0,0,.65)' }}>
          <div className={'grid grid-cols-2 gap-x-8'}>
            <div className={classes.infoItem} style={{ gridColumnStart: 'span 2' }}>
              <span className={'flex-none'}>事故原因：</span>
              <span className={'flex-1'}>
                <OverflowTooltip>{currentDetail?.reasonDesc}</OverflowTooltip>
              </span>
            </div>
            <div className={classes.infoItem} style={{ gridColumnStart: 'span 2' }}>
              <span className={'flex-none'}>处理过程：</span>
              <span
                className={'flex-1 whitespace-pre-wrap'}
                dangerouslySetInnerHTML={{ __html: currentDetail?.process }}
              />
            </div>
            <div className={classes.infoItem} style={{ gridColumnStart: 'span 2' }}>
              <span className={'flex-none'}>预防方案：</span>
              <span
                className={'flex-1 whitespace-pre-wrap'}
                dangerouslySetInnerHTML={{ __html: currentDetail?.plan }}
              />
            </div>
          </div>
        </div>
      </div>
    </DraggableModal>
  )
}

const ListTable = (props) => {
  const { year, sysNames, faultLevels, filterMonth } = props
  const classes = useStyle()
  const { table, setTable } = useTable({
    pagination: {
      total: 0,
      pageSize: 10,
      current: 1,
      pageSizeOptions: [10],
      size: 'default',
      showTotal: (total) => `共${total}条记录`,
      hideOnSinglePage: true,
    },
    rowKey: (row) => String(row.id),
    columns: [
      { dataIndex: 'empDept', title: '所在部门' },
      { dataIndex: 'faultName', title: '故障名称' },
      { dataIndex: 'sysName', title: '所属应用系统' },
      { dataIndex: 'faultStartTime', title: '故障开始时间' },
      { dataIndex: 'faultConsumingTime', title: '故障时长（分钟）' },
      { dataIndex: 'faultLevel', title: '故障等级' },
      { dataIndex: 'influenceDesc', title: '影响故障' },
      {
        dataIndex: 'actions',
        title: '操作',
        render(text, row) {
          return (
            <span className={'cursor-pointer text-blue-500'} onClick={() => checkDetail(row)}>
              查看详情
            </span>
          )
        },
      },
    ],
  })
  const [currentDetail, setCurrentDetail] = useState(null)
  const checkDetail = (row) => {
    setCurrentDetail(row)
  }

  const { current: page, pageSize } = table.pagination
  const { run: getList, loading } = useRequest(
    () => {
      if (!sysNames?.length || !faultLevels.length) {
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
        .get('/bi-sys/api/user/systemMonitor/getSystemAccidentDetails', {
          params: {
            page,
            pageSize,
            year: year.year(),
            sysNames: (sysNames || []).join(','),
            faultLevels: (faultLevels || []).join(','),
            month: filterMonth ? moment(filterMonth).format('MM') : undefined
          },
        })
        .then(({ data: { list, totalRows: total } }) => {
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
    { manual: true, debounceInterval: 200 }
  )

  useEffect(() => {
    getList()
  }, [getList, page, pageSize])

  useEffect(() => {
    setTable(prevState => ({...prevState, pagination: {...prevState.pagination, current: 1}}))
    getList()
  }, [setTable, getList, year, sysNames, faultLevels, filterMonth])

  return (
    <div>
      <Table {...props} className={classNames(classes.root, props.className)} {...table} loading={loading} />
      <DetailModal currentDetail={currentDetail} setCurrentDetail={setCurrentDetail} />
    </div>
  )
}

const colors = ['#80d1f3', '#f984b3', '#f9c73c', '#8696b7', '#89e4d6', '#75a0f9', '#9489fa', '#71c16f']
// const colors = ['#95a2ff', '#fa8080', '#ffc076', '#fae768', '#87e885', '#3cb9fc', '#73abf5', '#90ed7d']

const faultLevelList = ['P1', 'P2', 'P3', 'P4']
// const sysNameList = ['新平台', '网络', '财务系统', 'BI', 'SCM', '4PL', 'OA']

function AccidentStat() {
  const [checkedList, setCheckedList] = useState([])
  const [checkedList2, setCheckedList2] = useState(['P2', 'P3', 'P4'])
  const [indeterminate, setIndeterminate] = useState(false)
  const [indeterminate2, setIndeterminate2] = useState(false)
  const [checkAll, setCheckAll] = useState(true)
  const [checkAll2, setCheckAll2] = useState(true)
  const [selectYear, setSelectYear] = useState(moment())

  const [allData, setAllData] = useState([])

  const [sysNameList, setSysNameList] = useState([])

  useEffect(() => {
    axios.get('/bi-sys/api/user/systemMonitor/getSystemNames').then(({ data }) => {
      const list = data.map((item) => item.sysName)
      setSysNameList(list)
      setCheckedList(list)
    })
  }, [])

  const onCheckAllChange = (e) => {
    setCheckedList(e.target.checked ? sysNameList : [])
    setIndeterminate(false)
    setCheckAll(e.target.checked)
  }
  const onCheckAllChange2 = (e) => {
    setCheckedList2(e.target.checked ? faultLevelList : [])
    setIndeterminate2(false)
    setCheckAll2(e.target.checked)
  }

  const onChange = (list) => {
    setCheckedList(list)
    setIndeterminate(!!list.length && list.length < sysNameList.length)
    setCheckAll(list.length === sysNameList.length)
  }

  const onChange2 = (list) => {
    setCheckedList2(list)
    setIndeterminate2(!!list.length && list.length < faultLevelList.length)
    setCheckAll2(list.length === faultLevelList.length)
  }

  const onYearChange = (year) => {
    setSelectYear(year)
  }

  const [chart1Option, setChart1Option] = useState({
    tooltip: {
      trigger: 'axis',
      appendToBody: true,
      extraCssText: 'z-index: 999',
      axisPointer: {
        type: 'shadow',
      },
      formatter(params) {
        return formatterTooltip(params)
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
      const series = checkedList.map((item) => {
        return {
          type: 'bar',
          color: colors[sysNameList.indexOf(item)],
          barWidth: 32,
          stack: '事故数',
          name: item,
          data: allData.map((_) => {
            const theItem = _.items.find((n) => n['sysName'] === item)
            return theItem ? theItem['cnt'] : 0
          }),
        }
      })
      return {
        ...prev,
        xAxis: {
          ...prev.xAxis,
          data: allData.map((_) => _['mDate']),
        },
        legend: {
          ...prev.legend,
          data: checkedList,
        },
        series,
      }
    })
  }, [checkedList, allData, sysNameList])

  useEffect(() => {
    setTimeout(() => {
      if (!checkedList2.length || !checkedList.length) {
        setAllData([])
        return
      }
      axios
        .get('/bi-sys/api/admin/systemMonitor/getSystemAccidentGraph', {
          params: {
            year: selectYear.year(),
            sysNames: checkedList.join(','),
            faultLevels: checkedList2.join(','),
          },
        })
        .then(({ data }) => {
          const months = Array.from(new Set(data.map((_) => _['mDate'])))
          const ret = months.map((mDate) => {
            return {
              mDate,
              items: data.filter((_) => _['mDate'] === mDate),
            }
          })
          setAllData(ret)
        })
    }, 300)
  }, [selectYear, checkedList, checkedList2])

  useEffect(() => {
    setOptions()
  }, [setOptions])



  const [filterMonth, setFilterMonth] = useState()
  const onChartClick = useCallback((param, echarts) => {
    console.log(param, echarts)
    const { name } = param
    setFilterMonth(name)
  }, [setFilterMonth])

  useEffect(() => {
      setFilterMonth(null)
  }, [selectYear])

  return (
    <div className={''}>
      <div className={'common-section-head'}>中心各系统故障统计</div>
      <div className={'px-8 pt-4'}>
        <div className={'flex justify-between items-start mb-1'}>
          <div>
            <div className={'flex justify-start mb-2'}>
              <span className={'mr-2 w-20'}>所属系统：</span>
              <Checkbox className={'mr-4'} indeterminate={indeterminate} onChange={onCheckAllChange} checked={checkAll}>
                全部
              </Checkbox>
              <Checkbox.Group options={sysNameList} value={checkedList} onChange={onChange} />
            </div>

            <div className={'flex justify-start'}>
              <span className={'mr-2 w-20'}>故障等级：</span>
              <Checkbox
                  className={'mr-4'}
                  indeterminate={indeterminate2}
                  onChange={onCheckAllChange2}
                  checked={checkAll2}>
                全部
              </Checkbox>
              <Checkbox.Group options={faultLevelList} value={checkedList2} onChange={onChange2} />
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
              style={{ width: 100 }}
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
            style={{ height: 300 }}
          />
        </div>

        {
          filterMonth ?
          <div className={'h-6'}>
            以下为{filterMonth}的数据：<Button size={'small'} type={'link'} onClick={() => setFilterMonth(null)}>重置</Button>
          </div> : <div className={'h-6'} />
        }
        <ListTable
          className={'mt-2 pb-6'}
          year={selectYear}
          filterMonth={filterMonth}
          sysNames={checkedList}
          faultLevels={checkedList2}
        />
      </div>
    </div>
  )
}

export default AccidentStat
