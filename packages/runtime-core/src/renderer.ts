import { ShapeFlags } from '@vue/shared';
import { createAppAPI } from './apiCreateApp'
import { createComponentInstance, setupComponent } from './component';

export function createRenderer(rendererOptions) {  //告诉core怎么渲染
  const setupRenderEffect = (instance) => {
    // 需要创建一个effect 在effect中调用 render方法，这样render方法拿到这个effect，属性更新时effect会重新执行
    instance.render();
  }
  const mountComponent = (initialVNode, container) => {
    // 组件渲染流程 最核心的就是调用 setup 拿到返回值，获取render函数返回的结果来进行渲染
    // 1.先有实例
    const instance = initialVNode.component = createComponentInstance(initialVNode);
    // 2.将需要的数据解析到实例上
    setupComponent(instance); //启动组件
    // 3.创建一个effect，让render函数执行
    setupRenderEffect(instance);
  }
  const processComponent = (n1, n2, container) => {
    if (n1 == null) { //组件没有上一次的虚拟节点
      mountComponent(n2, container);
    } else {  //组件更新流程

    }
  }
  const patch = (n1, n2, container) => {
    // 针对不同类型做初始化操作
    const { shapeFlag } = n2;
    if (shapeFlag & ShapeFlags.ELEMENT) {
      console.log('元素');
    } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
      // console.log('组件');
      processComponent(n1, n2, container);
    }
  }

  const render = (vnode, container) => {
    // core的核心，根据不同的虚拟节点，创建对应的真实节点
    // 默认调用render，可能是初始化流程
    patch(null, vnode, container);
  }
  return {
    createApp: createAppAPI(render)
  }
}

// createRenderer 目的是创建一个渲染器
// 框架 都是组件 转化成虚拟dom -> 虚拟dom生成真实DOM挂载到真实页面上