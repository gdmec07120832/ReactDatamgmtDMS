import cloneDeep from 'lodash/cloneDeep'

const InitState = {
  userInfo: {},
  isTokenTimeout: false,
  permissionsMap: {},
}

const user = (state = InitState, action) => {
  switch (action.type) {
    case 'SET_USER_INFO':
      const permissionsMap = action.userInfo.permissions.reduce((acc, cur) => {
        const keys = cur.split('.')
        for (let i in keys) {
          let item = keys.slice(0, Number(i) + 1).join('.')
          acc[item] = true
        }
        return acc
      }, {})
      return {
        ...cloneDeep(state),
        userInfo: {
          ...action.userInfo,
          permissionsMap, // 兼容旧代码
        },
        permissionsMap
      }
    case 'SET_TOKEN_TIMEOUT':
      return {
        ...cloneDeep(state),
        isTokenTimeout: action.isTokenTimeout
      }
    default:
      return state
  }
}

export default user
