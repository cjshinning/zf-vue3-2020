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