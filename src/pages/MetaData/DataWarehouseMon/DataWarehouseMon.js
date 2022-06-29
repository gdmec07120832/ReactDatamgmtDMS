import React, { useEffect, useState } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { DatePicker, Select, Table } from 'antd'
import FieldItem from '../../../components/FieldItem'
import moment from 'moment'
import numeral from 'numeral'
import OverflowTooltip from '../../../components/OverflowTooltip'
import useTable from '../../../hooks/useTable'
import axios from '../../../utils/axios'
import EChartsReactCore from 'echarts-for-react/lib/core'
import * as echarts from 'echarts/core'
import echartsLoadingOption from '../../../utils/echartsLoadingOption'
import DebounceSelect from '../../../components/DebounceSelect/DebounceSelect'
import StyledDateRangePicker from '../../../components/StyledDateRangePicker'

const useStyle = makeStyles({
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr',
    gridGap: 20,
    '&>div': {
      padding: '10px',
      boxShadow: 'rgb(17 17 26 / 5%) 0 1px 0, rgb(17 17 26 / 10%) 0 0 8px',
      borderRadius: 10,
      '& .amount': {
        textAlign: 'center',
        padding: '10px 0',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
      },
    },
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    marginTop: 20,
    gridGap: 20,
    '&>div': {
      padding: '20px 20px 0 20px',
      boxShadow: 'rgb(17 17 26 / 5%) 0 1px 0, rgb(17 17 26 / 10%) 0 0 8px',
      minHeight: 300,
      borderRadius: 16,
    },
  },
  tableWrapper: {
    boxShadow: 'rgb(17 17 26 / 5%) 0 1px 0, rgb(17 17 26 / 10%) 0 0 8px',
    marginTop: 20,
    padding: '20px',
    borderRadius: 16,
    minHeight: 150,
  },
})
const defaultDateRange = [moment().subtract(30, 'days'), moment()]
function DataWarehouseMon() {
  const classes = useStyle()

  const [date1, setDate1] = useState(moment())
  const [dateRange, setDateRange] = useState(defaultDateRange)

  const { table, setTable } = useTable({
    rowKey: 'tableName',
    scroll: { x: 1100 },
    columns: [
      {
        dataIndex: 'tDate',
        width: 100,
        title: '日期',
        render: (text) => {
          return (text || '').slice(0, 10)
        },
      },
      { dataIndex: 'tableSpaceName', title: '表空间', width: 100 },
      { dataIndex: 'owner', title: '用户', width: 80 },
      { dataIndex: 'tableName', title: '表名', width: 140 },
      { dataIndex: 'tableVolumeM', title: '表体积(M)', width: 100 },
      { dataIndex: 'numRows', title: '总行数', width: 100 },
      { dataIndex: 'lastTableVolumeM', title: '昨日表体积', width: 100 },
      { dataIndex: 'lastNumRows', title: '昨日总行数', width: 100 },
      { dataIndex: 'dtdAddVolumeRate', title: '体积日增率', width: 100 },
      { dataIndex: 'dtdAddNumRowsRate', title: '行数日增率', width: 100 },
      {
        dataIndex: 'isNew',
        title: '是否新增',
        width: 80,
        render: (text) => {
          return { 0: '否', 1: '是' }[text]
        },
      },
    ],
  })

  const [totalVolume, setTotalVolume] = useState({
    tableTotalVolume: 0,
    rateOfIncrase: 0,
  })
  const [tableNumbers, setTableNumbers] = useState({
    ODSTableNum: 0,
    ODSNewTableNum: 0,
    DIMTableNum: 0,
    DIMNewTableNum: 0,
    FACTTableNum: 0,
    FACTNewTableNum: 0,
    WTTableNum: 0,
    WTNewTableNum: 0,
    DMTableNum: 0,
    DMNewTableNum: 0,
  })

  useEffect(() => {
    axios.get('/bi-metadata/api/admin/dataWarehouseModel/getDWVolume').then(({ data: [ret] }) => {
      setTotalVolume(ret)
    })
  }, [])

  useEffect(() => {
    axios.get('/bi-metadata/api/user/dataWarehouseModel/getTableNumGroupByDataHierarchy').then(({ data: [ret] }) => {
      setTableNumbers(ret)
    })
  }, [])

  const [chart1Option, setChart1Option] = useState({
    color: ['#74a0fa'],
    tooltip: {
      trigger: 'item',
      appendToBody: true,
      confine: true,
      axisPointer: {
        type: 'shadow',
      },
    },
    grid: {
      top: 0,
      bottom: 10,
      left: 210,
      right: 50,
      // containLabel: true
    },
    xAxis: {
      max: 'dataMax',
      axisLabel: {
        show: false,
      },
      splitLine: {
        show: false,
      },
    },
    yAxis: {
      axisLabel: {
        width: 200,
        overflow: 'truncate',
      },
      splitLine: {
        show: false,
      },
      axisLine: {
        show: false,
      },
      type: 'category',
      axisTick: {
        show: false,
      },
      data: [],
    },
  })

  useEffect(() => {
    axios
      .get('/bi-metadata/api/user/dataWarehouseModel/getTop10VolumeTable', {
        params: {
          tDate: date1.format('YYYY-MM-DD'),
        },
      })
      .then(({ data }) => {
        const rankData = data.reverse()
        setChart1Option((prev) => {
          return {
            ...prev,
            yAxis: {
              ...prev.yAxis,
              data: rankData.map((_) => _['tableName']),
            },
            series: [
              {
                type: 'bar',
                barWidth: 12,
                itemStyle: {
                  borderRadius: [0, 6, 6, 0],
                },
                label: {
                  show: true,
                  position: 'right',
                  fontSize: 12,
                  distance: 5,
                },
                data: rankData.map((_) => _['tableVolumeM']),
              },
            ],
          }
        })
      })
  }, [date1])

  const [chart2Option, setChart2Option] = useState({
    color: ['#74a0fa', '#f6c73a'],
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      left: 0,
      top: 0,
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
      top: 50,
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
    yAxis: [
      {
        splitLine: {
          show: false,
        },
        scale: true,
      },
      {
        splitLine: {
          show: false,
        },
      },
    ],
  })

  useEffect(() => {
    axios
      .get('/bi-metadata/api/user/dataWarehouseModel/getVolumeTrendOfTable', {
        params: {
          startDate: dateRange[0].format('YYYY-MM_DD'),
          endDate: dateRange[1].format('YYYY-MM-DD'),
        },
      })
      .then(({ data }) => {
        setChart2Option((prev) => ({
          ...prev,
          xAxis: {
            ...prev.xAxis,
            data: data.map((_) => _.tDate.slice(5, 10)),
          },
          series: [
            {
              type: 'line',
              name: '表体积(G)',
              data: data.map((_) => parseInt(_['tableVolumeG'])),
            },
            {
              type: 'line',
              name: '表体积增长率(%)',
              yAxisIndex: 1,
              data: data.map((_) => _['dailyGrowthRate']),
            },
          ],
        }))
      })
  }, [dateRange])

  const [query, setQuery] = useState({
    dateRange: [moment(), moment()],
    tableName: undefined,
    tableSpace: undefined,
    isNew: undefined,
  })

  const [tableLoading, setTableLoading] = useState(false)
  const { current, pageSize } = table.pagination
  useEffect(() => {
    const { dateRange, isNew, tableName, tableSpace } = query
    setTableLoading(true)
    axios
      .get('/bi-metadata/api/user/dataWarehouseModel/getTableDetail', {
        params: {
          startDate: dateRange[0].format('YYYY-MM-DD'),
          endDate: dateRange[1].format('YYYY-MM-DD'),
          isNew,
          tableSpace,
          tableName,
          page: current,
          pageSize,
        },
      })
      .then(({ data: { list, totalRows } }) => {
        setTable((prev) => {
          return {
            ...prev,
            dataSource: list,
            pagination: { ...prev.pagination, total: totalRows },
          }
        })
      })
      .finally(() => {
        setTableLoading(false)
      })
  }, [query, current, pageSize, setTable])

  const getFetchOption = (field) => {
    return function (keyword) {
      // if(!keyword) {
      //   return Promise.resolve([])
      // }
      return axios
        .get('/bi-metadata/api/user/dataWarehouseModel/getFactPubTavleViveDColValue', {
          params: {
            columnName: field,
            keyword,
          },
        })
        .then(({ data }) => {
          return Promise.resolve(
            data.map((item) => {
              return {
                label: item,
                value: item,
              }
            })
          )
        })
    }
  }

  return (
    <div className={'px-6 py-6'}>
      <div className={classes.grid}>
        <div>
          <span>总体积(G)</span>
          <p className={'amount'}>{numeral(totalVolume.tableTotalVolume).format('0,0')}</p>
          <p className={'text-xs text-gray-400'}>
            <span className={'mr-2'}>增长率(对比昨日)</span>
            <span>{numeral(totalVolume.rateOfIncrase).format('0.0')}</span>%
          </p>
        </div>
        <div>
          <span>ODS表数量</span>
          <p className={'amount'}>{numeral(tableNumbers.ODSTableNum).format('0,0')}</p>
          <p className={'text-xs text-gray-400'}>
            <span className={'mr-2'}>新增数量(对比昨日)</span>
            <span>{numeral(tableNumbers.ODSNewTableNum).format('0,0')}</span>
          </p>
        </div>
        <div>
          <span>DIM表数量</span>
          <p className={'amount'}>{numeral(tableNumbers.DIMTableNum).format('0,0')}</p>
          <p className={'text-xs text-gray-400'}>
            <span className={'mr-2'}>新增数量(对比昨日)</span>
            <span>{numeral(tableNumbers.DIMNewTableNum).format('0,0')}</span>
          </p>
        </div>
        <div>
          <span>FACT表数量</span>
          <p className={'amount'}>{numeral(tableNumbers.FACTTableNum).format('0,0')}</p>
          <p className={'text-xs text-gray-400'}>
            <span className={'mr-2'}>新增数量(对比昨日)</span>
            <span>{numeral(tableNumbers.FACTNewTableNum).format('0,0')}</span>
          </p>
        </div>
        <div>
          <span>WT表数量</span>
          <p className={'amount'}>{numeral(tableNumbers.WTTableNum).format('0,0')}</p>
          <p className={'text-xs text-gray-400'}>
            <span className={'mr-2'}>新增数量(对比昨日)</span>
            <span>{numeral(tableNumbers.WTNewTableNum).format('0,0')}</span>
          </p>
        </div>
        <div>
          <span>DM表数量</span>
          <p className={'amount'}>{numeral(tableNumbers.DMTableNum).format('0,0')}</p>
          <p className={'text-xs text-gray-400'}>
            <span className={'mr-2'}>新增数量(对比昨日)</span>
            <span>{numeral(tableNumbers.DMNewTableNum).format('0,0')}</span>
          </p>
        </div>
      </div>

      <div className={classes.grid2}>
        <div style={{ width: 'calc(100% - 1px)' }}>
          <div className={'flex justify-between'}>
            <div>表体积TOP10（单位：M）</div>
            <FieldItem label={'日期'} labelWidth={40}>
              <DatePicker value={date1} onChange={(v) => setDate1(v)} allowClear={false} />
            </FieldItem>
          </div>
          <div className={'pt-4 w-full'}>
            <EChartsReactCore
              notMerge={true}
              echarts={echarts}
              option={chart1Option}
              loadingOption={echartsLoadingOption}
              style={{ height: 300 }}
            />
            {/*<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />*/}
          </div>
        </div>
        <div style={{ width: 'calc(100% - 1px)' }}>
          <div className={'flex justify-between'}>
            <OverflowTooltip>表体积总量与增长率趋势</OverflowTooltip>
            <FieldItem label={'日期'} labelWidth={'auto'}>
              <StyledDateRangePicker
                style={{ flexShrink: 0 }}
                value={dateRange}
                onChange={(v) => setDateRange(v)}
                allowClear={false}
              />
            </FieldItem>
          </div>
          <div className={'pt-4'}>
            <EChartsReactCore
              notMerge={true}
              echarts={echarts}
              option={chart2Option}
              loadingOption={echartsLoadingOption}
              style={{ height: 300 }}
            />
            {/*<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />*/}
          </div>
        </div>
      </div>

      <div className={classes.tableWrapper}>
        <div>表明细查询</div>

        <div className={'grid grid-cols-4 gap-6 mt-2 mb-3'}>
          <FieldItem label={'日期'} labelWidth={40} labelAlign={'left'}>
            <StyledDateRangePicker

              value={query.dateRange}
              onChange={(v) => setQuery((prev) => ({ ...prev, dateRange: v }))}
              allowClear={false}
              className={'flex-1'}
            />
          </FieldItem>
          <FieldItem label={'表空间'} labelWidth={50} labelAlign={'left'}>
            <DebounceSelect
              value={query.tableSpace}
              placeholder={'输入表空间关键字查找'}
              allowClear
              className={'flex-1'}
              onChange={(v) => setQuery((prev) => ({ ...prev, tableSpace: v }))}
              fetchOptions={getFetchOption('TABLESPACE_NAME')}
            />
          </FieldItem>
          <FieldItem label={'表名'} labelWidth={40} labelAlign={'left'}>
            <DebounceSelect
              value={query.tableName}
              placeholder={'输入表名关键字查找'}
              allowClear
              className={'flex-1'}
              onChange={(v) => setQuery((prev) => ({ ...prev, tableName: v }))}
              fetchOptions={getFetchOption('TABLE_NAME')}
            />
          </FieldItem>
          <FieldItem label={'是否新增'} labelWidth={60} labelAlign={'left'}>
            <Select
              placeholder={'是否新增'}
              className={'flex-1'}
              allowClear
              value={query.isNew}
              onChange={(v) => setQuery((prev) => ({ ...prev, isNew: v }))}>
              <Select.Option value={1}>是</Select.Option>
              <Select.Option value={0}>否</Select.Option>
            </Select>
          </FieldItem>
        </div>
        <Table {...table} loading={tableLoading} />
      </div>
    </div>
  )
}

export default DataWarehouseMon
