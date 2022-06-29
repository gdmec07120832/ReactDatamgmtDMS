import React, { useState } from 'react'
import DraggableModal from '../../../components/DraggableModal'
import { Button, message, Switch } from 'antd'
import axios from '../../../utils/axios'

function ExecModal(props) {
  const { currentRow, setCurrentRow, onSuccess } = props
  let isGroupExec = !('directorId' in (currentRow || {}))

  const close = () => {
    setCurrentRow(null)
    setTriggerDependence(false)
  }

  const [triggerDependence, setTriggerDependence] = useState(false)

  const handleSubmit = () => {
    let type = isGroupExec ? 'group' : 'job'
    axios
      .get(`/bi-task-scheduling-system/api/admin/${type}/execute`, {
        params: {
          id: currentRow?.id,
          triggerDependance: triggerDependence,
        },
      })
      .then(({ msg, success }) => {
        if (success) {
          message.success('操作成功：' + msg)
          close()
          onSuccess?.()
        } else {
          message.error('操作失败：' + msg)
        }
      })
  }

  return (
    <DraggableModal
      destroyOnClose
      title={isGroupExec ? '执行分组' : '执行作业'}
      footer={[
        <Button onClick={close} key={'close'}>
          取消
        </Button>,
        <Button onClick={handleSubmit} key={'exec'} type={'primary'}>
          执行
        </Button>,
      ]}
      visible={!!currentRow}
      onCancel={close}>
      <div className={'flex'}>
        <span>是否进行依赖判断：</span>
        <Switch checked={triggerDependence} onChange={(v) => setTriggerDependence(v)} />
      </div>
    </DraggableModal>
  )
}

export default ExecModal
