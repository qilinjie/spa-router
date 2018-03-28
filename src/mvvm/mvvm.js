import Observer from './observer'
// 数据绑定语法前缀
const PREFIX = 'sp-'

class MVVM {
    /**
     * @param {HTMLElement, string} el css 选择器或者 dom 元素
     * @param {Object} data model
     */
    constructor(el, data){
        this._observer = new Observer(data)
    }

}