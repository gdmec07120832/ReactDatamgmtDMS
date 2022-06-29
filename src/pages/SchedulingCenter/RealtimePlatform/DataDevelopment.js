import React from 'react';
import useAppHost from './useAppHost';

function DataDevelopment() {
  const host = useAppHost()
  const url = host + '/#/datastudio?hideTopMenu=1'
  return (
      <div className={'bg-white'} style={{height: 'calc(100vh - 135px)'}}>
        {
            host && <iframe title={'作业管理'} className={'w-full h-full'} frameBorder={0} src={url}></iframe>
        }
      </div>
  );
}

export default DataDevelopment;