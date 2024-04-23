
export const enum NodeTypes {
  ROOT,
  ELEMENT,
  TXET,
  SIMPLE_EXPRESSION = 4,  //{{name}}
  INTERPOLATION = 5,  //{{}}
  ATTRIBUTE = 6,
  DIRECTIVE = 7,
  COMPOUND_EXPRESSION = 8, //组合表达式
  TEXT_CALL = 12, //文本调用 createTextVnode
  VNODE_CALL = 13,
  JS_CALL_EXPRESSION = 17
}

function isEnd(context) { //是否解析完毕，解析完毕的核心就是context.source=''
  const source = context.source;

  if (source.startsWith('</')) {
    return true;
  }

  return !source;
}

function advanceSpaces(context) {
  const match = /^[ \t\r\n]+/.exec(context.source);
  if (match) {
    advanceBy(context, match[0].length);
  }
}

function parseTag(context) {
  const start = getCursor(context);
  const match = /^<\/?([a-z][^ \t\r\n\>]*)/i.exec(context.source);
  const tag = match[1];
  advanceBy(context, match[0].length);
  advanceSpaces(context);

  const isSelfClosing = context.source.startsWith('/>');
  advanceBy(context, isSelfClosing ? 2 : 1)

  return {
    type: NodeTypes.ELEMENT,
    tag,
    isSelfClosing,
    loc: getSelection(context, start)
  }
}

function parseElement(context) {  //{{   name  }} {{name}}
  // 1.解析标签的名字
  let ele: any = parseTag(context);  //这里处理儿子有可能没有儿子，如果遇到结束标签就直接跳出

  // 2.处理儿子
  const children = parseChildren(context);

  if (context.source.startsWith('</')) {
    parseTag(context);  //解析关闭标签时，同时会移除关闭信息，并且更新偏移量
  }
  ele.children = children;
  ele.loc = getSelection(context, ele.loc.start);
  return ele;
}

function parseInterpolation(context) {
  const start = getCursor(context); //获取表达式的start位置
  const closeIndex = context.source.indexOf('}}', '{{');

  advanceBy(context, 2);
  const innerStart = getCursor(context);
  const innerEnd = getCursor(context);
  const rawContentLength = closeIndex - 2;  //拿到{{ 内容 }}，包含空格的
  const preTrimContent = parseTextData(context, rawContentLength);
  const content = preTrimContent.trim();
  const startOffset = preTrimContent.indexOf(content);
  if (startOffset > 0) {  //前面有空格
    advancePositionWithMutation(innerStart, preTrimContent, startOffset);
  }
  // 再去更新innerEnd
  const endOffset = content.length + startOffset;
  advancePositionWithMutation(innerEnd, preTrimContent, endOffset);
  advanceBy(context, 2);
  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      isStatic: false,
      loc: getSelection(context, innerStart, innerEnd),
      content
    },
    loc: getSelection(context, start)
  }
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

function getSelection(context, start, end?) { //获取这个信息对应的开始、结束、内容
  end = end || getCursor(context);
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
    // break;
    nodes.push(node);
  }
  nodes.forEach((node, index) => {
    if (node.type === NodeTypes.TXET) {
      if (!/[^ \t\r\n]/.test(node.content)) {
        nodes[index] = null;
      } else {
        node.content = node.content.replace(/[ \t\r\n]+/g, ' ');
      }
    }
  })

  return nodes.filter(Boolean);
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

function createRoot(children, loc) {
  return {
    type: NodeTypes.ROOT,
    children,
    loc
  }
}

export function baseParse(content) {
  // 标识节点的信息 行、列、偏移量...
  // 每解析一段，就移除一部分
  const context = createParserContext(content);
  const start = getCursor(context); //记录开始位置
  return createRoot(parseChildren(context), getSelection(context, start));
}
