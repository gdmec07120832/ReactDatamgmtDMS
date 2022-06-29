# 数据管理平台前端项目(React)

## 依赖安装

### 使用`yarn`来安装依赖

在`package.json`的目录（即当前目录）下执行

```
yarn
```

---

## 开始开发

编辑当前目录下的`dev-proxy.js`文件，配置开发服务器代理。

以下是参考配置，可根据实际情况修改:

```javascript
module.exports = {
  '/bi-dm': {
    target: 'http://sit.dm.bi.linshimuye.com:9020',
    changeOrigin: true,
    ws: false,
    pathRewrite: {
      '^/bi-dm': '/bi-dm',
    },
    secure: false,
  },
}
```

开发环境登录：

在当前目录下新建或编辑文件`.env.local.js`，内容如下：

```javascript
module.exports = {
  REACT_APP_token: 'DKWMDk3MTRSUmtzE277260E@MTY0MDA0ODQxNQ==', // 此处填写实际的token
}
```

**注意**： 

- 修改此文件后需重新编译
- 此文件勿提交到git

---

## 打包

```
# 生产
npm run build
# 或者yarn run build

# sit
npm run sit
# 或者yarn run sit
```
