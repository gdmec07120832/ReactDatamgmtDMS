import React from 'react'
import { loadComp } from './helper'

export const fetchDataRoutes = {
  name: 'fetchData',
  path: '/fetchData',
  component: loadComp(() => import('../pages/FetchData/Main')),
  redirect: true,
  meta: {
    topMenu: true,
    title: '取数工作台',
    auth: 'bi-data-fetch'
  },
  routes: [
    {
      name: 'fetchData-fetch',
      path: '/fetchData/fetch',
      component: ({children}) => children,
      redirect: true,
      meta: {
        title: '模板取数',
        auth: 'bi-data-fetch.TemplateAccessController'
      },
      routes: [
        {
          name: 'fetchData-fetch_a',
          path: '/fetchData/fetch/a',
          meta: {
            title: '产品供应',
            auth:  'bi-data-fetch.TemplateAccessController.productSupply'
          },
          component: loadComp(() => import('../pages/FetchData/Fetch/FetchMain'))
        },
        {
          name: 'fetchData-fetch_b',
          path: '/fetchData/fetch/b',
          meta: {
            title: '品牌市场',
            auth:  'bi-data-fetch.TemplateAccessController.brandMarket'
          },
          component: loadComp(() => import('../pages/FetchData/Fetch/FetchMain'))
        },
        {
          name: 'fetchData-fetch_c',
          path: '/fetchData/fetch/c',
          meta: {
            title: '渠道销售',
            auth:  'bi-data-fetch.TemplateAccessController.channelSales'
          },
          component: loadComp(() => import('../pages/FetchData/Fetch/FetchMain'))
        },
        {
          name: 'fetchData-fetch_d',
          path: '/fetchData/fetch/d',
          meta: {
            title: '仓储物流',
            auth:  'bi-data-fetch.TemplateAccessController.warehousingLogistics'
          },
          component: loadComp(() => import('../pages/FetchData/Fetch/FetchMain'))
        },
        {
          name: 'fetchData-fetch_e',
          path: '/fetchData/fetch/e',
          meta: {
            title: '财务管理',
            auth:  'bi-data-fetch.TemplateAccessController.financialManagement'
          },
          component: loadComp(() => import('../pages/FetchData/Fetch/FetchMain'))
        },
        {
          name: 'fetchData-fetch_f',
          path: '/fetchData/fetch/f',
          meta: {
            title: '数字内控',
            auth:  'bi-data-fetch.TemplateAccessController.digitalControl'
          },
          component: loadComp(() => import('../pages/FetchData/Fetch/FetchMain'))
        },
        {
          name: 'fetchData-fetch_g',
          path: '/fetchData/fetch/g',
          meta: {
            title: '海外B2C',
            auth:  'bi-data-fetch.TemplateAccessController.overseasB2C'
          },
          component: loadComp(() => import('../pages/FetchData/Fetch/FetchMain'))
        },
      ]
    },
    {
      name: 'fetchData-fetchPage',
      path: '/fetchData/fetchBy/:id',
      component: loadComp(() => import('../pages/FetchData/Fetch/FetchDetail')),
      meta: {
        parent: 'fetchData-fetch',
        title: '取数详情',
        auth:  'bi-data-fetch.TemplateAccessController'
      }
    },
    {
      name: 'fetchData-audit',
      path: '/fetchData/audit',
      component: loadComp(() => import('../pages/FetchData/Approval/ApprovalPage')),
      meta: {
        title: '我的申请',
        auth: 'bi-data-fetch.BiDfSqlTempAuditController'
      }
    },
    {
      name: 'fetchData-download',
      path: '/fetchData/download',
      component: loadComp(() => import('../pages/FetchData/DownloadList/DownloadList')),
      meta: {
        title: '下载任务',
        auth: 'bi-data-fetch.BiDfDataFileController.list'
      }
    },
    {
      name: 'fetchData-cfg',
      path: '/fetchData/cfg',
      component: ({ children }) => <>{children}</>,
      redirect: true,
      meta: {
        title: '取数配置',
        auth: 'bi-data-fetch.BiDfSqlTemplateController'
      },
      routes: [
        {
          name: 'fetchData-cfg-temp-cfg',
          path: '/fetchData/cfg/temp-cfg',
          exact: true,
          component: loadComp(() => import('../pages/FetchData/Cfg/TempCfg')),
          meta: {
            title: '模板配置',
            auth:  'bi-data-fetch.BiDfSqlTemplateController.list'
          }
        },
        {
          name: 'fetchData-cfg-temp-cfg-create',
          path: '/fetchData/cfg/temp-cfg/create',
          component: loadComp(() => import('../pages/FetchData/Cfg/EditPage')),
          meta: {
            parent: 'fetchData-cfg-temp-cfg',
            title: '新增模板',
            auth:  'bi-data-fetch.BiDfSqlTemplateController.saveOrUpdate'
          }
        },
        {
          name: 'fetchData-cfg-temp-cfg-edit',
          path: '/fetchData/cfg/temp-cfg/edit/:id',
          component: loadComp(() => import('../pages/FetchData/Cfg/EditPage')),
          meta: {
            parent: 'fetchData-cfg-temp-cfg',
            title: '编辑模板',
            auth:  'bi-data-fetch.BiDfSqlTemplateController.saveOrUpdate'
          }
        }
      ]
    }
  ]
}