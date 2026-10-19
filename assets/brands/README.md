# AI brand sources

Checked on 2026-10-19. The slides identify the brands for educational purposes.
The marks belong to their respective owners.

- `openai.svg`: OpenAI blossom from the header of https://developers.openai.com/.
  Original paths and viewBox retained; display dimensions set to 128 px.
- `gemini.png`: official 512 px Gemini image linked from https://gemini.google.com/:
  https://www.gstatic.com/lamda/images/gemini_sparkle_4g_512_lt_f94943af3be039176192d.png
- `claude.svg`: asterisk path from the header wordmark at https://claude.com/.
  The original path and terracotta fill are retained in a 125 × 125 viewBox.

These files are embedded as data URLs in `AI_BRAND_LOGOS` in `index.html`, so the
logos are also available in exported, standalone HTML files without a network.

Model names come from the linked official model catalogs:

- https://developers.openai.com/api/docs/models
- https://ai.google.dev/gemini-api/docs/models
- https://platform.claude.com/docs/en/models/overview

Scores use the public integer display of Artificial Analysis Intelligence Index
v4.3.2, checked on the same date. They describe a specific model and reasoning
setting, not an entire brand, a user satisfaction rating, or all service plans.

| Model | Setting | Score | Source |
| --- | --- | --- | --- |
| GPT-6 Astra | max | 53 | https://artificialanalysis.ai/models/gpt-6-astra |
| Gemini 4 Argon | high | 53 | https://artificialanalysis.ai/models/gemini-4-argon |
| Claude Opus 5.5 | max with fallback | 58 | https://artificialanalysis.ai/models/claude-opus-5-5 |

Update the model names, scores, setting, index version, source links, and checked
date together when refreshing these slides. API catalog models may differ from
the models selectable in a consumer service or plan.
