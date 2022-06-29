import cloneDeep from 'lodash/cloneDeep'
import { pick } from 'lodash'

const InitState = {
  breadcrumbParams: [],
  breadcrumb: [],
  currentMenuIds: [],
  asideMenuList: [],
  menuBadges: {}
}

const menu = (state = InitState, action) => {
  switch (action.type) {
    case 'change_menu':
      return {
        ...cloneDeep(state),
        breadcrumb: action.breadcrumb,
        currentMenuIds: action.currentMenuIds,
      }
    case 'set_asideMenuList':
      if (
        JSON.stringify((state.asideMenuList || []).map((item) => pick(item, ['name', 'path', 'meta']))) !==
        JSON.stringify((action.payload || []).map((item) => pick(item, ['name', 'path', ',meta'])))
      ) {
        return {
          ...cloneDeep(state),
          asideMenuList: action.payload,
        }
      } else {
        return state
      }
    case 'set_menuBadges':
      return  {
        ...cloneDeep(state),
        menuBadges: {
          ...state.menuBadges,
          ...action.payload
        }
      }
    case 'set_breadcrumb_params':
      return {
        ...cloneDeep(state),
        breadcrumbParams: action.payload,
      }
    default:
      return state
  }
}

export default menu
