#!/usr/bin/env python3
"""
生成服务页：/services/index.html + 4 个服务详情页

目的：承接「品牌策略公司」「活动策划」「新媒体代运营」「AR 互动营销」这类商业词，
每页带 Service + FAQPage + BreadcrumbList 结构化数据，正文 900~1200 字。

用法：python3 scripts/build-services.py
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://www.bj-ip.com"
BRAND = "怡亚科技"
OUT = ROOT / "services"

NAV_SERVICES = [
    ("brand-strategy", "品牌策略与品牌设计", "先把「凭什么选你」说清楚，再把它变成看得见的东西。"),
    ("brand-activation", "品牌活动与线下体验", "把一场活动当成一次内容生产来设计。"),
    ("content-operation", "内容与新媒体运营", "内容不是翻译产品，是持续对外表达的那条线。"),
    ("immersive-experience", "AI · AR/VR · CG 营销体验", "技术该不该用，只看它有没有让人多停留三秒。"),
]

SERVICES = [
    {
        "slug": "brand-strategy",
        "h1": "品牌策略与品牌设计",
        "title": "品牌策略与品牌设计 - 命名、定位、VI、包装 | 怡亚科技",
        "desc": "怡亚科技的品牌策略与品牌设计服务：品牌诊断、市场与消费者调研、品牌命名、定位与价值主张、VI 与 LOGO、包装设计、品牌 IP 形象，帮品牌说清「凭什么选你」。",
        "lead": "品牌策略解决的是一个很朴素的问题：消费者为什么要在几个看起来差不多的选项里选你。"
                "我们先把这个答案找出来，再用命名、视觉、IP 和包装，把它变成别人一眼就能看懂的东西。"
                "策略不是一份 PPT，它最后必须落在能被看见的物料上。",
        "pains": [
            "新产品要上市，名字、定位、包装一样都还没有",
            "品牌做了很多年，对外形象还停在上一个时代",
            "集团下面好几个品牌和产品线，消费者分不清谁是谁",
            "准备出海，国内那套表达在目标市场讲不通",
            "投了不少广告，但用户记不住你是谁、做什么",
        ],
        "deliver": [
            ("定位与诊断", "品牌现状诊断、市场与竞品扫描、消费者访谈、品牌命名、品牌定位与价值主张、品牌架构梳理、品牌故事与叙事"),
            ("视觉与表达", "LOGO 设计、VI 视觉识别系统、品牌视觉规范、包装设计、品牌 IP 形象设计、文创与周边延展"),
            ("落地与应用", "品牌手册、内部宣贯材料、首批应用物料（官网、画册、展陈、社交头像与模板）"),
            ("长期陪伴", "年度品牌顾问、新品上市视觉延展、品牌资产管理建议"),
        ],
        "steps": [
            ("01", "诊断", "先看现状：消费者现在怎么描述你、竞品占住了哪个词、你自己内部对品牌的理解是否一致。"),
            ("02", "定位", "找出那个别人没占住、你又真的做得到的差异点，把它压缩成一句能被复述的话。"),
            ("03", "表达", "把定位翻译成名字、标志、颜色、字体、语气和图形语言，形成一套可延展的系统。"),
            ("04", "落地", "落到真实物料上跑一遍，检查在包装、货架、屏幕和小尺寸头像里还成不成立。"),
        ],
        "audience": "从 0 到 1 的新品牌、需要形象焕新的成熟品牌、多品牌或多产品线需要梳理架构的集团、准备进入海外市场的品牌。",
        "faqs": [
            ("只做 LOGO，不做整套品牌，可以吗？",
             "可以。不过我们通常会先花时间把定位问清楚再动笔，因为标志只是定位的结果。"
             "定位不清的时候，方案会陷入「哪个好看」的无休止争论；定位清楚了，图形往往一次就能收敛。"),
            ("你们和传统广告公司、设计工作室有什么不同？",
             "传统广告公司强在传播执行，设计工作室强在视觉。我们的团队里策略、设计和技术在同一张桌子上，"
             "所以做完品牌还能直接接住落地：官网、活动、AR 互动、内容生产，不用再找三四家供应商对齐。"),
            ("一个品牌项目大概要多久？",
             "范围和深度差别很大，只做命名和只做全案不是一回事。我们会在诊断之后给到分阶段的排期和交付物清单，"
             "不用固定套餐去套不同的品牌。"),
            ("怎么判断品牌做得好不好？",
             "短期看三件事：内部能不能用一句话说清自己、消费者能不能复述、销售在跟客户介绍时是否还用得着解释半天。"
             "长期才看认知度和溢价能力，那个需要持续投入，不是一次项目能解决的。"),
        ],
        "related": [
            ("IP 打造方法论：构建从 0 到 1 完整框架的指南", "/insights/ip-creation-framework.html"),
            ("出海电商品牌策略：开启全球市场的成功密码", "/insights/overseas-ecommerce-brand-strategy.html"),
        ],
    },
    {
        "slug": "brand-activation",
        "h1": "品牌活动与线下体验",
        "title": "品牌活动策划与线下体验 - 快闪、发布会、展会 | 怡亚科技",
        "desc": "怡亚科技的品牌活动服务：活动策略与主题创意、空间设计与搭建、现场执行、KOL 邀约、传播节奏与内容产出，把一场活动设计成能被拍下来、传出去的内容。",
        "lead": "一场活动真正的价值不在现场有多热闹，而在散场之后还有多少人记得、愿意拍、愿意说。"
                "所以我们不先问「要什么风格」，而先问「哪三个位置会被人举起来拍」。"
                "活动是内容生产的现场，不是预算的终点。",
        "pains": [
            "活动做完，除了内部通稿和合影，什么也没留下",
            "现场搭得很漂亮，但没有人主动拍照发朋友圈",
            "预算大部分压在搭建上，传播几乎没有留位置",
            "每年都在做，消费者却记不住是哪个品牌做的",
            "医美、教育、金融这类高客单行业，需要小而精准的沟通场景",
        ],
        "deliver": [
            ("策略与创意", "活动目标定义、主题与概念创意、目标人群与邀约策略、活动节奏与传播规划"),
            ("空间与物料", "空间设计与搭建、主视觉与现场物料、互动装置、灯光与影音、动线与拍照点设计"),
            ("执行与管理", "供应商统筹、现场执行与流程管理、演职人员与主持人、应急预案"),
            ("传播与复盘", "现场内容产出（图、短视频、直播）、KOL 与 KOC 邀约、会后传播、效果复盘"),
        ],
        "steps": [
            ("01", "定义目标", "这场活动到底要影响谁、改变他的什么判断。目标不清楚，后面的创意都会变成自嗨。"),
            ("02", "设计体验", "先定拍照点和记忆点，再排动线。人会记住自己参与过的那一下，不会记住背景板。"),
            ("03", "落地执行", "搭建、流程、人员、天气和电，全部按分钟排。现场不出事，体验才成立。"),
            ("04", "传播放大", "现场产出足够多的可用素材，让没来的人也能看到，让来了的人愿意替你说。"),
        ],
        "audience": "新品发布与上市活动、经销商与渠道大会、行业展会与展台、城市快闪与路演、医美与高客单服务的小型精准沙龙。",
        "faqs": [
            ("你们接纯执行吗？只做搭建和现场。",
             "接。但我们会先确认一件事：这场活动结束后，你希望留下什么。"
             "如果只是要一个能顺利办完的现场，纯执行完全够；如果还希望有传播，我们建议至少把内容产出一起放进范围，"
             "否则现场最好的那几分钟会白白流走。"),
            ("活动和传播要不要分开找两家供应商？",
             "可以分开，但容易脱节：执行方不理解传播要什么素材，传播方没到现场抓不到东西。"
             "我们在同一个团队里做，现场拍摄、素材切分和后续投放的节奏是提前排好的。"),
            ("预算不大，能做吗？",
             "能，但要换思路。预算小的时候，把钱集中在一个能被拍照、能被传播的点上，"
             "比平摊到十个环节更有效。我们也会明确告诉你哪些环节可以砍。"),
            ("异地或海外办活动，你们能承接吗？",
             "能。异地项目我们会提前进场勘查，本地资源以合作供应商为主，核心的策略、创意和现场管理由我们的人跟。"),
        ],
        "related": [
            ("医美小会：开启精准高效的营销新路径", "/insights/medical-aesthetics-marketing.html"),
            ("出海品牌高效链接全球媒体：从关键词到合作增长实战指南", "/insights/overseas-brand-global-media.html"),
        ],
    },
    {
        "slug": "content-operation",
        "h1": "内容与新媒体运营",
        "title": "新媒体代运营与内容营销 - 账号定位与 KOL | 怡亚科技",
        "desc": "怡亚科技的内容与新媒体运营服务：账号定位与人格设定、内容矩阵与选题库、视觉模板体系、日常生产发布、KOL 与投放策略、AI 辅助生产流程，让内容成为可持续的资产。",
        "lead": "内容不是把产品说明翻译成图文。它是品牌持续对外表达的那条线。"
                "一条线要立得住，需要三样东西：说给谁听、说什么、多久说一次。"
                "我们把这三件事做成可复用的方法，而不是每个月重新凭感觉想选题。",
        "pains": [
            "账号做了两年，粉丝和互动都没真正起来",
            "内容凭感觉发，说不清哪条有效、为什么有效",
            "只做曝光，没人回答「这条能带来询盘吗」",
            "换一次代运营就换一次风格，每次都要重新教育用户",
            "知道该用 AI 提效，但不知道怎么用才不掉质量",
        ],
        "deliver": [
            ("定位与体系", "账号定位与人格设定、内容矩阵设计、栏目与选题库、视觉与模板体系、语气与话术规范"),
            ("生产与运营", "日常内容生产与发布、图文与短视频脚本、评论区与私信运营、节点与 campaign 内容"),
            ("增长与投放", "KOL 与 KOC 合作策略、平台投放策略、达人筛选与对接、投放数据回收"),
            ("复盘与提效", "月度数据复盘、内容归因分析、AI 辅助生产流程搭建、团队内训与交接"),
        ],
        "steps": [
            ("01", "定位", "先定这个账号在用户眼里是谁：专家、朋友还是品牌官方。人格不清，内容就没有稳定语气。"),
            ("02", "建库", "把选题做成库，按人群痛点、场景、节点分类，让生产从「今天发什么」变成「从库里取哪条」。"),
            ("03", "生产", "固定视觉模板和脚本结构，把重复劳动压下去，把省下的时间放在选题和信息密度上。"),
            ("04", "复盘", "看哪类选题带来了停留、收藏和询盘，把有效的放大，把无效的砍掉，每季度重排一次矩阵。"),
        ],
        "audience": "需要一个稳定对外表达窗口的品牌、账号做了很久但没有体系的团队、准备自己做内容但缺方法的甲方市场部、需要把 AI 接进内容流程的团队。",
        "faqs": [
            ("你们能保证涨粉或保证转化吗？",
             "不能，而且任何承诺具体数字的供应商都值得警惕。内容和平台流量都有不确定性。"
             "我们能承诺的是流程和判断：选题有依据、发布有节奏、数据有复盘，出了问题能定位到是哪一环。"),
            ("代运营和顾问，选哪个？",
             "看你自己有没有人能接。团队有人写、有人拍，只是缺方法和节奏，做顾问更划算；"
             "完全没人手，就先做代运营，同时把流程和模板沉淀下来，方便以后交接。"),
            ("只做小红书或只做抖音，可以吗？",
             "可以。平台选择取决于你的客户在哪、以及你的内容形态能不能在那个平台成立。"
             "我们一般建议先集中做一个平台跑通，再考虑复制，同时铺一个不依赖算法的阵地（官网、公众号、社群）。"),
            ("AI 生成的内容会不会被平台降权？",
             "平台限制的是低质和同质内容，不是工具本身。我们的做法是 AI 负责资料整理、初稿和多版本改写，"
             "观点、案例和判断由人来定，最后整体过一遍语气和事实。这样出来的内容既有量也有辨识度。"),
        ],
        "related": [
            ("数字化营销变革：从传统困境到创新突破", "/insights/digital-marketing-transformation.html"),
            ("IP 打造方法论：构建从 0 到 1 完整框架的指南", "/insights/ip-creation-framework.html"),
        ],
    },
    {
        "slug": "immersive-experience",
        "h1": "AI · AR/VR · CG 营销体验",
        "title": "AI、AR/VR、CG 互动营销 - 数字展厅与虚拟人 | 怡亚科技",
        "desc": "怡亚科技的营销技术服理：AR 互动与扫码体验、数字展厅与互动装置、虚拟人与数字分身、CG 产品片与三维动画、AI 内容生产流程，用技术换消费者的三秒停留。",
        "lead": "技术在这里不是炫技。我们判断一个技术该不该用，只有一个标准："
                "它有没有让消费者多停留三秒，或者多相信你一点。"
                "做不到这两件事的技术，再新也只是成本。",
        "pains": [
            "知道 AI 和 AR 有用，但不知道第一个项目该从哪里切",
            "做过一个 AR 互动，扫码的人很少，做完就沉了",
            "展台想做数字内容，供应商只会做一条视频",
            "内容生产成本降不下来，又担心降本就把效果做没了",
            "线下场景想留住人，但除了播放屏幕没有别的办法",
        ],
        "deliver": [
            ("互动体验", "AR 扫码互动、VR 场景体验、体感与互动装置、数字展厅与沉浸空间、H5 与小程序互动"),
            ("数字内容", "CG 产品片与三维动画、虚拟人与数字分身、AIGC 图像与视频、三维产品配置器"),
            ("AI 流程", "AI 内容生产流程搭建、素材资产库、批量生成与本地化、团队内训"),
        ],
        "steps": [
            ("01", "定场景", "先确定用在哪：货架、展台、直播间、官网还是私域。场景决定技术选型，不是反过来。"),
            ("02", "选技术", "在预算和体验之间找平衡。有些需求一个二维码加一条短视频就够了，不必上三维。"),
            ("03", "做小样", "先做最小可用版本，投到真实场景里看参与率和停留时长，再决定要不要加大投入。"),
            ("04", "上规模", "验证过再复制到其他产品线、其他城市、其他渠道，同时把生产流程沉淀成可复用的资产。"),
        ],
        "audience": "需要在线下场景留住人的品牌、要把复杂产品讲清楚的 B2B 企业、想降低三维内容成本的团队、准备搭建 AI 内容生产线的市场部。",
        "faqs": [
            ("AR 互动真的有人玩吗？",
             "取决于它挂在哪、以及玩了有什么好处。挂在包装上、又只给一个动画，参与率通常很低；"
             "如果它解决了一个具体问题（比如预览上脸效果、看家具放进家里的样子），参与率会完全不一样。"
             "我们做之前会先问清楚「用户为什么要扫」。"),
            ("AI 能替代创意团队吗？",
             "现阶段不能。AI 擅长的是把已有素材重组、批量生成变体、做多语言和多尺寸适配。"
             "创意判断、品牌一致性和事实核查仍然需要人。把它当成产能工具，而不是创意来源，才不会翻车。"),
            ("我想先小成本试一次，怎么开始？",
             "从一个具体场景开始，比如一款主推产品的 AR 试戴或者一条三维产品片，"
             "用最小可用版本验证效果，验证过再扩到整个产品线。一上来就做数字展厅，风险最大。"),
            ("虚拟人会不会显得很假、拉低品牌调性？",
             "会，如果只在屏幕上播报的话。虚拟人更适合放在有明确功能的场景里：导览、客服、产品讲解、直播助播。"
             "把它当工具人，不当品牌代言人，观感问题就小很多。"),
        ],
        "related": [
            ("数字化营销变革：从传统困境到创新突破", "/insights/digital-marketing-transformation.html"),
            ("出海品牌高效链接全球媒体：从关键词到合作增长实战指南", "/insights/overseas-brand-global-media.html"),
        ],
    },
]


def esc(s: str) -> str:
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;"))


def header_html() -> str:
    src = (ROOT / "header.html").read_text(encoding="utf-8")
    m = re.search(r"<header>.*?</header>", src, re.S)
    return m.group(0) if m else ""


def footer_html() -> str:
    src = (ROOT / "footer.html").read_text(encoding="utf-8")
    m = re.search(r"<footer>.*?</footer>", src, re.S)
    out = m.group(0) if m else ""
    return re.sub(r'(href|src)="(?!https?:|//|/|#|mailto:|tel:)([^"]+)"', r'\1="/\2"', out)


def head(title: str, desc: str, url: str, schema: dict, extra_css: str = "") -> str:
    return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<meta name="author" content="{BRAND}">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<link rel="canonical" href="{url}">
<link rel="icon" href="/favicon.ico">
<link rel="stylesheet" href="/style.css">
<link rel="stylesheet" href="/footer.css">
<link rel="stylesheet" href="/services.css">{extra_css}
<meta property="og:type" content="website">
<meta property="og:site_name" content="{BRAND}">
<meta property="og:locale" content="zh_CN">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE}/img/og-cover.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="{SITE}/img/og-cover.jpg">
<script type="application/ld+json">{json.dumps(schema, ensure_ascii=False)}</script>
</head>"""


def build_detail(s: dict) -> str:
    url = f"{SITE}/services/{s['slug']}.html"
    schema = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Service",
                "@id": f"{url}#service",
                "name": s["h1"],
                "serviceType": s["h1"],
                "description": s["desc"],
                "url": url,
                "areaServed": {"@type": "Country", "name": "中国"},
                "provider": {
                    "@type": "Organization",
                    "name": BRAND,
                    "url": f"{SITE}/",
                    "logo": f"{SITE}/img/logo.svg",
                    "telephone": "+86-18510501896",
                    "email": "yiyatech@bj-ip.com",
                },
            },
            {
                "@type": "FAQPage",
                "@id": f"{url}#faq",
                "mainEntity": [
                    {"@type": "Question", "name": q,
                     "acceptedAnswer": {"@type": "Answer", "text": a}}
                    for q, a in s["faqs"]
                ],
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "主页", "item": f"{SITE}/"},
                    {"@type": "ListItem", "position": 2, "name": "服务", "item": f"{SITE}/services/"},
                    {"@type": "ListItem", "position": 3, "name": s["h1"], "item": url},
                ],
            },
        ],
    }

    pains = "\n".join(f"      <li>{esc(p)}</li>" for p in s["pains"])
    deliver = "\n".join(
        f'      <div class="deliver-block"><h3>{esc(t)}</h3><p>{esc(d)}</p></div>'
        for t, d in s["deliver"]
    )
    steps = "\n".join(
        f'      <div class="step"><div class="num">{n}</div><h3>{esc(t)}</h3><p>{esc(d)}</p></div>'
        for n, t, d in s["steps"]
    )
    faqs = "\n".join(
        f'      <details><summary>{esc(q)}</summary><p>{esc(a)}</p></details>' for q, a in s["faqs"]
    )
    related = "\n".join(
        f'      <li><a href="{u}">{esc(t)}</a></li>' for t, u in s["related"]
    )
    others = "\n".join(
        f'      <li><a href="/services/{sl}.html">{esc(n)}</a> — {esc(f)}</li>'
        for sl, n, f in NAV_SERVICES if sl != s["slug"]
    )

    return f"""{head(s['title'], s['desc'], url, schema)}
<body class="service-body">
<div id="header-placeholder">
{header_html()}
</div>

<main class="service-page">
  <div class="service-wrap">
    <nav class="breadcrumb" aria-label="面包屑"><a href="/">主页</a><span>/</span><a href="/services/">服务</a><span>/</span><span>{esc(s['h1'])}</span></nav>
    <h1>{esc(s['h1'])}</h1>
    <p class="lead">{esc(s['lead'])}</p>

    <h2>我们通常在这几种情况下被找到</h2>
    <ul class="pain">
{pains}
    </ul>

    <h2>具体交付什么</h2>
    <div class="deliver">
{deliver}
    </div>

    <h2>我们怎么做</h2>
    <div class="steps">
{steps}
    </div>

    <h2>适合什么样的客户</h2>
    <p>{esc(s['audience'])}</p>

    <h2>常见问题</h2>
    <div class="faq">
{faqs}
    </div>

    <div class="cta">
      <h2>聊聊你的项目</h2>
      <p>先把问题定义清楚，再谈要不要合作。电话 185 1050 1896，邮箱 yiyatech@bj-ip.com。</p>
      <a class="btn" href="/contact.html">联系我们</a>
    </div>

    <div class="related">
      <h2>其他服务</h2>
      <ul>
{others}
      </ul>
      <h2>延伸阅读</h2>
      <ul>
{related}
      </ul>
    </div>
  </div>
</main>

<div id="footer-placeholder">
{footer_html()}
</div>
<script src="/script.js"></script>
</body>
</html>
"""


def build_index() -> str:
    url = f"{SITE}/services/"
    schema = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "CollectionPage",
                "@id": f"{url}#page",
                "name": "服务",
                "url": url,
                "inLanguage": "zh-CN",
                "isPartOf": {"@type": "WebSite", "url": f"{SITE}/"},
                "mainEntity": {
                    "@type": "ItemList",
                    "itemListElement": [
                        {"@type": "ListItem", "position": i + 1,
                         "name": n, "url": f"{SITE}/services/{sl}.html"}
                        for i, (sl, n, _) in enumerate(NAV_SERVICES)
                    ],
                },
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "主页", "item": f"{SITE}/"},
                    {"@type": "ListItem", "position": 2, "name": "服务", "item": url},
                ],
            },
        ],
    }
    cards = "\n".join(
        f'      <a href="/services/{sl}.html"><h3>{esc(n)}</h3><p>{esc(f)}</p></a>'
        for sl, n, f in NAV_SERVICES
    )
    return f"""{head("服务 - 品牌策略、品牌活动、内容运营与营销技术 | 怡亚科技",
                "怡亚科技的四项核心服务：品牌策略与品牌设计、品牌活动与线下体验、内容与新媒体运营、AI·AR/VR·CG 营销体验。从策略到落地，由同一个团队承接。",
                url, schema)}
<body class="service-body">
<div id="header-placeholder">
{header_html()}
</div>

<main class="service-page">
  <div class="service-wrap">
    <nav class="breadcrumb" aria-label="面包屑"><a href="/">主页</a><span>/</span><span>服务</span></nav>
    <h1>服务</h1>
    <p class="lead">怡亚科技做的事，可以拆成四条线：把品牌说清楚（策略与设计）、让人真的参与进来（活动与线下体验）、
    持续对外表达（内容与新媒体）、用技术换停留（AI·AR/VR·CG）。这四条线在同一个团队里，所以可以拆开做，也可以串起来做。</p>

    <h2>四项服务</h2>
    <div class="service-cards">
{cards}
    </div>

    <h2>怎么和你们合作</h2>
    <p>三种常见的合作方式：<strong>项目制</strong>，比如一次品牌全案、一场发布会、一条三维产品片；
    <strong>年度框架</strong>，把内容运营、活动节点和视觉延展打包，按季度排节奏；
    <strong>单项支持</strong>，只补你团队缺的那一块，比如只做定位、只做活动执行、只做 AR 互动。</p>
    <p>我们不设固定套餐。先聊清楚你要解决的问题，再给范围和报价。</p>

    <h2>我们不做什么</h2>
    <p>不接纯刷量的流量采买，不承诺具体的涨粉和转化数字，不做没有策略依据的「先出一版看看」。
    不是因为这些不能做，而是做完之后对品牌没有长期价值。</p>

    <div class="cta">
      <h2>先从一次诊断沟通开始</h2>
      <p>电话 185 1050 1896，邮箱 yiyatech@bj-ip.com。也可以先看看我们做过的项目。</p>
      <a class="btn" href="/work.html">看案例</a>
    </div>
  </div>
</main>

<div id="footer-placeholder">
{footer_html()}
</div>
<script src="/script.js"></script>
</body>
</html>
"""


def main():
    OUT.mkdir(exist_ok=True)
    (OUT / "index.html").write_text(build_index(), encoding="utf-8")
    print("  ✓ /services/index.html")
    for s in SERVICES:
        p = OUT / f"{s['slug']}.html"
        html = build_detail(s)
        p.write_text(html, encoding="utf-8")
        text = re.sub(r"<[^>]+>", "", html.split("<main", 1)[1])
        print(f"  ✓ /services/{s['slug']}.html  ({len(html) // 1024}KB, 正文约 {len(re.sub(r'\\s+', '', text))} 字)")


if __name__ == "__main__":
    main()
