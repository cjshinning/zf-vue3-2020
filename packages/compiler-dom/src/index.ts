
import { baseParse, NodeTypes } from './parse';
import { CREATE_BLOCK, CREATE_TEXT, CREATE_VNODE, FRAGMENT, getBaseTransformPreset, OPEN_BLOCK, TO_DISPLAY_STRING, transform } from './transform';

export const helperNameMap: any = {
  [FRAGMENT]: `Fragment`,
  [OPEN_BLOCK]: `openBlock`,
  [CREATE_BLOCK]: `createBlock`,
  [CREATE_VNODE]: `createVNode`,
  [CREATE_TEXT]: `createTextVNode`,
  [TO_DISPLAY_STRING]: `toDIsplayString`,
};

function createCodegenContext(ast) {
  const newLine = (n) => {
    context.push('\n' + ' '.repeat(n));
  }
  const context = {
    code: ``,
    push(c) {
      context.code += c;
    },
    helper(key) {
      return `${helperNameMap[key]}`;
    },
    indentLevel: 0,
    newLine() {
      newLine(context.indentLevel); //换行
    },
    indent() {
      newLine(++context.indentLevel); //缩进
    },
    deindent() {
      newLine(--context.indentLevel);
    }
  }
  return context;
}

function genVnodeCall(node, context) {
  const { tag, children, props, patchFlag, isBlock } = node;
  const { push, helper } = context;
  if (isBlock) {
    push(`(${helper(OPEN_BLOCK)}(),`)
    // 后面递归处理
  }
}

function genNode(node, context) {
  switch (node.type) {
    case NodeTypes.VNODE_CALL:
      genVnodeCall(node, context);
      break;
    case NodeTypes.ELEMENT:
      break;
    case NodeTypes.TXET:
      break;
    case NodeTypes.INTERPOLATION:
      break;
    case NodeTypes.SIMPLE_EXPRESSION:
      break;
    case NodeTypes.COMPOUND_EXPRESSION:
      break;
    case NodeTypes.JS_CALL_EXPRESSION:
      break;
  }
}

function generate(ast) {
  const context = createCodegenContext(ast);
  const { push, newLine, indent, deindent } = context;
  push(`const _Vue = Vue`);
  newLine();
  push(`return function render(_ctx){`);
  indent();
  push(`with (_ctx) {`)
  indent();
  push(`const {${ast.helpers.map(s => `${helperNameMap[s]}`).join(',')}} = _Vue`);
  newLine();
  push(`return `);  //需要根据转化后的结果，生成字符串
  genNode(ast.codegenNode, context);
  deindent();
  push(`}`);
  deindent()
  push(`}`);
  return context.code;
}

export function baseCompile(template) {
  // 将模板转化成ast语法树
  const ast = baseParse(template);
  // 将ast语法进行转换（优化，静态提升，方法缓存，生成代码为了最终生成代码时使用）
  const nodeTransforms = getBaseTransformPreset();  //nodeTransforms每遍历一个节点都要调用里面的方法
  transform(ast, nodeTransforms);
  // 根节点的处理 最外面包了一层代码

  return generate(ast);
}

// 从template -> ast语法树（vue里面有指令、有插槽、有事件，ast语法树是无法全部展示的）
// ast语法树 -> transform -> codegen
// 最终拼接完字符串，还是使用new Function实现