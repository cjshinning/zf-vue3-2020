## Vue2和Vue3区别介绍
- 源码采用monorepo方式进行管理，将模块拆分到package目录中
- Vue3采用ts开发，增强类型检测。Vue2则采用flow
- Vue3的性能优化，支持tree-shaking，不使用就不会被打包
- Vue2后期引入RFC，使每个版本改动可控rfc

### 内部代码优化
- Vue3劫持数据采用proxy；Vue2劫持数据采用defineProperty，defineProperty有性能问题和缺陷
- Vue3中对模板编译进行了优化。编译时生成了Block tree，可以对子节点的动态节点进行收集，可以减少比较，并且采用了patchFlag标记动态节点
- Vue3采用compositionApi，进行组织功能，解决反复横跳，优化复用逻辑（mixin带来的数据来源不清晰，命名冲突等），相比optionsApi类型推断更加方便
- 增加了Fragment，Teleport，Suspense组件


## Vue3交够分析
### Monorepo介绍
Monorepo是管理项目代码的一种方式，指在一个项目仓库中管理多个模块/包（package）
- 一个仓库可以维护多个模块，不用到处找仓库
- 方便版本管理和依赖管理，模块之间的引用，调用都非常方便

### Vue3项目结构
- reactivity 响应式系统
- runtime-core 与平台无关的运行时核心
- runtime-dom 针对浏览器的运行时。包含DOM AIP，属性，事件处理等
- runtime-test 用于测试
- server-renderer 用于服务器渲染
- compiler-core 与平台无关的编译器核心
- compiler-dom 针对浏览器的编译模块
- compiler-ssr 针对服务端渲染的编译模块
- compiler-sfc 针对单文件解析
- size-check 用来测试代码体积
- template-explorer 用于调试编译器输出的开发工具
- shared 多个包之间共享的内容
- vue 完整版本，包括运行时和编译器

