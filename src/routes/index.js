import React from 'react'
import { loadComp } from './helper'
import sysRoutes from './sys'
import monRoutes from './mon'
import dataQualityRoutes from './dataQuality'
import metaDataRoutes from './metaData'
import dataFillRoutes from './dataFill'
import requirementsMgmtRoutes from './requirementsMgmt'
import autoDeployRoutes from './autoDeploy'
import schedulingCenterRoutes from './schedulingCenter'
import dataServiceRoutes from './dataService'
import {fetchDataRoutes} from './fetchData'
import IndexPage from '../pages/IndexPage/IndexPage'
/**
 * @meta
 *    @topMenu 是否是导航栏横向菜单
 *    @title 网页标题或菜单名称
 *    @auth 权限   1: false-> 不受权限控制
 *                2: 'bi-sys.xxx'-> 权限具体的key值，可在权限集中查找
 *                3:'auto': 取决于子菜单，若至少有一个子菜单有权限，则有权限，否则无权限
 */

let routes = [
  {
    path: '/login',
    exact: true,
    name: 'login',
    component: loadComp(() => import('../components/LoginPage')),
    meta: {
      title: '登录',
      auth: false,
    },
  },
  {
    path: '/403',
    exact: true,
    name: '403',
    component: () => <span>403 Forbidden</span>,
    meta: {
      title: '403',
      auth: false,
    },
  },
  {
    name: 'layout',
    path: '/',
    component: loadComp(() => import('../components/Layout/Layout')),
    meta: {
      auth: false,
    },
    redirect: true,
    routes: [
      {
        name: 'index',
        path: '/index',
        component: IndexPage,
        meta: {
          title: '首页',
          hideBreadcrumb: true,
          auth: false,
        },
      },
      dataQualityRoutes,
      sysRoutes,
      monRoutes,
      metaDataRoutes,
      dataFillRoutes,
      requirementsMgmtRoutes,
      autoDeployRoutes,
      schedulingCenterRoutes,
      dataServiceRoutes,
      fetchDataRoutes
    ],
  },
]



const transformToMap = (__routes) => {
  const ret = {}
  function traversalV2(_routes, parent = null) {
    _routes.forEach((r) => {
      const _r = { ...r }
      if (_r?.meta?.parent) {
        _r.meta.namePath = (ret[_r?.meta?.parent].meta.namePath || []).concat(_r.name)
      } else {
        _r.meta.namePath = (parent?.meta?.namePath || []).concat(_r.name)
        _r.auth = _r.meta?.auth === undefined ? true : !!_r.meta.auth
      }
      if (!ret[_r.name]) {
        ret[_r.name] = _r
      } else {
        console.error(`[${_r.name}]路由名称重复，请修改`)
      }
      if (_r.routes) {
        traversalV2(_r.routes, _r)
      }
    })
  }
  traversalV2(__routes)
  return {
    routesNameMapV2: ret,
    routes: __routes
  }
}



const {routesNameMapV2, routes: _routes} = transformToMap(routes)


window.routesNameMapV2 = routesNameMapV2
window.routes = _routes

export { routesNameMapV2, transformToMap }

export default _routes
