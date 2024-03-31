// 组件中所有的方法

import { ShapeFlags } from '@vue/shared';
import { PublicInstanceProxyHandlers } from './componentPublicInstanceProxyHandlers';

export function createComponentInstance(vnode) {
  // web component 组件需要有“属性”“插槽”
  const instance = {  //组件的实例
    vnode,
    type: vnode.type,
    props: {},
    attrs: {},
    slots: {},
    ctx: {},
    data: {},
    setupState: {},  //如果setip返回一个对象，这个对象会做为setupState
    isMounted: false //表示这个组件是否挂载过
  }
  instance.ctx = { _: instance };
  return instance;
}

export function setupComponent(instance) {
  const { props, children } = instance.vnode; //{type,props,children}

  // 根据props解析出props和attrs，将其放到instance上
  instance.props = props; // initProps()
  instance.children = children; //插槽的解析 initSlot()

  // 需要先看一下当前组件是不是有状态的组件，函数组件
  let isStateful = instance.vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT;
  if (isStateful) { //表示是一个有状态的组件
    // 调用当前实例的setup方法，用setup的返回值填充 setupSate和对应的render方法
    setupSatefulComponent(instance);
  }
}

function setupSatefulComponent(instance) {
  // 1.代理 传递给render函数的参数
  instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers as any);
  // 2.获取组件的类型 拿到组件的setupt方法
  let Component = instance.type;
  let { setup } = Component;
  let setupContext = createSetupContext(instance);
  // 没有setup 没有render？
  setup(instance.props, setupContext);
  Component.render(instance.proxy);
}

function createSetupContext(instance) {
  return {
    attrs: instance.attrs,
    props: instance.props,
    slots: instance.slots,
    emit: () => { },
    expose: () => { }
  }
}

// instance 表示的是组件的状态 各种各样的状态 组件的相关信息
// context 就4个参数 是为了开发时使用的
// proxy 主要是为了取值方便 proxy.xxx