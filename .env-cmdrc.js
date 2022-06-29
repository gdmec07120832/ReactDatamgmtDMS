const path = require('path')
const fs = require('fs')
const commonVars = {
  BROWSER: 'none'
}

let envLocal = {}
const envLocalFile = path.resolve(__dirname, '.env.local.js')
if(fs.existsSync(envLocalFile)) {
//
  envLocal = require(envLocalFile)
}

module.exports = {
  dev: {
    ...commonVars,
    REACT_APP_RELEASE_ENV: 'dev',
    ...envLocal
  },
  sit: {
    ...commonVars,
    DISABLE_ESLINT_PLUGIN: true,
    REACT_APP_RELEASE_ENV: 'sit'
  },
  uat: {
    ...commonVars,
    DISABLE_ESLINT_PLUGIN: true,
    REACT_APP_RELEASE_ENV: 'uat'
  },
  pro: {
    ...commonVars,
    DISABLE_ESLINT_PLUGIN: true,
    REACT_APP_RELEASE_ENV: 'pro'
  }
}
