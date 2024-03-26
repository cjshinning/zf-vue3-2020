// Symbol 基本数据类型 string number boolean null undefined symbol bigint

// Symbol 独一无二的类型

let s1 = Symbol('cj');
let s2 = Symbol('cj');
console.log(s1 === s2); //false

// 对象的key来使用
let obj = {
  name: 'cj',
  age: 18,
  [s1]: 'ok'
}
// console.log(obj);

for (let key in obj) {  //Symbol属性默认是不能枚举的
  console.log(obj[key]);
}
console.log(Object.getOwnPropertySymbols(obj)); //获取所有symbol
console.log(Object.keys(obj));  //获取普通类型的key

let s3 = Symbol.for('cj');  //声明全新的
let s4 = Symbol.for('cj');  //把之前声明的拿过来用
console.log(s3 === s4); //true

// 元编程的能力 -> 可以改写语法本身

// typeof 判断类型 基本类型 Object.prototype.toString.call
// instanceof constructor

let obj1 = {
  [Symbol.toStringTag]: 'cj'
}
console.log(Object.prototype.toString.call(obj1));  //[object cj]

// 隐士类型转换
let obj2 = {
  [Symbol.toPrimitive](type) {
    // console.log(type);
    return '123';
  }
}
console.log(obj2 + 1);  //[object Object]1

let instance = {
  [Symbol.hasInstance](value) {
    return 'name' in value;
  }
}

console.log({ name: 'cj' } instanceof instance);  //true
