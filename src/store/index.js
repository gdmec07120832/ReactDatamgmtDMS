import { createStore, combineReducers } from 'redux'
import user from './reducers/user'
import menu from './reducers/menu'
import permission from './reducers/permission'
import metadata from './reducers/metadata'
import list from './reducers/list'
import routes from './reducers/routes';

const rootReducer = combineReducers({
  user,
  menu,
  permission,
  metadata,
  list,
  routes
})

export default createStore(
  rootReducer,
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
)
