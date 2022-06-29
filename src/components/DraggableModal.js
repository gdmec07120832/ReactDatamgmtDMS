import React, { useRef, useState } from 'react'
import { Modal } from 'antd'
import Draggable from 'react-draggable'

DraggableModal.propTypes = {
  ...Modal.propTypes,
}

function DraggableModal(props) {
  const dragRef = useRef()
  const [disabled, setDisabled] = useState(true)
  const [bounds, setBounds] = useState({ left: 0, right: 0, top: 0, bottom: 0 })
  const handleDrag = (event, uiData) => {
    const { clientWidth, clientHeight } = window?.document?.documentElement
    const targetRect = dragRef?.current?.getBoundingClientRect()
    setBounds({
      left: -targetRect?.left + uiData?.x,
      right: clientWidth - (targetRect?.right - uiData?.x),
      top: -targetRect?.top + uiData?.y,
      bottom: clientHeight - (targetRect?.bottom - uiData?.y),
    })
  }

  const Title = function () {
    return (
      <div
        style={{ width: '100%', cursor: 'move' }}
        onMouseOver={() => {
          if (disabled) {
            setDisabled(false)
          }
        }}
        onMouseOut={() => {
          setDisabled(true)
        }}>
        {props.title}
      </div>
    )
  }
  return (
    <Modal
      {...props}
      title={<Title />}
      modalRender={(modal) => (
        <Draggable
          bounds={bounds}
          disabled={disabled}
          onStart={(event, uiData) => {
            handleDrag(event, uiData)
          }}>
          <div ref={dragRef}>{modal}</div>
        </Draggable>
      )}>
      {props.children}
    </Modal>
  )
}

export default DraggableModal
