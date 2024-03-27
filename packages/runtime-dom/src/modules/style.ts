export const patchStyle = (el, prev, next) => {
  const style = el.style;
  if (next == null) {
    el.removeAttribute('style');  //{style:{}} {}
  } else {
    // 老的里面有没有新的
    if (prev) {
      for (let key in prev) {
        if (next[key] == null) {  //老的有 新的没有  需要删除
          style[key] = '';
        }
      }
    }
    // 新的里面需要赋值到style上
    for (let key in next) {  // {style:{color:'red'}} => {style:{backgroun:'red'}}
      style[key] = next[key];
    }
  }

}