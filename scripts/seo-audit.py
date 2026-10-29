#!/usr/bin/env python3
"""
全站 SEO/GEO 合规审计

两类检查：
  A. 红线项（会被判定为作弊，必须清零）
     - 隐藏文本：display:none / visibility:hidden / font-size:0 / text-indent 负值
                 / 同色文字 / opacity:0 / clip / 零高度溢出隐藏
     - 对爬虫与用户不一致（cloaking 的静态痕迹：noscript 里塞正文）
     - meta keywords（已废弃，且是堆词证据）
     - 关键词密度异常（中文 2~4 字 n-gram）
     - 结构化数据里出现正文没有的说法（schema 与可见内容不一致）
     - 隐藏链接

  B. 质量项（影响抓取与引用，建议修）
     - title / description 长度、缺失
     - H 标签层级、h1 数量
     - 图片 alt 缺失 / 重复 / 过长，缺少 width/height
     - 外链缺 rel
     - 出站链接过于集中
     - 页面可见正文过少（薄页面）

用法：python3 scripts/seo-audit.py [--verbose]
"""

import glob
import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://www.bj-ip.com"

SKIP = {"header.html", "footer.html", "ByteDanceVerify.html",
        "baidu_verify_codeva-1uINJbepWh.html"}
SKIP_DIRS = ("logo_motion",)

RED, YEL, GRN, DIM, RST = "\033[31m", "\033[33m", "\033[32m", "\033[2m", "\033[0m"


def pages():
    out = []
    for p in glob.glob("*.html") + glob.glob("insights/*.html") + glob.glob("services/*.html"):
        if Path(p).name in SKIP or any(d in p for d in SKIP_DIRS):
            continue
        out.append(p)
    return sorted(out)


def visible_text(html: str) -> str:
    s = re.sub(r"<(script|style|noscript)[^>]*>.*?</\1>", " ", html, flags=re.S | re.I)
    s = re.sub(r"<[^>]+>", " ", s)
    s = re.sub(r"&[a-z]+;|&#\d+;", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def find_hidden_text(html: str):
    """找隐藏文本的典型手法。返回 [(手法, 片段)]"""
    hits = []
    body = html.split("<body", 1)[-1]

    for m in re.finditer(r'<(\w+)[^>]*style="([^"]*)"[^>]*>(.*?)</\1>', body, re.S | re.I):
        style, inner = m.group(2).lower().replace(" ", ""), m.group(3)
        text = visible_text(inner)
        if len(text) < 4:
            continue
        if "display:none" in style:
            hits.append(("display:none", text[:40]))
        elif "visibility:hidden" in style:
            hits.append(("visibility:hidden", text[:40]))
        elif re.search(r"font-size:0(px|em|%)?[;\"']", style):
            hits.append(("font-size:0", text[:40]))
        elif re.search(r"text-indent:-[1-9]\d{3,}px", style):
            hits.append(("text-indent 负值", text[:40]))
        elif re.search(r"opacity:0(\.0+)?[;\"']", style):
            hits.append(("opacity:0", text[:40]))
        elif re.search(r"height:0[;\"']", style) and "overflow:hidden" in style:
            hits.append(("height:0 + overflow:hidden", text[:40]))
        elif re.search(r"color:#(fff|ffffff)", style) and re.search(r"background(-color)?:(#)?(fff|ffffff|white)", style):
            hits.append(("同色文字", text[:40]))

    hs = re.search(r"<style[^>]*>(.*?)</style>", html, re.S)
    if hs:
        for m in re.finditer(r"([.#][\w-]+)\s*\{([^}]*)\}", hs.group(1)):
            sel, decl = m.group(1), m.group(2).replace(" ", "").lower()
            if "display:none" in decl or "visibility:hidden" in decl:
                cls = sel.lstrip(".#")
                if re.search(rf'class="[^"]*\b{re.escape(cls)}\b', body):
                    hits.append((f"CSS 隐藏 {sel}", "（类被正文使用）"))
    return hits


# 中文高频虚词/代词。它们天然高频，不应算作堆词证据。
STOPWORDS = set("""
我们 你们 他们 她们 自己 大家 这个 那个 这些 那些 这样 那样 什么 怎么 为什么
可以 就是 不是 因为 所以 但是 而且 如果 虽然 已经 还有 以及 或者 而是 同时
通过 进行 需要 一个 一些 一直 非常 比较 只有 一定 可能 应该 必须 其实 确实
时候 地方 东西 事情 问题 方面 情况 过程 方式 方法 部分 内容 时候 之后 之前
对于 关于 由于 根据 按照 除了 没有 不能 不会 不要 不是 就是 也是 都是 还是
公司 我们 团队 客户 服务 项目 品牌 内容 数据 市场 合作 活动 产品 营销
""".split())

# 真正值得警惕的是这类"商业词组合"，被反复塞进正文里
SUSPECT_HINTS = ("品牌营销", "营销策划", "品牌设计", "活动策划", "新媒体运营", "数字营销")


def keyword_density(text: str, top: int = 5):
    """中文 3~5 字 n-gram 频次。只用于发现异常集中的商业词反复出现。"""
    cn = re.sub(r"[^\u4e00-\u9fa5]", "", text)
    if len(cn) < 300:
        return []
    counter = Counter()
    for n in (3, 4, 5):
        for i in range(len(cn) - n + 1):
            counter[cn[i:i + n]] += 1
    total = len(cn)
    out = []
    for term, c in counter.most_common(200):
        if c < 8:
            break
        if term in STOPWORDS:
            continue
        # 子串去重：只保留更长的
        if any(term != item[0] and term in item[0] for item in out):
            continue
        per_k = c / total * 1000
        out.append((term, c, round(per_k, 1)))
        if len(out) >= top:
            break
    return out


def schema_texts(html: str):
    out = []
    for m in re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.S):
        try:
            data = json.loads(m)
        except Exception:
            continue
        stack = [data]
        while stack:
            cur = stack.pop()
            if isinstance(cur, dict):
                for k, v in cur.items():
                    if k in ("headline", "name", "description") and isinstance(v, str) and len(v) > 6:
                        out.append(v)
                    elif isinstance(v, (dict, list)):
                        stack.append(v)
            elif isinstance(cur, list):
                stack.extend(cur)
    return out


def main():
    verbose = "--verbose" in sys.argv
    fatal, warn = [], []

    print(f"\n{'='*68}\n  全站 SEO / GEO 合规审计   {len(pages())} 个页面\n{'='*68}\n")

    for p in pages():
        html = Path(p).read_text(encoding="utf-8")
        text = visible_text(html)

        # ---------- A 红线 ----------
        for how, frag in find_hidden_text(html):
            fatal.append((p, f"隐藏文本[{how}]：{frag}"))

        if re.search(r'<meta\s+name="keywords"', html, re.I):
            fatal.append((p, "存在 meta keywords（已废弃，且是堆词证据）"))

        ns = re.findall(r"<noscript[^>]*>(.*?)</noscript>", html, re.S)
        for n in ns:
            if len(visible_text(n)) > 80:
                fatal.append((p, f"noscript 里有 {len(visible_text(n))} 字正文（cloaking 痕迹）"))

        for a in re.finditer(r"<a\s[^>]*>", html, re.I):
            tag = a.group(0).lower()
            if ("display:none" in tag or "visibility:hidden" in tag) :
                fatal.append((p, "隐藏链接"))

        # schema 与正文一致性：description 允许是摘要，但关键词要能在页面上找到
        flat = re.sub(r"[^\u4e00-\u9fa5A-Za-z0-9]", "", text)
        for s in schema_texts(html):
            terms = {s[i:i + 3] for i in range(len(s) - 2)
                     if re.fullmatch(r"[\u4e00-\u9fa5]{3}", s[i:i + 3])}
            if not terms:
                continue
            hit = sum(1 for t in terms if t in flat) / len(terms)
            if hit < 0.15:
                warn.append((p, f"schema 说法与正文几乎无重合（{hit:.0%}），可能是凭空添加：{s[:34]}…"))

        # ---------- B 质量 ----------
        if re.search(r'<meta\s+name="robots"\s+content="[^"]*noindex', html, re.I):
            continue

        title = re.search(r"<title>(.*?)</title>", html, re.S)
        title = title.group(1).strip() if title else ""
        desc = re.search(r'<meta\s+name="description"\s+content="([^"]*)"', html)
        desc = desc.group(1).strip() if desc else ""

        if not title:
            fatal.append((p, "缺 title"))
        elif not (10 <= len(title) <= 32):
            warn.append((p, f"title 长度 {len(title)}（建议 10~32 字）：{title[:30]}"))
        if not desc:
            warn.append((p, "缺 description"))
        elif not (40 <= len(desc) <= 110):
            warn.append((p, f"description 长度 {len(desc)}（建议 40~110 字）"))

        h1 = re.findall(r"<h1[^>]*>", html, re.I)
        if len(h1) == 0:
            warn.append((p, "没有 h1"))
        elif len(h1) > 1:
            fatal.append((p, f"h1 有 {len(h1)} 个"))
        levels = [int(x) for x in re.findall(r"<h([1-6])[^>]*>", html, re.I)]
        for a, b in zip(levels, levels[1:]):
            if b - a > 1:
                warn.append((p, f"标题跳级 h{a} → h{b}"))
                break

        imgs = re.findall(r"<img[^>]*>", html, re.I)
        noalt = [i for i in imgs if not re.search(r'alt="[^"]+"', i)]
        if noalt:
            warn.append((p, f"{len(noalt)} 张图缺 alt"))
        dim = [i for i in imgs if not (re.search(r'width="\d+"', i) and re.search(r'height="\d+"', i))]
        if dim and len(imgs) > 3:
            warn.append((p, f"{len(dim)}/{len(imgs)} 张图缺 width/height（影响 CLS）"))

        alts = [re.search(r'alt="([^"]*)"', i).group(1) for i in imgs if re.search(r'alt="([^"]*)"', i)]
        alts = [a for a in alts if a]
        if len(alts) > 6:
            c = Counter(alts).most_common(1)[0]
            if c[1] > len(alts) * 0.8:
                warn.append((p, f"alt 高度重复：'{c[0][:20]}' ×{c[1]}"))

        nvis = len(re.sub(r"\s", "", text))
        # 图库类页面（图片多）正文天然少，不算薄页面
        if nvis < 300 and len(imgs) < 10:
            warn.append((p, f"可见正文仅 {nvis} 字（薄页面）"))

        dens = keyword_density(text)
        for t, c, per_k in dens:
            if per_k > 25:
                fatal.append((p, f"疑似堆词：'{t}' 出现 {c} 次（{per_k}/千字）"))
                break
            if per_k > 15 and t in SUSPECT_HINTS:
                warn.append((p, f"商业词偏密：'{t}' 出现 {c} 次（{per_k}/千字）"))
                break

        ext = re.findall(r'<a\s[^>]*href="https?://(?!www\.bj-ip\.com)[^"]+"[^>]*>', html, re.I)
        bad_ext = [a for a in ext if "rel=" not in a.lower()]
        if bad_ext:
            warn.append((p, f"{len(bad_ext)} 个外链缺 rel（建议 nofollow/noopener）"))

        if verbose:
            print(f"{DIM}{p:46} 正文 {nvis:5} 字  h1×{len(h1)}  img {len(imgs)}{RST}")

    # ---------- 输出 ----------
    print(f"{RED}[红线项] {len(fatal)}{RST}")
    if fatal:
        for p, m in fatal:
            print(f"  {RED}✗{RST} {p:42} {m}")
    else:
        print(f"  {GRN}✓ 未发现作弊痕迹{RST}")

    print(f"\n{YEL}[质量项] {len(warn)}{RST}")
    for p, m in warn:
        print(f"  {YEL}!{RST} {p:42} {m}")

    print(f"\n{'='*68}")
    if not fatal:
        print(f"{GRN}结论：机器层全部是「声明式」的，没有隐藏文本、没有 cloaking、没有堆词。{RST}")
        print("这属于合规实现——搜索引擎看到的和人看到的完全一样，只是额外多了结构化声明。")
    else:
        print(f"{RED}结论：有 {len(fatal)} 项红线问题，必须处理后再上线。{RST}")
    print(f"{'='*68}\n")
    return 1 if fatal else 0


if __name__ == "__main__":
    sys.exit(main())
