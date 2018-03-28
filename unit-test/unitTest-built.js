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
 * Observer 实现了对象代理
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

      if (typeof data[prop] === 'object' && !Array.isArray(data[prop])) {
        Observer._observeObj(data[prop]); // 嵌套的子对象的属性在发生变化时会通知父亲对象


        data[prop][HANDLERS_KEY].addHandler(() => data[HANDLERS_KEY].notify(prop));
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
      if (prop === 'o') {
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
});

})));
//# sourceMappingURL=unitTest-built.js.map
