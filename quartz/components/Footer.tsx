import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/footer.scss"
import { version } from "../../package.json"
import { i18n } from "../i18n"

interface Options {
  links: Record<string, string>
}

export default ((opts?: Options) => {
  const Footer: QuartzComponent = ({ displayClass, cfg }: QuartzComponentProps) => {
    const year = new Date().getFullYear()
    const links = opts?.links ?? []
    return (
      <footer class={`${displayClass ?? ""}`}>
        {/* --- 1. 这里是原来的版权信息 --- */}
        <p>
          {i18n(cfg.locale).components.footer.createdWith}{" "}
          <a href="https://quartz.jzhao.xyz/">Quartz v{version}</a> © {year}
        </p>
        <ul>
          {Object.entries(links).map(([text, link]) => (
            <li>
              <a href={link}>{text}</a>
            </li>
          ))}
        </ul>

        {/* --- 2. 这里是我们新加的评论区代码！ --- */}
        <div style="margin-top: 2rem;">
          <script
            src="https://giscus.app/client.js"
            data-repo="BigSmartie/BigSmartie.github.io"   // 【改】仓库名
            data-repo-id="R_kgD..."                         // 【改】填你的 repo-id
            data-category="Announcements"                   // 【改】分类名
            data-category-id="DIC_kwD..."                   // 【改】填你的 category-id
            data-mapping="pathname"
            data-strict="0"
            data-reactions-enabled="1"
            data-emit-metadata="0"
            data-input-position="top"
            data-theme="preferred_color_scheme"
            data-lang="zh-CN"
            data-loading="lazy"
            crossorigin="anonymous"
            async
          ></script>
        </div>
        {/* --- 结束 --- */}
      </footer>
    )
  }

  Footer.css = style
  return Footer
}) satisfies QuartzComponentConstructor
