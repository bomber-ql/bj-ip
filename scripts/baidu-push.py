#!/usr/bin/env python3
"""
百度普通收录 API 推送

用法：
    python3 scripts/baidu-push.py <token>            # 推送 sitemap 里全部 URL
    python3 scripts/baidu-push.py <token> insights   # 只推 URL 含 insights 的

token 在百度搜索资源平台 → 用户中心 → 站点管理 → 普通收录 → API 提交 里复制。

注意：
- 每个站点每天有配额（新站通常 10–100 条），超了会返回 over quota
- 重复提交同一 URL 会占配额，建议只在内容更新后推
- 推送成功 ≠ 收录，只是"告诉百度这里变了"
"""

import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
API = "http://data.zz.baidu.com/urls"


def urls(keyword: str = "") -> list:
    sm = (ROOT / "sitemap.xml").read_text(encoding="utf-8")
    all_urls = re.findall(r"<loc>([^<]+)</loc>", sm)
    return [u for u in all_urls if keyword in u] if keyword else all_urls


def push(token: str, site: str, batch: list) -> dict:
    body = "\n".join(batch)
    req = urllib.request.Request(
        f"{API}?site={site}&token={token}",
        data=body.encode("utf-8"),
        headers={"Content-Type": "text/plain"},
        method="POST",
    )
    import json
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        # 百度的错误原因写在响应体里，必须读出来
        raw = e.read().decode("utf-8", "ignore")
        try:
            data = json.loads(raw)
        except Exception:
            data = {"message": raw[:200], "success": 0, "remain": "?"}
        data["_http"] = e.code
        return data


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 1

    token = sys.argv[1]
    keyword = sys.argv[2] if len(sys.argv) > 2 else ""
    targets = urls(keyword)

    if not targets:
        print("没找到要推送的 URL")
        return 1

    site = "https://www.bj-ip.com"
    print(f"准备推送 {len(targets)} 条到 {site}\n")

    # 百度单次上限 2000 条，这里按 100 分批，便于看每批结果
    for i in range(0, len(targets), 100):
        batch = targets[i:i + 100]
        try:
            res = push(token, site, batch)
        except Exception as e:
            print(f"  请求失败：{e}")
            return 1

        ok = res.get("success", 0)
        remain = res.get("remain", "?")
        print(f"  本批 {len(batch)} 条 → 成功 {ok} 条，今日剩余配额 {remain}")

        for msg in (res.get("not_same_site") or [])[:3]:
            print(f"    ✗ 不属于该站点：{msg}")
        for msg in (res.get("not_valid") or [])[:3]:
            print(f"    ✗ 格式不合法：{msg}")
        if res.get("message"):
            print(f"    ! {res['message']}")

    print("\n完成。推送只是通知百度来抓，收录结果到「普通收录 → 索引量」看。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
