import DraggableModal from '../../../../components/DraggableModal';
import CheckData from '../../components/CheckData';
import React from 'react';

const ViewFileDataModal = (props) => {
  const { current, setCurrent } = props
  const close = () => {
    setCurrent(null)
  }

  return (
      <DraggableModal width={1200} footer={null} destroyOnClose visible={current} onCancel={close} title={'查看文件数据'}>
        <CheckData forModal={true} fileId={current?.id} />
      </DraggableModal>
  )
}

export default ViewFileDataModal