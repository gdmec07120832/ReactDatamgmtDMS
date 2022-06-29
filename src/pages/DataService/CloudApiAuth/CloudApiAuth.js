import React from 'react';
import {useRouteMatch} from 'react-router-dom';
import PermissionCfg from '../PermissionCfg/PermissionCfg';

function CloudApiAuth() {
  const match = useRouteMatch()
  const matcher = (match.path).match(/\/dataService\/cloud\/(\w+)/)
  const type = matcher?.[1] || ''
  return (
      <PermissionCfg cloud={true} type={type} />
  );
}

export default CloudApiAuth;