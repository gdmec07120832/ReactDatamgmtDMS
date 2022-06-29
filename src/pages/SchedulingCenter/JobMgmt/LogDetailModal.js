import React, { useEffect, useState } from 'react'
import DraggableModal from '../../../components/DraggableModal'
import { Button, message } from 'antd'
import axios from '../../../utils/axios'
import styled from 'styled-components'
import OverflowTooltip from '../../../components/OverflowTooltip'
import { CopyOutlined } from '@ant-design/icons'
import { Tooltip } from '@material-ui/core'
import { CopyToClipboard } from 'react-copy-to-clipboard'

const Item = styled.div.attrs({
  className: 'flex justify-start items-start pt-1 pb-2',
})`
  color: rgba(0, 0, 0, 0.65);
`

const CopyWrapper = styled.div`
  position: relative;
  flex: 1;
  .copy-icon {
    position: absolute;
    padding: 6px;
    border-radius: 4px;
    font-size: 16px;
    top: 0;
    right: 10px;
    cursor: pointer;
    z-index: 999;
    background: #eee;
    &:hover {
      background: #ccc;
    }
  }
`

function LogDetailModal(props) {
  const { currentRow, setCurrentRow } = props

  const close = () => {
    setCurrentRow(null)
  }

  const [details, setDetails] = useState({})
  useEffect(() => {
    if (currentRow?.id) {
      axios
        .get('/bi-task-scheduling-system/api/user/jobLog/selectJobLogById', {
          params: {
            id: currentRow.id,
          },
        })
        .then(({ data }) => {
          setDetails(data)
        })
    }
  }, [currentRow])

  const onCopy = () => {
    message.success('已复制')
  }

  return (
    <DraggableModal
      width={960}
      title={'日志详情'}
      visible={!!currentRow}
      footer={[
        <Button onClick={close} key={'close'}>
          关闭
        </Button>,
      ]}
      onCancel={close}>
      <div className={'grid grid-cols-2 gap-x-8'}>
        <Item>
          <span>分组：</span>
          <span>{details.groupName}</span>
        </Item>
        <Item>
          <span className={'flex-none'}>作业名称：</span>
          <span>
            <OverflowTooltip>{details.jobName}</OverflowTooltip>
          </span>
        </Item>
        <Item>
          <span>执行时间：</span>
          <span>{details.executeDate}</span>
        </Item>
      </div>

      <div className="border border-b border-dashed mt-4 mb-2" style={{ color: 'rgb(217, 217, 217)' }} />
      <div className={'grid grid-cols-2 gap-x-8 mt-4'}>
        <Item>
          <span>开始时间：</span>
          <span>{details.startDate}</span>
        </Item>
        <Item>
          <span>结束时间：</span>
          <span>{details.endDate}</span>
        </Item>
      </div>
      <div>
        <Item>
          <span>参数：</span>
          <span>{details.parameter}</span>
        </Item>
      </div>

      <div>
        <Item>
          <span>命令：</span>
          <span>{details.command}</span>
        </Item>
      </div>

      <div>
        <Item>
          <span className={'flex-none'}>控制台日志：</span>
          <CopyWrapper>
            {details.consoleLog && (
              <Tooltip title={'复制日志'}>
                <CopyToClipboard className={'copy-icon'} onCopy={onCopy} text={details.consoleLog}>
                  <CopyOutlined />
                </CopyToClipboard>
              </Tooltip>
            )}
            <div
              dangerouslySetInnerHTML={{ __html: details.consoleLog }}
              className={'whitespace-pre-wrap break-all overflow-y-auto'}
              style={{ maxHeight: 280 }}
            />
          </CopyWrapper>
        </Item>
      </div>
    </DraggableModal>
  )
}

export default LogDetailModal
