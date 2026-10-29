#!/usr/bin/env python3
"""
GEO 文章体检：按 docs/geo-article-standard.md 给每篇文章打分。

用法：
    python3 scripts/geo-lint.py            # 全部文章
    python3 scripts/geo-lint.py ip01       # 只查某一篇（模糊匹配文件名）

满分 100，80 分以下不建议发布。
"""

import glob
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RED, YEL, GRN, DIM, RST = "\033[31m", "\033[33m", "\033[32m", "\033[2m", "\033[0m"

# 中文写作里最容易出现的空转词
AI_SMELL = ["赋能", "闭环", "抓手", "生态位", "综上所述", "值得注意的是",
            "在这个快速变化的时代", "众所周知", "不难发现", "随着……的发展"]


def visible(html: str) -> str:
    s = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", html, flags=re.S | re.I)
    s = re.sub(r"<[^>]+>", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def check(path: Path) -> dict:
    html = path.read_text(encoding="utf-8")
    text = visible(html)
    n = len(re.sub(r"\s", "", text))
    h2 = [re.sub(r"<[^>]+>", "", x).strip()
          for x in re.findall(r"<h2[^>]*>(.*?)</h2>", html, re.S)]

    # H2 问句：含问号、或"怎么/为什么/如何/哪/是否/多少"
    q_pat = re.compile(r"[？?]|怎么|为什么|如何|哪|是否|多少|能不能|要不要")
    q_num = sum(1 for x in h2 if q_pat.search(x))
    q_ratio = q_num / len(h2) if h2 else 0

    tables = re.findall(r"<table[^>]*>.*?</table>", html, re.S)
    big_tables = [t for t in tables if len(re.findall(r"<tr", t)) >= 4]   # 表头 + 3 行

    faq_items = len(re.findall(r"<details", html))
    list_items = len(re.findall(r"<li[^>]*>", html))

    numbers = len(re.findall(r"\d+(?:\.\d+)?\s*(?:%|万|亿|人|年|天|元|个|条|次|倍|家)", text))
    density = numbers / (n / 1000) if n else 0

    smells = [w for w in AI_SMELL if w in text]
    has_def = bool(re.search(r"是指|指的是|是.{0,6}的一种|定义为", text))
    links_service = len(re.findall(r'href="/services/', html))

    score = 0
    miss = []

    # ① 一句话答案
    if re.search(r'class="tldr"', html):
        score += 15
    else:
        miss.append("缺「一句话答案」(.tldr)")

    # ② 对比表格
    if big_tables:
        score += 15
    else:
        miss.append("缺对比表格（≥3 行）")

    # ③ 数据表或清单
    if len(tables) >= 2 or list_items >= 5:
        score += 10
    else:
        miss.append("缺数据表/清单")

    # ④ 品牌观点
    if re.search(r'class="brand-view"', html):
        score += 10
    else:
        miss.append("缺品牌观点（.brand-view）")

    # ⑤ FAQ
    if faq_items >= 5:
        score += 15
    elif faq_items > 0:
        score += 8
        miss.append(f"FAQ 只有 {faq_items} 条（建议 5–8）")
    else:
        miss.append("缺 FAQ")

    # ⑤ H2 问句比例
    if q_ratio >= 0.5:
        score += 10
    elif q_ratio >= 0.3:
        score += 5
        miss.append(f"问句标题仅 {q_ratio:.0%}（建议 ≥50%）")
    else:
        miss.append(f"问句标题仅 {q_ratio:.0%}（建议 ≥50%）")

    # ⑥ 定义句
    if has_def:
        score += 5
    else:
        miss.append("缺定义句（「X 是指……」）")

    # ⑧ 数字密度
    if density >= 3:
        score += 10
    elif density >= 1.5:
        score += 5
        miss.append(f"数字密度 {density:.1f}/千字（建议 ≥3）")
    else:
        miss.append(f"数字密度 {density:.1f}/千字（建议 ≥3）")

    # ⑨ AI 腔
    if not smells:
        score += 5
    else:
        miss.append("AI 腔：" + "、".join(smells[:3]))

    # ⑩ 服务内链
    if links_service:
        score += 5
    else:
        miss.append("没链到服务页")

    # 排版检查（不计分）：只看可见正文，避免把 JSON-LD / 标签属性里的引号算进来
    body_text = text
    dq = body_text.count('"')
    half_punct = len(re.findall(r"[\u4e00-\u9fa5][,;:!?](?!\d)", body_text))

    return {"file": path.name, "score": score, "chars": n, "miss": miss,
            "h2": len(h2), "q": q_num, "tables": len(tables), "faq": faq_items,
            "dq": dq, "half": half_punct}


def main():
    key = sys.argv[1] if len(sys.argv) > 1 else None
    files = [Path(p) for p in sorted(glob.glob(str(ROOT / "insights" / "*.html")))]
    if key:
        files = [f for f in files if key in f.name]
    if not files:
        print("没找到文章")
        return 1

    rows = [check(f) for f in files]

    print()
    print("=" * 78)
    print("  GEO 文章体检   （满分 100，80 分以下不建议发布）")
    print("=" * 78)
    print(f"{'文章':<44}{'分数':>6}{'字数':>8}{'表格':>6}{'FAQ':>5}")
    print("-" * 78)

    for r in rows:
        if r["score"] >= 80:
            color = GRN
        elif r["score"] >= 60:
            color = YEL
        else:
            color = RED
        name = r["file"].replace(".html", "")
        if len(name) > 42:
            name = name[:39] + "..."
        print(f"{name:<44}{color}{r['score']:>4}{RST}{'':>2}{r['chars']:>7}{r['tables']:>6}{r['faq']:>5}")

    print()
    for r in rows:
        if not r["miss"]:
            continue
        print(f"{DIM}{r['file']}{RST}")
        for m in r["miss"]:
            print(f"   {RED}·{RST} {m}")
        print()

    # 排版提醒：不影响分数，但会明显影响专业观感
    typos = [r for r in rows if r["dq"] or r["half"]]
    if typos:
        print(f"{YEL}排版提醒{RST}（不扣分，建议修）")
        for r in typos:
            bits = []
            if r["dq"]:
                bits.append(f"半角引号 {r['dq']} 处")
            if r["half"]:
                bits.append(f"中文后半角标点 {r['half']} 处")
            print(f"   {DIM}{r['file']}{RST}  " + " / ".join(bits))
        print()

    avg = sum(r["score"] for r in rows) / len(rows)
    print("-" * 78)
    print(f"平均分 {avg:.0f} ｜ 合格 {sum(1 for r in rows if r['score'] >= 80)}/{len(rows)} 篇")
    print()
    return 0


if __name__ == "__main__":
    sys.exit(main())
