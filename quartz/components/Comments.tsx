import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

export default (() => {
  const Comments: QuartzComponent = ({ displayClass, cfg }: QuartzComponentProps) => {
    return (
      // 这里只提供一个空的容器给 Giscus 挂载
      <div class={`comments ${displayClass ?? ""}`} id="giscus-container"></div>
    )
  }

  // 关键代码：通过 Quartz 的内部机制注入客户端脚本
  Comments.afterDOMLoaded = `
    function loadGiscus() {
      const container = document.getElementById('giscus-container');
      if (!container) return;
      
      // 【关键】每次跳转时，先清空旧页面的评论内容，防止出现两个评论框
      container.innerHTML = ''; 

      // 动态创建并插入 Giscus 脚本
      const script = document.createElement("script");
      script.src = "https://giscus.app/client.js";
      script.setAttribute("data-repo", "BigSmartie/BigSmartie.github.io");
      script.setAttribute("data-repo-id", "R_kgDOQ_hbQw");
      script.setAttribute("data-category", "General"); 
      script.setAttribute("data-category-id", "DIC_kwDOQ_hbQ84C1XAb");
      script.setAttribute("data-mapping", "pathname");
      script.setAttribute("data-strict", "0");
      script.setAttribute("data-reactions-enabled", "1");
      script.setAttribute("data-emit-metadata", "0");
      script.setAttribute("data-input-position", "top");
      script.setAttribute("data-theme", "preferred_color_scheme");
      script.setAttribute("data-lang", "zh-CN");
      script.setAttribute("data-loading", "lazy");
      script.crossOrigin = "anonymous";
      script.async = true;

      container.appendChild(script);
    }

    // 监听 Quartz 的无刷新跳转事件 "nav" (不仅首次加载会触发，每次点击链接都会触发)
    document.addEventListener("nav", loadGiscus);
  `

  return Comments
}) satisfies QuartzComponentConstructor