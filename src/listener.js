// ctx 的命名空间
import Util from './util'


export default function listener(ctx, next) {
  const prevHash = Util.GlobalData('hash')
  Util.GlobalData('hash', ctx.hash)
  // 第一次 listen
  if (typeof prevHash === 'undefined') {
    return next && next(ctx)
  }
  if (ctx.hash === prevHash) {
    return ''
  }
  return next && next(ctx)
}

