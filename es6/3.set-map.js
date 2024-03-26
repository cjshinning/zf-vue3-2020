// 数据类型 可以去重 set 值不重复 map -> weakmap weakset

// 使用区别
let set = new Set([1, 2, 1, 1, 2, 1, 1, 3, 'a']);
set.add(5);
console.log(set.entries(set));
console.log(set.has(5));

let map = new Map([['a', 1], ['v', 1], ['v', 1]]);
// console.log(map); //Map(2) { 'a' => 1, 'v' => 1 }

map.set({ a: 1 }, 2);
console.log(map); //Map(3) { 'a' => 1, 'v' => 1, { a: 1 } => 2 }

// 它的key可以使用对象

// 数组 交集 并集 差集
let arr1 = [1, 2, 3, 4];
let arr2 = [3, 4, 5, 6];

console.log(Object.prototype.toString.call(new Map())); //[object Map]
console.log(Object.prototype.toString.call(new Set())); //[object Set]

function union(arr1, arr2) {
  let s = new Set([...arr1, ...arr2]);  //集合 可以被迭代
  return [...s];
}
console.log(union(arr1, arr2)); //[ 1, 2, 3, 4, 5, 6 ]

function intersection(arr1, arr2) {
  let s1 = new Set(arr1);
  let s2 = new Set(arr2);

  return [...s1].filter(item => {
    return s2.has(item);
  })
}
console.log(intersection(arr1, arr2));  //[ 3, 4 ]

// weakMap 弱引用 垃圾回收 “标记引用”：每引用就会记一次数
class myTest { }
let my = new myTest();
let map1 = new WeakMap();

map1.set(my, 1);

my = null;  //当你给一个变量设置为null的时候，不会马上回收，会在合适的机会自己回收
// map引用的对象不会被回收 weakMap引用的对象被置为null时，后续会清空