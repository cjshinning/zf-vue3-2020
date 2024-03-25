import { hasChanged, isArray, isObject } from '@vue/shared';
import { track, trigger } from './effect';
import { TrackOpTypes, TriggerOpTypes } from './operators';
import { reactive } from './reactive';

export function ref(value) {  //value是一个普通类型
  // 将普通类型变成一个对象，可以是对象，但是一般情况下是对象直接用reactive更合理
  return createRef(value);
}

// ref和reactive的区别 reactive内部采用proxy ref内部采用defineProperty

export function shallowRef(value) {
  return createRef(value, true);
}

const convert = (val) => isObject(val) ? reactive(val) : val;

class RefImp {
  public _value;  //表示声明了一个_value属性，但是没有赋值
  public _v_isRef = true; //产生的实例会被添加这个_v_isRef属性，表示是一个ref熟悉
  constructor(public rawValue, public shallow) { //参数中前面增加修饰符表示此属性放到了实例上
    this._value = shallow ? rawValue : convert(rawValue); //如果是深度，需要把里面都变成响应式
  }
  // 类的属性访问器
  get value() { //代理 取值取value 会帮我们代理到_value
    track(this, TrackOpTypes.GET, 'value');
    return this._value;
  }
  set value(newValue) {
    if (hasChanged(newValue, this.rawValue)) { //判断新值是否有变化
      this.rawValue = newValue; //新值会作为老值
      this._value = this.shallow ? newValue : convert(newValue);
      trigger(this, TriggerOpTypes.SET, 'value', newValue);
    }
  }
}

// let state = ref({ name: { n: 'cj' } })
// console.log(state.value.name);

function createRef(rawValue, shallow = false) {
  return new RefImp(rawValue, shallow);
}

class ObjectRefImpl {
  public _v_isRef = true;
  constructor(public target, public key) {
  }
  get value() {
    return this.target[this.key];
  }
  set value(newValue) {
    this.target[this.key] = newValue;
  }
}

// 将某一个Key对应的值转化成ref
export function toRef(target, key) {  //可以把一个对象的值转换成ref类型
  return new ObjectRefImpl(target, key);
}

export function toRefs(object) { //object可能是数组也可能是对象
  const ret = isArray(object) ? new Array(object.length) : {};
  for (let key in object) {
    ret[key] = toRef(object, key);
  }
  return ret;
}