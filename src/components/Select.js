import React from 'react'
import { Select as BaseSelect } from 'antd'
import PropTypes from 'prop-types'

ExSelect.propTypes = {
  options: PropTypes.array.isRequired,
}

function ExSelect(props) {
  const { options = [], showSearch = true, ...restProps } = props
  return (
    <BaseSelect
      className={'flex-1'}
      style={{minWidth: 0}}
      {...restProps}
      showSearch={showSearch}
      filterOption={(input, option) => (option.children || option.label).toLowerCase().indexOf(input.toLowerCase()) >= 0}
      options={options.map(item => ({label: item.label, value: item.value, disabled: item.disabled}))}
    />
  )
}

export default ExSelect
