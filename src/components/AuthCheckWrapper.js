import React, { useCallback, useEffect, useState } from 'react'
import { Link, Redirect, useLocation } from 'react-router-dom'
import {connect, useSelector} from 'react-redux'
import { Button, Result } from 'antd'
import { match } from 'path-to-regexp'
import axios from '../utils/axios'
import cloneDeep from 'lodash/cloneDeep'
import filterDeep from 'deepdash/es/filterDeep'

const saveLog = (namePath, keys) => {
  setTimeout(() => {
    const path = namePath.join('/')
    axios.post('/bi-sys/api/user/systemLog/saveSystemLog', {
      logLevel: "INFO",
      description: keys,
      logType: "Web",
      opera: "WEB_PAGE_OPEN",
      content: path
    })
  })
}

const compareExpr = (expr, exprList) => {
  let valid = false
  const arr = expr.split('.')
  for (let item of exprList) {
    const arr0 = item.split('.').slice(0, arr.length)
    if (arr0.toString() === arr.toString()) {
      valid = true
      break
    }
  }
  return valid
}

const checkAuthExpr = (expr, exprList) => {
  if (expr === null || expr === undefined) {
    return false
  }
  if (expr === false || expr === 'auto') {
    return true
  }

  if(Array.isArray(expr)) {
    // 数组权限 包含任意一个权限 就算有权限
    return Boolean(expr.find(_expr => compareExpr(_expr, exprList)))
  } else if (Object.prototype.toString.call(expr) === '[object Set]') {
    return Array.from(expr).every(_ => _expr => compareExpr(_expr, exprList))
  }else {
    return compareExpr(expr, exprList)
  }
}

const LogWhenVisit = ({Comp, pathName}) => {
  const routesNameMapV2 = useSelector(state => state.routes.routesNameMapV2)
  const location = useLocation()
  const thisRoute = routesNameMapV2[pathName]
  if(!thisRoute.routes?.length) {
    const namePath = thisRoute.meta.namePath
    const matched = match(thisRoute.path,  { decode: decodeURIComponent })(location.pathname)
    let keys
    if(matched) {
      const params = matched.params
      keys = Object.keys(params).sort((a, b) => thisRoute.path.indexOf(a) - thisRoute.path.indexOf(b)).map((key) => {
        return params[key]
      }).join(',')
    }
    saveLog(namePath.map(name => routesNameMapV2[name]?.meta?.title).filter(Boolean), keys)
  }
  return Comp
}

function AuthCheckWrapper(props) {
  const location = useLocation()
  const routes = useSelector(state => state.routes.routes)
  const routesNameMapV2 = useSelector(state => state.routes.routesNameMapV2)

  let pathName = ''
  for (let name of Object.keys(routesNameMapV2).filter((name) => routesNameMapV2[name].path.startsWith('/'))) {
    const result = match(routesNameMapV2[name].path, { decode: decodeURIComponent })(location.pathname)
    if (result) {
      pathName = name
      break
    }
  }
  const currentRouteV2 = routesNameMapV2[pathName]
  const { userInfo, setUser, setMenu, setAsideMenu, isTokenTimeout } = props
  const [userInfoLoaded, setUserInfoLoaded] = useState(false)
  const filterAuthRoute = useCallback(
    (route) => {
      if (!route) {
        return []
      }
      return filterDeep(
        route,
        (item) => {
          const auth = item?.meta?.auth
          if(Array.isArray(auth) && auth.find(authKey => userInfo.permissionsMap?.[authKey])) {
            return true
          }
          if(Object.prototype.toString.call(auth) === '[object Set]' && Array.from(auth).every(authKey => userInfo.permissionsMap?.[authKey])) {
            return true
          }
          if (auth === false || (auth && userInfo.permissionsMap?.[auth])) {
            return true
          }
        },
        { cloneDeep: cloneDeep, childrenPath: ['routes'] }
      )
    },
    [userInfo.permissionsMap]
  )
  useEffect(() => {
    if (currentRouteV2) {
      const names = currentRouteV2.meta.namePath.map((name) => {
        return routesNameMapV2[name].meta.title
      })
      const name = names.slice(-1)[0]
      document.title = ((name ? name + '-' : '') + '林氏木业数据管理系统').replace(/{}/g, '')
      if (currentRouteV2.meta.namePath[0] === 'layout' && currentRouteV2.meta.namePath.length > 1) {
        const asideMenu = filterAuthRoute(routesNameMapV2[currentRouteV2.meta.namePath[1]].routes)
        setAsideMenu(asideMenu)
        setMenu(
          currentRouteV2.meta.namePath.slice(1),
          names.slice(1)
        )
      }
      if (currentRouteV2.path === '/login') {
        setUserInfoLoaded(true)
      } else {
        if (!userInfo.id) {
          axios
            .get('/bi-sys/api/user/biSysUser/getLoginUser')
            .then(({ data }) => {
              const { user, permissions } = data
              setUser({
                id: user.idUser,
                isAdmin: user.isAdmin === 1,
                userName: user.userName,
                nameCn: user.nameCn,
                permissions: permissions,
              })
            })
            .catch((err) => {
              console.log(err)
              if(err.code === 408) {
                // 没有权限
                setUser({
                  id: '-1',
                  userName: '-1',
                  nameCn: '-1',
                  permissions: []
                })
              }
            })
            .finally(() => {
              setUserInfoLoaded(true)
            })
        }
      }
    }
  }, [currentRouteV2, setMenu, setAsideMenu, userInfo.id, setUser, filterAuthRoute, routesNameMapV2])

  if (!currentRouteV2) {
    return (
      <Result
        status="404"
        title="404"
        subTitle="抱歉, 页面不存在"
        extra={
          <Button type="primary">
            <Link to={'/'}>回到首页</Link>
          </Button>
        }
      />
    )
  }
  const hasAuth =
    (userInfo.permissions || []).includes(currentRouteV2.meta?.auth) ||
    checkAuthExpr(currentRouteV2.meta?.auth, userInfo.permissions || [])
  const loggedIn = !!userInfo.id

  const childrenWithProps = React.Children.map(props.children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { routes: filterAuthRoute(routes) })
    }
    return child
  })

  return (
    <>
      {userInfoLoaded ? (
        currentRouteV2.path === '/login' ? (
          childrenWithProps
        ) : isTokenTimeout ? (
          <Redirect to={'/login'} />
        ) : loggedIn ? (
          hasAuth ? (
            <LogWhenVisit Comp={childrenWithProps} pathName={pathName}/>
          ) : (
            <Result
              status="403"
              subTitle="抱歉，您没有权限访问此页面"
              extra={
                <Button type={'primary'}>
                  <Link to={'/'}>回到首页</Link>
                </Button>
              }
              title="403"
            />
          )
        ) : (
          <Redirect to={'/login'} />
        )
      ) : (
        <></>
      )}
    </>
  )
}

export default connect(
  (state) => {
    const { user } = state
    return {
      userInfo: user.userInfo,
      isTokenTimeout: user.isTokenTimeout,
    }
  },
  (dispatch) => {
    return {
      setTopMenu: (topMenu) => {
        dispatch({
          type: 'set_top_menu',
          topMenu,
        })
      },
      setAsideMenu: (asideMenu) => {
        dispatch({
          type: 'set_asideMenuList',
          payload: asideMenu
        })
      },
      setMenu: (currentMenuIds, breadcrumb) => {
        dispatch({
          type: 'change_menu',
          currentMenuIds,
          breadcrumb,
        })
      },
      setUser: (userInfo) => {
        dispatch({
          type: 'SET_USER_INFO',
          userInfo,
        })
      },
    }
  }
)(AuthCheckWrapper)
