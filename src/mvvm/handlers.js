/**
 * Depend 处理 Handler 的添加、删除
 */
export default class Handlers {
  constructor() {
    this._cache = []
  }
  /**
   * addHandler 添加一个回调函数
   * @param {Function} handler 回调函数
   * @returns {undefined}
   */
  addHandler(handler) {
    this._cache.push(handler)
  }


  notify(prop) {
    this._cache.forEach((x) => x(prop))
  }

  destroy() {
    this._cache = []
  }
}
