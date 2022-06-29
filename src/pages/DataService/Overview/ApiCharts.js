import React, { useEffect, useState } from 'react'
import { Empty } from 'antd'
import ButtonRadioGroup from '../../../components/ButtonRadioGroup'
import EChartsReactCore from 'echarts-for-react/lib/core'
import * as echarts from 'echarts'
import cloneDeep from 'lodash/cloneDeep'
import moment from 'moment'
import { commonOptions } from './common'
import { useRequest } from 'ahooks'
import fetchSql from '../../../utils/fetchSql'
import ExSelect from '../../../components/Select'
import StyledDateRangePicker from '../../../components/StyledDateRangePicker'

function ApiCharts(props) {
  const {onGetListSuccess} = props
  const [chart1Option, setChart1Option] = useState({
    ...cloneDeep(commonOptions),
    xAxis: {
      axisTick: {
        alignWithLabel: true,
      },
      minInterval: 1,
      data: [],
    },
    series: [
      {
        type: 'line',
        name: '调用耗时(ms)',
        data: [],
      },
    ],
  })

  const [chart2Option, setChart2Option] = useState({
    ...cloneDeep(commonOptions),
    xAxis: {
      axisTick: {
        alignWithLabel: true,
      },
      minInterval: 1,
      data: [],
    },
    series: [
      {
        type: 'line',
        name: '调用次数',
        data: [],
      },
    ],
  })

  const [viewTab, setViewTab] = useState('timeConsuming')
  const changeViewType = (v) => {
    setViewTab(v)
  }

  const [statisticRange, setStatisticRange] = useState([moment().subtract(30, 'day'), moment()])

  const [selectedApi, setSelectedApi] = useState(undefined)

  const [apiList, setApiList] = useState([])
  useRequest(() => {
    return fetchSql('ALL_US_API', 'getInterfaceList', {}).then(({ data }) => {
      setApiList(
        data.map((item) => {
          return {
            ...item,
            label: item.cnName,
            value: item.ID,
          }
        })
      )

      if (data.length) {
        onGetListSuccess?.(data)
        setSelectedApi(data[0].ID)
      }
    })
  })

  const { run: getUsageTime, loading: loading1 } = useRequest(
    () => {
      return fetchSql('ALL_US_API', 'getInterfaceMaxBTPerDays', {
        prefix: apiList.find((item) => item.value === selectedApi)?.prefix,
        interfaceName: apiList.find((item) => item.value === selectedApi)?.interfaceName,
        interfaceType: apiList.find((item) => item.value === selectedApi)?.interfaceType,
        startDate: statisticRange[0].format('YYYY-MM-DD'),
        endDate: statisticRange[1].format('YYYY-MM-DD'),
      }).then(({ data }) => {
        setChart1Option((prevState) => ({
          ...prevState,
          xAxis: {
            ...prevState.xAxis,
            data: data.map((item) => item.tDate),
          },
          series: [
            {
              ...prevState.series[0],
              data: data.map((item) => item.burningTime),
            },
          ],
        }))
      })
    },
    { manual: true }
  )

  const { run: getInvokeTimes, loading: loading2 } = useRequest(
    () => {
      return fetchSql('ALL_US_API', 'getInterfaceCountPerDays', {
        prefix: apiList.find((item) => item.value === selectedApi)?.prefix,
        interfaceName: apiList.find((item) => item.value === selectedApi)?.interfaceName,
        interfaceType: apiList.find((item) => item.value === selectedApi)?.interfaceType,
        startDate: statisticRange[0].format('YYYY-MM-DD'),
        endDate: statisticRange[1].format('YYYY-MM-DD'),
      }).then(({ data }) => {
        setChart2Option((prevState) => ({
          ...prevState,
          xAxis: {
            ...prevState.xAxis,
            data: data.map((item) => item.tDate),
          },
          series: [
            {
              ...prevState.series[0],
              data: data.map((item) => item.visitTimes),
            },
          ],
        }))
      })
    },
    { manual: true }
  )

  useEffect(() => {
    if (selectedApi) {
      if (viewTab === 'timeConsuming') {
        getUsageTime()
      }

      if (viewTab === 'times') {
        getInvokeTimes()
      }
    }
  }, [viewTab, statisticRange, selectedApi, getInvokeTimes, getUsageTime])

  const handleSelectedApiChange = (v) => {
    setSelectedApi(v)
  }

  return (
    <div className={'bg-white mt-4'}>
      <div className={'common-section-head'}>
        <div className={'flex justify-between'}>
          <span>API调用个况</span>
          <div>
            <StyledDateRangePicker
              allowClear={false}
              value={statisticRange}
              onChange={(v) => setStatisticRange(v)}
              picker={'day'}
              disabledDate={(currentDate) => {
                return currentDate.valueOf() > moment().valueOf()
              }}
            />
          </div>
        </div>
      </div>
      <div className={'px-12 py-5'}>
        <div className={'flex justify-between'}>
          <div>
            <ButtonRadioGroup value={viewTab} onChange={changeViewType}>
              <ButtonRadioGroup.Radio value={'timeConsuming'}>调用耗时</ButtonRadioGroup.Radio>
              <ButtonRadioGroup.Radio value={'times'}>调用次数</ButtonRadioGroup.Radio>
            </ButtonRadioGroup>
          </div>
          <div>
            <ExSelect
              value={selectedApi}
              onChange={(v) => handleSelectedApiChange(v)}
              className={'w-96'}
              options={apiList}
            />
          </div>
        </div>
        <div>
          {viewTab === 'timeConsuming' &&
            (chart1Option.xAxis.data.length || loading1 ? (
              <EChartsReactCore
                option={chart1Option}
                showLoading={loading1}
                echarts={echarts}
                style={{ height: 320 }}
              />
            ) : (
              <div className={'flex justify-center items-center'} style={{ height: 320 }}>
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={'没有数据~'} />
              </div>
            ))}

          {viewTab === 'times' &&
            (chart2Option.xAxis.data.length || loading2 ? (
              <EChartsReactCore
                option={chart2Option}
                showLoading={loading2}
                echarts={echarts}
                style={{ height: 320 }}
              />
            ) : (
              <div className={'flex justify-center items-center'} style={{ height: 320 }}>
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={'没有数据~'} />
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}

export default ApiCharts
