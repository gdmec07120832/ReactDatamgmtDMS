import React, { useState } from 'react'
import {Button, InputNumber, Select} from 'antd'
import ChevronRight from '@material-ui/icons/ChevronRight'
import classNames from 'classnames'
import moment from 'moment'
import StyledDateRangePicker from '../../../../components/StyledDateRangePicker'
import styled from 'styled-components';
import orderBy from 'lodash/orderBy';


const StyledLabel = styled.span`
  width: 70px;
  line-height: 16px;
  position: relative;
  &:after {
    display: ${props => props.isRequired ? 'block' : 'none'};
    content: "*";
    color: red;
    position: absolute;
    left: -10px;
    top: 0;
  }
`

function DynamicQuery(props) {
  const { fields = [], onReset = () => {}, onQuery, form = {}, setForm } = props
  const [collapsed, setCollapsed] = useState(true)
  return !!fields.length ? (
    <div className={'grid grid-cols-4 gap-x-8 gap-y-4'}>
      {orderBy(fields, ['options'], ['desc']).slice(0, collapsed ? 3 : undefined).map((field, index) => (
        <div key={index} className={'flex space-x-2'}>
          <StyledLabel className={'flex-none'} isRequired={field.options === 'REQUIRED'}>
            {field.label}
          </StyledLabel>
          <div className={'flex-1 min-w-0'}>
            {field.colType === 'VARCHAR' && (
                <Select open={false} mode={'tags'} className={'w-full'} tokenSeparators={[',', '，']}
                        placeholder={field.label} allowClear value={form[field.prop + field.id]}
                        onChange={(v) => setForm((prev) => ({ ...prev, [field.prop + field.id]: v }))}
                />
            )}

            {field.colType === 'NUMBER' && (
              <InputNumber
                controls={false}
                placeholder={field.label}
                className={'w-full'}
                value={form[field.prop + field.id]}
                onChange={(v) => setForm((prev) => ({ ...prev, [field.prop + field.id]: v }))}
              />
            )}
            {field.colType === 'DATETIME' && (
              <StyledDateRangePicker
                style={{width: '100%'}}
                showTime={'HH:mm:ss'}
                format={'YYYY-MM-DD HH:mm:ss'}
                allowClear
                showNow={false}
                value={
                  form[field.prop + field.id]
                    ? [
                        form[field.prop + field.id][0] ? moment(form[field.prop + field.id][0]) : null,
                        form[field.prop + field.id][1] ? moment(form[field.prop + field.id][1]) : null,
                      ]
                    : []
                }
                onChange={(v, fv) => setForm((prev) => ({ ...prev, [field.prop + field.id]: fv }))}
              />
            )}
            {field.colType === 'DATE' && (
              <StyledDateRangePicker
                style={{width: '100%'}}
                format={'YYYY-MM-DD'}
                allowClear
                showNow={false}
                value={
                  form[field.prop + field.id]
                    ? [
                        form[field.prop + field.id][0] ? moment(form[field.prop + field.id][0]) : null,
                        form[field.prop + field.id][1] ? moment(form[field.prop + field.id][1]) : null,
                      ]
                    : []
                }
                onChange={(v, fv) => setForm((prev) => ({ ...prev, [field.prop + field.id]: fv }))}
              />
            )}
          </div>
        </div>
      ))}
      <div className={'flex justify-end space-x-4'} style={{ gridColumnStart: 4, gridColumnEnd: 5 }}>
        <Button key={'reset'} onClick={onReset}>重置</Button>
        <Button key={'query'} type={'primary'} onClick={onQuery}>
          查询
        </Button>
        {fields.length > 3 && (
          <span className={'flex text-blue-500 cursor-pointer'} onClick={() => setCollapsed((prevState) => !prevState)}>
            {collapsed ? '展开' : '收起'}
            <ChevronRight className={classNames('transform', collapsed ? 'rotate-90' : '-rotate-90')} />
          </span>
        )}
      </div>
    </div>
  ) : (
      <div>
        <div className={'text-center text-gray-300 text-sm'}>没有条件可供筛选</div>
        <div className={'text-right'}>
          <Button key={'query'} type={'primary'} onClick={onQuery}>
            查询
          </Button>
        </div>
      </div>
  )
}

export default DynamicQuery
