(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('jquery')) :
	typeof define === 'function' && define.amd ? define(['jquery'], factory) :
	(factory(global.jQuery));
}(this, (function ($) { 'use strict';

$ = $ && $.hasOwnProperty('default') ? $['default'] : $;

// 事件循环周期 单位毫秒
const EVENT_LOOP_DURATION = 100;
const RESERVED_PROP_NAMES = ['__eventQueue', '__handlerQueue', '__intervalID', 'startObserve', 'stopObserve', 'onChange', '__observe__', '__scope__', '__get__', '__set__'];
/** array 代理操作 */

const ARRAY_ORP = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'];
/**
 * 对非 Array 类型的对象进行深度观察，提供事件接口
 * 非 Array 对象的深层次的属性变化会向上冒泡，冒泡可以通过 event.stopPropagate() 停止
 * data 在被传入后，数据结构不应该被改变，也不应该有新的字段加入，除非是 Array 索引赋值，避免把非原始类型复制给字段
 * 对 Array 不作深度观察以提高性能 arr[0] = '' 这样的操作可以被观察到，但是 arr[1].name = 'xxx 不会被观察到
 */

class ObserverableObject {
  constructor(data) {
    this.__eventQueue = [];
    this.__handlerQueue = {};
    this.__intervalID = null;
    Object.keys(data).forEach(key => {
      if (RESERVED_PROP_NAMES.filter(x => x === key).length > 0) {
        throw new Error('reserved prop name');
      }
    });
    Object.assign(this, data);
    ObserverableObject.observe(this, '', this);
  }
  /**
    * @param {Oberserverable} observerable 观察者
    * @param {string} key parentkey.childkey 形式
    * @returns {any} value
    */


  static __get__(observerable, key) {
    if (key.indexOf('.') === -1) {
      return observerable[key];
    }

    const keys = key.split('.');
    const ctxkeys = keys.slice(0, keys.length - 1);
    let ctx = observerable;
    ctxkeys.forEach(x => {
      ctx = ctx[x];
    });
    return ctx[keys[keys.length - 1]];
  }
  /**
    *@param {Oberserverable} observerable 观察者
   * @param {string} key parentkey.childkey 形式
   * @param {any}  value 值
   * @returns {undefined}
   */


  static __set__(observerable, key, value) {
    if (key.indexOf('.') === -1) {
      observerable[key] = value;
    }

    const keys = key.split('.');
    const ctxkeys = keys.slice(0, keys.length - 1);
    let ctx = observerable;
    ctxkeys.forEach(x => {
      ctx = ctx[x];
    });
    ctx[keys[keys.length - 1]] = value;
  }
  /**
   * 检查 prop 是否是保留字
   * @param {string} prop 待检测的 prop
   * @returns {boolean} 是否是保留字
   */


  static isReservedProp(prop) {
    let isReservedProp = false;

    if (RESERVED_PROP_NAMES.filter(x => x === prop).length > 0) {
      isReservedProp = true;
    }

    return isReservedProp;
  }

  static observe(data, scope, observer) {
    const checkReserved = !(data instanceof ObserverableObject);

    if (typeof data !== 'object') {
      throw new TypeError('data must be object');
    }

    if (Array.isArray(data)) {
      ARRAY_ORP.forEach(opt => {
        Object.defineProperty(data, opt, {
          enumerable: false,
          configurable: true,

          value() {
            ObserverableObject.removeObserve(data, false);
            Array.prototype[opt].apply(data, arguments);
            const event = new ChangeEvent();
            event.changedKey = scope;
            event.target = data;
            observer.trigger(event);
            Object.keys(data).forEach(key => {
              ObserverableObject.defineProperty(data, key, data[key], observer, scope);
            });
          }

        });
      });
      Object.keys(data).forEach(key => {
        if (!checkReserved && ObserverableObject.isReservedProp(key)) {
          return;
        }

        ObserverableObject.defineProperty(data, key, data[key], observer, scope);
      });
      return;
    }

    Object.keys(data).forEach(key => {
      if (!checkReserved && ObserverableObject.isReservedProp(key)) {
        return;
      }

      ObserverableObject.defineProperty(data, key, data[key], observer, scope);

      if (typeof data[key] === 'object') {
        const childScope = scope === '' ? key : `${scope}.${key}`;
        ObserverableObject.observe(data[key], childScope, observer);
      }
    });
  }
  /**
   * 开始观察，监听变化
   * @returns {ObserberableObject} 返回自己
   */


  startObserve() {
    this.__intervalID = setInterval(() => {
      if (this.__eventQueue.length > 0) {
        const event = this.__eventQueue.shift();

        if (this.__handlerQueue[event.changedKey]) {
          this.__handlerQueue[event.changedKey].forEach(fn => fn(event));
        }

        const handlersSet = Object.keys(this.__handlerQueue).filter(x => event.changedKey.startsWith(x) && x !== event.changedKey).sort((a, b) => b.length - a.length).map(x => this.__handlerQueue[x]);

        if (!handlersSet || handlersSet.length === 0) {
          return;
        }

        for (let i = 0; i < handlersSet.length; i++) {
          if (event._isStopPropagated) {
            break;
          }

          handlersSet[i].forEach(fn => fn(event));
        }
      }
    }, EVENT_LOOP_DURATION);
    return this;
  }
  /**
   * 停止观察，取消监听
   * @returns {ObserberableObject} 返回自己
   */


  stopObserve() {
    if (this.__intervalID) {
      clearInterval(this._intervalID);
      this._intervalID = null;
    }

    return this;
  }
  /**
   * @param {string} changedKey 监听变化的 prop，可以是 prop.prop.prop 嵌套形式
   * @param {Function} handler  接受参数为 ChangeEvent 类型的 handler
   * @returns {ObserberableObject} 返回自己
   */


  onChange(changedKey, handler) {
    if (!this.__handlerQueue[changedKey]) {
      this.__handlerQueue[changedKey] = [];
    }

    this.__handlerQueue[changedKey].push(handler);

    return this;
  }
  /**
   * @param {ChaneeEvent} event 触发事件
   * @returns {ObserberableObject} 返回自己
   */


  trigger(event) {
    this.__eventQueue.push(event);

    return this;
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
    RESERVED_PROP_NAMES.forEach(name => {
      if (name === prop) {
        throw new Error('reserved prop name');
      }
    });

    const _scope = scope || '';

    if (!obj.__observe__) {
      Object.defineProperty(obj, '__observe__', {
        configurable: true,
        enumerable: false,
        value: {}
      });
    }

    const __observe__ = obj.__observe__;
    __observe__[prop] = value;

    if (typeof obj.__scope__ === 'undefined') {
      Object.defineProperty(obj, '__scope__', {
        configurable: true,
        enumerable: false,
        value: _scope
      });
    }

    Object.defineProperty(obj, prop, {
      get() {
        return __observe__[prop];
      },

      set(newVal) {
        if (newVal !== __observe__[prop]) {
          if (typeof __observe__[prop] === 'object') {
            ObserverableObject.removeObserve(__observe__[prop]);
          }

          __observe__[prop] = newVal;
          const changeEvent = new ChangeEvent();
          const changedKey = _scope === '' ? prop : `${_scope}.${prop}`;
          changeEvent.target = obj;
          changeEvent.changedKey = changedKey;
          observerable.trigger(changeEvent);

          if (typeof newVal === 'object') {
            ObserverableObject.observe(newVal, changedKey, observerable);
          }
        }
      }

    });
  }
  /**
   * 取消观察
   * @param {ObserverableObject} obj 要取消观察的对象
   * @param {boolean} recursively 是否递归操作
   * @returns {undefined}
   */


  static removeObserve(obj, recursively) {
    if (typeof recursively === 'undefined') {
      recursively = true;
    }

    const __observe__ = obj.__observe__;

    if (!__observe__) {
      return;
    }

    Object.keys(obj).forEach(prop => {
      if (ObserverableObject.isReservedProp(prop)) {
        return;
      }

      Object.defineProperty(obj, prop, {
        get() {
          return __observe__[prop];
        },

        set(newVal) {
          if (newVal !== __observe__[prop]) {
            __observe__[prop] = newVal;
          }
        }

      });

      if (typeof obj[prop] === 'object' && recursively) {
        ObserverableObject.removeObserve(obj[prop]);
      }
    });
  }

}

class ChangeEvent {
  constructor() {
    this.target = null;
    this.changedKey = null;
    this._isStopPropagated = false;
  }

  stopPropagate() {
    this._isStopPropagated = true;
  }

}

const PREFIX = 'sp-';

class Directive {
  constructor(raw, scope) {
    this._scope = scope;
    this._raw = raw;
  }

  unbind() {
    return null;
  }

} // sp-text 指令


class TextDirective extends Directive {
  static New(raw, scope) {
    return new TextDirective(raw, scope);
  }
  /**
   * 同步数据模型到视图的单向绑定
   * @param {Observer} observerable 可观察的对象
   * @returns {undefined}
   */


  bind(observerable) {
    this._observerable = observerable;

    this._scope.$el.text(ObserverableObject.__get__(this._observerable, this._raw));

    this._observerable.onChange(this._raw, () => {
      this._scope.$el.text(ObserverableObject.__get__(this._observerable, this._raw));
    });
  }

} // sp-bind 指令

class InputBindDirective extends Directive {
  static New(raw, scope) {
    return new InputBindDirective(raw, scope);
  }
  /**
   * 表单到模型的双向绑定
   * @param {Observerable} observerable 可观察的对象
   * @returns {undefined}
   */


  bind(observerable) {
    this._observerable = observerable;

    this._scope.$el.val(ObserverableObject.__get__(this._observerable, this._raw));

    this._observerable.onChange(this._raw, () => {
      this._scope.$el.val(ObserverableObject.__get__(this._observerable, this._raw));
    });

    this._scope.$el.on('input', () => {
      ObserverableObject.__set__(this._observerable, this._raw, this._scope.$el.val());
    });
  }

  unbind() {
    this._scope.$el.off('input');
  }

} // sp-click 指令

class ClickDirective extends Directive {
  static New(raw, scope) {
    return new ClickDirective(raw, scope);
  }
  /**
   * 表单到模型的双向绑定
   * @param {Observerable} observerable 可观察的对象
   * @returns {undefined}
   */


  bind(observerable) {
    this._observerable = observerable;

    this._scope.$el.on('click', event => {
      this._observerable[this._raw](event);
    });
  }

  unbind() {
    this._scope.$el.off('click');
  }

}
/**
 * 索引
 */

const DIRECTIVES = {
  bind: InputBindDirective,
  text: TextDirective,
  click: ClickDirective
};

const DIRECTIVE_PATTERN = new RegExp(`${PREFIX}(\\w+)`);
/**
 * @param {$} $element 文档节点
 * @param {Observer} observerable 绑定到的数据模型
 * @returns {Array} directives
 */

function compileTemplate($element, observerable) {
  const directives = [];

  if ($element.children() && $element.children().length > 0) {
    $element.children().each((index, el) => {
      const parseResult = parseElement($(el), observerable);

      if (parseResult) {
        parseResult.forEach(d => directives.push(d));
      }

      const compileResult = compileTemplate($(el), observerable); // compileResult 如果是 array 必须非空再 append

      if (compileResult && compileResult.length > 0) {
        compileResult.forEach(d => directives.push(d));
      }
    });
  }

  return directives;
}
/**
 * 解析指令
 * @param {Jquery} $el 需要解析的文档节点
 * @param {Object} observerable 数据模型
 * @returns {Array} directives
 */

function parseElement($el, observerable) {
  if ($el.length === 0) {
    return null;
  }

  const attributes = Array.from($el[0].attributes) || [];
  const scope = {
    $parent: $el.parent(),
    $next: $el.next(),
    $el
  };
  const directives = [];
  attributes.forEach(attr => {
    const raw = attr.value;
    const directiveName = isDirecitve(attr.name);
    const directiveType = directiveName && DIRECTIVES[directiveName];

    if (directiveName && directiveType) {
      const directive = directiveType.New(raw, scope);
      directive.bind(observerable);
      directives.push(directive);
    }
  });
  return directives.length !== 0 && directives;
}
/**
 * @param {string} attr 指令
 * @returns {string} 匹配到的字符
 */


function isDirecitve(attr) {
  const matchResult = attr.match(DIRECTIVE_PATTERN);
  return matchResult && matchResult[1] || '';
}

class MVVM {
  /**
   * @param {string} el 构建虚拟 dom 的 html 文本
   * @param {Function} dataFactory return model
   */
  constructor(el, dataFactory) {
    this._dataFactory = dataFactory;

    if (typeof el === 'string') {
      el = el.trim();
    }

    this._$el = $(el);
    this._created = false;
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
    };

    const data = this._dataFactory();

    this._observerable = new ObserverableObject(data);
    Object.keys(data).filter(key => typeof data[key] === 'function').forEach(key => {
      this._observerable[key] = data[key];
    });
    this._directives = compileTemplate(this._$el, this._observerable);

    this._observerable.startObserve();

    if (typeof data.onCreate === 'function') {
      data.onCreate.call(this._observerable, context);
    }

    if (typeof data.onMount === 'function') {
      this.hooks.onMount.push(data.onMount.bind(this._observerable));
    }

    if (typeof data.onUnmount === 'function') {
      this.hooks.onUnmount.push(data.onUnmount.bind(this._observerable));
    }

    if (typeof data.onDestroy === 'function') {
      this.hooks.onDestroy.push(data.onDestroy.bind(this._observerable));
    }

    this._created = true;
  } // 挂载


  mount() {
    this.hooks.onMount.forEach(fn => fn());
  } // 取消挂载


  unmount() {
    this.hooks.onUnmount.forEach(fn => fn());
  } // 销毁


  destroy() {
    if (this._created) {
      this._observer.stopObserve();

      this.hooks = {
        onMount: [],
        onUnmount: [],
        onDestroy: []
      };
      this.hooks.onMount.forEach(fn => fn());
      this._created = false;

      this._directives.forEach(d => {
        d.unbind();
      });
    }
  }

  $el() {
    return this._$el;
  }

}

class Context {
  constructor() {
    this.hash = '';
    this.RestParams = {};
  }

  redirect(hash) {
    this.hash = hash;
    window.location.hash = hash;
    return this;
  }

}

const DATA_KEY = 'spa.data';
let uid = 0; // 工具类

class Util {
  // 中间件组合器
  static composeMiddlewares(funcs) {
    return Util._reduceReverse(funcs, (b, a) => function (ctx) {
      a(ctx, b);
    });
  }

  static _reduceReverse(arr, func) {
    let last = arr[arr.length - 1];
    arr.reverse().forEach(el => {
      last = func(last, el);
    });
    return last;
  }

  static GlobalData(key, value) {
    if (typeof value === 'undefined') {
      return window[DATA_KEY] && window[DATA_KEY][key];
    }

    if (typeof window[DATA_KEY] !== 'object') {
      window[DATA_KEY] = {};
    }

    window[DATA_KEY][key] = value;
    return Util;
  }

  static noop() {
    return null;
  }

  static cookie(key, val) {
    if (typeof val === 'undefined') {
      const cookie = document.cookie.split(';').map(x => x.replace(/^\s+/, '')).reduce((a, b) => {
        a[b.split('=')[0]] = b.split('=')[1];
        return a;
      }, {});
      return cookie[key];
    }

    document.cookie = `${key}=${val}`;
    return this;
  } // 匹配器，匹配成功返回 rest 参数 失败返回 null
  // hash /main/1022 pattern: /main/:uid => {uid: 1022}


  static matcher(hash, pattern) {
    const patternItems = pattern.split('/').filter(x => x).map(x => {
      if (x.startsWith(':')) {
        return {
          rest: true,
          key: x.slice(1)
        };
      }

      return {
        rest: false,
        key: x
      };
    });
    const hashToken = Util.hashParser(hash);

    if (patternItems.length !== hashToken.path.length) {
      return null;
    }

    let matched = true;
    const result = {};
    patternItems.forEach((x, index) => {
      if (x.rest) {
        result[x.key] = hashToken.path[index];
        return;
      }

      if (x.key !== hashToken.path[index]) {
        matched = false;
      }
    });
    return matched ? result : null;
  }

  static uid() {
    return uid++;
  } // hash 解析器，返回 token
  // http://localhost/#path/ssvxs/211?search=url&name=formater
  // => [path, ssvxs , 211], {search: 'url', name : 'formater'}


  static hashParser(hash) {
    hash = decodeURIComponent(hash);
    let queries = hash.split('?')[1];

    if (queries) {
      queries = queries.split('&').filter(x => x).reduce((a, b) => {
        const key = b.split('=')[0];
        const val = b.split('=')[1];
        a[key] = val;
        return a;
      }, {});
    }

    return {
      path: hash.split('?')[0].split('/').filter(x => x),
      queries
    };
  } // jsonp 接口用于调远程用户数据


  static jsonp(params, url, callback) {
    const callbackName = `func${Util.uid()}`;
    const element = document.createElement('script');
    let queries = Object.keys(params).reduce((prev, key) => `${prev}${encodeURIComponent(key)}=${encodeURIComponent(params[key])}&`, '');
    queries = queries[queries.length - 1] === '&' ? queries.slice(0, queries.length - 1) : queries;
    element.src = `${url}?callback=${callbackName}&${queries}`;

    window[callbackName] = data => {
      callback(data);
      delete window[callbackName];
      document.body.removeChild(element);
    };

    document.body.appendChild(element);
  }

}

// ctx 的命名空间
function listener(ctx, next) {
  const prevHash = Util.GlobalData('hash');
  Util.GlobalData('hash', ctx.hash); // 第一次 listen

  if (typeof prevHash === 'undefined') {
    return next && next(ctx);
  }

  if (ctx.hash === prevHash) {
    return '';
  }

  return next && next(ctx);
}

const refreshEvery = 200;

class SPA {
  constructor() {
    this._middlewares = [];
    this.use(listener);
  } // 中间件接口


  use(middleware) {
    this._middlewares.push(middleware);

    return this;
  } // 中间件 compose


  init() {
    this._app = Util.composeMiddlewares(this._middlewares) || Util.noop;
    return this;
  } // 生成 app


  app() {
    const _app = this._app;
    return () => setInterval(() => {
      const ctx = new Context();
      ctx.hash = window.location.hash && window.location.hash.slice(1);

      _app(ctx);
    }, refreshEvery);
  }

  start() {
    this.init();
    this.app()();
  }

}

function SPA$1 (config) {
  return new SPA(config);
}

class Rest {
  constructor(config) {
    this._config = config;
  }

  middleware() {
    return (ctx, next) => {
      const rules = Object.keys(this._config);

      for (let i = 0; i < rules.length; i++) {
        const matchResult = Util.matcher(ctx.hash, rules[i]);

        if (matchResult !== null) {
          ctx.hash = rules[i];
          ctx.RestParams = matchResult;
        }
      }

      return next && next(ctx);
    };
  }

}
function Rest$1 (config) {
  return new Rest(config).middleware();
}

const ROUTER_PLACEHOLDER_TAG_NAME = 'router-view'; // Router 把地址路由到 mvvm

class Router {
  constructor(config) {
    this._slot = new RouterSlot(document.querySelector(ROUTER_PLACEHOLDER_TAG_NAME));
    this._config = config;
    this._rest = Rest$1(config);
  } // 根据地址挂载虚拟 dom


  middleware() {
    const router = (ctx, next) => {
      let hash = ctx.hash;

      if (!hash) {
        hash = '/';
      }

      this._slot.unmount();

      const rules = Object.keys(this._config);
      let mounted = false;

      for (let i = 0; i < rules.length; i++) {
        const rule = rules[i];
        const mvvm = this._config[rules[i]];

        if (rule === hash && !mounted) {
          this._slot.mount(mvvm, ctx.RestParams);

          mounted = true;
          break;
        }
      }

      if (!mounted) {
        this._slot.mount(this._config['/'], ctx.RestParams);
      }

      return next && next(ctx);
    };

    return Util.composeMiddlewares([this._rest, router]);
  }

}
function Router$1 (config) {
  if (typeof config === 'undefined') {
    throw TypeError('config cannot be undefined');
  }

  return new Router(config).middleware();
}
class RouterSlot {
  /**
   * @param {HTMLElement} el 起到占位作用的 html element
   */
  constructor(el) {
    this._el = el;
    this._previous = el.previousElementSibling;
    this._parent = el.parentElement;
    $(el).remove();
    this._mounted = false;
    this._mvvm = null;
  } // 挂载 mvvm


  mount(mvvm, context) {
    if (this._mounted && this._mvvm === mvvm) {
      return;
    }

    if (this._mounted && this._mvvm !== mvvm) {
      this.unmount();
    }

    if (!mvvm._created) {
      mvvm.create(context);
    }

    if (!this._previous) {
      $(this._parent).prepend(mvvm.$el());
    } else {
      $(this._previous).after(mvvm.$el());
    }

    this._mounted = true;
    this._mvvm = mvvm;

    this._mvvm.mount();
  } // 取消挂载 mvvm


  unmount() {
    if (this._mounted) {
      this._mvvm.$el().detach();

      this._mvvm.unmount();

      this._mvvm = null;
      this._mounted = false;
    }
  }

}

window.passedTest = 0;
window.testCases = 0;

function assert(bool, msg) {
  if (!bool) {
    throw msg;
  }
}

window.testCases++;
let o = new ObserverableObject({
  key: 'val'
});
o.startObserve();
o.onChange('key', function (event) {
  assert(event.target === o);
  window.passedTest++;
});
o.key = ''; // 测试深层 array 操作

window.testCases++;
let o2 = new ObserverableObject({
  key: 'val',
  key1: {
    key2: ['xxx', 'yyyy']
  }
});
o2.startObserve();
o2.onChange('key1', function (event) {
  assert(event.target === o2.key1.key2);
  assert(event.changedKey === 'key1.key2');
  window.passedTest++;
});
o2.key1.key2.push('');
window.testCases++;
let o3 = new ObserverableObject({
  key: [1, 2, 3, {
    a: 'b'
  }]
});
o3.startObserve();
o3.onChange('key', function (event) {
  assert(event.target === o3);
  window.passedTest++;
});
o3.key = ''; // 测试 array 操作

window.testCases++;
let o4 = new ObserverableObject({
  key: [1, 2, 3, {
    a: 'b'
  }]
});
o4.startObserve();
o4.onChange('key', function (event) {
  window.passedTest++;
});
o4.key.push(9); // 测试重新赋值 array 操作

window.testCases += 5;
let o5 = new ObserverableObject({
  key: [1, 2, 3, {
    a: 'b'
  }]
});
o5.startObserve();
o5.onChange('key', function (event) {
  window.passedTest++;
});
o5.key = {
  ttt: 'xxx'
};
o5.key.ttt = ' ';
o5.key = [];
o5.key.push({
  xxx: 'ffff'
});
o5.key.shift(); // 测试 array 赋值操作可以被观察到

let o6 = new ObserverableObject({
  users: [{
    name: 'salpadding'
  }, {
    name: '------'
  }, {
    name: '++++'
  }, {
    name: 'xxxxxx'
  }],
  info: {
    hhh: 'hhhh'
  }
});
window.testCases += 3;
o6.onChange('users', function (event) {
  window.passedTest++;
});
o6.onChange('info', function () {
  window.passedTest++;
});
o6.startObserve();
let u = {
  name: 'yyyy'
};
o6.users.push(u);
let info = o6.info;
o6.info = {};
info.hhh = 'xxxxx';
o6.users[0] = {
  name: 'xxxx'
};
let o7 = new ObserverableObject({
  users: [{
    name: 'salpadding'
  }, {
    name: '------'
  }, {
    name: '++++'
  }, {
    name: 'xxxxxx'
  }],
  info: {
    hhh: 'hhhh'
  }
}); // 测试 get set

assert(ObserverableObject.__get__(o7, 'info.hhh') === 'hhhh');

ObserverableObject.__set__(o7, 'info.hhh', 'xxx');

assert(ObserverableObject.__get__(o7, 'info.hhh') === 'xxx');
setTimeout(() => {
  window.passedTest === window.testCases;
}, 1000);
const loginMVVM = new MVVM(`
    <form id="form">
        <label>输入的用户名是：</label><span sp-text="username"></span>
        <div class="form-group">
            <input sp-bind="username" type="text" class="form-control" id="exampleInputEmail1" aria-describedby="emailHelp" placeholder="Enter username">
            <small id="emailHelp" class="form-text text-muted">We'll never share your email with anyone else.</small>
        </div>
        <a  sp-click="onClick" href="" class="btn btn-primary">Submit</a>
    </form>
`, () => {
  return {
    username: 'salpadding',

    onClick(event) {
      event.preventDefault();
      window.location.hash = `/info/${this.username}`;
    }

  };
});
const infoMVVM = new MVVM(`
    <div class="card" style="width: 18rem;">
    <div class="card-body">
        <h5 class="card-title" sp-text="username"></h5>
        <h6 class="card-subtitle mb-2 text-muted">Card subtitle</h6>
        <p class="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
        <a href="#" v-click="onClick" class="card-link">修改用户名</a>
        <a id="logout" href="#/login" class="card-link">logout</a>
        <input sp-bind="username" type="text">
    </div>
    </div>
`, () => {
  return {
    username: 'salpadding',

    onCreate(restParams) {
      this.username = restParams.username || '';
    },

    onClick(event) {
      event.preventDefault();
    }

  };
});
const app = SPA$1();
app.use(Router$1({
  '/': loginMVVM,
  '/login': loginMVVM,
  '/info/:username': infoMVVM
}));
app.start();

})));
//# sourceMappingURL=visualTest-built.js.map
