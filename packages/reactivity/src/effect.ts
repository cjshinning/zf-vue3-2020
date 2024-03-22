
export function effect(fn, options: any = {}) {
  // 让这个effect变成响应式的effect，可以做到数据变化重新执行
  const effect = createReactiveEffeft(fn, options);

  if (!options.lazy) {  //默认的effect会先执行
    effect(); //响应式的effect默认会先执行一次
  }

  return effect;
}

let uid = 0;
let activeEffect; //存储当前的effect
const effectStack = []
function createReactiveEffeft(fn, options) {
  const effect = function reactiveEffect() {
    if (!effectStack.includes(effect)) {  //保证effect没有加入到effectStack中
      try {
        effectStack.push(effect);
        activeEffect = effect;
        return fn(); //函数执行时会取值，会执行get方法
      } finally {
        effectStack.pop();
        activeEffect = effectStack[effectStack.length - 1];
      }
    }


  }
  effect.id = uid++;  // 制作一个effect表示，用于区分effect
  effect.isEffect = true; //用于标识这个是响应式effect
  effect.raw = fn;  //保留effect对应的原函数
  effect.options = options; //在effect上保存用户的属性
  return effect;
}
// 让某个对象中的属性收集当前他对应的effect函数
const targetMap = new WeakMap();
export function track(target, type, key) {  //可以拿到当前的effect
  // 需要让target的key找到对应的effect
  // activeEffect; //当前正在运行的effect
  // console.log(target, key, activeEffect);
  if (activeEffect === undefined) { //此属性不用收集依赖，因为没在effect中使用
    return;
  }
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map));
  }
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = new Set));
  }
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);
  }
  console.log(targetMap);
}

// weakMap key => { name: 'cj', age: 18 } value => Map {name => set}
// { name: 'cj', age: 18 } => name => [effect, effect]

// effect(() => {
//   state.xxx++;
// })

// 因为函数调用是栈形结构，所以需要使用栈来保证当前的effect是正确的
// effect(()=>{  //effect1
//   state.name; -> effect1
//   effect(()=>{  //effect2
//     statusbar.age -> effect2
//   })
//   state.address -> effect2
// })