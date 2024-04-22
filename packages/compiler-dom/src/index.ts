
export const enum NodeTypes {
  ROOT,
  ELEMENT,
  TXET,
  SIMPLE_EXPRESSION = 4,
  INTERPOLATION = 5,
  ATTRIBUTE = 6,
  DIRECTIVE = 7,
  COMPONENT_EXPRESSION = 8,
  TEXT_CALL = 12,
  VNODE_CALL = 13
}

function isEnd(context) { //是否解析完毕，解析完毕的核心就是context.source=''
  const source = context.source;
  return !source;
}

function parseElement(context) {

}

function parseInterpolation(context) {

}

function getCursor(context) {
  let { line, column, offset } = context;

  return { line, column, offset };
}

function advancePositionWithMutation(context, s, endIndex) {
  let lineCount = 0;
  let linePos = -1;
  for (let i = 0; i < endIndex; i++) {
    if (s.charCodeAt(i) == 10) {  //遇到换行就加一行
      lineCount++;
      linePos = i;  //换行后第一个的位置
    }
  }
  context.offset += endIndex;
  context.line += lineCount;
  context.column = linePos == -1 ? context.column + endIndex : endIndex - linePos;
  console.log(context);
  // 如何更新列数
  // 如何更新偏移量

}

function advanceBy(context, endIndex) {
  let s = context.source; //源内容

  // 计算出一个新的结束位置
  advancePositionWithMutation(context, s, endIndex);  //根据内容和结束索引来修改上下文信息

  context.source = s.slice(endIndex); //截取内容
}

function parseTextData(context, endIndex) {
  const rawText = context.source.slice(0, endIndex);
  advanceBy(context, endIndex);  //在context.source中把文本内容删除
  return rawText;
}

function getSelection(context, start) { //获取这个信息对应的开始、结束、内容
  let end = getCursor(context);
  return {
    start,
    end,
    source: context.originalSource.slice(start.offset, end.offset)
  }
}

function parseText(context) { //1.先处理文本
  // <div>hello world  {{xxx}}</div>
  const endTokens = ['<', '{{'];
  let endIndex = context.source.length;
  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i], 1);
    if (index !== -1 && endIndex > index) {
      endIndex = index;
    }
  }
  // 有了文本的结束位置，就可以更新行列信息
  let start = getCursor(context);
  const content = parseTextData(context, endIndex);

  return {
    type: NodeTypes.TXET,
    content,
    loc: getSelection(context, start)
  }
}

function parseChildren(context) {
  const nodes = [];

  while (!isEnd(context)) {
    const s = context.source; //当前上下文中的内容 < abc  {{}}
    let node;
    if (s[0] == '<') {  //标签
      node = parseElement(context);
    } else if (s.startsWith('{{')) {  //表达式
      node = parseInterpolation(context);
    } else {
      node = parseText(context);
    }
    nodes.push(node);
  }

  return nodes;
}

function createParserContext(content) {
  return {
    line: 1,
    column: 1,
    offset: 0,
    source: content, //这个source会被不停地截取，等到source为空的时候解析完毕
    originalSource: content //这个值不会变，记录传入的内容
  }
}

function baseParse(content) {
  // 标识节点的信息 行、列、偏移量...
  // 每解析一段，就移除一部分
  const context = createParserContext(content);
  return parseChildren(context);
}

export function baseCompile(template) {
  // 将模板转化成ast语法树
  const ast = baseParse(template);
  return ast;
}