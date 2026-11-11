---
name: "europe-city-culture-planner"
description: "给欧洲中大型城市排文艺向的几天行程（去掉到达日和离开日）：按用户在 profile.md 里的口味（现当代艺术、喜欢的艺术家风格、菜市场、震撼的建筑、城里登高、轮渡和老电车、另类街区、主题 free walking tour、沉重历史）搜官方旅游网站、展览和近期活动，查这几天的大型演唱会和英语脱口秀，推荐中英文能看的本地电影、书、纪录片，输出带行程总图和时间线的中英双语页面。用户说要去某个城市玩几天、问某个城市怎么逛时使用。"
---


# 欧洲城市文艺行程（Europe City Culture Planner）

## 为什么需要这个 skill

去一个不熟的欧洲城市时，小红书上的攻略太浅、太快，都是同一张打卡清单。这个 skill 的思路是：**先看这个城市官方旅游网站推荐的经典地方和这几天的活动，再按用户自己的口味（写在 `profile.md`）筛选和补充（现当代艺术、菜市场、震撼的建筑、登高、轮渡、另类街区……），把中间几天排成按区域走得通的行程，最后提醒哪些必须提前订。**

不要用小红书这类速食攻略当来源。

## 语言

- 和用户对话用用户自己的语言。
- **页面默认中英双语**：JSON 顶层写 `"languages": ["zh", "en"]` 和 `"lang"`（默认先显示哪种，见 `profile.md` 的「页面语言」，没写就用用户的语言），每个文本字段写成 `{"zh": "…", "en": "…"}`。页面右上角有「中文 / EN」切换按钮，浏览者的选择会被记住；链接后面加 `?lang=en` 可以直接打开英文版。
- 两种语言的内容必须一致：数字、价格、时间、链接完全相同，只翻译文字；地名、展览名、机构名保留原文。电影和书的 `title` 在英文里写英文片名 / 书名。
- 用户只要一种语言，或者想省 token 时（双语会让 JSON 长约一倍），直接写普通字符串，页面就不显示切换按钮。

## 用户的口味和固定情况

开始前先读同目录下的 **`profile.md`**：里面是用户喜欢和不喜欢的类型、满意过的例子、风格参照的艺术家、演出和影视口味、交通情况。下面各步说到「口味」「演出口味」「电影、书、纪录片口味」「固定情况」都指这个文件，排行程时逐条对照。没有 `profile.md` 时，在第 0 步一起简单问一下用户喜欢什么。

## 第 0 步：确认输入

| 项 | 说明 | 缺失时 |
|---|---|---|
| 城市 | 欧洲中大型城市 | 必须问 |
| 到达日 / 离开日 | 决定排哪几天、季节、展期和活动 | 必须问 |
| 中间几天有没有固定安排 | 例如某天晚上看演出、某天要工作 | 没说就当没有 |
| 住在哪个区 | 影响每天的起点 | 没说就按市中心算 |

**只排中间的整天**：到达日和离开日都不排。例如 11 月 3 日到、11 月 8 日走，就排 4、5、6、7 日四天。只待 1 晚（没有中间整天）时，问用户要不要在到达日下午或离开日上午排半天。缺的项合并成一次提问（有提问工具就用，例如 Claude 的 AskUserQuestion）。

## 第 1 步：官方旅游网站和这几天的活动

1. **找官方旅游网站**：搜「<城市> official tourism website / visit <城市>」，常见形式如 leipzig.travel、visitstockholm.com、visitcopenhagen.com、wien.info、krakow.travel、budapestinfo.hu、visitoslo.com。以城市旅游局或市政府办的为准，不是商业攻略站。
2. 在官网上看：
   - **经典推荐**（must-see、top sights、museums、architecture、neighbourhoods）：先列成候选清单，再按上面的口味打分。
   - **活动日历**（what's on / events / calendar）：筛出**落在用户这几天里**的活动，例如展览开幕、艺术节、博物馆之夜、建筑开放日、市集、夜间活动、节日。
   - 官网的城市卡（例如 Copenhagen Card、Budapest Card、Wien Karte）：算一下按这次的行程买划不划算，写进结论。
3. 官网读不到（反爬、只有图片）时，换它的英文版、活动日历的子页面，或者用浏览器打开。

## 第 2 步：按口味补充搜索

官方网站往往只有经典景点。按下面的类型逐一补充，每类找到 2–5 个候选就够：

| 类型 | 去哪找 | 搜什么 |
|---|---|---|
| 现当代艺术馆和展览 | 每个馆官网的 exhibitions / current 页面（核对展期是否覆盖用户的日期）；e-flux、artforum 的展讯；城市的 Kunsthalle、当代艺术中心 | 「<城市> contemporary art museum」「<城市> exhibition <月份 年份>」「Kunsthalle <城市>」 |
| Klimt / Matisse 风格 | 博物馆藏品检索、临时展页面 | 「<城市> Art Nouveau museum」「<城市> Jugendstil」「Matisse exhibition <年份>」「Fauvism <城市> collection」 |
| 奇怪的、隐藏的地方 | Atlas Obscura、Spotted by Locals（本地人写的推荐，比较深）、城市的英文本地杂志 | 「<城市> atlas obscura」「spotted by locals <城市>」 |
| 菜市场 | 官网、Google 地图 | 「<城市> market hall」「<当地语言的市场词：Markthalle / hala targowa / torvehal / mercado>」，确认**营业日和上午时间** |
| 震撼的建筑 | 官网、Google 地图评价和照片 | 教堂、歌剧院、议会、图书馆、车站；查**内部能不能参观、要不要导览、什么时候开放** |
| 登高望远 | 官网、Google 地图照片 | 「<城市> best viewpoint」「<城市> hill view old town」；看照片确认视野里是有特色的城市景观；查日落时间，傍晚的观景点排在日落前约 30 分钟 |
| 交通体验 | 当地公交公司官网 | 复古电车 / 观光电车线路、公共轮渡线路（例如斯德哥尔摩 SL 的群岛轮渡、哥本哈根港口公交）、以车站艺术出名的地铁线、缆车；写清楚用普通公交票还是另外买票 |
| 新式水岸街区 | 建筑网站（ArchDaily、dezeen）、官网 | 「<城市> new harbour district architecture」「<城市> waterfront housing」 |
| 另类 / 抗议街区 | Spotted by Locals、本地杂志、Reddit r/<城市> | 「<城市> alternative neighbourhood」「<城市> street art」「<城市> squat / autonomous」 |
| 露天博物馆、海岛、自然 | 官网 | 「<城市> open air museum」「<城市> island ferry day trip」「<城市> deer park」 |
| 沉重历史 | 纪念馆官网 | 集中营、二战、冷战、秘密警察、起义纪念馆；查**官方预约系统**和最早能订多久前 |

**范围**：先找市区。按口味筛完后候选不够排满这几天，扩大到**市中心坐火车 / 区域交通 1 小时内**的地方（例如 Louisiana 之于哥本哈根）。**例外**：超过 1 小时但非常有名、有分量的（例如克拉科夫的奥斯维辛），**不要过滤掉**，放进「1 小时圈外」或直接排进某天，并提示预订。

**评价**：用 Google 地图看评分和评价数，默认门槛 ≥ 4.4 且 ≥ 200 条评价；小众的另类地方、小画廊评价少很正常，可以放宽，但要写出评价数。

## 第 3 步：高分 free walking tour

每次都搜：GuruWalk、Freetour.com，以及当地自己的 free walking tour 公司官网（例如「<城市> free walking tour」）。

- 门槛（默认值）：评分 ≥ 4.7（满分 5），评价数 ≥ 300 条。
- **优先主题型**：政治、社会、另类历史、街头艺术、共产主义时期、犹太区等，像 `profile.md` 里举的「Politically Incorrect」那种；普通老城导览只列 1 个最高分的。
- 记录：名字、平台、评分（人数）、哪天几点、时长、语言、集合点、要不要提前登记。
- 列 2–4 个，选 1 个最合适的排进某天。

## 第 4 步：核对开放时间和预订

每个要排进行程的地方都核对一次（以官网为准）：

- **闭馆日**：很多博物馆周一闭馆，有的周二；教堂做弥撒时不让参观；市场有固定营业日。
- **开放时间、票价、免费日**（很多馆每月某天免费，或某晚延长开放）。
- **展期**：临时展要覆盖用户在的日期，否则不列。
- **要不要提前订**：限时入场、名额少的导览、热门纪念馆。按距离出发还有多久给状态：
  - `urgent`（马上订）：经常提前几周订满，或者用户的日期已经快满了；
  - `soon`（尽快订）：提前 1–2 周比较稳；
  - `ok`（到时再订）：当天或前一天订就行。
- 如果出发在 10 天内，顺便看一眼天气预报，下雨的那天把室内的放进去。

遇到验证码、要登录：不要绕过，写「未能查到」并给链接。**绝不下单、不填写个人或支付信息。**

## 第 5 步：这几天的大型演出和脱口秀

查用户在这个城市的**整个停留期间**，包括到达日和离开日的晚上（这两天虽然不排白天的行程，但晚上可能有演出）。

1. **去哪查**：
   - 票务平台：Ticketmaster（用当地国家的站点）、Eventim、Live Nation，以及当地主要票务平台（例如丹麦 Billetlugen、波兰 eBilet、瑞典 Tickster）。
   - 演出聚合：Songkick、Bandsintown，按城市和日期筛选。
   - 城市的大型场馆官网日程：体育场、Arena、大音乐厅。
   - 脱口秀：演员自己的巡演页面（tour dates），以及搜「English stand-up comedy <城市> <月份>」「English comedy club <城市>」。很多城市有固定的英语脱口秀俱乐部或开放麦，没有大牌演员时可以列一个高评分的。
   - 官方旅游网站的活动日历（第 1 步已经看过的）。
2. **列什么**：名气大的国际巡演、口味相符的英语脱口秀（见「演出口味」）。小型本地乐队、非中英文的脱口秀不列。
3. **每项记录**：名字、类型（`concert` 演唱会 / `comedy` 脱口秀 / `theatre` 剧场或歌剧 / `festival` 音乐节）、日期和开场时间、场馆、语言（脱口秀必写）、票价、售票状态（`onsale` 在售 / `few` 余票少 / `soldout` 已售罄 / `resale` 只有转售票 / `soon` 即将开售，写开售时间）、购票链接。
4. **差几天的也提一句**：用户走后一两天或来之前一两天有很想看的大型演出，写进 `showsNote`，用户可能愿意调整日期。
5. **什么都没有**：在 `showsNote` 写明查了哪些来源、这几天没有找到。
6. 有票要买的放进 `bookAhead`。**绝不下单。**

## 第 6 步：电影、书、纪录片

推荐 4–8 部，类型混搭（电影、纪录片、剧集、书都可以），按「电影 / 纪录片 / 剧集 / 书」分组。

- **主题**：这个城市或国家的历史文化，古代、现代都可以，也可以是好玩的、讲本地人生活的。和这次行程的地点有关的优先（例如在这座城市取景、讲这座教堂或这段历史），在 `why` 里写出和行程的哪一站有关。
- **语言**：只推荐中文或英文能看的，在 `lang` 里写清楚：「英语」「中文」「丹麦语，中英字幕」「英文译本」。拿不准有没有中英字幕或译本的不列。
- **去重和口味**：对照 `profile.md`「电影、书、纪录片口味」里用户看过的作品，看过的不推荐；参考用户喜欢的作品。
- **来源和评分**：用 IMDb、Letterboxd、豆瓣、Goodreads 看评分，评价很差的不列。可以在 `where` 写在哪能看（在德国能看的流媒体可以用 JustWatch 德国站查；书写有没有中文版）。
- `tag` 写一个短标签，例如「古代」「二战」「冷战」「性别议题」「有趣」「建筑」。

## 第 7 步：排每天的行程

1. **按区域排**：同一天的地点尽量在同一片区或一条交通线上，用 Google 地图公交模式估算地点之间的时间。
2. **节奏**：每天 3–5 个点就够，不要塞满。大型艺术馆留半天；Louisiana 这种值得留一整天的就整天只排它（加上附近的海边）。
3. **一天的顺序**：上午菜市场或博物馆（人少）；中午附近吃；下午街区、建筑；傍晚登高看日落；交通体验（轮渡、电车）当作两个地点之间的移动方式，而不是单独跑一趟。
4. **每座城市至少排一次「交通体验」**（有轮渡就坐轮渡，有复古电车就坐电车）。
5. **free walking tour** 排在前面几天，后面的日子可以去导览里听到的地方。
6. 避开闭馆日；每天给一个**下雨 / 关门的备选**。
7. 排不进去但合口味的放进「没排进去，但也合你口味」（备选池）。
8. 某天晚上有用户可能想去的演出（第 5 步）时，把它作为当天最后一站排进去，或者在当天的 `note` 里提一句。
9. **坐标**：每个地点在 Google 地图上读纬度、经度（地址栏 `@纬度,经度`），写进 `lat` / `lng`，查不到就不写。页面会据此自动画出**行程总图**（所有天的点按天着色，编号是「第几天-第几站」，同一天按时间连线）和每天的路线图。**总时间线**由 `days[].stops[]` 的时间和顺序自动生成，所以每站都写上 `time`。

## 第 8 步：输出 JSON，用固定模板渲染

页面的样式和排版已经固定在 `template/` 里，**不要手写 HTML 和 CSS**。你只需要按 `schema/city.schema.json` 写一份 JSON，再用脚本把它渲染成页面。这样每次输出的只有数据，省 token，页面也每次一致。

- 格式见 `schema/city.schema.json`，完整示例见 `examples/london-2027-03.json`（伦敦，2027 年复活节长周末，中英双语）。不确定字段怎么写时，照着示例写。
- 文件名用城市和日期，例如 `london-2027-03.json`。

### 渲染

在 skill 目录下运行（二选一，都不需要安装依赖）：

```bash
node scripts/render.mjs path/to/london-2027-03.json      # Node 18+
python3 scripts/render.py path/to/london-2027-03.json    # 只用标准库
```

生成的 HTML 是一个独立文件：样式和脚本都已内联，直接用浏览器打开，或发给别人。脚本会先检查必需字段，有问题会报出是哪一天哪一站的哪个字段；页面上出现红框「行程页渲染失败」也说明 JSON 写错了。

**地图和时间线**：`days[].stops[]` 有 `lat` / `lng` 时，页面自动画行程总图（所有天的点按天着色，编号是「第几天-第几站」，同一天按时间连线）和每天的路线图；`pool[]` 有坐标时也画一张。总时间线由每站的 `time` 和顺序自动生成。都是 `render.js` 自己画的 SVG 示意图，不联网。页面右上角有语言切换和「导出 / 打印 PDF」。

### 交给用户

- **Claude（claude.ai / Claude 桌面端 / Claude Code）**：把渲染出的 HTML 用 Artifact 发布（同一次查询改版时发布到同一个链接，并把 `version` 加 1）。不需要再加载 `artifact-design` skill，模板已经满足它的要求。
  - 如果当前环境里没有 `scripts/`（例如只同步了 SKILL.md）：写一个页面外壳，把 JSON 放进 `<script type="application/json" id="trip-data">`，引用 `style.css` 和 `render.js`，发布时用 Artifact 的 `files` 从模板 Artifact 复制这两个文件：`{"render.js": {"artifact": "https://claude.ai/artifact/MkpNGXmN8uMU7xNj9zdLEE", "path": "render.js"}, "style.css": {"artifact": "https://claude.ai/artifact/MkpNGXmN8uMU7xNj9zdLEE", "path": "style.css"}}`。外壳写法见 `template/shell.html`（把内联的 `<style>` 和 `<script>` 换成 `<link rel="stylesheet" href="style.css">` 和 `<script src="render.js"></script>`）。
- **Cursor、Codex、Gemini CLI 等在本地运行的 agent**：把 JSON 和 HTML 存进项目的 `plans/` 目录，告诉用户文件路径。
- **ChatGPT（代码解释器）等只能上传文件的环境**：用 `python3 scripts/render.py` 渲染，把 HTML 作为文件发给用户下载。
- **完全不能运行代码的环境**：把 JSON 发给用户，并告诉用户在本地运行上面的渲染命令。

### JSON 字段

标「html」的字段可以用 `<b>`、`<i>`、`<a href=…>`、`<br>`，其他是纯文本；页面只保留这几种行内标签，链接只允许 http(s)。文本字段按「语言」一节写成双语对象（或者单语字符串）。

**类别 `cat`**（决定颜色和图例）：`market` 菜市场、`arch` 建筑、`art` 现当代艺术、`artclassic` 古典艺术、`alt` 另类街区、`view` 登高望远、`ride` 交通体验、`tour` 城市导览、`history` 沉重历史、`nature` 自然 / 海岛、`event` 活动、`food` 吃、`other` 其他。

| 字段 | 说明 |
|---|---|
| `languages` / `lang` | 内容包含的语言 / 默认先显示哪种，见「语言」一节 |
| `title` / `version` | 页面标题（和 `<title>` 一致）/ 版本号 |
| `city` / `country` / `dateLabel` | 城市、国家、日期文字（如「11 月 3–8 日」）；`heading`、`eyebrow` 可覆盖默认标题 |
| `queriedAt` | 查询时间 |
| `intro` | html，页头说明：排了哪几天、口味要点 |
| `verdict.items` / `verdict.alerts` | html 数组：这次最值得的 3–5 件事 / 提示（闭馆日、城市卡是否划算、天气） |
| `bookAhead[]` | 需要提前订：`{name, status: urgent / soon / ok / done, deadline, why(html), url}`，页面按紧急程度自动排序 |
| `skipNote` | html，说明哪两天没排（到达日、离开日） |
| `days[]` | 每天：`{date, theme, note(html), stops[], backup(html)}` |
| `days[].stops[]` | 按时间顺序：`{time, name, cat, area, duration, hours, price, why(html), booking(html), url, lat, lng}`；`why` 写**为什么合用户的口味**，不要写百科介绍；`booking` 写要提前订或注意事项（红字显示） |
| `exhibitions[]` | 这几天在展：`{title, venue, until, price, match（如「像 Klimt」「像 Matisse」「议题型」「奇怪当代」）, why(html), url}` |
| `events[]` | 这几天的活动：`{name, cat, date, place, price, why(html), url}` |
| `shows[]` | 大型演出和脱口秀：`{name, kind: concert / comedy / theatre / festival, status: onsale / few / soldout / resale / soon, date, venue, lang, price, why(html), url}` |
| `showsNote` | html，查了哪些来源、差几天的演出、或者「这几天没有找到」；`shows` 为空时也会单独显示 |
| `media[]` | 电影、书、纪录片：`{kind: film / doc / series / book / podcast, title（显示名；英文版写英文片名 / 书名）, original（原名，和 title 相同时不重复显示）, year, creator, lang, where, tag, why(html), url}`，页面自动按类型分组 |
| `mediaNote` | html，媒体部分的说明 |
| `tours[]` | free walking tour：`{name, platform, rating, count, schedule, duration, lang, why(html), url}`；`toursNote` 写门槛 |
| `pool[]` | 备选：`{name, cat, area, hours, price, why(html), url, lat, lng}` |
| `beyond[]` | 1 小时圈外但有名：`{name, cat, distance, why(html), booking(html), url}` |
| `skipped[]` | 有意没排的热门景点：`{name, why(html)}`（例如古典艺术为主、观景台只看到普通楼） |
| `footer.paragraphs` / `footer.links` | html 数组：假设和默认门槛、实际查了哪些来源、哪些没查到 / 链接行，每行 `[{text, url}, …]` |

交付后在对话里用几句话说这几天的主线和最需要马上订的东西，不要把行程再贴一遍。