# AGENTS.md

This repository is an AI-agent skill for planning culture-first days in European cities. Cursor, Codex, Gemini CLI, Claude Code and similar agents read this file automatically.

这个仓库是一个给 AI agent 用的「欧洲城市文艺行程」skill。

## When the user asks to plan days in a European city / 用户要去某个欧洲城市玩几天时

1. Read `europe-city-culture-planner/SKILL.md` and follow steps 0–8. / 读 `SKILL.md`，按第 0–8 步做。
2. Read `europe-city-culture-planner/profile.md`: the user's taste, examples they loved, transport situation and page language. / 读 `profile.md`：用户的口味和固定情况。
3. Write the itinerary JSON following `europe-city-culture-planner/schema/city.schema.json` to `plans/<city>-<yyyy-mm>.json`, modelled on `europe-city-culture-planner/examples/london-2027-03.json`.
4. Render it; never hand-write HTML / 渲染成页面，不要手写 HTML:

   ```bash
   node europe-city-culture-planner/scripts/render.mjs plans/<file>.json
   # or
   python3 europe-city-culture-planner/scripts/render.py plans/<file>.json
   ```

5. Tell the user the path of `plans/<file>.html` and sum up the days and what must be booked now in a few sentences.

## Rules / 规则

- Talk to the user in their language. The page is bilingual (zh + en) by default; see "语言" in SKILL.md.
- Opening hours, prices, exhibition dates and show dates must be looked up live, with source and time; if something can't be found, say so instead of guessing. / 实时查，查不到就写「未能查到」。
- Never book or pay, never enter personal or payment details, never bypass captchas or logins. / 不下单，不填个人或支付信息，不绕过验证码。
- To change the page design, edit only `europe-city-culture-planner/template/`, then run `npm run example` and check the result.
