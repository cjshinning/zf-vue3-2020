import { currentInstance, setCurrentInstance } from './component';

const enum LifeCycleHooks {
  BEFORE_MOUNT = 'bm',
  MOUNTED = 'm',
  BEFORE_UPDATE = 'bu',
  UPDATED = 'u'
}

const injectHook = (type, hook, target) => {  //在这个函数中保留了实例 闭包
  if (!currentInstance) {
    console.warn('injection APIs can only be used during execution of setup()')
  } else {
    const hooks = target[type] || (target[type] = []) //instance.bm=[]
    const wrap = () => {
      setCurrentInstance(target); // currentInstance = 自己的
      hook.call(target);
      setCurrentInstance(null);
    }
    hooks.push(wrap);
  }
}

const createHook = (lifecycle) => (hook, target = currentInstance) => { //target用来标识他是哪个实例的钩子
  // 给当前实例增加对应的生命周期
  injectHook(lifecycle, hook, target);
}

export const invokeArrayFns = (fns) => {
  for (let i = 0; i < fns.length; i++) {
    fns[i]();
  }
}

export const onBeforeMount = createHook(LifeCycleHooks.BEFORE_MOUNT);
export const onMounted = createHook(LifeCycleHooks.MOUNTED);
export const onBeforeUpdate = createHook(LifeCycleHooks.BEFORE_UPDATE);
export const onUpdated = createHook(LifeCycleHooks.UPDATED);