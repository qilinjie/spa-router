import Handlers from './handlers'

/** 用于存放数据 */
const PRIVATE_DATA_KEY = '__observe__'
/** 用于在代理对象中存放 handlers */
const HANDLERS_KEY = `${PRIVATE_DATA_KEY}.__handlers__`
/** 用于在代理对象中存放 property */
const PROP_KEY = `${PRIVATE_DATA_KEY}.__property__`

/** array 代理操作 */
const ARRAY_ORP = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse']

/**
 * 没有采用事件系统的观察者
 */
export default class Observer {
  constructor(data) {
    this._data = data
    Observer._observeObj(this._data)
  }
  static _observeObj(data) {
    if (typeof data !== 'object') {
      throw new TypeError('argument data must be object')
    }
    Object.keys(data).forEach((prop) => {
      defineProperty(data, prop, data[prop])
      if (typeof data[prop] === 'object') {
        Observer._observeObj(data[prop])
        // 嵌套的子对象的属性在发生变化时会通知父亲对象
        data[prop][HANDLERS_KEY].addHandler((childprop) => data[HANDLERS_KEY].notify(`${prop}.${childprop}`))
      }
      // array 操作也会通知
      if (Array.isArray(data[prop])) {
        ARRAY_ORP.forEach((opt) => {
          const arrayTarget = data[PROP_KEY][prop]
          arrayTarget[opt] = function () {
            Array.prototype[opt].apply(arrayTarget, arguments)
            data[HANDLERS_KEY].notify(prop)
          }
        })
      }
    })
  }
  /**
   * 外部观察接口
   * @param {Function} callback 回调函数
   * @returns {undefined}
   */
  onChange(callback) {
    this._data[HANDLERS_KEY].addHandler(callback)
  }
  data() {
    return this._data
  }
  /**
   * @param {string} key parentkey.childkey 形式
   * @returns {any} value
   */
  get(key) {
    const keys = key.split('.')
    const ctxkeys = keys.slice(0, keys.length - 1)
    let ctx = this._data
    ctxkeys.forEach(
      (x) => {
        ctx = ctx[x]
      }
    )
    return ctx[keys[keys.length - 1]]
  }
  /**
   * @param {string} key parentkey.childkey 形式
   * @param {any}  value 值
   * @returns {undefined}
   */
  set(key, value) {
    const keys = key.split('.')
    const ctxkeys = keys.slice(0, keys.length - 1)
    let ctx = this._data
    ctxkeys.forEach(
      (x) => {
        ctx = ctx[x]
      }
    )
    ctx[keys[keys.length - 1]] = value
  }
}

/**
 * @param {Object} obj 观察者对象
 * @param {string} prop 需要观察的属性
 * @param {any} val 需要观察属性的初始化值
 * @returns {undefined}
 */
export function defineProperty(obj, prop, val) {
  if (prop === PRIVATE_DATA_KEY) {
    throw new Error('cannot define private property')
  }
  if (typeof val === 'undefined') {
    val = obj[prop]
  }
  if (typeof obj[HANDLERS_KEY] === 'undefined') {
    obj[HANDLERS_KEY] = new Handlers()
  }
  if (typeof obj[PROP_KEY] === 'undefined') {
    obj[PROP_KEY] = {}
  }
  const handlers = obj[HANDLERS_KEY]
  obj[PROP_KEY][prop] = val
  Object.defineProperty(obj, prop, {
    get() {
      return obj[PROP_KEY][prop]
    },
    set(newVal) {
      if (newVal !== obj[PROP_KEY][prop]) {
        obj[PROP_KEY][prop] = newVal
        handlers.notify(prop)
      }
    }
  })
}
