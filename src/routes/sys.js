import React from 'react'
import {loadComp} from './helper'

const sysRoutes = {
  name: 'sys',
  path: '/sys',
  component: ({children}) => (<>{children}</>),
  redirect: true,
  meta: {
    title: '后台管理',
    auth: 'bi-sys'
  },
  routes: [
    {
      name: 'sys-app-user',
      path: '/sys/app/user',
      component: loadComp(() => import('../pages/SysMon/Sys/UserRole')),
      meta: {
        title: '用户与角色',
        auth: ['bi-sys.BISysUserController', 'bi-sys.BiSysRoleController']
      }
    },
    {
      name: 'sys-app-dingMSg',
      path: '/sys/app/dingMsg',
      component: loadComp(() => import('../pages/SysMon/Sys/MsgCfg')),
      meta: {
        title: '钉钉消息发送配置',
        auth: 'bi-sys.NoticeToObjController.list'
      }
    },
    {
      name: 'sys-app-dbCfg',
      path: '/sys/app/dbCfg',
      component: loadComp(() => import('../pages/SysMon/Sys/DbConfig')),
      meta: {
        title: '数据库连接配置',
        auth: 'bi-sys.DatasourceConfigController.queryPage'
      }
    },
    {
      name: 'sys-app-dict-config',
      path: '/sys/app/dictCfg',
      component: loadComp(() => import('../pages/SysMon/Sys/DictCfg')),
      meta: {
        title: '字典配置',
        auth: 'bi-sys.SysConstantController.listType'
      }
    },
    {
      name: 'sys-app-simple-schedule',
      path: '/sys/app/simple-schedule',
      component: loadComp(() => import('../pages/SysMon/Sys/SimpleSchedule/SimpleSchedule')),
      meta: {
        title: '工作地查看',
        auth: 'bi-sys.UserDefaultOfficeController.listSkdByMonth'
      }
    },
    {
      name: 'sys-app-task-schedule',
      path: '/sys/app/task-schedule',
      component: loadComp(() => import('../pages/SysMon/Sys/TaskSchedule/TaskSchedule')),
      meta: {
        title: '工作计划',
        auth: 'bi-sys.BiSysWorkPlanController'
      }
    }
  ]
}

export default sysRoutes
