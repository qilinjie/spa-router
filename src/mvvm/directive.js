export const PREFIX = 'sp-'
import ObserverableObject from './eventObserver'

class Directive {
  constructor(raw, scope) {
    this._scope = scope
    this._raw = raw
  }
  unbind() {
    return null
  }
}

// sp-text 指令
export class TextDirective extends Directive {
  static New(raw, scope) {
    return new TextDirective(raw, scope)
  }
  /**
   * 同步数据模型到视图的单向绑定
   * @param {Observer} observerable 可观察的对象
   * @returns {undefined}
   */
  bind(observerable) {
    this._observerable = observerable
    this._scope.$el.text(ObserverableObject.__get__(this._observerable, this._raw))
    this._observerable.onChange(this._raw, () => {
      this._scope.$el.text(ObserverableObject.__get__(this._observerable, this._raw))
    })
  }
}

// sp-bind 指令
export class InputBindDirective extends Directive {
  static New(raw, scope) {
    return new InputBindDirective(raw, scope)
  }
  /**
   * 表单到模型的双向绑定
   * @param {Observerable} observerable 可观察的对象
   * @returns {undefined}
   */
  bind(observerable) {
    this._observerable = observerable
    this._scope.$el.val(ObserverableObject.__get__(this._observerable, this._raw))
    this._observerable.onChange(this._raw, () => {
      this._scope.$el.val(ObserverableObject.__get__(this._observerable, this._raw))
    })
    this._scope.$el.on('input', () => {
      ObserverableObject.__set__(this._observerable, this._raw, this._scope.$el.val())
    })
  }
  unbind() {
    this._scope.$el.off('input')
  }
}

// sp-click 指令
export class ClickDirective extends Directive {
  static New(raw, scope) {
    return new ClickDirective(raw, scope)
  }
  /**
   * 表单到模型的双向绑定
   * @param {Observerable} observerable 可观察的对象
   * @returns {undefined}
   */
  bind(observerable) {
    this._observerable = observerable
    this._scope.$el.on('click', (event) => {
      this._observerable[this._raw](event)
    })
  }
  unbind() {
    this._scope.$el.off('click')
  }
}
/**
 * 索引
 */
export const DIRECTIVES = {
  bind: InputBindDirective,
  text: TextDirective,
  click: ClickDirective
}
