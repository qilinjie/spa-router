import Observer from '../src/mvvm/observer'

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
            if (prop === 'o') {
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
})



