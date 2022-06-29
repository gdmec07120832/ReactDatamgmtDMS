import React from 'react';
import {useRouteMatch} from 'react-router-dom';
import RoleCfg from '../PermissionCfg/RoleCfg';

function CloudRole() {
  const match = useRouteMatch()
  const matcher = (match.path).match(/\/dataService\/cloud\/(\w+)/)
  const type = matcher?.[1] || ''
  return (
      <RoleCfg cloud={true} type={type} />
  );
}

export default CloudRole;