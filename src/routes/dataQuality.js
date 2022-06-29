import React from 'react'
import { loadComp } from './helper'


const dataQualityRoutes =  {
  name: 'dataQuality',
  path: '/dataQuality',
  component: ({ children }) => (<>{children}</>),
  redirect: true,
  meta: {
    topMenu: true,
    title: '数据质量',
    auth: 'bi-data-quality'
  },
  routes: [
    {
      name: 'dataQuality-overview',
      path: '/dataQuality/overview',
      component: loadComp(() => import('../pages/DataQuality/Overview')),
      meta: {
        title: '质量概览',
        auth: 'bi-data-quality.HomeController'
      }
    },
    {
      name: 'dataQuality-plan',
      path: '/dataQuality/plan',
      exact: true,
      component: loadComp(() => import('../pages/DataQuality/PlanIndex')),
      meta: {
        title: '方案管理',
        auth: 'bi-data-quality.VerificationSchemeController.queryPage'
      }
    },
    {
      name: 'dataQuality-plan-detail',
      exact: true,
      path: '/dataQuality/plan/:id',
      component: loadComp(() => import('../pages/DataQuality/PlanV2')),
      meta: {
        parent: 'dataQuality-plan',
        title: '方案配置',
        auth: 'bi-data-quality.VerificationSchemeController.saveOrUpdate'
      }
    },
    {
      name: 'dataQuality-plan-rule-check',
      exact: true,
      path: '/dataQuality/plan/:id/checkRule/:ruleId',
      component: loadComp(() => import('../pages/DataQuality/EditRule')),
      meta: {
        parent: 'dataQuality-plan-detail',
        title: '规则查看',
        auth: 'bi-data-quality.VerificationSchemeController.saveOrUpdate'
      }
    },
    {
      name: 'dataQuality-plan-rule-edit',
      exact: true,
      path: '/dataQuality/plan/:id/editRule/:ruleId',
      component: loadComp(() => import('../pages/DataQuality/EditRule')),
      meta: {
        parent: 'dataQuality-plan-detail',
        title: '规则编辑',
        auth: 'bi-data-quality.VerificationRuleController.saveOrUpdate'
      }
    },
    {
      name: 'dataQuality-ruleTempConfig',
      path: '/dataQuality/ruleTempConfig',
      component: loadComp(() => import('../pages/DataQuality/RuleTempConfig')),
      meta: {
        title: '规则模板',
        auth: 'bi-data-quality.RuleTemplateController.queryPage'
      }
    }
  ]
}

export default dataQualityRoutes
