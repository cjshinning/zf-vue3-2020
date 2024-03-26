// ES6 后续新增的方法都放在Reflect上 -> Object

let s1 = Symbol('cj');
let obj = {
  name: 'cj',
  age: 18,
  [s1]: 'ok'
}
Reflect.ownKeys(obj).forEach(item => {  //获取所有的key属性
  console.log(item);
})

// defineProperty -> Reflect
// Reflect.get  Reflect.set Reflect.delete

const fn = (a, b) => {
  console.log('fn', a, b);
}
fn.apply = function () {  //自定义了apply 会默认调用它，但是我们想调用函数本身的apply
  console.log('apply');
}
// 调用函数本身的apply方法如何调用，call的功能是让apply方法中this指向fn,并让apply方法执行
// fn.apply(); //apply
// Function.prototype.apply.call(fn, null, [1, 2]);  //fn 1 2

Reflect.apply(fn, null, [1, 2]);  //fn 1 2
