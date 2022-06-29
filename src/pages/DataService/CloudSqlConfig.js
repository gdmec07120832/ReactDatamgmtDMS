import React from 'react';
import SqlCfgBase from './components/SqlCfgBase';
import {useRouteMatch} from 'react-router-dom';

function CloudSqlConfig() {
  const match = useRouteMatch()
  const matcher = (match.path).match(/\/dataService\/cloud\/(\w+)/)
  const type = matcher?.[1] || ''
  return (
      <SqlCfgBase cloud={true} type={type} />
  );
}

export default CloudSqlConfig;