import React from 'react'
import {Badge, Menu} from 'antd'
import { Link } from 'react-router-dom'
import {connect, useSelector} from 'react-redux'
import styled from 'styled-components';

const filterValidChild = (route) => {
  return (route || []).filter((item) => {
    return !item?.meta?.parent
  })
}

const StyledMenu = styled(Menu)`
  overflow-y: auto;
  overflow-x: hidden;
  &::-webkit-scrollbar {
    width: 0;
  }
`

const StyledMenuItem = styled(Menu.Item)`
  &.ant-menu-item-selected a .ant-badge {
    color: var(--primary-color);
  }
`

function recursive(routes, menuBadges) {
  return filterValidChild(routes).map((route) => {
    return route.routes ? (
      filterValidChild(route.routes).length ? (
        <Menu.SubMenu key={route.name} title={route?.meta?.title}>
          {recursive(route.routes)}
        </Menu.SubMenu>
      ) : null
    ) : (
      <StyledMenuItem key={route.name}>
        <Link to={route.path}>
          <Badge count={menuBadges?.[route.name]} offset={[50, 8]}>
            {route?.meta?.title}
          </Badge>
        </Link>
      </StyledMenuItem>
    )
  })
}

function TreeMenu(props) {
  const routesNameMapV2 = useSelector(state => state.routes.routesNameMapV2)
  const { currentMenuIds } = props
  const selectedKeys = currentMenuIds.filter((m) => {
    return !routesNameMapV2[m]?.meta?.parent
  })
  const menuBadges = useSelector(state => state.menu.menuBadges)
  return (
    <StyledMenu
      mode="inline"
      key={currentMenuIds[0]}
      selectedKeys={[selectedKeys.slice(-1)[0]]}
      style={{ height: '100%', borderRight: 0 }}>
      {recursive(props.asideMenuList, menuBadges)}
    </StyledMenu>
  )
}

export default connect((state) => {
  const { menu } = state
  return {
    asideMenuList: menu.asideMenuList,
    currentMenuIds: menu.currentMenuIds,
  }
})(TreeMenu)
