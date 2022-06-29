import cloneDeep from 'lodash/cloneDeep'

const InitState = {
  overallExpandedIds: [],
  scenesExpandedIds: []
}

const metadata = (state = InitState, action) => {
  switch (action.type) {
    case 'set_overallExpandedIds':
      return {
        ...cloneDeep(state),
        overallExpandedIds: action.payload
      }
    case 'set_scenesExpandedIds':
      return {
        ...cloneDeep(state),
        scenesExpandedIds: action.payload
      }
    default:
      return state
  }
}

export default metadata
