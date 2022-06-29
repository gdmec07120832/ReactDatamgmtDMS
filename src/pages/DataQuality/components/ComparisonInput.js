import React, { useState } from 'react'
import { Input, InputNumber, Select } from 'antd'
import {isNil} from 'lodash/lang';

function ComparisonInput({ value = {}, onChange, disabled }) {
  const [comparisonOperator, setComparisonOperator] = useState()
  const [threshold, setThreshold] = useState()

  const triggerChange = (changedValue) => {
    onChange?.({
      comparisonOperator,
      threshold,
      ...value,
      ...changedValue,
    })
  }

  const handleChange1 = (v) => {
    if (!('comparisonOperator' in value)) {
      setComparisonOperator(v)
    }

    triggerChange({
      comparisonOperator: v,
    })
  }

  const handleChange2 = (v) => {
    if (!('threshold' in value)) {
      setThreshold(v)
    }

    triggerChange({
      threshold: v,
    })
  }

  return (
    <Input.Group compact>
      <Select
        disabled={disabled}
        value={value.comparisonOperator || comparisonOperator}
        onChange={(v) => handleChange1(v)}
        style={{ width: '30%' }}>
        <Select.Option value={'>'}>&gt;</Select.Option>
        <Select.Option value={'>='}>&gt;=</Select.Option>
        <Select.Option value={'<'}>&lt;</Select.Option>
        <Select.Option value={'<='}>&lt;=</Select.Option>
        <Select.Option value={'!='}>!=</Select.Option>
        <Select.Option value={'=='}>==</Select.Option>
      </Select>
      <InputNumber
        disabled={disabled}
        style={{ width: 'calc(70% - 70px)' }}
        value={isNil(value.threshold) ? threshold : value.threshold}
        onChange={(v) => handleChange2(v)}
      />
      <div className={'inline-block text-right'} style={{ lineHeight: '30px', width: 70 }}>
        则为异常
      </div>
    </Input.Group>
  )
}

export default ComparisonInput
