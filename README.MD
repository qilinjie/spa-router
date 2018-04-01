# spa-router

## 依赖库

- jquery

## 路由方法

### 创建 mvvm 实例 

```js
import MVVM from './src/mvvm/mvvm'
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
    onCreate(rest){

    }
    onClick(event) {
        event.preventDefault()
        window.location.hash =`/info/${this.username}`
    }
}})
```

- MVVM 构造器的第一个参数是 dom， 会被 jquery 解析
- MVVM 的第二个参数必须是一个返回 Object 的函数，
- onCreate 钩子中可以获得路由匹配规则到的 rest 参数
- 除了 onCreate 还有 onMount, onUnmount, onDestroy 钩子
- 使用 sp-click 可以把事件绑定到 dom 元素中

### 路由入口 router-view

以下 html 文件中的 router-view 是挂载 mvvm 的占位符

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <link href="https://cdn.bootcss.com/bootstrap/4.0.0/css/bootstrap.min.css" rel="stylesheet">
    <title>Document</title>
    <style>
        form{
            max-width: 600px;
            margin:0 auto;
            border: 1px solid #eee;
            padding: .7rem .3rem;
        }
    </style>
</head>
<body>
    <router-view></router-view>
    <script src="https://cdn.bootcss.com/jquery/1.9.1/jquery.js"></script>
    <script src="./visualTest-built.js"></script>
</body>
</html>
```

### 制定路由策略

```js
import Router from './src/router'
const router = Router({
        '/' : infoMVVM,
        '/login' : loginMVVM,
        '/info/:username' : infoMVVM
    })
```

- Router 的配置是 javascript 对象
- '/' 代表默认路由到的位置
- '/info/:username' 表示 '/info/1244' 这样的地址会被路由到 infoMVVM ，并且 1234会被解析成 rest 参数 

## 视觉测试

- visual-test/index.html



## 单元测试

```sh
npm run test
```