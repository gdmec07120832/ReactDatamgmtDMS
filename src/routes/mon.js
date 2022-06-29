import React from 'react'
import {loadComp} from './helper'

const monRoutes = {
  name: 'mon',
  path: '/mon',
  component: ({children}) => (<>{children}</>),
  redirect: true,
  meta: {
    title: '运维监控',
    auth: 'auto'
  },
  routes: [
    {
      name: 'mon-monitor-techOP',
      path: '/mon/monitor/techOP',
      component: ({children}) => children,
      redirect: true,
      meta: {
        title: '技术运营数据',
        auth: 'auto'
      },
      routes: [
        {
          name: 'mon-monitor-techOP-dataMid',
          path:  '/mon/monitor/techOP/dataMid',
          component: loadComp(() => import('../pages/SysMon/Monitor/TechOpData/DataMid')),
          meta: {
            title: '数据中台',
            auth: 'bi-sys.SystemMonitorController.getBISystemMonitorDataDaily'
          }
        },
        {
          name: 'mon-monitor-techOP-mpmMid',
          path: '/mon/monitor/techOP/mpmMid',
          component: loadComp(() => import('../pages/SysMon/Monitor/TechOpData/MpmMid')),
          meta: {
            title: '研供中台',
            auth: 'bi-sys.SystemMonitorController.getMPMSystemMonitorData'
          }
        },
        {
          name: 'mon-monitor-techOP-finMid',
          path:  '/mon/monitor/techOP/finMid',
          component: loadComp(() => import('../pages/SysMon/Monitor/TechOpData/FinMid')),
          meta: {
            title: '财务中台',
            auth: 'bi-sys.SystemMonitorController.getFINSystemMonitorDataDaily'
          }
        },
        {
          name: 'mon-monitor-techOP-accStat',
          path:  '/mon/monitor/techOP/accStat',
          component: loadComp(() => import('../pages/SysMon/Monitor/TechOpData/AccidentStat')),
          meta: {
            title: '系统故障统计',
            auth: 'bi-sys.SystemMonitorController.getSystemAccidentGraph'
          }
        },
        {
          name: 'mon-monitor-techOP-releaseStat',
          path: '/mon/monitor/techOP/releaseStat',
          component: loadComp(() => import('../pages/SysMon/Monitor/TechOpData/ReleaseStat')),
          meta: {
            title: '系统发布统计',
            auth: 'bi-sys.SystemMonitorController.getReleaseStatistics'
          }
        }
      ]
    },
    {
      name: 'mon-monitor-serverMo',
      path: '/mon/monitor/serverMo',
      component: loadComp(() => import('../pages/SysMon/Monitor/ServerMo/ServerMo')),
      meta: {
        title: '服务器监控',
        // auth: false,
        auth: 'bi-sys.ServersMonitorController.getServerMonitorList'
      },
    },
    {
      name: 'mon-monitor-appMo',
      path: '/mon/monitor/appMo',
      component: loadComp(() => import('../pages/SysMon/Monitor/AppMo/AppMo')),
      meta: {
        title: '应用监控',
        auth: 'bi-sys.AppMonitorController.getAppMonitorList'
      },
    },
    {
      name: 'mon-monitor-tomcat',
      path: '/mon/monitor/tomcat',
      exact: true,
      component: loadComp(() => import('../pages/SysMon/Monitor/TomcatMgmt/TomcatMgmt')),
      meta: {
        title: 'tomcat管理',
        // auth: 'bi-sys.LinuxTomcatController.page'
        auth: process.env.REACT_APP_RELEASE_ENV === 'pro' ? 'nil' : 'bi-sys.LinuxTomcatController.page'
      },
    },
    {
      name: 'mon-monitor-tomcat-logs',
      path: '/mon/monitor/tomcat/logs',
      component: loadComp(() => import('../pages/SysMon/Monitor/TomcatMgmt/Logs')),
      meta: {
        title: 'tomcat操作日志',
        auth: 'bi-sys.LinuxTomcatLogController.pageList',
        parent: 'mon-monitor-tomcat'
      }
    },
    {
      name: 'mon-monitor-oggMo',
      path: '/mon/monitor/oggMo',
      component: loadComp(() => import('../pages/SysMon/Monitor/OggMo')),
      meta: {
        title: 'ogg监控',
        auth: 'bi-auto-deploy.OggMonitorController.list'
      },
    },
    {
      name: 'mon-monitor-slaveDbCheck',
      path: '/mon/monitor/slaveDbCheck',
      component: loadComp(() => import('../pages/SysMon/Monitor/SlaveHealthCheck/SlaveHealthCheck')),
      meta: {
        title: '从库健康检查',
        auth: 'bi-sys.SlaveHealthCheckController.getSlaveList'
      },
    }
  ]
}


export default monRoutes