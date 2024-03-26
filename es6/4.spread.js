// 深拷贝和浅拷贝

let o1 = { name: 'cj' };
let o2 = { age: { n: 18 } };

let assign = { ...o1, ...o2 };
o2.age.n = 28;
console.log(assign);  //{ name: 'cj', age: { n: 28 } }

console.log(JSON.stringify({ a: /\d+/, nu: null, un: undefined, fn: function () { } }));

// 把对象上的每个属性 都拷贝一下深拷贝 递归对象去拷贝

// typeof instanceof toString constructor
function deepClone(obj, hash = new WeakMap()) {  //记录拷贝前和拷贝后的对应关系
  if (obj == null) return obj;
  if (obj instanceof RegExp) return new RegExp(obj);
  if (obj instanceof Date) return new Date(obj);
  // ...
  if (typeof obj !== 'object') return obj;

  if (hash.has(obj)) return hash.get(obj); //返回上次拷贝的结果 不再递归

  const copy = new obj.constructor;
  hash.set(obj, copy);
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      copy[key] = deepClone(obj[key], hash);
    }
  }
  return copy;
}

// let obj = { age: { n: 18 } };
// console.log(deepClone(obj));  //{ age: { n: 18 } }

// 如果拷贝过的对象，就不需要再次拷贝
var obj1 = { a: '1' };
obj1.b = {};
obj1.b.a = obj1.b;
console.log(deepClone(obj1)); //{ a: '1', b: <ref *1> { a: [Circular *1] } }
