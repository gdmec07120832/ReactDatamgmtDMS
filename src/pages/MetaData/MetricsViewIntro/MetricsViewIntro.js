import React, { useRef } from 'react'
import styled from 'styled-components'
import { useSize } from 'ahooks'
import { useHistory } from 'react-router-dom'
import classNames from 'classnames'

const ImageHead = styled.div`
  position: relative;
  img {
    user-select: none;
    width: 100%;
    max-height: 240px;
    border-radius: 10px;
    height: auto;
    object-fit: cover;
  }
  .text {
    position: absolute;
    width: 30%;
    left: 64px;
    top: 50%;
    transform: translateY(-50%);
    color: #fff;
    font-family: 'Microsoft YaHei UI', PingFangSC-Semibold, PingFang SC, serif;
    .main-text {
      white-space: nowrap;
      font-size: 30px;
      font-weight: 600;
      line-height: 32px;
    }
    .sub-text {
      margin-top: 16px;
      font-size: 14px;
      font-weight: 400;
      line-height: 24px;
    }
  }
`

const Cells = styled.div.attrs((props) => {
  const { imageHeight } = props
  const h = Math.max(194, imageHeight || 0) + 8
  return {
    style: { height: `calc(100% - ${h}px)` },
  }
})`
  margin-top: 18px;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;

  .item {
    display: flex;
    align-items: flex-start;
    padding: 45px 10px 45px 45px;
    border-right: 1px solid #ededed;
    border-bottom: 1px solid #ededed;
    transition: all 0.2s;
    &.disabled {
      filter: grayscale(1);
      .item-link {
        cursor: not-allowed;
      }
    }
    @media (max-width: 1600px) {
      padding: 20px 10px 20px 20px;
    }
    &:nth-child(4n) {
      border-bottom: none;
    }
    &:nth-child(5n) {
      border-bottom: none;
    }
  }

  .item-icon {
    user-select: none;
    width: 40px;
    height: 40px;
    margin-right: 24px;
  }
  .item-title {
    font-size: 16px;
    font-family: 'Microsoft YaHei Regular', 'Microsoft YaHei UI', sans-serif;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.88);
    line-height: 24px;
    @media (max-width: 1600px) {
      font-size: 14px;
    }
  }
  .item-desc {
    margin-top: 4px;
    font-size: 14px;
    color: #7e7e7e;
    line-height: 22px;
    @media (max-width: 1600px) {
      font-size: 12px;
    }
  }

  .item-link {
    position: relative;
    cursor: pointer;
    margin-top: 24px;
    font-weight: 500;
    color: #3882f1;
    line-height: 22px;
    display: inline-block;
    padding-right: 22px;
    &:before {
      display: block;
      position: absolute;
      top: 6px;
      right: 0;
      width: 13px;
      height: 12px;
      content: '';
      background: url(${require('../../../assets/images/arrow-right.png').default}) no-repeat left top/contain;
    }
  }
`

const list = [
  {
    icon: require('../../../assets/images/icon01.png').default,
    title: '????????????',
    desc: (
      <span>
        ????????????????????????????????????????????????????????????
        <br />
        ????????????113?????????????????????????????????
      </span>
    ),
  },
  {
    icon: require('../../../assets/images/icon02.png').default,
    title: '????????????',
    desc: (
      <span>
        ??????????????????????????????????????????????????????????????????
        <br />
        ????????????71?????????????????????????????????
      </span>
    ),
  },
  {
    icon: require('../../../assets/images/icon04.png').default,
    title: '????????????',
    desc: (
      <span>
        ??????????????????????????????????????????????????????????????????
        <br />
        ????????????108?????????????????????????????????
      </span>
    ),
  },
  {
    icon: require('../../../assets/images/icon05.png').default,
    title: '????????????',
    disabled: true,
    desc: <span>?????????</span>,
    // desc: <span>?????????-?????????????????????-??????????????????????????????????????????????????????<br/>????????????102?????????????????????????????????</span>,
  },
  {
    icon: require('../../../assets/images/icon04.png').default,
    title: '????????????',
    disabled: true,
    desc: <span>?????????</span>,
  },
]

function MetricsViewIntro() {
  const history = useHistory()

  const ref = useRef()
  const size = useSize(ref)

  const jumpToViewPage = (title) => {
    history.push('/metaData/metricsSys/metricsView', {
      tab: title,
    })
  }
  return (
    <div className={'p-6'} style={{ minHeight: 'calc(100vh - 90px)' }}>
      <ImageHead ref={ref}>
        <img src={require('../../../assets/images/metrics-view-intro.png').default} alt="" />
        <div className={'text'}>
          <div className={'main-text'}>??????????????????</div>
          <div className={'sub-text'}>
            ???????????????????????????????????????????????????????????????
            <br />
            ?????????????????????????????????/???????????????????????????????????????
          </div>
        </div>
      </ImageHead>

      <Cells imageHeight={size.height}>
        {list.map((item) => {
          return (
            <div key={item.title} className={classNames('item', { disabled: item.disabled })}>
              <img className={'item-icon'} src={item.icon} alt="" />
              <div>
                <div className={'item-title'}>{item.title}</div>
                <div className={'item-desc'}>{item.desc}</div>
                <div
                  className={'item-link'}
                  onClick={() => {
                    !item.disabled && jumpToViewPage(item.title)
                  }}>
                  ????????????
                </div>
              </div>
            </div>
          )
        })}
      </Cells>
    </div>
  )
}

export default MetricsViewIntro
