import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

export default (() => {
  const Comments: QuartzComponent = ({ displayClass, cfg }: QuartzComponentProps) => {
    return (
      <div class={`comments ${displayClass ?? ""}`}>
        <script
          src="https://giscus.app/client.js"
          data-repo="BigSmartie/BigSmartie.github.io"
          data-repo-id="R_kgDOQ_hbQw"
          data-category="Announcements"
          data-category-id="DIC_kwDOQ_hbQ84C1XAa"
          data-mapping="pathname"
          data-strict="0"
          data-reactions-enabled="1"
          data-emit-metadata="0"
          data-input-position="bottom"
          data-theme="preferred_color_scheme"
          data-lang="zh-CN"
          crossorigin="anonymous"
          async
        ></script>
      </div>
    )
  }

  return Comments
}) satisfies QuartzComponentConstructor