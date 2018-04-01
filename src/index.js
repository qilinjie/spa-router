import {Context} from './ctx'
import Util from './util'
import Listener from './listener'
const refreshEvery = 200
class SPA {
  constructor() {
    this._middlewares = []
    this.use(Listener)
  }
  // 中间件接口
  use(middleware) {
    this._middlewares.push(middleware)
    return this
  }
  // 中间件 compose
  init() {
    this._app = Util.composeMiddlewares(this._middlewares) || Util.noop
    return this
  }
  // 生成 app
  app() {
    const _app = this._app
    return () => setInterval(() => {
      const ctx = new Context()
      ctx.hash = window.location.hash && window.location.hash.slice(1)
      _app(ctx)
    }, refreshEvery)
  }
  start() {
    this.init()
    this.app()()
  }
}

export default function (config) {
  return new SPA(config)
}
