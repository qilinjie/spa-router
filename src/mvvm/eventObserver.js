// 事件循环周期 单位毫秒
const EVENT_LOOP_DURATION = 50
const RESERVED_PROP_NAMES = ['__eventQueue', '__handlerQueue', '__intervalID', 'startObserve', 'stopObserve', 'onChange', '__observe__', '__scope__', '__get__', '__set__']
/** array 代理操作 */
const ARRAY_ORP = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse']

/**
 * 对非 Array 类型的对象进行深度观察，提供事件接口
 * 非 Array 对象的深层次的属性变化会向上冒泡，冒泡可以通过 event.stopPropagate() 停止
 * data 在被传入后，数据结构不应该被改变，也不应该有新的字段加入，除非是 Array 索引赋值，避免把非原始类型复制给字段
 * 对 Array 不作深度观察以提高性能 arr[0] = '' 这样的操作可以被观察到，但是 arr[1].name = 'xxx 不会被观察到
 */
export default class ObserverableObject {
  constructor(data) {
    this.__eventQueue = []
    this.__handlerQueue = {}
    this.__intervalID = null
    Object.keys(data).forEach((key) => {
      if (RESERVED_PROP_NAMES.filter((x) => x === key).length > 0) {
        throw new Error('reserved prop name')
      }
    })
    Object.assign(this, data)
    ObserverableObject.observe(this, '', this)
  }
  /**
    * @param {Oberserverable} observerable 观察者
    * @param {string} key parentkey.childkey 形式
    * @returns {any} value
    */
  static __get__(observerable, key) {
    if (key.indexOf('.') === -1) {
      return observerable[key]
    }
    const keys = key.split('.')
    const ctxkeys = keys.slice(0, keys.length - 1)
    let ctx = observerable
    ctxkeys.forEach(
      (x) => {
        ctx = ctx[x]
      }
    )
    return ctx[keys[keys.length - 1]]
  }
  /**
    *@param {Oberserverable} observerable 观察者
   * @param {string} key parentkey.childkey 形式
   * @param {any}  value 值
   * @returns {undefined}
   */
  static __set__(observerable, key, value) {
    if (key.indexOf('.') === -1) {
      observerable[key] = value
    }
    const keys = key.split('.')
    const ctxkeys = keys.slice(0, keys.length - 1)
    let ctx = observerable
    ctxkeys.forEach(
      (x) => {
        ctx = ctx[x]
      }
    )
    ctx[keys[keys.length - 1]] = value
  }
  /**
   * 检查 prop 是否是保留字
   * @param {string} prop 待检测的 prop
   * @returns {boolean} 是否是保留字
   */
  static isReservedProp(prop) {
    let isReservedProp = false
    if (RESERVED_PROP_NAMES.filter((x) => x === prop).length > 0) {
      isReservedProp = true
    }
    return isReservedProp
  }
  static observe(data, scope, observer) {
    const checkReserved = !(data instanceof ObserverableObject)
    if (typeof data !== 'object') {
      throw new TypeError('data must be object')
    }
    if (Array.isArray(data)) {
      ARRAY_ORP.forEach((opt) => {
        Object.defineProperty(data, opt, {
          enumerable: false,
          configurable: true,
          value() {
            ObserverableObject.removeObserve(data, false)
            Array.prototype[opt].apply(data, arguments)
            const event = new ChangeEvent()
            event.changedKey = scope
            event.target = data
            observer.trigger(event)
            Object.keys(data).forEach((key) => {
              ObserverableObject.defineProperty(data, key, data[key], observer, scope)
            })
          }
        })
      })
      Object.keys(data).forEach((key) => {
        if (!checkReserved && ObserverableObject.isReservedProp(key)) {
          return
        }
        ObserverableObject.defineProperty(data, key, data[key], observer, scope)
      })
      return
    }
    Object.keys(data).forEach((key) => {
      if (!checkReserved && ObserverableObject.isReservedProp(key)) {
        return
      }
      ObserverableObject.defineProperty(data, key, data[key], observer, scope)
      if (typeof data[key] === 'object') {
        const childScope = scope === '' ? key : `${scope}.${key}`
        ObserverableObject.observe(data[key], childScope, observer)
      }
    })
  }
  /**
   * 开始观察，监听变化
   * @returns {ObserberableObject} 返回自己
   */
  startObserve() {
    this.__intervalID = setInterval(() => {
      if (this.__eventQueue.length > 0) {
        const event = this.__eventQueue.shift()
        if (this.__handlerQueue[event.changedKey]) {
          this.__handlerQueue[event.changedKey].forEach((fn) => fn(event))
        }
        const handlersSet = Object.keys(this.__handlerQueue).filter((x) => event.changedKey.startsWith(x) && x !== event.changedKey)
          .sort(
            (a, b) => b.length - a.length
          )
          .map(
            (x) => this.__handlerQueue[x]
          )
        if (!handlersSet || handlersSet.length === 0) {
          return
        }
        for (let i = 0; i < handlersSet.length; i++) {
          if (event._isStopPropagated) {
            break
          }
          handlersSet[i].forEach((fn) => fn(event))
        }
      }
    }, EVENT_LOOP_DURATION)
    return this
  }
  /**
   * 停止观察，取消监听
   * @returns {ObserberableObject} 返回自己
   */
  stopObserve() {
    if (this.__intervalID) {
      clearInterval(this._intervalID)
      this._intervalID = null
    }
    return this
  }
  /**
   * @param {string} changedKey 监听变化的 prop，可以是 prop.prop.prop 嵌套形式
   * @param {Function} handler  接受参数为 ChangeEvent 类型的 handler
   * @returns {ObserberableObject} 返回自己
   */
  onChange(changedKey, handler) {
    if (!this.__handlerQueue[changedKey]) {
      this.__handlerQueue[changedKey] = []
    }
    this.__handlerQueue[changedKey].push(handler)
    return this
  }
  /**
   * @param {ChaneeEvent} event 触发事件
   * @returns {ObserberableObject} 返回自己
   */
  trigger(event) {
    this.__eventQueue.push(event)
    return this
  }
  /**
   * @param {Object} obj 被观察的对象
   * @param {string} prop 需要被观察的对象的属性名
   * @param {any} value 被观察对象的属性名的初始属性值
   * @param {ObserverableObject} observerable 事件管理者
   * @param {string} scope 属性值空间
   * @param {boolean} checkReserved 是否检查命名冲突
   * @returns {undefined}
   */
  static defineProperty(obj, prop, value, observerable, scope) {
    RESERVED_PROP_NAMES.forEach((name) => {
      if (name === prop) {
        throw new Error('reserved prop name')
      }
    })
    const _scope = scope || ''
    if (!obj.__observe__) {
      Object.defineProperty(obj, '__observe__', {
        configurable: true,
        enumerable: false,
        value: {}
      })
    }
    const __observe__ = obj.__observe__
    __observe__[prop] = value
    if (typeof obj.__scope__ === 'undefined') {
      Object.defineProperty(obj, '__scope__', {
        configurable: true,
        enumerable: false,
        value: _scope
      })
    }
    Object.defineProperty(obj, prop, {
      get() {
        return __observe__[prop]
      },
      set(newVal) {
        if (newVal !== __observe__[prop]) {
          if (typeof __observe__[prop] === 'object') {
            ObserverableObject.removeObserve(__observe__[prop])
          }
          __observe__[prop] = newVal
          const changeEvent = new ChangeEvent()
          const changedKey = _scope === '' ? prop : `${_scope}.${prop}`
          changeEvent.target = obj
          changeEvent.changedKey = changedKey
          observerable.trigger(changeEvent)
          if (typeof newVal === 'object') {
            ObserverableObject.observe(newVal, changedKey, observerable)
          }
        }
      }
    })
  }
  /**
   * 取消观察
   * @param {ObserverableObject} obj 要取消观察的对象
   * @param {boolean} recursively 是否递归操作
   * @returns {undefined}
   */
  static removeObserve(obj, recursively) {
    if (typeof recursively === 'undefined') {
      recursively = true
    }
    const __observe__ = obj.__observe__
    if (!__observe__) {
      return
    }
    Object.keys(obj).forEach((prop) => {
      if (ObserverableObject.isReservedProp(prop)) {
        return
      }

      Object.defineProperty(obj, prop, {
        get() {
          return __observe__[prop]
        },
        set(newVal) {
          if (newVal !== __observe__[prop]) {
            __observe__[prop] = newVal
          }
        }
      })
      if (typeof obj[prop] === 'object' && recursively) {
        ObserverableObject.removeObserve(obj[prop])
      }
    })
  }
}

class ChangeEvent {
  constructor() {
    this.target = null
    this.changedKey = null
    this._isStopPropagated = false
  }
  stopPropagate() {
    this._isStopPropagated = true
  }
}
