import React from 'react'
import styled from 'styled-components'
import { CSSTransition } from 'react-transition-group'

const Item = styled.div`
  height: 16px;
  line-height: 16px;
  font-size: 12px;
  text-align: center;
  color: #fff;
`

function RenderProgress(props) {
  const { progress } = props
  return <>
   <CSSTransition timeout={1000} unmountOnExit in={!!progress?.jobCount} classNames={'slide-in'}>
    <div className={'flex rounded overflow-hidden'}>
      <Item style={{ width: `${progress?.successJobCount}%`, background: '#28a745' }} />
      <Item style={{ width: `${progress?.runnningJobCount}%`, background: '#007bff' }} />
      <Item style={{ width: `${progress?.waitingTimeOutJobCount}%`, background: '#ffc107' }} />
      <Item style={{ width: `${progress?.failureJobCount}%`, background: '#dc3545' }} />
      <Item style={{ width: `${progress?.stoppedJobCount}%`, background: '#343a40' }} />
      <Item style={{ width: `${progress?.waitingJobCount}%`, background: '#17a2b8' }} />
    </div>
  </CSSTransition>
    {
      progress && !progress?.jobCount && '无进度'
    }
  </>
}

const ColorExplain = () => {
  return (
    <div>
      <div className={'w-80 text-gray-900'}>
        <div className={'flex w-full'}>
          <Item style={{ background: '#28a745' }} className={'flex-1'}>
            成功
          </Item>
          <Item style={{ background: '#007bff' }} className={'flex-1'}>
            正在运行
          </Item>
          <Item style={{ background: '#ffc107' }} className={'flex-1'}>
            超时
          </Item>
          <Item style={{ background: '#dc3545' }} className={'flex-1'}>
            失败
          </Item>
          <Item style={{ background: '#343a40' }} className={'flex-1'}>
            禁用
          </Item>
          <Item style={{ background: '#17a2b8' }} className={'flex-1'}>
            等待
          </Item>
        </div>
      </div>
    </div>
  )
}

export { ColorExplain }

export default RenderProgress
