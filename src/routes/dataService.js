import React from 'react'
import { loadComp } from './helper'

const dataServiceRoutes = {
  name: 'dataService',
  path: '/dataService',
  redirect: true,
  component: ({ children }) => children,
  meta: {
    title: '数据服务',
    auth: 'auto',
  },
  routes: [
    {
      name: 'dataService-overview',
      path: '/dataService/overview',
      component: loadComp(() => import('../pages/DataService/Overview/Overview')),
      meta: {
        title: 'API概览',
        auth: 'bi-mobile.ApiOverviewController.list',
      },
    },
    {
      name: 'dataService-SQLCfg',
      path: '/dataService/sqlCfg',
      redirect: true,
      component: ({ children }) => children,
      meta: {
        title: 'API配置',
        auth: 'auto',
      },
      routes: [
        {
          name: 'dataService-SQLCfg-pc',
          path: '/dataService/sqlCfg/pc',
          component: loadComp(() => import('../pages/DataService/SqlConfig/PcCfg')),
          meta: {
            title: '数据灯塔',
            auth: 'bi-mobile.DataInterfaceConfigController.list',
          },
        },
        // {
        //   name: 'dataService-SQLCfg-mobile',
        //   path: '/dataService/sqlCfg/mobile',
        //   component: loadComp(() => import('../pages/DataService/SqlConfig/MobileCfg')),
        //   meta: {
        //     title: '移动灯塔',
        //     auth: 'bi-mobile.DataInterfaceConfigController.list',
        //   },
        // },
        {
          name: 'dataService-SQLCfg-screen',
          path: '/dataService/sqlCfg/screen',
          component: loadComp(() => import('../pages/DataService/SqlConfig/ScreenCfg')),
          meta: {
            title: '数据大屏',
            auth: 'bi-mobile.DataInterfaceConfigController.list',
          },
        },
        {
          name: 'dataService-SQLCfg-dataMessage',
          path: '/dataService/sqlCfg/dataMessage',
          component: loadComp(() => import('../pages/DataService/SqlConfig/DataMsgCfg')),
          meta: {
            title: '数讯传送',
            auth: 'bi-mobile.DataInterfaceConfigController.list',
          },
        },
        {
          name: 'dataService-SQLCfg-external',
          path: '/dataService/sqlCfg/external',
          component: loadComp(() => import('../pages/DataService/SqlConfig/ExternalCfg')),
          meta: {
            title: '业务系统',
            auth: 'bi-mobile.DataInterfaceConfigController.list',
          },
        },
      ],
    },
    {
      name: 'dataService-productCfg',
      path: '/dataService/productCfg',
      component: (props) => props.children,
      redirect: true,
      meta: {
        title: '产品配置',
        auth: 'auto',
      },
      routes: [
        {
          name: 'dataService-productCfg-dataMessageCfg',
          path: '/dataService/productCfg/dataMessageCfg',
          component: loadComp(() => import('../pages/DataService/DataMessageCfg/DataMessageCfg')),
          meta: {
            title: '数讯传送',
            auth: 'bi-mobile.DataMessageConfigController.list',
          },
        },
      ],
    },
    {
      name: 'dataService-permission-mgmt',
      path: '/dataService/permissionMgmt',
      redirect: true,
      component: ({ children }) => children,
      meta: {
        title: '权限管理',
        auth: 'auto',
      },
      routes: [
        {
          name: 'dataService-permission-mgmt-permCfg',
          path: '/dataService/permissionMgmt/permCfg',
          component: loadComp(() => import('../pages/DataService/PermissionCfg/PermissionCfg')),
          meta: {
            title: '权限设置',
            auth: 'bi-mobile.ApiPermissionController.list',
          },
        },
        {
          name: 'dataService-permission-mgmt-roleCfg',
          path: '/dataService/permissionMgmt/roleCfg',
          component: loadComp(() => import('../pages/DataService/PermissionCfg/RoleCfg')),
          meta: {
            title: '角色配置',
            auth: 'bi-mobile.ApiRoleController.list',
          },
        },
      ],
    },
    {
      name: 'dataService-cloud',
      path: '/dataService/cloud',
      redirect: true,
      component: ({ children }) => children,
      meta: {
        title: '云数据服务',
        auth: 'bi-mobile-aliyun',
      },
      routes: [
        {
          name: 'dataService-cloud-mobileTerminal',
          path: '/dataService/cloud/MobileTerminal',
          component: ({ children }) => children,
          redirect: true,
          meta: {
            title: '移动灯塔',
            auth: 'bi-mobile-aliyun.AppPermission.MobileTerminal',
          },
          routes: [
            {
              name: 'dataService-cloud-mobileTerminal-sqlConfig',
              path: '/dataService/cloud/MobileTerminal/sqlConfig',
              component: loadComp(() => import('../pages/DataService/CloudSqlConfig')),
              meta: {
                title: 'API配置',
                auth: new Set(['bi-mobile-aliyun.DataInterfaceConfigController.list', 'bi-mobile-aliyun.AppPermission.MobileTerminal']),
              },
            },
            {
              name: 'dataService-cloud-mobileTerminal-dataSource',
              path: '/dataService/cloud/MobileTerminal/dataSource',
              component: loadComp(() => import('../pages/DataService/CloudDatasource/CloudDatasource')),
              meta: {
                title: '数据源配置',
                auth: new Set(['bi-mobile-aliyun.DatasourceConfigController.queryPage', 'bi-mobile-aliyun.AppPermission.MobileTerminal']),
              },
            },
            {
              name: 'dataService-cloud-mobileTerminal-apiAuth',
              path: '/dataService/cloud/MobileTerminal/apiAuth',
              component: loadComp(() => import('../pages/DataService/CloudApiAuth/CloudApiAuth')),
              meta: {
                title: 'API权限',
                auth: new Set(['bi-mobile-aliyun.ApiPermissionController.list', 'bi-mobile-aliyun.AppPermission.MobileTerminal']),
              },
            },
            {
              name: 'dataService-cloud-mobileTerminal-roleCfg',
              path: '/dataService/cloud/MobileTerminal/roleCfg',
              component: loadComp(() => import('../pages/DataService/CloudRole/CloudRole')),
              meta: {
                title: 'API角色',
                auth: new Set(['bi-mobile-aliyun.ApiRoleController.list', 'bi-mobile-aliyun.AppPermission.MobileTerminal']),
              },
            },
          ],
        },
        {
          name: 'dataService-cloud-digitalSupplier',
          path: '/dataService/cloud/DigitalSupplier',
          component: ({ children }) => children,
          redirect: true,
          meta: {
            title: '数字供应商',
            auth: 'bi-mobile-aliyun.AppPermission.DigitalSupplier',
          },
          routes: [
            {
              name: 'dataService-cloud-digitalSupplier-sqlConfig',
              path: '/dataService/cloud/DigitalSupplier/sqlConfig',
              component: loadComp(() => import('../pages/DataService/CloudSqlConfig')),
              meta: {
                title: 'API配置',
                auth: new Set(['bi-mobile-aliyun.DataInterfaceConfigController.list', 'bi-mobile-aliyun.AppPermission.DigitalSupplier']),
              },
            },
            {
              name: 'dataService-cloud-digitalSupplier-dataSource',
              path: '/dataService/cloud/DigitalSupplier/dataSource',
              component: loadComp(() => import('../pages/DataService/CloudDatasource/CloudDatasource')),
              meta: {
                title: '数据源配置',
                auth: new Set(['bi-mobile-aliyun.DatasourceConfigController.queryPage', 'bi-mobile-aliyun.AppPermission.DigitalSupplier']),
              },
            },
            {
              name: 'dataService-cloud-digitalSupplier-apiAuth',
              path: '/dataService/cloud/DigitalSupplier/apiAuth',
              component: loadComp(() => import('../pages/DataService/CloudApiAuth/CloudApiAuth')),
              meta: {
                title: 'API权限',
                auth: new Set(['bi-mobile-aliyun.ApiPermissionController.list', 'bi-mobile-aliyun.AppPermission.DigitalSupplier']),
              },
            },
            {
              name: 'dataService-cloud-digitalSupplier-roleCfg',
              path: '/dataService/cloud/DigitalSupplier/roleCfg',
              component: loadComp(() => import('../pages/DataService/CloudRole/CloudRole')),
              meta: {
                title: 'API角色',
                auth: new Set(['bi-mobile-aliyun.ApiRoleController.list', 'bi-mobile-aliyun.AppPermission.DigitalSupplier']),
              },
            },
            {
              name: 'dataService-cloud-digitalSupplier-pagePermCfg',
              path: '/dataService/cloud/DigitalSupplier/pagePermCfg',
              component: loadComp(() => import('../pages/DataService/CloudPagePerm/CloudPagePerm')),
              meta: {
                title: '页面权限',
                auth: new Set(['bi-mobile-aliyun.PagePermissionController.list', 'bi-mobile-aliyun.AppPermission.DigitalSupplier']),
              }
            },
            {
              name: 'dataService-cloud-digitalSupplier-relationCfg',
              path: '/dataService/cloud/DigitalSupplier/relationCfg',
              component: loadComp(() => import('../pages/DataService/_AppsCfg/DigitalSupplierCfg/RelationCfg')),
              meta: {
                title: '供应商维护',
                auth: new Set(['bi-mobile-aliyun.AppPermission.DigitalSupplier', 'bi-mobile-aliyun.SupplierController.list'])
              }
            }
          ],
        },
        {
          name: 'dataService-cloud-dashboard4BOSS',
          path: '/dataService/cloud/Dashboard4BOSS',
          component: ({ children }) => children,
          redirect: true,
          meta: {
            title: 'BOSS看板',
            auth: 'bi-mobile-aliyun.AppPermission.Dashboard4BOSS',
          },
          routes: [
            {
              name: 'dataService-cloud-dashboard4BOSS-sqlConfig',
              path: '/dataService/cloud/Dashboard4BOSS/sqlConfig',
              component: loadComp(() => import('../pages/DataService/CloudSqlConfig')),
              meta: {
                title: 'API配置',
                auth: new Set(['bi-mobile-aliyun.DataInterfaceConfigController.list', 'bi-mobile-aliyun.AppPermission.Dashboard4BOSS']),
              },
            },
            {
              name: 'dataService-cloud-dashboard4BOSS-dataSource',
              path: '/dataService/cloud/Dashboard4BOSS/dataSource',
              component: loadComp(() => import('../pages/DataService/CloudDatasource/CloudDatasource')),
              meta: {
                title: '数据源配置',
                auth: new Set(['bi-mobile-aliyun.DatasourceConfigController.queryPage', 'bi-mobile-aliyun.AppPermission.Dashboard4BOSS']),
              },
            },
            {
              name: 'dataService-cloud-dashboard4BOSS-apiAuth',
              path: '/dataService/cloud/Dashboard4BOSS/apiAuth',
              component: loadComp(() => import('../pages/DataService/CloudApiAuth/CloudApiAuth')),
              meta: {
                title: 'API权限',
                auth: new Set(['bi-mobile-aliyun.ApiPermissionController.list', 'bi-mobile-aliyun.AppPermission.Dashboard4BOSS']),
              },
            },
            {
              name: 'dataService-cloud-dashboard4BOSS-roleCfg',
              path: '/dataService/cloud/Dashboard4BOSS/roleCfg',
              component: loadComp(() => import('../pages/DataService/CloudRole/CloudRole')),
              meta: {
                title: 'API角色',
                auth: new Set(['bi-mobile-aliyun.ApiRoleController.list', 'bi-mobile-aliyun.AppPermission.Dashboard4BOSS']),
              },
            }
          ],
        },
      ],
    },
  ],
}

export default dataServiceRoutes
