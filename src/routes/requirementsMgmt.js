import React from 'react';
import {loadComp} from './helper';

const requirementsMgmtRoutes = {
  name: 'requirementsMgmt',
  path: '/requirementsMgmt',
  component: ({children}) => (<>{children}</>),
  redirect: true,
  meta: {
    topMenu: true,
    title: '需求管理',
    auth: 'auto'
  },
  routes: [
    {
      name: 'requirementsMgmt-list',
      path: '/requirementsMgmt/list',
      component: loadComp(() => import('../pages/RequirementsMgmt/RequirementsMgmt')),
      meta: {
        title: '需求管理',
        auth: 'bi-auto-deploy.DemandController.list'
      }
    },
    {
      name: 'requirementsMgmt-cfg',
      path: '/requirementsMgmt/cfg',
      component: ({children}) => (<>{children}</>),
      redirect: true,
      meta: {
        title: '需求管理配置',
        auth: 'auto'
      },
      routes: [
        {
          name: 'requirementsMgmt-cfg-flowTemplate',
          path: '/requirementsMgmt/cfg/flowTemplate',
          component: loadComp(() => import('../pages/RequirementsMgmt/FlowTemplateCfg')),
          meta: {
            title: '流程模板配置',
            auth: 'bi-auto-deploy.ProcessTemplateController.list'
          }
        },
        {
          name: 'requirementsMgmt-cfg-bizMode',
          path: '/requirementsMgmt/cfg/bizMode',
          component: loadComp(() => import('../pages/RequirementsMgmt/BizModeCfg')),
          meta: {
            title: '业务模块配置',
            auth: 'bi-auto-deploy.BusinessModeController.list'
          }
        }
      ]
    }
  ]
}

export default requirementsMgmtRoutes
