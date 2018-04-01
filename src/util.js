const DATA_KEY = 'spa.data'
let uid = 0
// 工具类
export default class Util {
  // 中间件组合器
  static composeMiddlewares(funcs) {
    return Util._reduceReverse(funcs, (b, a) => function (ctx) {
      a(ctx, b)
    })
  }
  static _reduceReverse(arr, func) {
    let last = arr[arr.length - 1]
    arr.reverse().forEach((el) => {
      last = func(last, el)
    })
    return last
  }
  static GlobalData(key, value) {
    if (typeof value === 'undefined') {
      return window[DATA_KEY] && window[DATA_KEY][key]
    }
    if (typeof window[DATA_KEY] !== 'object') {
      window[DATA_KEY] = {}
    }
    window[DATA_KEY][key] = value
    return Util
  }
  static noop() {
    return null
  }
  static cookie(key, val) {
    if (typeof val === 'undefined') {
      const cookie = document.cookie.split(';')
        .map((x) => x.replace(/^\s+/, '')
        )
        .reduce((a, b) => {
          a[b.split('=')[0]] = b.split('=')[1]
          return a
        }, {})
      return cookie[key]
    }
    document.cookie = `${key}=${val}`
    return this
  }

  // 匹配器，匹配成功返回 rest 参数 失败返回 null
  // hash /main/1022 pattern: /main/:uid => {uid: 1022}
  static matcher(hash, pattern) {
    const patternItems = pattern.split('/').filter((x) => x).map((x) => {
      if (x.startsWith(':')) {
        return {
          rest: true,
          key: x.slice(1)
        }
      }
      return {
        rest: false,
        key: x
      }
    })

    const hashToken = Util.hashParser(hash)
    if (patternItems.length !== hashToken.path.length) {
      return null
    }
    let matched = true
    const result = {}
    patternItems.forEach((x, index) => {
      if (x.rest) {
        result[x.key] = hashToken.path[index]
        return
      }
      if (x.key !== hashToken.path[index]) {
        matched = false
      }
    })
    return matched ? result : null
  }
  static uid() {
    return uid++
  }
  // hash 解析器，返回 token
  // http://localhost/#path/ssvxs/211?search=url&name=formater
  // => [path, ssvxs , 211], {search: 'url', name : 'formater'}
  static hashParser(hash) {
    hash = decodeURIComponent(hash)
    let queries = hash.split('?')[1]
    if (queries) {
      queries = queries.split('&').filter((x) => x)
        .reduce((a, b) => {
          const key = b.split('=')[0]
          const val = b.split('=')[1]
          a[key] = val
          return a
        }, {})
    }
    return {
      path: hash.split('?')[0].split('/').filter((x) => x),
      queries
    }
  }
  // jsonp 接口用于调远程用户数据
  static jsonp(params, url, callback) {
    const callbackName = `func${Util.uid()}`
    const element = document.createElement('script')
    let queries = Object.keys(params).reduce((prev, key) => `${prev}${encodeURIComponent(key)}=${encodeURIComponent(params[key])}&`
      , '')
    queries = queries[queries.length - 1] === '&' ? queries.slice(0, queries.length - 1) : queries
    element.src = `${url}?callback=${callbackName}&${queries}`
    window[callbackName] = (data) => {
      callback(data)
      delete window[callbackName]
      document.body.removeChild(element)
    }
    document.body.appendChild(element)
  }
}
