export const OK = 200
// NAME_SPACE 防止命名冲突
export const NAME_SPACE =  {
  RESOLVER_CTX_KEY : 'spa.resolver',
  FILTER_CTX_KEY : 'spa.filter',
  ROUTER_CTX_KEY: 'spa.router',
  HISTORY_CTX_KEY: 'spa.history'
}

// Context 用于中间件之间进行通信
export class Context {
  constructor() {
    this.hash = ''
    this.RestParams = {}
  }
  redirect(hash) {
    this.hash = hash
    window.location.hash = hash
    return this
  }
}
