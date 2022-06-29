const fs = require('fs')
const path = require('path')

const proxyFile = path.resolve(__dirname, 'dev-proxy.js')

if(!fs.existsSync(proxyFile)) {
 fs.writeFileSync(proxyFile,
   `module.exports = {
        '/bi-dm': {
        target: 'http://10.10.14.123:8000',
        changeOrigin: true,
        ws: false,
        pathRewrite: {
          '^/bi-dm': '',
        },
        secure: false,
      }
   }`
 )
}

exports.proxyFile = proxyFile
