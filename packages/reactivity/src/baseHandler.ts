// 实现new Proxy(target,handler)
// 是不是仅读的，仅读的数下set时会报错
// 是不是深度的

import { extend, isObject } from '@vue/shared';
import { track } from './effect';
import { TrackOpTypes } from './operators';
import { readonly, reactive } from './reactive';

const get = createGetter();
const shallowGet = createGetter(false, true);
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);

const set = createSetter();
const shallowSet = createSetter(true);

export const mutableHandler = {
  get
};
export const shallowReactiveHandler = {
  get: shallowGet
};

let readonlyObj = {
  set: (target, key) => {
    console.warn(`set on key ${key} failed`);
  }
}

export const readonlyHandler = extend({
  get: readonlyGet,
}, readonlyObj);
export const shallowReadonlyHandler = extend({
  get: shallowReadonlyGet
}, readonlyObj);

function createGetter(isReadonly = false, shallow = false) {  //拦截获取
  return function get(target, key, receiver) {  //let proxy=reactive({obj:{}});
    // proxy + reflect
    // 后续Obejct上的方法，会被迁移到Reflect上
    // 以前target[key]=value方法设置值可能会失败，并不会报异常，也没有返回值标识
    // Reflect 方法具备返回值
    // Reflect 使用可以不使用proxy
    const res = Reflect.get(target, key, receiver); //等价于target[key]

    if (!isReadonly) {
      // 收集依赖，等会数据变化后更新对应的视图
      // console.log('执行effect时会取值，收集effect', target, key);
      // 当我们对对像（target）做什么操作（取值TrackOpTypes.GET）需要把属性（key）收集起来
      track(target, TrackOpTypes.GET, key,);
    }
    if (shallow) {
      return res;
    }
    if (isObject(res)) {  //vue2是一上来就递归，vue3是取值时会进行代理，vue3的代理模式时懒代理
      return isReadonly ? readonly(res) : reactive(res);
    }

    return res;
  }
}

function createSetter(shallow = false) {  //拦截设置
  return function set(target, key, value, receiver) {
    const res = Reflect.set(target, key, value, receiver); //等价于target[key]=value

    return res;
  }
}
