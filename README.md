## CatPawOpen

本仓库是猫爪源的示例项目，将配置功能以网页的方式提供，并集成到源中，希望降低猫爪源的使用门槛

关键代码：
- `esbuild.js`：添加编译前端项目的插件，将页面产物编译进到最终的bundle中
- `src/index.js`：注册前端项目的路由，并监听0.0.0.0，允许局域网访问配置页面
- `src/website`：前端项目的实现

更多细节请查看[commit变更内容](https://github.com/gendago/CatPawOpen/commit/18074f94e79d4c94ff5b9c88760ccba9af7e6fb9)

为了验证可行性，本仓库内集成了部分站源，几乎全部抄袭自其他仓库，感谢：道长、真心、奥秘