import { isObject } from '@vue/shared';

import {
  mutableHandler,
  shallowReactiveHandler,
  readonlyHandler,
  shallowReadonlyHandler
} from './baseHandler';

export function reactive(target) {
  return createReactiveObject(target, false, mutableHandler);
}

export function shallowReactive(target) {
  return createReactiveObject(target, false, shallowReactiveHandler);
}

export function readonly(target) {
  return createReactiveObject(target, true, readonlyHandler);
}

export function shallowReadonly(target) {
  return createReactiveObject(target, true, shallowReadonlyHandler);
}

const reactiveMap = new WeakMap();  //会自动垃圾回收，不会造成内存泄漏
const readonlyMap = new WeakMap();
// 是不是仅读 是不是深度 柯里化 new Proxy() 最核心的需要拦截 数据的读取和修改 get set
export function createReactiveObject(target, isReadonly, baseHandler) {
  // 如果目标不是对象，那就没法拦截，reactive这个api只能拦截对象类型
  if (!isObject(target)) {
    return target;
  }
  // 如果某个对象已经被代理过了，就不要再次代理了，可能一个对象，被代理是深度，又被仅读代理了
  const proxyMap = isReadonly ? reactiveMap : reactiveMap;
  const existProxy = proxyMap.get(target);
  if (existProxy) {
    return existProxy;  //如果已经被代理了，直接返回即可
  }
  const proxy = new Proxy(target, baseHandler);
  proxyMap.set(target, proxy); //将要代理的对象和对应代理结构缓存起来

  return proxy;
}
