import React from 'react';
import {Button} from 'antd';
const noop = function () {}

function TableQuery(props) {
  const {children, onSearch, onReset} = props
  return (
      <div className={'flex items-start'}>
        <div className={'flex-1 grid grid-cols-4 gap-x-6 gap-y-3'}>
          {children}
        </div>
        <div className={'ml-4'}>
          <div className={'flex justify-end'}>
            <Button type={'primary'} className={'mr-2'} onClick={onSearch || noop}>查询</Button>
            <Button className={'mr-2'} onClick={onReset || noop}>重置</Button>
          </div>
        </div>
      </div>
  );
}

export default TableQuery;