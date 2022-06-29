import React from 'react'
import { connect } from 'react-redux'
import { compile, pathToRegexp } from 'path-to-regexp'
import { Layout, Menu, Breadcrumb, Dropdown, message } from 'antd'
import { CaretLeftOutlined, CaretRightOutlined, UserOutlined } from '@ant-design/icons'
import logo from '../../assets/logo.png'

import styles from './layout.module.less'
import { Link, withRouter } from 'react-router-dom'
import TreeMenu from './TreeMenu'
import axios from '../../utils/axios'
import filterDeep from 'deepdash/es/filterDeep'
import cloneDeep from 'lodash/cloneDeep'

const { Header, Sider } = Layout

const UserIconMenu = function ({ history }) {
  const logout = () => {
    axios.get('/bi-sys/api/user/biSysUser/logout').then(() => {
      message.success('退出成功')
      history.push('/login')
    })
  }

  const handleMenuClick = (payload) => {
    switch (payload.key) {
      case 'logout':
        logout()
        break
      default:
        ;(() => {})()
    }
  }

  return (
    <Menu onClick={handleMenuClick}>
      <Menu.Item key="logout">
        <div>退出</div>
      </Menu.Item>
    </Menu>
  )
}

class BaseLayout extends React.Component {
  state = {
    collapsed: false,
  }

  toggle = () => {
    this.setState((prevState) => ({
      collapsed: !prevState.collapsed,
    }))
  }

  handleBreadcrumbClick = (item, i) => {
    if (i === this.props.breadcrumb.length - 1) {
      return
    }
    const name = this.props.currentMenuIds[i]
    const route = this.props.routesNameMapV2[name]
    if (route) {
      const routePath = route.path
      const keys = []
      pathToRegexp(routePath, keys)
      if (keys.length) {
        const _index = this.props.currentMenuIds
          .filter((item) => {
            return /\/:[a-zA-Z]+/.test(this.props.routesNameMapV2[item].path)
          })
          .indexOf(name)
        const params = this.props.breadcrumbParams[_index]
        const realPath = compile(routePath, { encode: encodeURIComponent })(params)
        this.props.history.push(realPath)
      } else {
        this.props.history.push(route.path)
      }
    }
  }

  calcBreadcrumbTitle = (title) => {
    if (/{}/.test(title)) {
      const index = this.props.breadcrumb.filter((item) => /{}/.test(item)).indexOf(title)
      const params = this.props.breadcrumbParams[index]
      const _title = title.replace(/{}/g, params?.title || '')
      document.title = _title + '-林氏木业数据管理系统'
      return _title
    } else {
      return title
    }
  }

  topMenuList = [
    { title: '元数据管理', key: 'metaData', path: '/metaData', permission: 'bi-metadata', disabled: false },
    {
      title: '调度中心',
      key: 'schedulingCenter',
      path: '/schedulingCenter',
      permission: 'bi-metadata',
      disabled: false,
    },
    {
      title: '自动部署',
      key: 'autoDeploy',
      path: '/autoDeploy',
      permission: 'bi-auto-deploy.TaskController',
      disabled: false,
    },
    {
      title: '填报管理',
      key: 'dataFill',
      path: '/dataFill',
      permission: 'bi-data-reporting',
      disabled: false,
    },
    { title: '数据质量', key: 'dataQuality', path: '/dataQuality', permission: 'bi-data-quality', disabled: false },
    {
      title: '需求管理',
      key: 'requirementsMgmt',
      path: '/requirementsMgmt',
      permission: 'bi-auto-deploy.DemandController',
      disabled: false,
    },
    { title: '数据服务', key: 'dataService', path: '/dataService', permission: 'bi-mobile', disabled: false },
    { title: '运维监控', key: 'mon', path: '/mon', permission: 'bi-mon', disabled: false },
    { title: '取数工作台', key: 'fetchData', path: '/fetchData', permission: 'bi-data-fetch', disabled: false},
    { title: '后台管理', key: 'sys', path: '/sys', permission: 'bi-sys', disabled: false },
  ]

  filterRoutes = function (routes, permissionMap) {
    if (!routes) {
      return false
    }
    return filterDeep(
      routes,
      (item) => {
        const auth = item?.meta?.auth
        if(!item?.meta?.parent) {
          if(Array.isArray(auth) && auth.find(authKey => permissionMap?.[authKey])) {
            return true
          }
          if(Object.prototype.toString.call(auth) === '[object Set]' && Array.from(auth).every(authKey => permissionMap?.[authKey])) {
            return true
          }
          if (auth === false || (auth && permissionMap?.[auth])) {
            return true
          }
        }
      },
      { cloneDeep: cloneDeep, childrenPath: ['routes'] }
    )
  }

  render() {
    const currentMenu = this.props.routesNameMapV2[this.props.currentMenuIds.slice(-1)[0]]
    const hideBreadcrumb = currentMenu?.meta?.hideBreadcrumb
    const isIndex = this.props.location.pathname === '/index'
    return (
      <Layout style={{ height: '100%' }}>
        <Header className={styles.header}>
          <div className={styles.logo}>
            <Link to={'/'}>
              <div className={'flex space-x-2'}>
                <img width={24} src={logo} alt="logo"/>
                <div style={{lineHeight: '24px', height: 28}}>林氏数据管理系统</div>
              </div>
            </Link>
          </div>
          <Menu className={styles.menu} mode="horizontal" selectedKeys={[this.props.currentMenuIds[0]]}>
            {this.topMenuList.map((m) => {
              if (m.disabled) {
                return (
                  <Menu.Item disabled key={m.key}>
                    {m.title}
                  </Menu.Item>
                )
              }
              const hasChild = this.filterRoutes(this.props.routesNameMapV2[m.key]?.routes, this.props.permissionsMap)
              if (hasChild) {
                return (
                  <Menu.Item key={m.key}>
                    <Link to={m.path}>{m.title}</Link>
                  </Menu.Item>
                )
              }
              return null
            })}
          </Menu>
          <Dropdown overlay={UserIconMenu.bind(this, this.props)} trigger={['click']}>
            <div className={styles.userWrapper}>
              <span>
                {this.props.nameCn ? `${this.props.nameCn}(${this.props.userName})` : `${this.props.userName}`}
              </span>
              <UserOutlined className={styles.userIcon} />
            </div>
          </Dropdown>
        </Header>
        <Layout>
          <Sider
            style={{ display: isIndex ? 'none' : 'initial' }}
            className={styles.aside}
            width={this.state.collapsed ? 0 : 200}
            theme={'light'}>
            <TreeMenu />
            <div className={styles.collapseBtn} onClick={this.toggle}>
              {this.state.collapsed ? <CaretRightOutlined /> : <CaretLeftOutlined />}
            </div>
          </Sider>
          <Layout className={styles.layout}>
            {hideBreadcrumb ? null : (
              <Breadcrumb className={styles.breadcrumb}>
                {this.props.breadcrumb.map((item, i) => {
                  return (
                    <Breadcrumb.Item
                      key={item}
                      onClick={() => {
                        this.handleBreadcrumbClick(item, i)
                      }}
                      style={{ cursor: i === this.props.breadcrumb.length - 1 ? '' : 'pointer' }}>
                      {this.calcBreadcrumbTitle(item)}
                    </Breadcrumb.Item>
                  )
                })}
              </Breadcrumb>
            )}
            <div className={styles.layoutInner} id={'layoutInner'} style={{ position: 'relative' }}>
              {this.props.children}
            </div>
          </Layout>
        </Layout>
      </Layout>
    )
  }
}

export default connect((state) => {
  const { menu, user, routes } = state
  return {
    nameCn: user?.userInfo?.nameCn,
    userName: user?.userInfo?.userName,
    permissionsMap: user?.userInfo?.permissionsMap,
    routesNameMapV2: routes.routesNameMapV2,
    asideMenuList: menu.asideMenuList,
    currentMenuIds: menu.currentMenuIds,
    breadcrumb: menu.breadcrumb,
    breadcrumbParams: menu.breadcrumbParams,
  }
})(withRouter(BaseLayout))
