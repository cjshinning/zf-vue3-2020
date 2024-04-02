const arr = [2, 3, 1, 5, 6, 8, 7, 9, 4]; //1 3 4 9 最长递增的子序列 求个数
// 1, 2, 0, 3, 4, 5
// 1, 8, 5, 3, 4, 9, 7, 6, 0

function getSequence(arr) { //最终的结果是索引
  const len = arr.length;
  const result = [0];
  let start;
  let end;
  let middle;
  for (let i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      let resultLastIndex = result[result.length - 1];
      // 取到索引对应的值
      if (arr[resultLastIndex] < arrI) {
        result.push(i);
        continue;
      }

      // 二分查找，找到比当前值大的那一个
      start = 0;
      end = result.length - 1;
      while (start < end) {
        middle = ((start + end) / 2) | 0;
        if (arr[result[middle]] < arrI) {
          start = middle + 1;
        } else {
          end = middle;
        } //找到结果集中，比当前这一项大的数
      }
      // start/end就是找到的位置
      if (arrI < arr[result[start]]) {  //如果相同或者比当前的还大就不换了
        result[start] = i;
      }
    }
  }
  return result;
}

console.log(getSequence(arr));

// 求当前列表中最大递增的个数

// 贪心 + 二分查找

// 在查找中如果当前的比最后一个大，直接插入
// 如果当前这个比最后一个小，采用二分查找的方式，找到已经排好的列表，找到比当前数组大的那一项，将其替换掉

// 1, 8, 5, 3, 4, 9, 7, 6, 2

// 贪心算法（看谁更有潜力）
// 1
// 1 8
// 1 5
// 1 3
// 1 3 4
// 1 3 4 9
// 1 3 4 7
// 1 3 4 6
// 后面加个2
// 1 2 4 6

// 2, 3, 1, 5, 6, 8, 7, 9, 4
// 2
// 2 3
// 1 3
// 1 3 5
// 1 3 5 6
// 1 3 5 6 8
// 1 3 5 6 7
// 1 3 5 6 7 9 这个是值

// 2 3 5 6 7 9 真实需要的值

// 2, 1, 8, 4, 6, 7 这个是索引（错误）

