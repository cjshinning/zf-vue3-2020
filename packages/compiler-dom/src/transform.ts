import { PatchFlags } from '@vue/shared';
import { NodeTypes } from './parse';

export const CREATE_VNODE = Symbol('createVNode');
export const TO_DISPLAY_STRING = Symbol('toDisplayString');
export const OPEN_BLOCK = Symbol('openBlock');
export const CREATE_BLOCK = Symbol('createBlock');
export const FRAGMENT = Symbol('Fragment');
export const CREATE_TEXT = Symbol('createTextVNode');

function createVnodeCall(context, tag, props, children, patchFlag) {
  context.helper(CREATE_VNODE);
  return {
    type: NodeTypes.VNODE_CALL,
    tag,
    props,
    children,
    patchFlag
  }
}

function transformElement(node, context) {
  // 希望在整个树处理完毕后，再处理元素
  if (node.type != NodeTypes.ELEMENT) { //此节点是元素
    return;
  }
  return () => {  //退出函数 洋葱模型
    // console.log('处理元素的回调');
    // createVNode('h1',{},'helloworld',1)
    const { tag, children } = node;
    const vnodeTag = `'${tag}'`;
    let vnodeProps;
    let vnodeChildren;
    let vnodePatchFlag;
    let patchFlag = 0;  //用于标记标签是不是动态的
    // console.log(tag, children);
    if (children.length > 0) {
      if (children.length == 1) {
        const child = children[0];
        const type = child.type;
        const hasDynamicTextChild = type === NodeTypes.INTERPOLATION || type === NodeTypes.COMPOUND_EXPRESSION;
        if (hasDynamicTextChild) {
          patchFlag |= PatchFlags.TEXT;
        }
        vnodeChildren = child;
      } else {
        vnodeChildren = children; //多个儿子 不用处理
      }
    }
    if (patchFlag !== 0) {
      vnodePatchFlag = patchFlag + '';
    }
    node.codegenNode = createVnodeCall(context, vnodeTag, vnodeProps, vnodeChildren, vnodePatchFlag);
  }
}

function isText(node) {
  return node.type === NodeTypes.INTERPOLATION || node.type === NodeTypes.TXET;
}

function createCallExpression(callee, args) {
  return {
    type: NodeTypes.JS_CALL_EXPRESSION,
    callee,
    arguments: args
  }
}

function transformText(node, context) {
  // { { name } } hello => [children, children]=> createTextNode(name + 'hello')
  if (node.type == NodeTypes.ROOT || node.type == NodeTypes.ELEMENT) {
    return () => {
      // 对元素中的文本进行合并操作
      let hasText = false;
      let children = node.children;
      let container = null;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isText(child)) {  // hello {{name}} {{world}} hello
          hasText = true; //当前元素确实有文本，需要合并
          for (let j = i + 1; j < children.length; j++) {
            const next = children[j];
            if (isText(next)) {
              if (!container) {
                container = children[i] = {
                  type: NodeTypes.COMPOUND_EXPRESSION,
                  loc: child.loc,
                  children: [child]
                }
                container.children.push(`+`, next);
                children.splice(j, 1);
                j--;
              }
            } else {
              container = null;
              break;
            }
          }
        }
      }
      // 文本需要增加createText方法，helper里增加
      // <div>hello</div>
      if (!hasText || children.length == 1) { //只有一个汉字，再代码执行的时候，可以直接innerHTML，无需createText
        return;
      }
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isText(child) || child.type == NodeTypes.COMPOUND_EXPRESSION) {
          const callArgs = [];  //用于存放参数
          callArgs.push(child);
          if (child.type !== NodeTypes.TXET) {
            callArgs.push(PatchFlags.TEXT + '');
          }

          children[i] = {
            type: NodeTypes.TEXT_CALL,
            content: child,
            loc: child.loc,
            codegenNode: createCallExpression(  //用于最后生成代码的
              context.helper(CREATE_TEXT),
              callArgs
            )
          }
        }
      }
    }
  }
}

// 树结构，树的每一个节点进行转化
export function getBaseTransformPreset() {  //很多转换的方法
  return [
    // 方法1，方法2，...
    transformElement,
    transformText
  ]
}

function createTransformContext(root, nodeTransforms) {
  const context = {
    root,
    currentNode: root, //当前节点会随着树的遍历而更新
    nodeTransforms,  //上下文的目的是为了传参方便
    helpers: new Set(),
    helper(name) {  //代码中用到的具体方法，需要调用此方法，将对应的名字加入到helpers
      context.helpers.add(name);
      return name;
    }
  }
  return context;
}

function traverseChildren(node, context) {
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    traverseNode(child, context);
  }
}

function traverseNode(node, context) {
  const { nodeTransforms } = context;
  context.currentNode = node;
  const exits = [];
  for (let i = 0; i < nodeTransforms.length; i++) {
    const onExit = nodeTransforms[i](node, context);
    if (onExit) exits.push(onExit);
  }
  switch (node.type) {
    case NodeTypes.ROOT:
    case NodeTypes.ELEMENT:
      traverseChildren(node, context);
    case NodeTypes.INTERPOLATION:
      context.helper(TO_DISPLAY_STRING);
  }
  let i = exits.length;
  // 为了保证退出方法对应的context.currentNode是正确的
  while (i--) {
    exits[i]();
  }
}

function createRootCodegen(root, context) {
  const { helper } = context;
  const children = root.children;
  helper(OPEN_BLOCK);
  helper(CREATE_BLOCK);
  if (children.length == 1) {
    const child = children[0];  //直接以当前这个孩子做为根节点
    const codegen = child.codegenNode;
    codegen.isBlock = true; //只有一个儿子，那么它就是blocktree的根节点
    root.codegenNode = codegen; //一个儿子直接把而自己的codegen挂载到最外层
  } else if (children.length > 1) {
    root.codegenNode = createVnodeCall(context, helper(FRAGMENT), undefined, children, PatchFlags.STABLE_FRAGMENT);
    root.codegenNode.isBlock = true;
  }
}

export function transform(root, nodeTransforms) {
  const context = createTransformContext(root, nodeTransforms);
  traverseNode(root, context);
  createRootCodegen(root, context);
  root.helpers = [...context.helpers];
}