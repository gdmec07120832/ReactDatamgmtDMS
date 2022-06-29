import React from 'react'

import CloudDatasourceBase from '../components/CloudDatasourceBase';
import {useRouteMatch} from 'react-router-dom';

function CloudDatasource() {
  const match = useRouteMatch()
  const matcher = (match.path).match(/\/dataService\/cloud\/(\w+)/)
  const type = matcher?.[1] || ''
  return <CloudDatasourceBase type={type} />
}

export default CloudDatasource