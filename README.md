## CatPawOpen

本仓库是猫爪源的示例项目，将配置功能以网页的方式提供，并集成到源中，希望降低猫爪源的使用门槛

关键代码：
- `esbuild.js`：添加编译前端项目的插件，将页面产物编译进到最终的bundle中
- `src/index.js`：注册前端项目的路由，并监听0.0.0.0，允许局域网访问配置页面
- `src/website`：前端项目的实现

为了验证可行性，本仓库内集成了部分站源，几乎全部抄袭自其他仓库，感谢：道长、真心、奥秘

### 拓展Action

1. Toast提示
```json
{
    "action": "toast",
    "opt": {
      "message": "提示内容",
      "duration": 2
    }
}
```

2. 弹幕推送
> 弹幕数据格式跟安卓源保持一致，示例：https://api.bilibili.com/x/v1/dm/list.so?oid=30777215354
```json
{
    "action": "danmuPush",
    "opt": {
      "url": "弹幕下载地址"
    }
}
```

3. App内部打开Webview
```json
{
    "action": "openInternalWebview",
    "opt": {
      "url": "https://www.baidu.com"
    }
}
```

4. App外部打开Webview
```json
{
    "action": "openExternalWebview",
    "opt": {
      "url": "https://www.baidu.com"
    }
}
```

5. 保存用户配置
> 由壳子实现跨设备同步
```json
{
    "action": "saveProfile",
    "opt": {
      "cookie1": "value1",
      "cookie2": "value2"
    }
}
```

6. 查询用户配置
> 由壳子实现跨设备同步
```json
{
    "action": "queryProfile",
    "opt": {}
}
```