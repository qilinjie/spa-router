import Observer from './eventObserver'
import compileTemplate from './compile'
import $ from 'jquery'

export default class MVVM {
  /**
   * @param {string} el 构建虚拟 dom 的 html 文本
   * @param {Function} dataFactory return model
   */
  constructor(el, dataFactory) {
    this._dataFactory = dataFactory
    if (typeof el === 'string') {
      el = el.trim()
    }
    this._$el = $(el)
    this._created = false
  }
  /**
   * @param {Object} context 来自 router 解析的 rest 参数
   * @returns {undefined}
   */
  create(context) {
    this.hooks = {
      onMount: [],
      onUnmount: [],
      onDestroy: []
    }
    const data = this._dataFactory()
    this._observerable = new Observer(data)
    Object.keys(data).filter((key) => typeof data[key] === 'function')
      .forEach((key) => {
        this._observerable[key] = data[key]
      })
    this._directives = compileTemplate(this._$el, this._observerable)
    this._observerable.startObserve()
    if (typeof data.onCreate === 'function') {
      data.onCreate.call(this._observerable, context)
    }
    if (typeof data.onMount === 'function') {
      this.hooks.onMount.push(
        data.onMount.bind(this._observerable)
      )
    }
    if (typeof data.onUnmount === 'function') {
      this.hooks.onUnmount.push(
        data.onUnmount.bind(this._observerable)
      )
    }
    if (typeof data.onDestroy === 'function') {
      this.hooks.onDestroy.push(
        data.onDestroy.bind(this._observerable)
      )
    }
    this._created = true
  }
  // 挂载
  mount() {
    this.hooks.onMount.forEach((fn) => fn())
  }
  // 取消挂载
  unmount() {
    this.hooks.onUnmount.forEach((fn) => fn())
  }
  // 销毁
  destroy() {
    if (this._created) {
      this._observerable.stopObserve()
      this.hooks = {
        onMount: [],
        onUnmount: [],
        onDestroy: []
      }
      this.hooks.onMount.forEach((fn) => fn())
      this._created = false
      this._directives.forEach((d) => {
        d.unbind()
      })
    }
  }
  $el() {
    return this._$el
  }
}
