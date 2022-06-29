import React from 'react';
import {loadComp} from './helper';

const autoDeployRoutes = {
  name: 'autoDeploy',
  path: '/autoDeploy',
  component: (props) => props.children,
  redirect: true,
  meta: {
    topMenu: true,
    title: '自动部署',
    auth: 'auto'
  },
  routes: [
    {
      name: 'autoDeploy-taskDeploy',
      exact: true,
      path: '/autoDeploy/taskDeploy',
      component: loadComp(() => import('../pages/AutoDeploy/TaskDeploy/TaskDeploy')),
      meta: {
        title: '任务部署',
        auth: 'bi-auto-deploy.ReleaseTaskController.listReleased'
      }
    },
    {
      name: 'autoDeploy-taskMgmt',
      path: '/autoDeploy/taskMgmt',
      exact: true,
      component: loadComp(() => import('../pages/AutoDeploy/TaskMgmt/TaskMgmt')),
      meta: {
        title: '任务管理',
        auth: 'bi-auto-deploy.TaskController.listTaskForCreator'
      }
    },
    {
      name: 'autoDeploy-taskMgmt-edit',
      path: '/autoDeploy/taskMgmt/:taskId',
      exact: true,
      component: loadComp(() => import('../pages/AutoDeploy/TaskMgmt/Edit')),
      meta: {
        parent: 'autoDeploy-taskMgmt',
        title: `{}`,
        auth: false
      }
    },
    {
      name: 'autoDeploy-taskMgmt-check',
      path: '/autoDeploy/taskMgmt/:taskId/readonly',
      exact: true,
      component: loadComp(() => import('../pages/AutoDeploy/TaskMgmt/Edit')),
      meta: {
        parent: 'autoDeploy-taskMgmt',
        title: `{}`,
        auth: false
      }
    },
    {
      name: 'autoDeploy-taskAudit',
      path: '/autoDeploy/taskAudit',
      exact: true,
      component: loadComp(() => import('../pages/AutoDeploy/TaskAudit/TaskAudit')),
      meta: {
        title: '任务审核',
        auth: 'bi-auto-deploy.AuditTaskController.listAudit'
      }
    },
    {
      name: 'autoDeploy-taskAudit-check',
      path: '/autoDeploy/taskAudit/:taskId/readonly',
      exact: true,
      component: loadComp(() => import('../pages/AutoDeploy/TaskMgmt/Edit')),
      meta: {
        parent: 'autoDeploy-taskAudit',
        title: `{}`,
        auth: false
      }
    },
    {
      name: 'autoDeploy-taskDeploy-check',
      path: '/autoDeploy/taskDeploy/:taskId/readonly',
      exact: true,
      component: loadComp(() => import('../pages/AutoDeploy/TaskMgmt/Edit')),
      meta: {
        parent: 'autoDeploy-taskDeploy',
        title: `{}`,
        auth: false
      }
    }
  ]
}


export default autoDeployRoutes
