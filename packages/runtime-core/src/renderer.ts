import { createAppAPI } from './apiCreateApp'

export function createRenderer(rendererOptions) {  //告诉core怎么渲染
  const render = (vnode, container) => {
    // core的核心
  }
  return {
    createApp: createAppAPI(render)
  }
}