import Observer from '../src/mvvm/observer'
import { TextDirective, InputBindDirective} from '../src/mvvm/directive'
import {compileTemplate} from '../src/mvvm/compile'
// 观察者单元测试
describe('observer', function(){
    it('set prop properly', function () {
        let o = new Observer({
            users: [0, 1, 2, 3],
            key: 'val'
        })
        let data = o.data()
        expect(data.key).toBe('val')
    })
    it('primitive prop change', function(){
        let changed = false
        let o = new Observer({
            users: [0, 1, 2, 3],
            key: 'val'
        })
        let data = o.data()
        o.onChange(function(prop){
            if(prop === 'key'){
                changed = true
            }
        })
        data.key = 'val.'
        expect(changed).toBe(true)
    })
    it('primitive prop not change', function () {
        let changed = false
        let o = new Observer({
            users: [0, 1, 2, 3],
            key: 'val'
        })
        let data = o.data()
        o.onChange(function (prop) {
            if (prop === 'key') {
                changed = true
            }
        })
        data.key = 'val'
        expect(changed).toBe(false)
    })
    it('object prop change', function () {
        let changed = false
        let o = new Observer({
            users: [0, 1, 2, 3],
            key: 'val',
            o: {
                key: 'val'
            }
        })
        let data = o.data()
        o.onChange(function (prop) {
            if (prop === 'o.key') {
                changed = true
            }
        })
        data.o.key = 'val.'
        expect(changed).toBe(true)
    })       
    it('observe array prop change', function () {
        let changed = false
        let o = new Observer({
            users: [0, 1, 2, 3],
            key: 'val'
        })
        let data = o.data()
        o.onChange(function (prop) {
            if (prop === 'users') {
                changed = true
            }
        })
        data.users.push('val.')
        expect(data.users.push === Array.prototype.push).toBe(false)
        expect(changed).toBe(true)
    })
    it('get value', function(){
        let o = new Observer({
                key1 : {
                    key2 : {
                        key3: '3'
                    }
                }
            }
        )
        expect(o.get('key1.key2.key3')).toBe('3')
        expect(o.get('key1.key2.key3')).toBe(o.data().key1.key2.key3)
    })
    it('set value', function () {
        let o = new Observer({
            key1: {
                key2: {
                    key3: '3'
                }
            }
        }
        )
        o.set('key1.key2.key3', 4)
        expect(o.get('key1.key2.key3')).toBe(4)
    })
})

// 指令绑定单元测试
describe('directive', function(){
    it('text directive', function(){
        let el = document.createElement('div')
        let textdirective = new TextDirective('key1.key2', {
            el: el
        })
        let o = new Observer({
            key1: {
                key2 : 'key2'
            }
        })
        textdirective.bind(o)
        expect(el.innerHTML).toBe('key2')
        o.data().key1.key2 = 'key3'
        expect(el.innerHTML).toBe('key3')
    })

    it('input directive', function () {
        let el = document.createElement('input')
        el.setAttribute('type', 'text')
        document.body.appendChild(el)
        let inputdirective = new InputBindDirective('key1.key2', {
            el: el
        })
        let o = new Observer({
            key1: {
                key2: 'key2'
            }
        })
        inputdirective.bind(o)
        expect(el.value).toBe('key2')
        o.data().key1.key2 = 'key3'
        expect(el.value).toBe('key3')
    })
    it('composite directive', function(){
        let el = document.createElement('div')
        el.innerHTML = `
            <input type="text" sp-bind="username">
            <h1 sp-text="username"></h1>
        `
        let o = new Observer({
            username: 'salpadding'
        })
        document.body.appendChild(el)
        compileTemplate(el, o)
        expect(el.querySelector('input').value).toBe('salpadding')
        expect(el.querySelector('h1').innerHTML).toBe('salpadding')
    })
})



