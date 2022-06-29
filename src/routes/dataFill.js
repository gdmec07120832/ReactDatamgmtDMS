import React from 'react'
import { loadComp } from './helper'

const dataFillRoutes = {
  name: 'dataFill',
  path: '/dataFill',
  component: ({ children }) => <>{children}</>,
  redirect: true,
  meta: {
    topMenu: true,
    title: '填报管理',
    auth: 'bi-data-reporting',
  },
  routes: [
    {
      name: 'dataFill-overview',
      path: '/dataFill/overview',
      exact: true,
      component: loadComp(() => import('../pages/DataFill/Overview/Overview')),
      meta: {
        title: '填报概览',
        auth: 'bi-data-reporting.OverviewController.getBacklogOverview'
      }
    },
    {
      name: 'dataFill-todo',
      path: '/dataFill/todo',
      exact: true,
      component: loadComp(() => import('../pages/DataFill/FillTodos/TodoIndex')),
      meta: {
        title: '填报工作台',
        auth: 'bi-data-reporting',
      },
    },
    {
      name: 'dataFill-todo_templateRecord',
      path: '/dataFill/todo/templateRecord/record/:id',
      exact: true,
      component: loadComp(() => import('../pages/DataFill/DataFillPage/ImportRecord')),
      meta: {
        parent: 'dataFill-todo',
        title: '{}填报记录',
        auth: false,
      },
    },
    {
      name: 'dataFill-todo_templateAllData',
      path: '/dataFill/fill/templateRecord/allData/:templateId',
      exact: true,
      component: loadComp(() => import('../pages/DataFill/DataFillPage/AuditDataList')),
      meta: {
        parent: 'dataFill-todo_templateRecord',
        title: '全部数据',
        auth: false,
      },
    },
    {
      name: 'dataFill-todo_templateRecord_fileDetail',
      path: '/dataFill/todo/templateRecord/record/:recordId/detail/:fileId',
      exact: true,
      component: loadComp(() => import('../pages/DataFill/DataFillPage/importFileDetail')),
      meta: {
        parent: 'dataFill-todo_templateRecord',
        title: '{}文件详情',
        auth: false,
      },
    },
    {
      name: 'dataFill-fill_fillAudit',
      path: '/dataFill/fill/fillAudit',
      component: loadComp(() => import('../pages/DataFill/DataFillPage/FillAuditListPage')),
      meta: {
        title: '填报审核',
        auth: 'bi-data-reporting.ExcelAuditController.list',
      },
    },
    {
      name: 'dataFill-cfg',
      path: '/dataFill/cfg',
      component: ({ children }) => <>{children}</>,
      redirect: true,
      meta: {
        title: '填报配置',
        auth: 'auto',
      },
      routes: [
        {
          name: 'dataFill-cfg_templateList',
          path: '/dataFill/cfg/templateList',
          exact: true,
          component: loadComp(() => import('../pages/DataFill/DataFillPage/DataFillTemplateIndex')),
          meta: {
            title: '模板配置',
            auth: 'bi-data-reporting.ExcelTemplateController.list',
          },
        },
        {
          name: 'dataFill-cfg_editTemplate',
          path: '/dataFill/cfg/templateList/editTemplate/:id',
          exact: true,
          component: loadComp(() => import('../pages/DataFill/DataFillPage/EditTemplate')),
          meta: {
            parent: 'dataFill-cfg_templateList',
            title: '编辑模板',
            auth: 'bi-data-reporting.ExcelTemplateController.saveOrUpdate',
          },
        },
        {
          name: 'dataFill-cfg_importRecord',
          path: '/dataFill/cfg/templateList/record/:id',
          exact: true,
          component: loadComp(() => import('../pages/DataFill/DataFillPage/ImportRecord')),
          meta: {
            parent: 'dataFill-cfg_templateList',
            title: '{}导入记录',
            auth: false,
          },
        },
        {
          name: 'dataFill-cfg_importRecord_fileDetail',
          path: '/dataFill/cfg/templateList/record/:recordId/detail/:fileId',
          exact: true,
          component: loadComp(() => import('../pages/DataFill/DataFillPage/importFileDetail')),
          meta: {
            parent: 'dataFill-cfg_importRecord',
            title: '{}文件详情',
            auth: false,
          },
        },
        {
          name: 'dataFill-cfg_templateCate',
          path: '/dataFill/cfg/templateCate',
          component: loadComp(() => import('../pages/DataFill/DataFillCfg/TemplateCate')),
          meta: {
            title: '模板分类',
            auth: 'bi-data-reporting.ExcelCategoryController.list',
          },
        },
        {
          name: 'dataFill-cfg_syncTarget',
          path: '/dataFill/cfg/syncTarget',
          component: loadComp(() => import('../pages/DataFill/DataFillCfg/SyncTarget')),
          meta: {
            title: '同步机器管理',
            auth: 'bi-data-reporting.MisSyncTargetController.list',
          },
        },
      ],
    },
  ],
}

export default dataFillRoutes
