import React, { useEffect } from 'react'
import styled from 'styled-components'

import bg from './images/bg3.jpg'
const img = new Image()
img.src = bg

const Wrapper = styled.div`
  min-width: 1366px;
  min-height: 700px;
  background: #fff url(${bg}) no-repeat top right/100% 100%;
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
  font-family: 'ali_ph', sans-serif;
  height: calc(100vh - 64px);
  margin: 0 -24px -20px -24px;
  background-clip: border-box;
`

const LeftSide = styled.div`
  padding-left: 10%;
  padding-top: 10%;

  .shortName {
    font-family: sans-serif;
    padding: 0 6px;
    letter-spacing: 1px;
    font-size: 14px;
    height: 26px;
    line-height: 26px;
    border-radius: 4px;
    color: #fff;
    background: #3265e5;
  }

  .fullName {
    font-family: 'Microsoft YaHei', sans-serif;
    letter-spacing: 10px;
    margin-right: -10px;
    font-size: 64px;
    line-height: 64px;
    font-weight: 600;
    color: #3265e5;
    //color: rgb(12, 163, 150);
  }

  .enDescText {
    margin-top: 2%;
  }
`

const EnText = styled.span`
  font-family: sans-serif;
  letter-spacing: 6px;
  font-size: 24px;
  color: rgba(0, 0, 0, 0.2);
  margin-right: -4px;
`

const DescText = styled.div`
  margin-top: 8%;
  > div {
    color: rgba(0, 0, 0, .5);
    line-height: 40px;
    font-size: 24px;
  }
`

const Versions = styled.div`
  position: relative;
  color: rgb(191, 191, 191);
  font-family: sans-serif;
  margin-top: 12%;
  padding-top: 2%;
  letter-spacing: 2px;
  font-size: 14px;
  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 50px;
    height: 3px;
    background: rgba(50, 101, 229, .5);
  }
`

function IndexPage() {
  useEffect(() => {
    document.title = '首页--林氏木业数据管理系统'
  }, [])
  return (
    <Wrapper className={'flex items-start bg-white'}>
      <LeftSide className={'flex-1'}>
        <div className={'inline-block'}>
          <div className={'inline-flex items-top space-x-6'}>
            <div className={'fullName'}>数据管理系统</div>
            <div className={'shortName'}>DMS</div>
          </div>
          <div className={'enDescText space-x-4'}>
            <EnText>Data</EnText>
            <EnText>Management</EnText>
            <EnText>System</EnText>
          </div>
        </div>

        <DescText>
          <div>构建集团统一数据管理系统</div>
          <div>逐步实现数据透明化、集中化、资产化、服务化</div>
        </DescText>

        <Versions>
          <div className={'space-x-6'}>
            <span>Version 1.0</span>
            <span>(2022.01-至今)</span>
          </div>
        </Versions>
      </LeftSide>
    </Wrapper>
  )
}

export default IndexPage
