import Util from './util'

// Rest rest 参数解析 和 重写规则
export class Rest {
  constructor(config) {
    this._config = config
  }
  middleware() {
    return (ctx, next) => {
      const rules = Object.keys(this._config)
      for (let i = 0; i < rules.length; i++) {
        const matchResult = Util.matcher(ctx.hash, rules[i])
        if (matchResult !== null) {
          ctx.hash = rules[i]
          ctx.RestParams = matchResult
        }
      }
      return next && next(ctx)
    }
  }
}

export default function (config) {
  return (new Rest(config)).middleware()
}
