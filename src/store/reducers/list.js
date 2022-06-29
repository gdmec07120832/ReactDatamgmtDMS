import cloneDeep from 'lodash/cloneDeep'
const InitState = {
  userList: []
}

const list = (state = InitState, action) => {
  switch (action.type) {
    case 'set_userList':
      return {
        ...cloneDeep(state),
        userList: action.payload
      }
    default:
      return state
  }
}

export default list