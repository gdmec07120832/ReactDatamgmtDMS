import React, { Component } from 'react'
import { Route, Redirect, Switch } from 'react-router-dom'

class RenderRoutes extends Component {
  render () {
    const { routes, redirect } = this.props
    return (
      <Switch>
        {
          routes.map(route => {
            const { component, ...rest } = route
            return <Route key={route.name} {...rest}>
              {
                <route.component>
                  {
                    route.routes && route.routes.length ?
                      <RenderRoutes routes={route.routes} redirect={route.redirect}/> : null
                  }
                </route.component>
              }
            </Route>
          })
        }
        {
          redirect ? <Redirect to={routes.filter(r => !r.meta?.parent)[0].path}/> : null
        }
      </Switch>
    )
  }
}

export default RenderRoutes
