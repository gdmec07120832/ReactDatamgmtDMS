import React from 'react'
import { TreeSelect } from 'antd'
import styled from 'styled-components'

const StyledTreeSelect = styled(TreeSelect)`
  .ant-select-selector {
    max-height: 200px;
    overflow-y: auto;
  }

  .ant-select-selection-overflow {
    display: block;
  }
  .ant-select-selection-overflow-item {
    display: block;
    .ant-select-selection-item {
      display: inline-flex;
    }
  }
`

export default StyledTreeSelect