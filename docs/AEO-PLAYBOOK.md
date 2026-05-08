# AEO Playbook — Answer Engine Optimization for the Blog Pipeline

> **Why this matters:** Search no longer ends at Google's blue links. Roughly 30–50% of relevant
> queries now resolve inside ChatGPT search, Perplexity, Google AI Overviews, Bing Copilot, and
> Gemini — engines that *extract and cite* answers rather than send clicks. Articles must be
> readable by both classical SEO crawlers AND answer engines that quote you verbatim.
>
> This document is the source-of-truth for AEO patterns the pipeline must follow. It is
> referenced by `writer.md`, `packager.md`, and `director.md`. Update here, propagate down.

---

## 0. The single mental model

Imagine your article will be read by:
1. **A human** scanning headers and the first paragraph
2. **A Google crawler** indexing entities, schema, internal links
3. **An answer engine** (ChatGPT/Perplexity/AIO) that grabs 1–3 sentences to quote, attributing them to your URL

If the same content satisfies all three, you win. Optimize for #3 first because it's strictest;
the others come along for the ride.

---

## 1. The non-negotiable structure

Every long-form article in the pipeline MUST contain, in this order:

```
1. H1 title (front-loads primary keyword)
2. Quick Answer block            ← AEO fuel #1 (40–80 words, 2–3 sentences)
3. Body H2 #1 (primary keyword in heading)
4. Body H2 #2
5. Body H2 #3
6. "Getting there from ASTY Cabin" (proximity anchor — site-specific)
7. FAQ block (3–5 Q&A, exact-match question format)   ← AEO fuel #2
8. Single CTA
```

That gives the answer engine a fast, high-confidence extraction target (Quick Answer + FAQ),
and gives Google a structured article with FAQPage schema generated from the same FAQ block.

---

## 2. Quick Answer block — the most extractable real estate

### Why
Answer engines extract from the first 100–200 words after the H1. If those words don't directly
address the implicit question of the article, the engine grabs nothing and your URL doesn't get
cited. This single block accounts for the majority of AI-search referrals.

### How
- Write it AS IF you're answering the user's question in one breath.
- 40–80 words, 2–3 sentences, no preamble.
- Lead with the concrete answer; supporting context second.
- Include at least one atomic fact (number, distance, time, price).
- Include the primary entity (e.g. "ASTY Cabin", "Asan Medical Center").

### Example

❌ Don't:
> "Seoul is a vibrant city with many hospital options, and choosing the right area for medical
> tourism can feel overwhelming. In this article we'll explore..."

✅ Do:
> "For medical tourism in Seoul, Songpa-gu offers the best access-to-comfort ratio. From ASTY
> Cabin you reach Asan Medical Center in 15 minutes by taxi or Samsung Medical Center in 25
> minutes by subway, with a fully equipped serviced residence as your base. Weekly rates start
> from ₩700,000."

The good version is one Perplexity citation away from sending bookings.

---

## 3. Atomic facts — write so engines can lift them cleanly

Distances, times, prices, capacities, hours, addresses must be in **scannable form** — not buried
in flowing prose.

| Fact type   | Pattern                                                   |
|-------------|------------------------------------------------------------|
| Walking     | "5-min walk to Garak Market Station (Lines 3 & 8)"        |
| Transit     | "10 minutes to Gangnam by Line 2"                         |
| Taxi        | "15 minutes to Asan Medical Center by taxi"               |
| Price (KRW) | "From ₩700,000/week"                                      |
| Hours       | "Open 11:00–22:00, closed Mondays"                        |

When you write "around 15 minutes" the engine drops the fact. When you write
"15 minutes by taxi", the engine quotes it.

If the number is uncertain, hedge the surrounding sentence ("typically 15 minutes during
off-peak"), but keep the number itself crisp. Never invent precision.

---

## 4. Entity richness — name everything explicitly

Answer engines pattern-match named entities (`Asan Medical Center`, `Garak Market Station`,
`Songpa-gu`). They cannot resolve "the major hospital nearby" or "the closest subway station".

Rules:
- First mention: full official name. Second mention onward: short form OK.
- Always pair an entity with its qualifier on first use:
  - "Asan Medical Center (Korea's largest hospital)"
  - "Garak Market Station (Lines 3 & 8)"
- For non-English names, give the English form first, then the local script in parens once:
  - "Garak Market (가락시장)"
  - "soondubu (순두부)"

Reference list (ASTY-cabin-specific entities to anchor):
- Locations: ASTY Cabin, Songpa-gu, Garak-dong, Garak Market Station, Gangnam, Jamsil, Lotte World
- Hospitals: Asan Medical Center, Samsung Seoul Hospital (a.k.a. Samsung Medical Center)
- Transit lines: Line 2, Line 3, Line 8
- Awards / authority: iF Design Award

---

## 5. FAQ block — your second extraction target

### Why
FAQPage schema gets actively quoted in Google AI Overviews and Bing Copilot. ChatGPT and
Perplexity also pattern-match `Q: ... A: ...` blocks and lift them whole.

### How

```
## Frequently Asked Questions

**Q: How far is ASTY Cabin from Asan Medical Center?**
A: ASTY Cabin is in Songpa-gu, about 15 minutes from Asan Medical Center by taxi or
20 minutes by subway via Line 3.

**Q: Does ASTY Cabin offer monthly rates?**
A: Yes. Weekly rates start from ₩700,000; monthly rates are available with discounts —
contact ASTY Cabin directly for corporate or long-stay quotes.

**Q: Is the apartment fully furnished?**
A: Every unit includes a full kitchen, washer/dryer, and hotel-grade linens. No additional
purchases are needed for a long stay.
```

Hard rules:
- 3–5 Q&A pairs. Below 3 = thin schema. Above 5 = noise.
- Question must be how a real person types into search (not stiff PR phrasing).
- Answer 30–80 words, 1–2 sentences, **stand-alone** (don't say "as mentioned above").
- Each answer must contain at least one atomic fact OR a direct yes/no opener.
- The packager extracts these and emits FAQPage schema; your formatting must be exact:
  `**Q: ...**` then a newline, then `A: ...`.

---

## 6. Definition sentences — claim the entity

When the article introduces a concept, write a definition sentence: `[Subject] is [definition].`
Engines pattern-match these for "what is" queries.

Examples:
- "A serviced residence is a fully-furnished apartment with hotel-grade services, designed for
  stays longer than a typical hotel booking but shorter than a year-long lease."
- "Medical tourism in Seoul refers to international patients traveling to Korea for treatment
  at hospitals like Asan Medical Center and Samsung Seoul Hospital, often combining the trip
  with recovery stays in nearby serviced residences."

Use one definition sentence per major concept introduced.

---

## 7. Comparison structures — high citation value

Articles that compare options ("X vs Y") get pulled into AI answers more than narrative pieces.

When relevant, use explicit `Hotel vs Serviced Residence` H3 subheadings or a small comparison
table. Keep cells short (3–6 words) so they survive HTML-to-text extraction.

Example:

| Aspect            | Hotel                  | Serviced Residence (ASTY Cabin) |
|-------------------|------------------------|----------------------------------|
| Stay length       | 1–7 nights             | Weekly to monthly                |
| Kitchen           | None / mini-fridge     | Full kitchen                     |
| Cost (>14 days)   | Highest                | 30–50% less                      |
| Privacy           | Hallway noise          | Apartment-style                  |

---

## 8. Voice / banned tells

Answer engines penalize (or just don't cite) content that reads as AI-spun. The pipeline already
forbids `**bold**` markdown for this reason. Also avoid:

- Filler openings: "In this article…", "In today's fast-paced world…"
- AI tells: "delve into", "unleash", "leverage", "navigate", "robust"
- Em-dash clusters (max 1 em-dash per paragraph)
- All-caps shouting
- Meta-commentary ("As we've discussed", "Now that we've covered")

If the writer agent finds itself writing one of these, rewrite the sentence.

---

## 9. ASTY-cabin topic clusters (reference for the director)

Per `docs/multi-blog-monetization/`-aligned SEO strategy, the three pillars for ASTY Cabin are:

| Pillar                      | Slug pattern                          | Example cluster posts                                  |
|-----------------------------|---------------------------------------|--------------------------------------------------------|
| Long-Term Stays in Seoul    | `long-stay-*`, `monthly-*`            | cost of living, neighborhoods, furnished vs unfurnished |
| Medical Tourism in Seoul    | `medical-*`, `hospital-*`             | Asan guide, Samsung guide, post-op recovery, costs      |
| Corporate Relocation Seoul  | `corporate-*`, `business-*`, `expat-*`| visa setup, business areas, expat onboarding            |

When the director proposes weekly topics, prefer pillar-aligned topics. When proposing a topic
that doesn't fit a pillar, justify why in the rationale.

---

## 10. The packager contract

The packager generates `meta.json`. To support FAQPage schema, the packager extracts the FAQ
block from `en.md` body and emits a `faq` array:

```json
{
  "translations": { ... },
  "faq": [
    { "question": "How far is ASTY Cabin from Asan Medical Center?",
      "answer": "ASTY Cabin is in Songpa-gu, about 15 minutes ..." },
    ...
  ]
}
```

`scripts/generate-schema.ts` reads this and produces FAQPage JSON-LD that the site includes in
`<head>`. If the FAQ block is missing or under 3 items, the schema is omitted (better to have
no FAQPage schema than a broken one).

---

## 11. What this doc is NOT

- Not a style guide for human polish — see CLAUDE.md for voice.
- Not a technical SEO checklist (sitemap, hreflang, Core Web Vitals) — site infra concern.
- Not link-building strategy.

This is purely the **content shape** that gets you cited by answer engines.

---

## Updates

When you change any pattern in this file, update the writer/packager/director prompts in the
same commit and run a sample article through the full pipeline to verify the schema still
parses (use `npx tsx scripts/generate-schema.ts <slug>` and inspect the JSON-LD).
