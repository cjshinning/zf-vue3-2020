export function ref(value) {  //value是一个普通类型
  // 将普通类型变成一个对象，可以是对象，但是一般情况下是对象直接用reactive更合理
  return createRef(value);
}

// ref和reactive的区别 reactive内部采用proxy ref内部采用defineProperty

export function shallowRef(value) {
  return createRef(value, true);
}

class RefImp {
  public _value;  //表示声明了一个_value属性，但是没有赋值
  public _v_isRef = true; //产生的实例会被添加这个_v_isRef属性，表示是一个ref熟悉
  constructor(public rawValue, public shallow) { //参数中前面增加修饰符表示此属性放到了实例上

  }
}

function createRef(rawValue, shallow = false) {
  return new RefImp(rawValue, shallow);
}