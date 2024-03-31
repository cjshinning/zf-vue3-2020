// createVNode 创建虚拟节点

import { isArray, isObject, isString, ShapeFlags } from '@vue/shared';

// h('div',{style:{color:'red'}},children) h方法和createVNode类似
export const createVNode = (type, props, children = null) => {
  // 可以根据type来区分是组件还是普通元素
  // 根据type来区分 是元素还是组件
  // 给虚拟节点加一个类型
  const shapeFlag = isString(type) ? ShapeFlags.ELEMENT : isObject(type) ? ShapeFlags.STATEFUL_COMPONENT : 0;
  const vnode = { //一个对象来描述对应的内容，虚拟节点有跨平台的能力
    _v_isVnode: true,  //它是一个vnode节点
    type,
    props,
    children,
    component: null, //存放组件对应的实例
    el: null, //稍后会将虚拟节点和真实节点对应起来
    key: props && props.key, //diff算法会用到key
    shapeFlag //判断当前自己的类型和儿子类型
  }
  normalizeChildren(vnode, children);
  // <div>span p</div>
  return vnode;
}

// 判断儿子类型
function normalizeChildren(vnode, children) {
  let type = 0;
  if (children == null) { //不对儿子做处理

  } else if (isArray(children)) {
    type = ShapeFlags.ARRAY_CHILDREN;
  } else {
    type = ShapeFlags.TEXT_CHILDREN;
  }
  vnode.shapeFlag |= type;
}

