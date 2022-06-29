import React, {useEffect, useState} from 'react'
import styled from 'styled-components'
import SimpleTable from './SimpleTable'
import { ReactComponent as Icon1 } from './svgs/icon01.svg'
import { ReactComponent as Icon2 } from './svgs/icon02.svg'
import { ReactComponent as Icon3 } from './svgs/icon03.svg'
import { ReactComponent as Icon4 } from './svgs/icon04.svg'
import { useRequest } from 'ahooks'
import axios from '../../../utils/axios'
import orderBy from 'lodash/orderBy'
import numeral from 'numeral'
import OverflowTooltip from '../../../components/OverflowTooltip'
import { Pagination } from 'antd'

const TYPES = ['TOTAL', 'OVERDUE', 'TO_AUDIT', 'OVERDUE_LEFT_3', 'OVERDUE_LEFT_5']

const TYPES_TEXT = {
  TOTAL: '待填报',
  OVERDUE: '逾期填报',
  TO_AUDIT: '待审批',
  OVERDUE_LEFT_3: '剩余3天填报',
  OVERDUE_LEFT_5: '剩余5天填报',
}

const TYPES_IMG = {
  TOTAL: <Icon1 />,
  OVERDUE: <Icon2 />,
  TO_AUDIT: <Icon3 />,
  OVERDUE_LEFT_3: <Icon4 />,
  OVERDUE_LEFT_5: <Icon4 />,
}

const ItemWrap = styled.div.attrs({
  className: 'flex justify-start items-start p-4 rounded relative',
})`
  background: rgb(247, 248, 249);
  border: 1px solid transparent;
  &:after {
    display: none;
    content: '';
    position: absolute;
    width: 12px;
    height: 10px;
    background: #fff;
    bottom: -1px;
    clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
    left: 48px;
  }
  svg {
    color: #8dabf3;
  }
  .type-text {
    color: #848484;
  }
  &.active {
    color: #fff;
    background: #2561ef;
    &:after {
      display: block;
    }
    .type-text {
      color: #fff;
    }
    svg {
      color: #fff;
    }
  }
`

function Overview() {
  const [columns1] = useState([
    {
      title: '数据域',
      dataIndex: 'dataFieldName',
      render(record) {
        return <OverflowTooltip>{record.dataFieldName}</OverflowTooltip>
      },
    },
    {
      title: '总填报数',
      dataIndex: 'count',
      render(record) {
        return <div className={'py-2.5'}>{record.count}条</div>
      },
    },
    {
      title: '占比',
      dataIndex: 'rate',
      render(record) {
        return numeral(record.rate).format('0.0%')
      },
    },
  ])

  const [columns2] = useState([
    { title: '数据域', dataIndex: 'dataFieldName' },
    { title: '第一层分类', dataIndex: 'oneTierName' },
    { title: '第二层分类', dataIndex: 'categoryName' },
    {
      title: '填报名称',
      dataIndex: 'excelName',
      render(record) {
        return <OverflowTooltip>{record.excelName}</OverflowTooltip>
      },
    },
    {
      title: '填报角色',
      dataIndex: 'submitterRoleName',
      render(record) {
        return <OverflowTooltip>{record.submitterRoleName}</OverflowTooltip>
      },
    },
    {
      title: '审批角色',
      dataIndex: 'excelAuditorName',
      render(record) {
        return <OverflowTooltip>{record.excelAuditorName}</OverflowTooltip>
      },
    },
    {
      title: '期限',
      dataIndex: 'betweenDaysNumber',
      render(record) {
        const { betweenDaysNumber } = record
        return (
          <div className={'py-2'} style={{ color: betweenDaysNumber < 0 ? 'var(--dangerous-color)' : '' }}>
            {betweenDaysNumber >= 0 ? `剩${betweenDaysNumber}天` : `超${Math.abs(betweenDaysNumber)}天`}
          </div>
        )
      },
    },
  ])

  const [dataSource1, setDataSource1] = useState([])
  const [dataSource2, setDataSource2] = useState([])

  const [, setCurType] = useState('TOTAL')

  const handleTypeClick = (key) => {
    setCurType(key)
  }

  const [statisticValues, setStatisticValues] = useState({})
  useRequest(() => {
    return axios.get('/bi-data-reporting/api/admin/overview/getBacklogOverview').then(({ data }) => {
      const {
        todoTotalCount,
        overdueCount,
        penddingCount,
        remaining3DaysCount,
        remaining5DaysCount,
        dataFieldOverviewDTOList,
      } = data
      setStatisticValues({
        TOTAL: todoTotalCount,
        OVERDUE: overdueCount,
        TO_AUDIT: penddingCount,
        OVERDUE_LEFT_3: remaining3DaysCount,
        OVERDUE_LEFT_5: remaining5DaysCount,
      })
      setDataSource1(orderBy(dataFieldOverviewDTOList, [(o) => Number(o.count)], ['desc']))
    })
  })

  const [paginationOptions, setPaginationOptions] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    onChange(page) {
      setPaginationOptions((prevState) => ({
        ...prevState,
        current: page,
      }))
    },
  })
  const { current: page, pageSize } = paginationOptions
  const { run: getList, loading } = useRequest(
    () => {
      return axios
        .get('/bi-data-reporting/api/user/overview/getTodoListDetail', {
          params: { page, pageSize },
        })
        .then(({ data: { list, totalRows } }) => {
          setPaginationOptions((prevState) => ({
            ...prevState,
            total: totalRows,
          }))

          setDataSource2(list)
        })
    },
    { manual: true }
  )

  useEffect(() => {
    getList()
  }, [getList, page])


  return (
    <>
      <div className={'common-section-head'}>填报待办概况</div>
      <div>
        <div className={'grid grid-cols-5 gap-x-4 p-6'}>
          {TYPES.map((key) => (
            <ItemWrap key={key} onClick={() => handleTypeClick(key)}>
              <div className={'flex-none absolute'} style={{ fontSize: 16 }}>
                {TYPES_IMG[key]}
              </div>
              <div className={'flex-1 text-center'}>
                <div className={'type-text'}>{TYPES_TEXT[key]}</div>
                <div className={'text-2xl pt-2 pb-1'}>{numeral(statisticValues[key] || 0).format('0,0')}</div>
              </div>
            </ItemWrap>
          ))}
        </div>
        <div className={'mx-6 mb-6'} style={{ borderBottom: '2px dashed rgba(244,244,244)' }} />

        <div className={'grid grid-cols-12 gap-x-4 px-6 pb-6'}>
          <div className={'col-span-4'}>
            <div className={'mb-4 text-base'}>数据域分布</div>
            <SimpleTable rowKey={'dataFieldName'} columns={columns1} dataSource={dataSource1} />
          </div>
          <div className={'col-span-8'}>
            <div className={'mb-4 text-base'}>填报待办明细</div>
            <SimpleTable rowKey={'id'} loading={loading} columns={columns2} dataSource={dataSource2} />
            {paginationOptions.total > 0 && <Pagination {...paginationOptions} className={'text-right mt-2.5'} />}
          </div>
        </div>
      </div>
    </>
  )
}

export default Overview
