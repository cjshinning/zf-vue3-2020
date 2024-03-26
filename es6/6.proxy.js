// Vue2中使用的是defineProperty 它的也得就是给本来的属性可以用此方法来定义，并且可以把值转化成get

let obj = {};

// 使用defineProperty需要定义第三方参数 才能控制set和get
let _value;
Object.defineProperty(obj, 'a', {
  enumerable: true,
  configurable: true,
  // writable: true,
  get() {
    return _value;
  },
  set(newValue) {
    _value = newValue;
  }
})
// delete obj.a;
// console.log(obj); //{ a: [Getter/Setter] }
obj.a = 100;
console.log(obj.a); //100

// 把对象的属性 全部转化成getter+setter，遍历所有对象，用Object.defineProperty重新定义属性，性能不好
// 如果是数组，采用这种方式，性能很差
// 如果对象里面嵌套对象，需要递归处理

// proxy不用改成原对象，但是兼容性差
let proxy = new Proxy(obj, {  //没有对obj的属性进行重写，不需要递归，当访问到的属性是对象时，再代理即可
  get() { //proxy.xxx

  },
  set() { //proxy.xxx=100

  },
  has() { //'xxx' in proxy

  },
  deleteProperty() {  //删除属性的时候会执行

  },
  ownKeys() {

  }
})