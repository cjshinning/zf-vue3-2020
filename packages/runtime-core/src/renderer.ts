import { effect } from '@vue/reactivity';
import { ShapeFlags } from '@vue/shared';
import { createAppAPI } from './apiCreateApp'
import { createComponentInstance, setupComponent } from './component';
import { queueJob } from './scheduler';
import { normalizeVnode, Text } from './vnode';

export function createRenderer(rendererOptions) {  //告诉core怎么渲染
  const {
    insert: hostInsert,
    remove: hostRemove,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    createComment: hostCreateComment,
    setText: hostSetText,
    setElementText: hostSetElementText,
  } = rendererOptions;

  // ---------------- 组件 -----------------
  const setupRenderEffect = (instance, container) => {
    // 需要创建一个effect 在effect中调用 render方法，这样render方法拿到这个effect，属性更新时effect会重新执行
    instance.update = effect(function componentEffect() {  //每个组件都有一个effect，vue3是组件级更新，数据变化会重新执行对应的effect
      if (!instance.isMounted) {
        // 初次渲染
        let proxyToUse = instance.proxy;
        // $vnode _vnode(vue2)
        // vnode subTree(vue3)
        let subTree = instance.subTree = instance.render.call(proxyToUse, proxyToUse);
        // console.log(subTree);
        patch(null, subTree, container);
        instance.isMounted = true;
      } else {
        // 更新逻辑
        // diff算法
        console.log('更新了');
      }
    }, {
      scheduler: queueJob
    })
  }
  const mountComponent = (initialVNode, container) => {
    // 组件渲染流程 最核心的就是调用 setup 拿到返回值，获取render函数返回的结果来进行渲染
    // 1.先有实例
    const instance = initialVNode.component = createComponentInstance(initialVNode);
    // 2.将需要的数据解析到实例上
    setupComponent(instance); //启动组件
    // 3.创建一个effect，让render函数执行
    setupRenderEffect(instance, container);
  }
  const processComponent = (n1, n2, container) => {
    if (n1 == null) { //组件没有上一次的虚拟节点
      mountComponent(n2, container);
    } else {  //组件更新流程

    }
  }
  // ---------------- 组件 -----------------


  // ---------------- 元素 -----------------
  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; i++) {
      let child = normalizeVnode(children[i]);
      patch(null, child, container);
    }
  }
  const mountElement = (vnode, container) => {
    // 递归渲染
    const { props, shapeFlag, type, children } = vnode;
    let el = vnode.el = hostCreateElement(type);
    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, children); //文本直接扔进去即可
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el);
    }
    hostInsert(el, container);
  }
  const processElement = (n1, n2, container) => {
    if (n1 == null) {
      mountElement(n2, container);
    } else {
      // 元素更新
      // console.log('更新了');
    }
  }

  const processText = (n1, n2, container) => {
    if (n1 == null) {
      hostInsert((n2.el = hostCreateText(n2.children)), container);
    }
  }
  const patch = (n1, n2, container) => {
    // 针对不同类型做初始化操作
    const { shapeFlag, type } = n2;
    switch (type) {
      case Text:
        processText(n1, n2, container);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // console.log('元素');
          console.log(n1, n2, container);
          processElement(n1, n2, container);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          // console.log('组件');
          processComponent(n1, n2, container);
        }
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