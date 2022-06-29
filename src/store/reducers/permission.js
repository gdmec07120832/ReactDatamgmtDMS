import cloneDeep from 'lodash/cloneDeep'
const InitState = {
  permissionTree: []
}

const permission = (state = InitState, action) => {
  switch (action.type) {
    case 'set_permission_tree':
      return {
        ...cloneDeep(state),
        permissionTree: action.payload
      }
    default:
      return InitState
  }
}

export default permission
