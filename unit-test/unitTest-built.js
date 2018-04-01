(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(factory());
}(this, (function () { 'use strict';

/**
 * Depend 处理 Handler 的添加、删除
 */
class Handlers {
  constructor() {
    this._cache = [];
  }
  /**
   * addHandler 添加一个回调函数
   * @param {Function} handler 回调函数
   * @returns {undefined}
   */


  addHandler(handler) {
    this._cache.push(handler);
  }

  notify(prop) {
    this._cache.forEach(x => x(prop));
  }

  destroy() {
    this._cache = [];
  }

}

/** 用于存放数据 */

const PRIVATE_DATA_KEY = '__observe__';
/** 用于在代理对象中存放 handlers */

const HANDLERS_KEY = `${PRIVATE_DATA_KEY}.__handlers__`;
/** 用于在代理对象中存放 property */

const PROP_KEY = `${PRIVATE_DATA_KEY}.__property__`;
/** array 代理操作 */

const ARRAY_ORP = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'];
/**
 * Observer 实现了对象的深度观察
 */

class Observer {
  constructor(data) {
    this._data = data;

    Observer._observeObj(this._data);
  }

  static _observeObj(data) {
    if (typeof data !== 'object') {
      throw new TypeError('argument data must be object');
    }

    Object.keys(data).forEach(prop => {
      defineProperty(data, prop, data[prop]);

      if (typeof data[prop] === 'object') {
        Observer._observeObj(data[prop]); // 嵌套的子对象的属性在发生变化时会通知父亲对象


        data[prop][HANDLERS_KEY].addHandler(childprop => data[HANDLERS_KEY].notify(`${prop}.${childprop}`));
      } // array 操作也会通知


      if (Array.isArray(data[prop])) {
        ARRAY_ORP.forEach(opt => {
          const arrayTarget = data[PROP_KEY][prop];

          arrayTarget[opt] = function () {
            Array.prototype[opt].apply(arrayTarget, arguments);
            data[HANDLERS_KEY].notify(prop);
          };
        });
      }
    });
  }
  /**
   * 外部观察接口
   * @param {Function} callback 回调函数
   * @returns {undefined}
   */


  onChange(callback) {
    this._data[HANDLERS_KEY].addHandler(callback);
  }

  data() {
    return this._data;
  }
  /**
   * @param {string} key parentkey.childkey 形式
   * @returns {any} value
   */


  get(key) {
    const keys = key.split('.');
    const ctxkeys = keys.slice(0, keys.length - 1);
    let ctx = this._data;
    ctxkeys.forEach(x => {
      ctx = ctx[x];
    });
    return ctx[keys[keys.length - 1]];
  }
  /**
   * @param {string} key parentkey.childkey 形式
   * @param {any}  value 值
   * @returns {undefined}
   */


  set(key, value) {
    const keys = key.split('.');
    const ctxkeys = keys.slice(0, keys.length - 1);
    let ctx = this._data;
    ctxkeys.forEach(x => {
      ctx = ctx[x];
    });
    ctx[keys[keys.length - 1]] = value;
  }

}
/**
 * @param {Object} obj 观察者对象
 * @param {string} prop 需要观察的属性
 * @param {any} val 需要观察属性的初始化值
 * @returns {undefined}
 */

function defineProperty(obj, prop, val) {
  if (prop === PRIVATE_DATA_KEY) {
    throw new Error('cannot define private property');
  }

  if (typeof val === 'undefined') {
    val = obj[prop];
  }

  if (typeof obj[HANDLERS_KEY] === 'undefined') {
    obj[HANDLERS_KEY] = new Handlers();
  }

  if (typeof obj[PROP_KEY] === 'undefined') {
    obj[PROP_KEY] = {};
  }

  const handlers = obj[HANDLERS_KEY];
  obj[PROP_KEY][prop] = val;
  Object.defineProperty(obj, prop, {
    get() {
      return obj[PROP_KEY][prop];
    },

    set(newVal) {
      if (newVal !== obj[PROP_KEY][prop]) {
        obj[PROP_KEY][prop] = newVal;
        handlers.notify(prop);
      }
    }

  });
}

const PREFIX = 'sp-';
class Directive {
  constructor(raw, scope) {
    this._scope = scope;
    this._raw = raw;
  }

  bind() {
    return null;
  }

  update() {
    return null;
  }

} // sp-text 指令 后续需要加入 XSS 防范

class TextDirective extends Directive {
  static New(raw, scope) {
    return new TextDirective(raw, scope);
  }
  /**
   * 同步数据模型到视图的单向绑定
   * @param {Observer} observable 可观察的对象
   * @returns {undefined}
   */


  bind(observable) {
    this._scope.el.innerHTML = observable.get(this._raw);
    observable.onChange(key => {
      if (key === this._raw) {
        this._scope.el.innerHTML = observable.get(key);
      }
    });
  }

} // sp-bind 指令

class InputBindDirective extends Directive {
  static New(raw, scope) {
    return new InputBindDirective(raw, scope);
  }
  /**
   * 表单到模型的双向绑定
   * @param {Observer} observable 可观察的对象
   * @returns {undefined}
   */


  bind(observable) {
    this._scope.el.value = observable.get(this._raw);
    observable.onChange(key => {
      if (key === this._raw) {
        this._scope.el.value = observable.get(key);
      }
    });

    this._scope.el.addEventListener('input', () => {
      observable.set(this._raw, this._scope.el.value);
    });
  }

}
/**
 * 索引
 */

const DIRECTIVES = {
  bind: InputBindDirective,
  text: TextDirective
};

const DIRECTIVE_PATTERN = new RegExp(`${PREFIX}(\\w+)`);
/**
 * @param {HTMLElement} element 文档节点
 * @param {Observer} observerable 绑定到的数据模型
 * @returns {undefined}
 */

function compileTemplate(element, observerable) {
  if (element.children && element.children.length > 0) {
    Array.from(element.children).forEach(el => {
      parseElement(el, observerable);
      compileTemplate(el, observerable);
    });
  }
}
/**
 * 解析指令
 * @param {HTMLElement} el 需要解析的文档节点
 * @param {Object} observerable 数据模型
 * @returns {undefined}
 */

function parseElement(el, observerable) {
  const attributes = Array.from(el.attributes) || [];
  const scope = {
    parentNode: el.parentElement,
    nextNode: el.nextElementSibling,
    el
  };
  attributes.forEach(attr => {
    const raw = attr.value;
    const directiveName = isDirecitve(attr.name);
    const directiveType = directiveName && DIRECTIVES[directiveName];

    if (directiveName && directiveType) {
      const directive = directiveType.New(raw, scope);
      directive.bind(observerable);
    }
  });
}
/**
 * @param {string} attr 指令
 * @returns {string} 匹配到的字符
 */


function isDirecitve(attr) {
  const matchResult = attr.match(DIRECTIVE_PATTERN);
  return matchResult && matchResult[1] || '';
}

describe('observer', function () {
  it('set prop properly', function () {
    let o = new Observer({
      users: [0, 1, 2, 3],
      key: 'val'
    });
    let data = o.data();
    expect(data.key).toBe('val');
  });
  it('primitive prop change', function () {
    let changed = false;
    let o = new Observer({
      users: [0, 1, 2, 3],
      key: 'val'
    });
    let data = o.data();
    o.onChange(function (prop) {
      if (prop === 'key') {
        changed = true;
      }
    });
    data.key = 'val.';
    expect(changed).toBe(true);
  });
  it('primitive prop not change', function () {
    let changed = false;
    let o = new Observer({
      users: [0, 1, 2, 3],
      key: 'val'
    });
    let data = o.data();
    o.onChange(function (prop) {
      if (prop === 'key') {
        changed = true;
      }
    });
    data.key = 'val';
    expect(changed).toBe(false);
  });
  it('object prop change', function () {
    let changed = false;
    let o = new Observer({
      users: [0, 1, 2, 3],
      key: 'val',
      o: {
        key: 'val'
      }
    });
    let data = o.data();
    o.onChange(function (prop) {
      if (prop === 'o.key') {
        changed = true;
      }
    });
    data.o.key = 'val.';
    expect(changed).toBe(true);
  });
  it('observe array prop change', function () {
    let changed = false;
    let o = new Observer({
      users: [0, 1, 2, 3],
      key: 'val'
    });
    let data = o.data();
    o.onChange(function (prop) {
      if (prop === 'users') {
        changed = true;
      }
    });
    data.users.push('val.');
    expect(data.users.push === Array.prototype.push).toBe(false);
    expect(changed).toBe(true);
  });
  it('get value', function () {
    let o = new Observer({
      key1: {
        key2: {
          key3: '3'
        }
      }
    });
    expect(o.get('key1.key2.key3')).toBe('3');
    expect(o.get('key1.key2.key3')).toBe(o.data().key1.key2.key3);
  });
  it('set value', function () {
    let o = new Observer({
      key1: {
        key2: {
          key3: '3'
        }
      }
    });
    o.set('key1.key2.key3', 4);
    expect(o.get('key1.key2.key3')).toBe(4);
  });
}); // 指令绑定单元测试

describe('directive', function () {
  it('text directive', function () {
    let el = document.createElement('div');
    let textdirective = new TextDirective('key1.key2', {
      el: el
    });
    let o = new Observer({
      key1: {
        key2: 'key2'
      }
    });
    textdirective.bind(o);
    expect(el.innerHTML).toBe('key2');
    o.data().key1.key2 = 'key3';
    expect(el.innerHTML).toBe('key3');
  });
  it('input directive', function () {
    let el = document.createElement('input');
    el.setAttribute('type', 'text');
    document.body.appendChild(el);
    let inputdirective = new InputBindDirective('key1.key2', {
      el: el
    });
    let o = new Observer({
      key1: {
        key2: 'key2'
      }
    });
    inputdirective.bind(o);
    expect(el.value).toBe('key2');
    o.data().key1.key2 = 'key3';
    expect(el.value).toBe('key3');
  });
  it('composite directive', function () {
    let el = document.createElement('div');
    el.innerHTML = `
            <input type="text" sp-bind="username">
            <h1 sp-text="username"></h1>
        `;
    let o = new Observer({
      username: 'salpadding'
    });
    document.body.appendChild(el);
    compileTemplate(el, o);
    expect(el.querySelector('input').value).toBe('salpadding');
    expect(el.querySelector('h1').innerHTML).toBe('salpadding');
  });
});

})));
//# sourceMappingURL=unitTest-built.js.map
