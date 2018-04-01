import ObserverableObject from '../src/mvvm/eventObserver'
import MVVM from '../src/mvvm/mvvm'
import SPA from '../src/index'
import Router from '../src/router'
window.passedTest = 0
window.testCases = 0
function assert(bool, msg){
    if (!bool){
        throw msg
    }
}

window.testCases ++
let o = new ObserverableObject({
    key: 'val'
})

o.startObserve()

o.onChange('key', function(event){
    assert(event.target === o)
    window.passedTest ++
})

o.key = ''

// 测试深层 array 操作
window.testCases++
let o2 = new ObserverableObject({
    key: 'val',
    key1 : {
        key2 : ['xxx', 'yyyy']
    }
})

o2.startObserve()

o2.onChange('key1', function (event) {
    assert(event.target === o2.key1.key2)
    assert(event.changedKey === 'key1.key2')
    window.passedTest++
})

o2.key1.key2.push('')


window.testCases++
let o3 = new ObserverableObject({key:[1, 2, 3, {
    a: 'b'
}]})

o3.startObserve()

o3.onChange('key', function(event){
    assert(event.target === o3)
    window.passedTest++
})

o3.key = ''

// 测试 array 操作
window.testCases++
let o4 = new ObserverableObject({key: [1, 2, 3, {
    a: 'b'
}]})

o4.startObserve()

o4.onChange('key', function (event) {
    window.passedTest++
})

o4.key.push(9)


// 测试重新赋值 array 操作
window.testCases += 5
let o5 = new ObserverableObject({
    key: [1, 2, 3, {
        a: 'b'
    }]
})

o5.startObserve()

o5.onChange('key', function (event) {
    window.passedTest++
})

o5.key = {ttt: 'xxx'}

o5.key.ttt = ' '

o5.key = []
o5.key.push({
    xxx: 'ffff'
})
o5.key.shift()

// 测试 array 赋值操作可以被观察到
let o6 = new ObserverableObject({
    users: [    
        {
            name: 'salpadding',
        },
        {
            name: '------',
        },
        {
            name: '++++',
        },
        {
            name: 'xxxxxx',
        },
    ],
    info:{
        hhh: 'hhhh'
    }
})

window.testCases += 3
o6.onChange('users', function (event) {
    window.passedTest++
})
o6.onChange('info', function () {
    window.passedTest++
})
o6.startObserve()
let u = {name: 'yyyy'}
o6.users.push(u)
let info = o6.info
o6.info = {}
info.hhh ='xxxxx'
o6.users[0] = {
    name: 'xxxx'
}


let o7 = new ObserverableObject({
    users: [
        {
            name: 'salpadding',
        },
        {
            name: '------',
        },
        {
            name: '++++',
        },
        {
            name: 'xxxxxx',
        },
    ],
    info: {
        hhh: 'hhhh'
    }
})

// 测试 get set
assert(ObserverableObject.__get__(o7,'info.hhh') === 'hhhh')
ObserverableObject.__set__(o7, 'info.hhh', 'xxx')
assert(ObserverableObject.__get__(o7, 'info.hhh') === 'xxx')

setTimeout(() => {
    window.passedTest === window.testCases
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
`, () => {return {
    username: 'salpadding',
    onClick(event) {
        event.preventDefault()
        window.location.hash =`/info/${this.username}`
    }
}})


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
`, () => {return {
    username: 'salpadding',
    onCreate(restParams) {
        this.username = restParams.username || ''
    },
    onClick(event){
        event.preventDefault()
        
    }
}})

const app = SPA()
app.use(
    Router({
        '/' : loginMVVM,
        '/login' : loginMVVM,
        '/info/:username' : infoMVVM
    })
)

app.start()