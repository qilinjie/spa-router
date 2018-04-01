import Rest from './rest'
import Util from './util'
import $ from 'jquery'
const ROUTER_PLACEHOLDER_TAG_NAME = 'router-view'
// Router 把地址路由到 mvvm
export class Router {
  constructor(config) {
    this._slot = new RouterSlot(document.querySelector(ROUTER_PLACEHOLDER_TAG_NAME))
    this._config = config
    this._rest = Rest(config)
  }
  // 根据地址挂载虚拟 dom
  middleware() {
    const router = (ctx, next) => {
      let hash = ctx.hash
      if (!hash) {
        hash = '/'
      }
      this._slot.unmount()
      const rules = Object.keys(this._config)
      let mounted = false
      for (let i = 0; i < rules.length; i++) {
        const rule = rules[i]
        const mvvm = this._config[rules[i]]
        if (rule === hash && !mounted) {
          this._slot.mount(mvvm, ctx.RestParams)
          mounted = true
          break
        }
      }
      if (!mounted) {
        this._slot.mount(this._config['/'], ctx.RestParams)
      }
      return next && next(ctx)
    }
    return Util.composeMiddlewares([this._rest, router])
  }
}

export default function (config) {
  if (typeof config === 'undefined') {
    throw TypeError('config cannot be undefined')
  }
  return (new Router(config)).middleware()
}

export class RouterSlot {
  /**
   * @param {HTMLElement} el 起到占位作用的 html element
   */
  constructor(el) {
    this._el = el
    this._previous = el.previousElementSibling
    this._parent = el.parentElement
    $(el).remove()
    this._mounted = false
    this._mvvm = null
  }
  // 挂载 mvvm
  mount(mvvm, context) {
    if (this._mounted && this._mvvm === mvvm) {
      return
    }
    if (this._mounted && this._mvvm !== mvvm) {
      this.unmount()
    }
    if (!mvvm._created) {
      mvvm.create(context)
    }
    if (!this._previous) {
      $(this._parent).prepend(
        mvvm.$el()
      )
    } else {
      $(this._previous).after(mvvm.$el())
    }
    this._mounted = true
    this._mvvm = mvvm
    this._mvvm.mount()
  }
  // 取消挂载 mvvm
  unmount() {
    if (this._mounted) {
      this._mvvm.$el().detach()
      this._mvvm.unmount()
      this._mvvm = null
      this._mounted = false
    }
  }
}
