export const downloadByUrl = (path, filename) => {
  // Create a new link
  const anchor = document.createElement('a');
  anchor.href = path;
  anchor.download = filename;

  // Append to the DOM
  document.body.appendChild(anchor);

  // Trigger `click` event
  anchor.click();

  // Remove element from DOM
  document.body.removeChild(anchor);
};
/* eslint-disable  no-unused-expressions, no-cond-assign */
export const getBrowserVersion = () => {
  const sys = {};
  const ua = navigator.userAgent.toLowerCase();
  let s;
  (s = ua.match(/edge\/([\d.]+)/)) ? sys.edge = s[1] :
      (s = ua.match(/rv:([\d.]+)\) like gecko/)) ? sys.ie = s[1] :
          (s = ua.match(/msie ([\d.]+)/)) ? sys.ie = s[1] :
              (s = ua.match(/firefox\/([\d.]+)/)) ? sys.firefox = s[1] :
                  (s = ua.match(/chrome\/([\d.]+)/)) ? sys.chrome = s[1] :
                      (s = ua.match(/opera.([\d.]+)/)) ? sys.opera = s[1] :
                          (s = ua.match(/version\/([\d.]+).*safari/)) ? sys.safari = s[1] : 0;

  if (sys.edge) return { browser: "Edge", version : sys.edge, mainVersion: sys.edge?.split('.')?.[0]};
  if (sys.ie) return { browser: "IE", version : sys.ie,mainVersion: sys.ie?.split('.')?.[0]};
  if (sys.firefox) return { browser: "Firefox", version: sys.firefox,mainVersion: sys.firefox?.split('.')?.[0]};
  if (sys.chrome) return { browser: "Chrome", version: sys.chrome, mainVersion: sys.chrome?.split('.')?.[0]};
  if (sys.opera) return { browser: "Opera", version: sys.opera, mainVersion: sys.opera?.split('.')?.[0] };
  if (sys.safari) return { browser: "Safari", version: sys.safari,mainVersion: sys.safari?.split('.')?.[0] };
  return { browser: "", version : "0" };
}


export const downloadBlob = (blob, filename) => {
  if (typeof window.navigator.msSaveBlob !== 'undefined') {
    // 兼容IE，window.navigator.msSaveBlob：以本地方式保存文件
    window.navigator.msSaveBlob(blob, decodeURI(filename))
  } else {
    // 创建新的URL并指向File对象或者Blob对象的地址
    const blobURL = window.URL.createObjectURL(blob)
    // 创建a标签，用于跳转至下载链接
    const tempLink = document.createElement('a')
    tempLink.style.display = 'none'
    tempLink.href = blobURL
    tempLink.setAttribute('download', decodeURI(filename))
    // 兼容：某些浏览器不支持HTML5的download属性
    if (typeof tempLink.download === 'undefined') {
      tempLink.setAttribute('target', '_blank')
    }
    // 挂载a标签
    document.body.appendChild(tempLink)
    tempLink.click()
    document.body.removeChild(tempLink)
    // 释放blob URL地址
    window.URL.revokeObjectURL(blobURL)
  }
}

export const getParentKey = (key, tree) => {
  let parentKey;
  for (let i = 0; i < tree.length; i++) {
    const node = tree[i];
    if (node.children) {
      if (node.children.some(item => item.key === key)) {
        parentKey = node.key;
      } else if (getParentKey(key, node.children)) {
        parentKey = getParentKey(key, node.children);
      }
    }
  }
  return parentKey;
};


export const traverse = (nodeList, result = [],  childrenProp = 'children',) => {
  for (let node of nodeList) {
    result.push({
      ...node
    })
    if (node[childrenProp]?.length) {
      traverse(node[childrenProp], result)
    }
  }
  return result
}

export function list_to_tree(list, parentId = 'parentId', rootParentId = null) {
  let map = {}, node, roots = [], i;

  for (i = 0; i < list.length; i += 1) {
    map[list[i].id] = i; // initialize the map
    list[i].children = []; // initialize the children
  }

  for (i = 0; i < list.length; i += 1) {
    node = list[i];
    if (node[parentId] !== rootParentId) {
      // if you have dangling branches check that map[node.parentId] exists
      list[map[node[parentId]]].children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}
