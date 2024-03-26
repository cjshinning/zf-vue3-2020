// reduce 收敛函数 可以把一个数组转化成其他格式

Array.prototype.reduce = function (callback, prev) {
  for (let i = 0; i < this.length; i++) {
    if (!prev) {
      prev = callback(this[i], this[i + 1], i + 1, this);
      i++;
    } else {
      prev = callback(prev, this[i], i, this);
    }
  }
  return prev;
}

// 执行过程 求和函数 
let r = ([1, 2, 3, 4]).reduce((previousValue, currentValue, index, array) => {
  console.log(previousValue, currentValue);
  return previousValue + currentValue;
})
// 返回值是上一次的 + 当前的值
console.log(r);

console.log([1, [2, [3, [4]]]].flat(3));  //[ 1, 2, 3, 4 ]

// compose 面试问reduce会让实现compose
function sum(a, b) {
  return a + b;
}
function len(str) {
  return str.length;
}
function addPrefix(str) {
  return '$' + str;
}

// let r1 = addPrefix(len(sum('a', 'b')));
// console.log(r1);  //$2

// const compose = (...fns) => {
//   return function (...args) {
//     let lastFn = fns.pop();
//     let r = lastFn(...args);
//     return fns.reduceRight((prev, current) => {
//       return current(prev);
//     }, r)
//   }
// }

// const compose = (...fns) => (...args) => {
//   let lastFn = fns.pop();
//   return fns.reduceRight((prev, current) => current(prev), lastFn(...args))
// }

// const compose = (...fns) => {
//   return fns.reduce(function (a, b) {
//     return function (...args) {
//       return a(b(...args));
//     }
//   })
// }

const compose = (...fns) => fns.reduce((a, b) => (...args) => a(b(...args)));

let final = compose(addPrefix, len, sum);
const r2 = final('a', 'b');
console.log(r2);  //$2