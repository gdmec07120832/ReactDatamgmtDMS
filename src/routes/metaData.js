import React from 'react'
import { loadComp } from './helper'

const metaDataRoutes = {
  name: 'metaData',
  path: '/metaData',
  component: ({ children }) => <>{children}</>,
  redirect: true,
  meta: {
    topMenu: true,
    title: '元数据管理',
    auth: 'bi-metadata',
  },
  routes: [
    {
      name: 'metaDataOverview',
      path: '/metaData/overview',
      component: ({ children }) => <>{children}</>,
      redirect: true,
      meta: {
        title: '元数据概览',
        auth: 'auto',
      },
      routes: [
        {
          name: 'metaDataOverview-page',
          path: '/metaData/overview/page',
          component: loadComp(() => import('../pages/MetaData/MetaDataOverview/OverviewV2')),
          meta: {
            title: '元数据概览',
            auth: 'bi-metadata.MetadataOverviewController',
          },
        },
        {
          name: 'metaDataOverview-reportRelationship',
          path: '/metaData/overview/reportRelationship',
          component: loadComp(() => import('../pages/MetaData/MetaDataOverview/ReportRelationshipV2')),
          meta: {
            title: '报表血缘关系',
            auth: 'bi-auto-deploy.MetaDataController.list',
          },
        },
      ],
    },
    {
      name: 'metricsSys',
      path: '/metaData/metricsSys',
      component: ({ children }) => <>{children}</>,
      redirect: true,
      meta: {
        title: '指标体系',
        auth: 'auto',
      },
      routes: [
        {
          name: 'metricsDesign',
          path: '/metaData/metricsSys/metricsDesign',
          redirect: true,
          component: (props) => props.children,
          meta: {
            title: '指标设计',
            auth: 'bi-metadata.KpiNodeController.insertOrUpdate',
          },
          routes: [
            {
              name: 'metricsDesign-main',
              path: '/metaData/metricsSys/metricsDesign/main',
              component: loadComp(() => import('../pages/MetaData/MetricsSys/MetricsDesign/MetricsDesign')),
              meta: {
                title: '整体设计',
                auth: 'bi-metadata.KpiNodeController.insertOrUpdate',
              },
            },
            {
              name: 'metricsDesign-scenes',
              path: '/metaData/metricsSys/metricsDesign/scenes',
              component: () => <div className={'p-6'}>敬请期待</div>,
              meta: {
                title: '场景式指标集合',
                auth: 'bi-metadata.KpiNodeController.insertOrUpdate',
              },
            },
            {
              name: 'metricsDesign-relateReport',
              path: '/metaData/metricsSys/metricsDesign/relateReport',
              component: () => <div className={'p-6'}>敬请期待</div>,
              meta: {
                title: '报表关联指标集合',
                auth: 'bi-metadata.KpiNodeController.insertOrUpdate',
              },
            },
          ],
        },
        {
          name: 'metricsView',
          path: '/metaData/metricsSys/metricsView',
          component: loadComp(() => import('../pages/MetaData/MetricsSys/MetricsCheck/MetricsCheck')),
          meta: {
            title: '指标查阅',
            auth: 'bi-metadata.KpiNodeController.kpiNodeQueryPage',
          },
        },
        {
          name: 'metricsEdit',
          path: '/metaData/metricsSys/metricsEdit/create',
          component: loadComp(() => import('../pages/MetaData/IndicatorSys/IndicatorCreate/IndicatorCreatePage')),
          meta: {
            title: '指标新建',
            auth: 'bi-metadata.KpiNodeController.insertOrUpdate',
            parent: 'metricsDesign',
          },
        },
        {
          name: 'metricsUpdate',
          path: '/metaData/metricsSys/metricsEdit/update/:id',
          component: loadComp(() => import('../pages/MetaData/IndicatorSys/IndicatorCreate/IndicatorCreatePage')),
          meta: {
            title: '指标更新',
            auth: 'bi-metadata.KpiNodeController.insertOrUpdate',
            parent: 'metricsDesign',
          },
        },
        {
          name: 'metricsCheck',
          path: '/metaData/metricsSys/metricsEdit/check/:id',
          component: loadComp(() => import('../pages/MetaData/IndicatorSys/IndicatorCreate/IndicatorCreatePage')),
          meta: {
            title: '指标查看',
            auth:  false,
            parent: 'metricsDesign',
          },
        },
        {
          name: 'metricsAudit',
          path: '/metaData/metricsSys/metricsAudit',
          component: loadComp(() => import('../pages/MetaData/IndicatorSys/IndicatorAudit/IndicatorAuditPage')),
          meta: {
            title: '指标审核',
            auth: 'bi-metadata.NodeAuditController.list',
          },
        },
        {
          name: 'metricsViewIntro',
          path: '/metaData/metricsSys/metricsViewIntro',
          component: loadComp(() => import('../pages/MetaData/MetricsViewIntro/MetricsViewIntro')),
          meta: {
            parent: 'metricsView',
            title: '指标查阅欢迎页',
            hideBreadcrumb: true,
            auth: false
          }
        },
        {
          name: 'metaDataCfg',
          path: '/metaData/metricsSys/metaDataCfg',
          component: ({ children }) => <>{children}</>,
          redirect: true,
          meta: {
            title: '基础配置',
            auth: 'auto',
          },
          routes: [
            {
              name: 'metaDataCfg-dimensionCfg',
              path: '/metaData/metricsSys/metaDataCfg/dimensionCfg',
              component: loadComp(() => import('../pages/MetaData/MetaDataCfg/DimensionCfg/DimensionCfgPage')),
              meta: {
                title: '指标维度',
                auth: 'bi-metadata.DimensionController.list',
              },
            },
            {
              name: 'metaDataCfg-datasourceCfg',
              path: '/metaData/metricsSys/metaDataCfg/datasourceCfg',
              component: loadComp(() => import('../pages/MetaData/MetaDataCfg/DatasourceCfg/DatasourceCfgPage')),
              meta: {
                title: '数据来源',
                auth: 'bi-metadata.DataSourceController.list',
              },
            },
            {
              name: 'metaDataCfg-bzField',
              path: '/metaData/metricsSys/metaDataCfg/bzField',
              component: loadComp(() => import('../pages/MetaData/MetaDataCfg/BzFieldCfg/BzFieldCfg')),
              meta: {
                title: '指标业务领域',
                auth: 'bi-metadata.KpiNodeController.insertOrUpdate',
              },
            },
          ],
        },
      ],
    },

    {
      name: 'modelMgmt',
      path: '/metaData/modelMgmt',
      component: ({ children }) => <>{children}</>,
      redirect: true,
      meta: {
        title: '模型管理',
        auth: 'auto',
      },
      routes: [
        {
          name: 'databaseModelMon',
          path: '/metaData/modelMgmt/databaseModelMon',
          component: loadComp(() => import('../pages/MetaData/DataWarehouseMon/DataWarehouseMon')),
          meta: {
            title: '数仓模型监控',
            auth: 'bi-metadata.DWModelMonitorController.getDWVolume',
          },
        },
        {
          name: 'databaseModelDesign',
          path: '/metaData/modelMgmt/databaseModelDesign',
          component: loadComp(() => import('../pages/MetaData/DatabaseModelDesign/DatabaseModelDesign')),
          meta: {
            title: '数仓模型管理',
            auth: 'bi-metadata.DWModelController.listTableModel',
          },
        },
        {
          name: 'databaseModelNaming',
          path: '/metaData/modelMgmt/databaseModelNaming',
          component: loadComp(() => import('../pages/MetaData/DatabaseNaming/NamingIndexPage')),
          meta: {
            title: '数仓模型规范',
            auth: 'bi-metadata.BiMtdTblNamingRulesController',
          },
        },
        {
          name: 'eltCodeSearch',
          path: '/metaData/modelMgmt/eltCodeSearch',
          component: loadComp(() => import('../pages/MetaData/KettleOnlineSearch/ETLSearch')),
          meta: {
            title: 'ETL代码搜索',
            auth: 'bi-auto-deploy.KettleJobController.list',
          },
        },
        {
          name: 'kettleSearch',
          path: '/metaData/modelMgmt/kettleSearch',
          component: loadComp(() => import('../pages/MetaData/KettleOnlineSearch/KettleSearch')),
          meta: {
            title: 'Kettle在线查询',
            auth: 'bi-auto-deploy.KettleJobController.list',
          },
        },
      ],
    },
  ],
}

export default metaDataRoutes
