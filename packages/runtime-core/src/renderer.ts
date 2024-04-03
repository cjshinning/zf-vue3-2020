import { effect } from '@vue/reactivity';
import { ShapeFlags } from '@vue/shared';
import { patchProp } from 'packages/runtime-dom/src/patchProp';
import { createAppAPI } from './apiCreateApp'
import { createComponentInstance, setupComponent } from './component';
import { queueJob } from './scheduler';
import { normalizeVnode, Text } from './vnode';

export function createRenderer(rendererOptions) {  //告诉core怎么渲染
  const {
    insert: hostInsert,
    remove: hostRemove,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    createComment: hostCreateComment,
    setText: hostSetText,
    setElementText: hostSetElementText,
    nextSibling: hostNextSibling,
  } = rendererOptions;

  // ---------------- 组件 -----------------
  const setupRenderEffect = (instance, container) => {
    // 需要创建一个effect 在effect中调用 render方法，这样render方法拿到这个effect，属性更新时effect会重新执行
    instance.update = effect(function componentEffect() {  //每个组件都有一个effect，vue3是组件级更新，数据变化会重新执行对应的effect
      if (!instance.isMounted) {
        // 初次渲染
        let proxyToUse = instance.proxy;
        // $vnode _vnode(vue2)
        // vnode subTree(vue3)
        let subTree = instance.subTree = instance.render.call(proxyToUse, proxyToUse);
        // console.log(subTree);
        patch(null, subTree, container);
        instance.isMounted = true;
      } else {
        // 更新逻辑
        // diff算法
        const prevTree = instance.subTree;
        let proxyToUse = instance.proxy;
        const nextTree = instance.render.call(proxyToUse, proxyToUse);
        patch(prevTree, nextTree, container);
      }
    }, {
      scheduler: queueJob
    })
  }
  const mountComponent = (initialVNode, container) => {
    // 组件渲染流程 最核心的就是调用 setup 拿到返回值，获取render函数返回的结果来进行渲染
    // 1.先有实例
    const instance = initialVNode.component = createComponentInstance(initialVNode);
    // 2.将需要的数据解析到实例上
    setupComponent(instance); //启动组件
    // 3.创建一个effect，让render函数执行
    setupRenderEffect(instance, container);
  }
  const processComponent = (n1, n2, container) => {
    if (n1 == null) { //组件没有上一次的虚拟节点
      mountComponent(n2, container);
    } else {  //组件更新流程

    }
  }
  // ---------------- 组件 -----------------


  // ---------------- 元素 -----------------
  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; i++) {
      let child = normalizeVnode(children[i]);
      patch(null, child, container);
    }
  }
  const mountElement = (vnode, container, anchor = null) => {
    // 递归渲染
    const { props, shapeFlag, type, children } = vnode;
    let el = vnode.el = hostCreateElement(type);
    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, children); //文本直接扔进去即可
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el);
    }
    hostInsert(el, container, anchor);
  }
  const patchProps = (oldProps, newProps, el) => {
    if (oldProps !== newProps) {
      for (let key in newProps) {
        const prev = oldProps[key];
        const next = newProps[key];
        if (prev !== next) {
          hostPatchProp(el, key, prev, next);
        }
      }

      for (let key in oldProps) {
        if (!(key in newProps)) {
          hostPatchProp(el, key, oldProps[key], null);
        }
      }
    }
  }
  const patchKeyedChildren = (c1, c2, el) => {
    // vue3 对特殊情况进行优化

    let i = 0;  //都是默认从头开始比较
    let e1 = c1.length - 1;
    let e2 = c2.length - 1;

    // sync from start 从头开始一个个比 遇到不同的就停止了
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSomeVNodeType(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }
      i++;
    }

    // sync from end
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSomeVNodeType(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }
      e1--;
      e2--;
    }
    // 比较后 有一方已经完全比对完成

    // 如果完成后，最终i的值大于e1，说明是新增
    if (i > e1) { //老的少 新的多
      if (i <= e2) {  //表示有新增的部分
        const nextPos = e2 + 1;
        const anchor = nextPos < c2.length ? c2[nextPos].el : null;
        while (i <= e2) {
          // 确定向前还是向后插入？
          patch(null, c2[i], el, anchor); //只是向后追加
          i++;
        }
      }
    } else if (i > e2) {  //老的多新的少 有一方已经比对完了
      while (i <= e1) {
        unmount(c1[i]);
        i++;
      }
    } else {
      // 乱序比较，需要尽可能复用，用新的元素做成一个因设备区老的里找，一样的就复用，不一样的要不插入，要不删除
      let s1 = i;
      let s2 = i;

      // vue3用的是新的做的映射表 vue2用的是老的做的映射表
      const keyToNewIndexMap = new Map(); //值：索引
      for (let i = s2; i <= e2; i++) {
        const childVnode = c2[i];
        keyToNewIndexMap.set(childVnode.key, i);
      }
      // console.log(keyToNewIndexMap);

      const toBePatched = e2 - s2 + 1;
      const newIndexToOldIndexMap = new Array(toBePatched).fill(0);

      // 去老的里面查找 看有没有复用的
      for (let i = s1; i <= e1; i++) {
        const oldVnode = c1[i];
        let newIndex = keyToNewIndexMap.get(oldVnode.key);
        if (newIndex === undefined) {  //老的不在新的里面
          unmount(oldVnode);
        } else {  //新老的比对，比较之后位置有差异
          // 新的和旧的索引的关系
          newIndexToOldIndexMap[newIndex - s2] = i + 1;
          patch(oldVnode, c2[newIndex], el);
        }
      }
      // [5, 3, 4, 0] -> [1, 2]
      let increasingNewIndexSequence = getSequence(newIndexToOldIndexMap);
      let j = increasingNewIndexSequence.length - 1;  //取出最后一个人的索引
      // toBePatched[3, 2, 1, 0]
      for (let i = toBePatched - 1; i >= 0; i--) {
        let currentIndex = i + s2;  //找到h的索引
        let child = c2[currentIndex]; //找到h对应的节点
        let anchor = currentIndex + 1 < c2.length ? c2[currentIndex + 1].el : null;  //第一次插入h后，h是一个虚拟节点，同时插入后，虚拟节点会拥有真实节点
        if (newIndexToOldIndexMap[i] == 0) {  //如果自己是0，说明没有被patch过
          patch(null, child, el, anchor);
        } else {
          // [1,2,3,4,5,6]
          // [1,6,2,3,4,5] 最长递增子序列
          // 这个操作 需要将节点全部的移动一次，希望可以尽可能的少移动 [5,3,4,0]
          // 3, 2, 1, 0
          // [1, 2] 2
          if (i != increasingNewIndexSequence[j]) {
            hostInsert(child.el, el, anchor); //操作当前的d 以d下一个座位参照物插入
          } else {
            j--;  //跳过不需要移动的元素，为了减少移动，需要这个最长子序列算法
          }

        }
      }

      // 最后就是移动节点，并且将新增的节点插入
      // 最长递增子序列
    }

    // common sequence
  }
  function getSequence(arr) { //最终的结果是索引
    const len = arr.length;
    const result = [0]; //索引 递增的序列 用二分查找性能高O(nlogn)高于O(n^2)
    const p = arr.slice(0); //用来存放索引
    let start;
    let end;
    let middle;
    for (let i = 0; i < len; i++) {
      const arrI = arr[i];
      if (arrI !== 0) {
        let resultLastIndex = result[result.length - 1];
        // 取到索引对应的值
        if (arr[resultLastIndex] < arrI) {
          p[i] = resultLastIndex;
          result.push(i); //当前的值比上一个人大，直接push，并且让这个人在记录他的前面
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
          if (start > 0) {  //才需要替换
            p[i] = result[start - 1]; //要将他替换的前一个记住
          }
          result[start] = i;
        }
      }
    }
    let len1 = result.length; //总长度
    let last = result[len1 - 1];  //取最后一个
    while (len1-- > 0) {  //根据前驱节点一个个向前查找
      result[len1] = last;
      last = p[last];
    }
    return result;
  }
  const unmountChildren = (children) => {
    for (let i = 0; i < children.length; i++) {
      unmount(children[i]);
    }
  }
  const patchChildren = (n1, n2, el) => {
    const c1 = n1.children;
    const c2 = n2.children;

    // 老的有儿子 新的没儿子 新的有儿子 老的没儿子 新老都有儿子 新老都是文本
    const prevShapeFlag = n1.shapeFlag;
    const shapeFlag = n2.shapeFlag;
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 老的是n个孩子 但是新的是文本
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {  //case1:现在是文本，之前是数组
        unmountChildren(c1);  //如果c1中包含组件 会调用组件的销毁方法
      }

      // 两个人都是文本情况
      if (c2 !== c1) {  //case2:两个都是文本
        hostSetElementText(el, c2);
      }
    } else {
      // 新的不是文本（也就是是元素），上一次有可能是文本或者数组
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) { //case3:两个都是数组
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 当前是数组 之前是数组
          // 两个数组的比对 -> 核心diff算法 *******
          patchKeyedChildren(c1, c2, el);
        } else {
          // 没有孩子 特殊情况 当前是null 删除掉老的
          unmountChildren(c1);
        }
      } else {
        // 上一次是文本
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) { //case4:现在是数组，之前是文本
          hostSetElementText(el, '');
        }
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(c2, el);
        }
      }
    }

  }
  const patchElement = (n1, n2, container) => {
    // 元素是相同节点
    let el = (n2.el = n1.el);

    // 更新属性 更新儿子
    const oldProps = n1.props || {};
    const newProps = n2.props || {};

    patchProps(oldProps, newProps, el);
    patchChildren(n1, n2, el);
  }
  const processElement = (n1, n2, container, anchor) => {
    if (n1 == null) {
      mountElement(n2, container, anchor);
    } else {
      // 元素更新
      patchElement(n1, n2, container);
    }
  }

  const processText = (n1, n2, container) => {
    if (n1 == null) {
      hostInsert((n2.el = hostCreateText(n2.children)), container);
    }
  }
  const isSomeVNodeType = (n1, n2) => {
    return n1.type === n2.type && n1.key === n2.key;
  }
  const unmount = (n1) => { //如果是组件 调用组件的声明周期等
    hostRemove(n1.el);
  }
  const patch = (n1, n2, container, anchor = null) => {
    // 针对不同类型做初始化操作
    const { shapeFlag, type } = n2;
    if (n1 && !isSomeVNodeType(n1, n2)) {
      // 把以前的删掉 换成n2
      anchor = hostNextSibling(n1.el);
      unmount(n1);
      n1 = null;  //重新渲染n2对应的内容
    }
    switch (type) {
      case Text:
        processText(n1, n2, container);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // console.log('元素');
          processElement(n1, n2, container, anchor);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          // console.log('组件');
          processComponent(n1, n2, container);
        }
    }

  }

  const render = (vnode, container) => {
    // core的核心，根据不同的虚拟节点，创建对应的真实节点
    // 默认调用render，可能是初始化流程
    patch(null, vnode, container);
  }
  return {
    createApp: createAppAPI(render)
  }
}

// createRenderer 目的是创建一个渲染器
// 框架 都是组件 转化成虚拟dom -> 虚拟dom生成真实DOM挂载到真实页面上