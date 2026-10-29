#!/usr/bin/env python3
"""
把 posts/*.html 正文片段编译成 SEO/GEO 友好的独立静态页 /insights/<slug>.html

做四件事：
1. 抽出正文（去掉重复的标题/<hr>前的元信息）
2. 把 base64 内联图片落成实体文件，并压缩成 webp（LCP 与图片收录）
3. 生成带完整 head / Open Graph / Article + BreadcrumbList 结构化数据的页面
4. 重新生成 sitemap.xml

用法：python3 scripts/build-articles.py
"""

import base64
import json
import re
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit("需要 Pillow：/Users/cen/.workbuddy/binaries/python/envs/default/bin/pip install Pillow")

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://www.bj-ip.com"
BRAND = "怡亚科技"
MAX_W = 1600
QUALITY = 82

# 文章 id -> 语义化 slug（新增文章时在这里补一行，或留空自动生成）
SLUG_MAP = {
    "ip01": "ip-creation-framework",
    "article-miqvvmld-1osi": "overseas-brand-global-media",
    "article-mhqo73q0-csd8": "digital-marketing-transformation",
    "article-mhq9eitm-3wrg": "overseas-ecommerce-brand-strategy",
    "article-mhq9lhd6-1xna": "medical-aesthetics-marketing",
}

# 不进入 sitemap / 列表页的文章（内容未确认发布时放这里）
UNPUBLISHED = set()


def slugify(article_id: str) -> str:
    if article_id in SLUG_MAP:
        return SLUG_MAP[article_id]
    s = re.sub(r"[^a-z0-9]+", "-", article_id.lower()).strip("-")
    return s or "article"


def optimize_image(src: Path) -> Path:
    """超过 200KB 或超宽的图片转 webp，返回最终使用的路径。"""
    if src.suffix.lower() == ".webp":
        return src
    dst = src.with_suffix(".webp")
    try:
        if dst.exists() and dst.stat().st_mtime >= src.stat().st_mtime:
            return dst
        im = Image.open(src)
        if im.mode in ("RGBA", "LA", "P"):
            im = im.convert("RGBA")
            bg = Image.new("RGB", im.size, (255, 255, 255))
            bg.paste(im, mask=im.split()[-1])
            im = bg
        else:
            im = im.convert("RGB")
        if im.width > MAX_W:
            im = im.resize((MAX_W, round(im.height * MAX_W / im.width)), Image.LANCZOS)
        im.save(dst, "WEBP", quality=QUALITY, method=6)
        return dst
    except Exception as e:
        print(f"    ! 图片转换失败 {src.name}: {e}")
        return src


def materialize_base64(html: str, article_id: str) -> str:
    """把 data:image/... 内联图落成文件。"""
    counter = {"n": 0}

    def repl(m):
        mime, payload = m.group(2), m.group(3)
        counter["n"] += 1
        ext = ".png" if "png" in mime else (".jpg" if "jpe" in mime else ".png")
        out = ROOT / "img" / "posts" / f"{article_id}-inline-{counter['n']}{ext}"
        out.parent.mkdir(parents=True, exist_ok=True)
        if not out.exists():
            out.write_bytes(base64.b64decode(payload))
        return 'src="/img/posts/' + out.name + '"'

    return re.sub(r'src="(data:image/([a-z+]+);base64,([^"]+))"', repl, html)


def fix_image_paths(html: str) -> str:
    """相对 img/posts/x.png 改成站内绝对路径，避免 /insights/ 下 404。"""
    return re.sub(r'src="img/', 'src="/img/', html)


def add_image_attrs(html: str, title: str) -> str:
    """补 alt / loading / width / height（CLS 与图片 SEO）。"""
    n = {"i": 0}

    def repl(m):
        tag = m.group(0)
        src = re.search(r'src="([^"]+)"', tag)
        if not src:
            return tag
        n["i"] += 1
        extra = ""
        # alt 已有就保留原值，没有才补
        if " alt=" not in tag:
            extra += f' alt="{title} - 图{n["i"]}"'
        if "loading=" not in tag:
            extra += ' loading="lazy"'
        if "decoding=" not in tag:
            extra += ' decoding="async"'
        # 尺寸独立判断，不看 alt（原逻辑因此在已有 alt 时漏掉 width/height）
        if "width=" not in tag or "height=" not in tag:
            local = ROOT / src.group(1).lstrip("/")
            try:
                with Image.open(local) as im:
                    extra += f' width="{im.width}" height="{im.height}"'
            except Exception:
                pass
        return tag.replace("<img", f"<img{extra}", 1)

    return re.sub(r"<img[^>]*>", repl, html)


def extract_content(raw: str, title: str) -> str:
    body = raw
    if "<hr" in body:
        body = body.split("<hr", 1)[1]
        body = body[body.find(">") + 1:] if ">" in body else body
    body = body.strip()

    # 正文里与页面标题重复的那个 h1 直接删掉（页面顶部已有 h1）
    for m in re.finditer(r"<h1[^>]*>(.*?)</h1>", body, re.S):
        if re.sub(r"<[^>]+>", "", m.group(1)).strip() == title.strip():
            body = body[:m.start()] + body[m.end():]
            break

    # 其余标题层级统一降一级，保证一页只有一个 h1
    body = re.sub(r"<h1([^>]*)>", r"<h2\1>", body)
    body = re.sub(r"</h1>", "</h2>", body)

    # 给正文 h2 加锚点，供「本文要点」跳转（也方便 AI 按小节切分引用）
    counter = {"n": 0}

    def add_id(m):
        open_tag, inner = m.group(1), m.group(2)
        counter["n"] += 1
        if "id=" in open_tag:
            return m.group(0)
        new_tag = open_tag[:-1] + f' id="sec-{counter["n"]}">'
        return f"{new_tag}{inner}</h2>"

    body = re.sub(r"(<h2[^>]*>)(.*?)</h2>", add_id, body, flags=re.S)
    return body


def key_points(content: str):
    """从正文 h2 生成「本文要点」——可见、可跳转、可被 AI 按节抽取。"""
    items = re.findall(r'<h2[^>]*id="([^"]+)"[^>]*>(.*?)</h2>', content, re.S)
    out = []
    for anchor, text in items:
        clean = re.sub(r"<[^>]+>", "", text).strip()
        if clean:
            out.append((anchor, clean))
    return out


def plain_text(html: str) -> str:
    t = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", html, flags=re.S | re.I)
    t = re.sub(r"<[^>]+>", " ", t)
    t = re.sub(r"&[a-z]+;", " ", t)
    return re.sub(r"\s+", " ", t).strip()


def esc(s: str) -> str:
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
             .replace('"', "&quot;"))


def load_partial(name: str, prefix: str = "/") -> str:
    p = ROOT / name
    if not p.exists():
        return ""
    html = p.read_text(encoding="utf-8")
    m = re.search(r"<header>.*?</header>", html, re.S)
    if not m:
        m = re.search(r"<footer>.*?</footer>", html, re.S)
    if not m:
        return ""
    out = m.group(0)
    if prefix == "/":
        out = re.sub(r'(href|src)="(?!https?:|//|/|#|mailto:|tel:)([^"]+)"', r'\1="/\2"', out)
    return out


def render_points(content: str) -> str:
    pts = key_points(content)
    if len(pts) < 2:
        return ""
    lis = "".join(f'<li><a href="#{a_}">{esc(t)}</a></li>' for a_, t in pts[:8])
    return (f'<nav class="key-points" aria-label="本文要点">'
            f'<p class="kp-title">本文要点</p><ol>{lis}</ol></nav>')


def build_page(a: dict, content: str, slug: str, desc: str, cover: str, related: list) -> str:
    url = f"{SITE}/insights/{slug}.html"
    title = a["title"]
    date = a.get("date", "")
    author = a.get("author") or BRAND
    tags = [t for t in a.get("tags", []) if len(t) <= 12 and not t.startswith("一、")]
    ccls = {"数据洞察": "data-insight-tag", "品牌策略": "brand-strategy-tag", "品牌活动": "brand-activity-tag"}
    tag_html = "".join(
        f'<span class="article-tag {ccls[t]}">{esc(t)}</span>' if t in ccls
        else f'<span class="article-tag">{esc(t)}</span>' for t in tags)

    article_ld = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": title,
        "description": desc,
        "datePublished": date,
        "dateModified": date,
        "inLanguage": "zh-CN",
        "mainEntityOfPage": {"@type": "WebPage", "@id": url},
        "image": [cover] if cover else [],
        "author": {"@type": "Organization", "name": author, "url": f"{SITE}/vision.html"},
        "publisher": {
            "@type": "Organization",
            "name": BRAND,
            "logo": {"@type": "ImageObject", "url": f"{SITE}/img/logo.svg"},
        },
    }
    crumbs_ld = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "主页", "item": f"{SITE}/"},
            {"@type": "ListItem", "position": 2, "name": "全域智能洞察", "item": f"{SITE}/insights.html"},
            {"@type": "ListItem", "position": 3, "name": title, "item": url},
        ],
    }

    related_html = ""
    if related:
        items = "".join(
            f'<li><a href="/insights/{r["slug"]}.html">{esc(r["title"])}</a></li>' for r in related
        )
        related_html = f'<aside class="related-posts"><h2>继续阅读</h2><ul>{items}</ul></aside>'

    return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{esc(title)} - {BRAND}</title>
<meta name="description" content="{esc(desc)}">
<meta name="author" content="{esc(author)}">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<link rel="canonical" href="{url}">
<link rel="icon" href="/favicon.ico">
<link rel="stylesheet" href="/style.css">
<link rel="stylesheet" href="/footer.css">
<link rel="stylesheet" href="/assets/fontawesome/css/all.min.css">
<link rel="stylesheet" href="/blog.css">
<meta property="og:type" content="article">
<meta property="og:site_name" content="{BRAND}">
<meta property="og:locale" content="zh_CN">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{cover}">
<meta property="article:published_time" content="{date}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{esc(title)}">
<meta name="twitter:description" content="{esc(desc)}">
<meta name="twitter:image" content="{cover}">
<script type="application/ld+json">{json.dumps(article_ld, ensure_ascii=False)}</script>
<script type="application/ld+json">{json.dumps(crumbs_ld, ensure_ascii=False)}</script>
</head>
<body class="article-page">
<div id="header-placeholder">{load_partial("header.html")}</div>

<main>
<div class="breadcrumb" role="navigation" aria-label="面包屑"><a href="/">主页</a><span>/</span><a href="/insights.html">全域智能洞察</a><span>/</span><span>{esc(title)}</span></div>
<article id="article-content">
<div class="article-header">
<h1>{esc(title)}</h1>
<p class="article-meta">发布于 {date} · 作者：{esc(author)}</p>
<div class="article-tags">{tag_html}</div>
</div>
{render_points(content)}
{content}
</article>
{related_html}
<div class="article-footer-nav"><a href="/insights.html" class="read-more">&larr; 返回全部洞察</a></div>
</main>

<div id="footer-placeholder">{load_partial("footer.html")}</div>
</body>
</html>
"""


def build_insights_page(articles: list, built: list) -> None:
    """把 insights.html 重写成静态列表：内容写在 HTML 里，JS 只做筛选增强。"""
    by_id = {b["id"]: b for b in built}
    cats = ["数据洞察", "品牌策略", "品牌活动"]

    cards = []
    for a in sorted(articles, key=lambda x: x.get("date", ""), reverse=True):
        b = by_id.get(a["id"])
        if not b:
            continue
        tags = [t for t in a.get("tags", []) if len(t) <= 12 and not t.startswith("一、")]
        cats_hit = [c for c in cats if c in tags]
        cls = {"数据洞察": "data-insight-tag", "品牌策略": "brand-strategy-tag", "品牌活动": "brand-activity-tag"}
        chips = "".join(f'<span class="article-tag {cls[c]}">{esc(c)}</span>' for c in cats_hit)
        other = [t for t in tags if t not in cats]
        other_html = "".join(f'<span class="tag-plain">{esc(t)}</span>' for t in other[:4])
        lead = (a.get("summary") or "").strip()
        cards.append(f"""      <article class="article-entry" data-tags="{esc(' '.join(tags))}">
        <h2><a href="/insights/{b['slug']}.html">{esc(a['title'])}</a></h2>
        <p class="article-meta">发布于 {a.get('date','')} · 作者：{esc(a.get('author') or BRAND)}</p>
        <div class="article-tags">{chips}{other_html}</div>
        <p class="article-summary">{esc(lead)}</p>
        <a href="/insights/{b['slug']}.html" class="read-more">阅读全文 &rarr;</a>
      </article>""")

    ld = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "全域智能洞察",
        "url": f"{SITE}/insights.html",
        "inLanguage": "zh-CN",
        "isPartOf": {"@type": "WebSite", "url": f"{SITE}/"},
        "mainEntity": {
            "@type": "ItemList",
            "itemListElement": [
                {"@type": "ListItem", "position": i + 1, "url": f"{SITE}/insights/{b['slug']}.html",
                 "name": b["title"]}
                for i, b in enumerate([by_id[a["id"]] for a in articles if a["id"] in by_id])
            ],
        },
    }

    html = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>全域智能洞察 - 品牌营销方法论与行业观点 | {BRAND}</title>
<meta name="description" content="怡亚科技的全域智能洞察栏目：分享品牌策略、数据洞察与品牌活动的实战方法论，涵盖IP打造、出海媒体链接、数字化营销变革等主题。">
<meta name="author" content="{BRAND}">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<link rel="canonical" href="{SITE}/insights.html">
<link rel="icon" href="/favicon.ico">
<link rel="stylesheet" href="/footer.css">
<link rel="stylesheet" href="/style.css">
<link rel="stylesheet" href="/assets/fontawesome/css/all.min.css">
<link rel="stylesheet" href="/blog.css">
<meta property="og:type" content="website">
<meta property="og:site_name" content="{BRAND}">
<meta property="og:locale" content="zh_CN">
<meta property="og:title" content="全域智能洞察 - 品牌营销方法论与行业观点">
<meta property="og:description" content="品牌策略、数据洞察与品牌活动的实战方法论。">
<meta property="og:url" content="{SITE}/insights.html">
<meta property="og:image" content="{SITE}/img/og-cover.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="{SITE}/img/og-cover.jpg">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
</head>
<body>
<div id="header-placeholder">{load_partial("header.html")}</div>

<main>
  <div class="content-container">
    <h1 class="page-title">全域智能洞察</h1>
    <p class="page-intro">这里记录怡亚科技在品牌策略、数据洞察与品牌活动上的实战方法。每篇文章都来自真实项目：我们做过什么、踩过哪些坑、可复用的框架是什么。适合正在做品牌升级、内容体系搭建或出海传播的团队参考。</p>
  </div>

  <div class="category-nav" role="tablist" aria-label="按分类筛选">
    <button class="category-btn active" data-filter="all">全部</button>
    <button class="category-btn" data-filter="数据洞察">数据洞察</button>
    <button class="category-btn" data-filter="品牌策略">品牌策略</button>
    <button class="category-btn" data-filter="品牌活动">品牌活动</button>
  </div>

  <div id="article-list">
{chr(10).join(cards)}
  </div>
  <p class="no-articles" id="empty-tip" hidden>该分类下暂无文章。</p>

</main>

<div id="footer-placeholder">{load_partial("footer.html")}</div>

<script>
  document.querySelectorAll('.category-btn').forEach(function (btn) {{
    btn.addEventListener('click', function () {{
      var f = btn.dataset.filter;
      document.querySelectorAll('.category-btn').forEach(function (b) {{ b.classList.remove('active'); }});
      btn.classList.add('active');
      var shown = 0;
      document.querySelectorAll('#article-list .article-entry').forEach(function (card) {{
        var hit = f === 'all' || (card.dataset.tags || '').split(' ').indexOf(f) > -1;
        card.hidden = !hit;
        if (hit) shown++;
      }});
      document.getElementById('empty-tip').hidden = shown > 0;
    }});
  }});
</script>
</body>
</html>
"""
    (ROOT / "insights.html").write_text(html, encoding="utf-8")
    print(f"  ✓ insights.html（{len(cards)} 篇文章静态渲染，含筛选增强）")



def sync_llms(articles: list, built: list) -> None:
    """让 llms.txt 的文章清单跟着构建自动更新，避免手写漏更新。"""
    f = ROOT / "llms.txt"
    if not f.exists():
        return
    by_id = {b["id"]: b for b in built}
    lines = []
    for a in sorted(articles, key=lambda x: x.get("date", ""), reverse=True):
        b = by_id.get(a["id"])
        if not b:
            continue
        lead = (a.get("summary") or "").strip()
        if len(lead) > 60:
            lead = lead[:58] + "…"
        lines.append(f'- [{a["title"]}]({SITE}/insights/{b["slug"]}.html)：{lead}')
    block = "## 内容（全域智能洞察）\n\n" + "\n".join(lines)
    text = f.read_text(encoding="utf-8")
    head = text.split("## 内容（全域智能洞察）")[0]
    tail = "## 引用说明"
    rest = text.split(tail, 1)[1] if tail in text else ""
    f.write_text(head + block + "\n\n" + tail + rest, encoding="utf-8")
    print(f"  ✓ llms.txt 文章清单已同步（{len(lines)} 篇）")



def build_sitemap_page() -> None:
    """生成人能看的网站地图 /sitemap.html（机器那份是 sitemap.xml）。"""
    groups = [
        ("主要页面", ["index.html", "work.html", "vision.html", "contact.html"]),
        ("服务", ["services/index.html"] + sorted(
            f"services/{x.name}" for x in (ROOT / "services").glob("*.html") if x.name != "index.html")),
        ("全域智能洞察", ["insights.html"] + sorted(
            f"insights/{x.name}" for x in (ROOT / "insights").glob("*.html"))),
    ]
    names = {
        "index.html": "首页",
        "work.html": "全域营销案例",
        "vision.html": "关于我们",
        "contact.html": "联系我们",
        "services/index.html": "服务总览",
        "insights.html": "全域智能洞察",
    }

    def label(path: str) -> str:
        if path in names:
            return names[path]
        f = ROOT / path
        if not f.exists():
            return ""
        html = f.read_text(encoding="utf-8")
        h1 = re.search(r"<h1[^>]*>(.*?)</h1>", html, re.S)
        if h1:
            return re.sub(r"<[^>]+>", "", h1.group(1)).strip()
        t = re.search(r"<title>(.*?)</title>", html, re.S)
        return re.sub(r"\s+-\s+怡亚科技.*$", "", t.group(1)).strip() if t else path

    def url(path: str) -> str:
        if path == "index.html":
            return f"{SITE}/"
        if path.endswith("index.html"):
            return f"{SITE}/{path[:-11]}"
        return f"{SITE}/{path}"

    blocks = []
    for title, items in groups:
        lis = []
        for it in items:
            if not (ROOT / it).exists():
                continue
            lis.append(f'        <li><a href="{url(it)}">{esc(label(it))}</a></li>')
        if lis:
            blocks.append(f"      <h2>{title}</h2>\n      <ul>\n" + "\n".join(lis) + "\n      </ul>")

    ld = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "网站地图",
        "url": f"{SITE}/sitemap.html",
        "inLanguage": "zh-CN",
        "isPartOf": {"@type": "WebSite", "url": f"{SITE}/"},
    }

    html = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>网站地图 - 全部页面导航 | {BRAND}</title>
<meta name="description" content="怡亚科技官网的完整页面索引：主要页面、四项服务、全域智能洞察文章，一页找到全部内容。">
<meta name="author" content="{BRAND}">
<meta name="robots" content="index,follow">
<link rel="canonical" href="{SITE}/sitemap.html">
<link rel="icon" href="/favicon.ico">
<link rel="stylesheet" href="/style.css">
<link rel="stylesheet" href="/assets/fontawesome/css/all.min.css">
<link rel="stylesheet" href="/sitemap.css">
<meta property="og:type" content="website">
<meta property="og:site_name" content="{BRAND}">
<meta property="og:title" content="网站地图 | {BRAND}">
<meta property="og:url" content="{SITE}/sitemap.html">
<meta property="og:image" content="{SITE}/img/og-cover.jpg">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
</head>
<body>
<div id="header-placeholder">{load_partial("header.html")}</div>

<main class="sitemap-page">
  <h1>网站地图</h1>
  <p class="lead">这里列出站内所有页面。要了解我们做什么，从「服务」开始；想看方法论，去「全域智能洞察」。</p>
{chr(10).join(blocks)}
</main>

<div id="footer-placeholder">{load_partial("footer.html")}</div>
</body>
</html>
"""
    (ROOT / "sitemap.html").write_text(html, encoding="utf-8")
    print(f"  ✓ sitemap.html（{sum(len(b) for b in blocks) // 60} 组页面）")


def main():
    index_path = ROOT / "articles-index.json"
    articles = json.loads(index_path.read_text(encoding="utf-8"))
    out_dir = ROOT / "insights"
    out_dir.mkdir(exist_ok=True)

    built = []
    for a in articles:
        src = ROOT / a["contentFile"]
        if not src.exists():
            print(f"  ! 找不到正文 {src}")
            continue
        built.append({"id": a["id"], "slug": slugify(a["id"]),
                      "title": a["title"], "date": a.get("date", "")})

    # 第二轮才写页面，因为「继续阅读」需要全部 slug
    for b in built:
        a = next(x for x in articles if x["id"] == b["id"])
        src = ROOT / a["contentFile"]
        raw = src.read_text(encoding="utf-8")
        content = extract_content(raw, a["title"])
        content = materialize_base64(content, a["id"])
        content = fix_image_paths(content)
        for path in {m.group(1) for m in re.finditer(r'src="(/img/[^"]+)"', content)}:
            p = ROOT / path.lstrip("/")
            if p.exists():
                new = optimize_image(p)
                if new != p:
                    content = content.replace(path, "/" + new.relative_to(ROOT).as_posix())
        content = add_image_attrs(content, a["title"])

        desc = (a.get("summary") or plain_text(content))[:150].replace('"', "“")
        # og:image 必须是 jpg/png——微信、Facebook 不支持 webp 摘要图
        cover = "/img/og-cover.jpg"
        first = re.search(r'src="(/img/[^"]+\.(?:png|jpg|jpeg))"', content)
        if first:
            cover = first.group(1)
        cover = SITE + cover

        related = [r for r in built if r["id"] != b["id"]][:3]
        html = build_page(a, content, b["slug"], desc, cover, related)
        (out_dir / f"{b['slug']}.html").write_text(html, encoding="utf-8")
        print(f"  ✓ /insights/{b['slug']}.html  ({len(html) // 1024}KB, 正文约 {len(plain_text(content))} 字)")

    # sitemap
    pages = [("", "1.0", "weekly"), ("services/", "0.9", "monthly"),
             ("sitemap.html", "0.4", "monthly"),
             ("insights.html", "0.9", "weekly"),
             ("vision.html", "0.7", "monthly"), ("contact.html", "0.7", "monthly"),
             ("work.html", "0.6", "monthly")]
    for slug in ("brand-strategy", "brand-activation", "content-operation", "immersive-experience"):
        if (ROOT / "services" / f"{slug}.html").exists():
            pages.append((f"services/{slug}.html", "0.8", "monthly"))
    urls = [f"""  <url>
    <loc>{SITE}/{p}</loc>
    <lastmod>{__import__("datetime").date.today().isoformat()}</lastmod>
    <changefreq>{cf}</changefreq>
    <priority>{pr}</priority>
  </url>""" for p, pr, cf in pages]
    for b in built:
        if b["id"] in UNPUBLISHED:
            continue
        urls.append(f"""  <url>
    <loc>{SITE}/insights/{b['slug']}.html</loc>
    <lastmod>{b['date'] or __import__("datetime").date.today().isoformat()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>""")
    sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' \
        + "\n".join(urls) + "\n</urlset>\n"
    (ROOT / "sitemap.xml").write_text(sitemap, encoding="utf-8")
    print(f"  ✓ sitemap.xml（{len(urls)} 条）")

    # 供 insights.html 静态列表使用
    (ROOT / "scripts" / "articles-built.json").write_text(
        json.dumps(built, ensure_ascii=False, indent=2), encoding="utf-8")

    build_insights_page(articles, built)
    sync_llms(articles, built)
    build_sitemap_page()


if __name__ == "__main__":
    main()
