#!/usr/bin/env python3
"""
把 header.html / footer.html 的真实 HTML 写进各页面，替代原来的 fetch 注入。

原因：fetch 注入的导航在初始 HTML 里不存在，爬虫看不到任何内链；
      而 header.html 本身是完整的 <head><body> 片段，注入到 <div> 里还是非法 DOM。

同时统一修正：canonical 域名（加 www）、相对路径的 og:image、占位符 og:url。

幂等：重复运行不会套娃，已内联的页面会自动跳过并刷新内容。
"""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://www.bj-ip.com"

TARGETS = ["index.html", "insights.html", "article.html", "404.html",
           "vision.html", "contact.html", "work.html", "products.html"]

BEGIN_H, END_H = "<!-- header:auto -->", "<!-- /header:auto -->"
BEGIN_F, END_F = "<!-- footer:auto -->", "<!-- /footer:auto -->"


def extract(name: str, tag: str, absolute: bool = True) -> str:
    src = ROOT / name
    if not src.exists():
        return ""
    html = src.read_text(encoding="utf-8")
    m = re.search(rf"<{tag}>.*?</{tag}>", html, re.S)
    if not m:
        return ""
    out = m.group(0)
    if absolute:
        # header.html 里是 index.html / insights.html 这种相对链接，
        # 内联到 /insights/ 子目录页面会 404，统一改成站内绝对路径
        out = re.sub(r'(href|src)="(?!https?:|//|/|#|mailto:|tel:)([^"]+)"', r'\1="/\2"', out)
        out = out.replace('href="/index.html"', 'href="/"')
    return out


def inline(html: str, which: str, block: str) -> str:
    b, e = (BEGIN_H, END_H) if which == "header" else (BEGIN_F, END_F)
    wrapped = f'{b}\n{block}\n{e}'
    # 已有标记的，整段替换（保证能刷新）
    html = re.sub(re.escape(b) + r".*?" + re.escape(e), lambda _: wrapped, html, flags=re.S)
    if b in html:
        return html
    holder = f'<div id="{which}-placeholder"></div>'
    if holder in html:
        return html.replace(holder, f'<div id="{which}-placeholder">\n{wrapped}\n</div>', 1)
    return html


def normalize(html: str) -> str:
    html = html.replace("https://bj-ip.com", SITE)
    html = html.replace('content="https://yourdomain.com"', f'content="{SITE}/"')
    html = html.replace('content="img/logo.svg"', f'content="{SITE}/img/og-cover.jpg"')
    html = re.sub(r'content="img/([^"]+)"', rf'content="{SITE}/img/\1"', html)
    html = re.sub(r'content="([^"]*\.svg)"', r'content="' + SITE + '/img/og-cover.jpg"', html)
    return html


def main():
    header = extract("header.html", "header")
    footer = extract("footer.html", "footer")
    if not header or not footer:
        raise SystemExit("header.html / footer.html 里没找到 <header> 或 <footer>")

    for name in TARGETS:
        p = ROOT / name
        if not p.exists():
            continue
        html = p.read_text(encoding="utf-8")
        before = len(html)
        html = inline(html, "header", header)
        html = inline(html, "footer", footer)
        html = normalize(html)
        p.write_text(html, encoding="utf-8")
        print(f"  ✓ {name}  ({before // 1024}KB → {len(html) // 1024}KB)")


if __name__ == "__main__":
    main()
