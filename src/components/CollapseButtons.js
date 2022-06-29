import React from 'react'
import { Button, Dropdown, Menu, Space } from 'antd'
import { DownOutlined } from '@ant-design/icons'

function CollapseButtons(props) {
  const { children, max = 3 } = props
  if (!Array.isArray(children)) {
    return children
  }

  const _children = children.filter(Boolean)
  const len = _children.length
  let showButtons
  let collapsedButtons = []
  if (len > max) {
    showButtons = _children.slice(0, max - 1)
    collapsedButtons = _children.slice(max - 1).map((item, index) => {
      return <Menu.Item key={index}>{item}</Menu.Item>
    })
  } else {
    showButtons = _children
  }
  return (
    <Space>
      {showButtons}
      {len > max && (
        <Dropdown
          overlay={<Menu>{collapsedButtons}</Menu>}
          overlayClassName={'collapsedButtonsDropdownWrapper'}
          trigger={['click']}
          overlayStyle={{ zIndex: 1029 }}>
          <Button type={'link'} size={'small'}>
            更多
            <DownOutlined />
          </Button>
        </Dropdown>
      )}
    </Space>
  )
}

export default CollapseButtons
