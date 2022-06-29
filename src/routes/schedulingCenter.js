import React from 'react'
import { loadComp } from './helper'

const schedulingCenterRoutes = {
  name: 'schedulingCenter',
  path: '/schedulingCenter',
  component: ({ children }) => <>{children}</>,
  redirect: true,
  meta: {
    title: '调度中心',
    auth: false,
  },
  routes: [
    {
      name: 'schedulingCenter-index',
      path: '/schedulingCenter/index',
      component: loadComp(() => import('../pages/SchedulingCenter/Index/Index')),
      meta: {
        title: '调度概览',
        auth: 'bi-task-scheduling-system',
      },
    },
    {
      name: 'schedulingCenter-groupMgmt',
      path: '/schedulingCenter/groupMgmt',
      component: loadComp(() => import('../pages/SchedulingCenter/GroupMgmt/GroupMgmt')),
      meta: {
        title: '分组管理',
        auth: 'bi-task-scheduling-system.GroupController',
      },
    },
    {
      name: 'schedulingCenter-jobMgmt',
      exact: true,
      path: '/schedulingCenter/jobMgmt',
      component: loadComp(() => import('../pages/SchedulingCenter/JobMgmt/JobMgmt')),
      meta: {
        title: '作业管理',
        auth: 'bi-task-scheduling-system.JobController',
      },
    },
    {
      name: 'schedulingCenter-jobMgmt-jobDetail',

      path: '/schedulingCenter/jobMgmt/jobDetail/:id',
      component: loadComp(() => import('../pages/SchedulingCenter/JobMgmt/JobLogList')),
      meta: {
        parent: 'schedulingCenter-jobMgmt',
        title: '作业日志',
        auth: false
      }
    },
    {
      name: 'schedulingCenter-hrchyMgmt',
      path: '/schedulingCenter/hrchyMgmt',
      component: loadComp(() => import('../pages/SchedulingCenter/HRCHYMgmt/HrchyMgmt')),
      meta: {
        title: '层级管理',
        auth: 'bi-task-scheduling-system.LevelController',
      },
    },
    {
      name: 'schedulingCenter-jobExtMgmt',
      path: '/schedulingCenter/jobExtMgmt',
      component: loadComp(() => import('../pages/SchedulingCenter/JobExtMgmt/JobExtMgmt')),
      meta: {
        title: '作业拓展管理',
        auth: 'bi-task-scheduling-system.ExpandController',
      },
    },
    {
      name: 'schedulingCenter-realtimePlatform',
      path: '/schedulingCenter/realtimePlatform',
      component: ({children}) => children,
      meta: {
        title: '实时平台',
        auth: 'auto'
      },
      routes: [
        {
          name: 'schedulingCenter-realtimePlatform-jobMgmt',
          path: '/schedulingCenter/realtimePlatform/jobMgmt',
          component: loadComp(() => import('../pages/SchedulingCenter/RealtimePlatform/JobMgmt')),
          meta: {
            title: '作业管理',
            auth: 'bi-task-scheduling-system.RealTimePlatform.jobManager'
          }
        },
        {
          name: 'schedulingCenter-realtimePlatform-dataDevelopment',
          path: '/schedulingCenter/realtimePlatform/dataDevelopment',
          component: loadComp(() => import('../pages/SchedulingCenter/RealtimePlatform/DataDevelopment')),
          meta: {
            title: '数据开发',
            auth: 'bi-task-scheduling-system.RealTimePlatform.dataDevelopment'
          }
        },
        {
          name: 'schedulingCenter-realtimePlatform-operationsCenter',
          path: '/schedulingCenter/realtimePlatform/operationsCenter',
          component: loadComp(() => import('../pages/SchedulingCenter/RealtimePlatform/OperationsCenter')),
          meta: {
            title: '运维中心',
            auth: 'bi-task-scheduling-system.RealTimePlatform.operationsCenter'
          }
        },
        {
          name: 'schedulingCenter-realtimePlatform-registrationCenter',
          path: '/schedulingCenter/realtimePlatform/registrationCenter',
          component: loadComp(() => import('../pages/SchedulingCenter/RealtimePlatform/RegistrationCenter')),
          meta: {
            title: '注册中心',
            auth: 'bi-task-scheduling-system.RealTimePlatform.registrationCenter'
          }
        },
        {
          name: 'schedulingCenter-realtimePlatform-systemManagement',
          path: '/schedulingCenter/realtimePlatform/systemManagement',
          component: loadComp(() => import('../pages/SchedulingCenter/RealtimePlatform/SystemManagement')),
          meta: {
            title: '系统设置',
            auth: 'bi-task-scheduling-system.RealTimePlatform.systemManagement'
          }
        },
      ]
    }
  ],
}

export default schedulingCenterRoutes
