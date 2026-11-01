# Reel Studio - Design System & Visual Authority

> Established via UI/UX Pro Max + Impeccable Skill  
> Mode: **Operate** (Studio) + **Persuade** (Landing)  
> Aesthetic: Editorial, High-Density Y-Combinator Startup (No AI Slop)

---

## 1. Core Color Tokens

### Light Mode (Default)

- **Canvas / Background:** `#FAF9F6` (warm off-white editorial paper)
- **Surface / Card Background:** `#FFFFFF` (crisp white)
- **Subtle Surface:** `#F4F3EF` (muted control fill)
- **Border Hairline:** `#E5E3DC` (1px clean geometric border)
- **Text Primary:** `#121212` (near-black, 95% contrast)
- **Text Secondary:** `#666460` (muted charcoal)
- **Text Tertiary / Metadata:** `#8C8982` (caption / timestamp gray)
- **Accent Primary (YC Amber-Flame):** `#F26522` (vibrant, confident, singular)
- **Accent Hover:** `#DE5718`
- **Accent Subtle Fill:** `#FFF4ED` (for selected chips, tags)
- **Success / Lift Positive:** `#16A34A`
- **Destructive / Lift Negative:** `#DC2626`

### Dark Mode

- **Canvas / Background:** `#0B0B0C` (deep obsidian)
- **Surface / Card Background:** `#141416`
- **Border Hairline:** `#232326`
- **Text Primary:** `#F4F4F5`
- **Text Secondary:** `#A1A1AA`
- **Accent Primary:** `#F97316`

---

## 2. Typography

- **UI Sans (Body & Headings):** `Geist Sans`, `Inter Tight`, `-apple-system, BlinkMacSystemFont, sans-serif`
  - Body: 14px / line-height 20px (dense, readable)
  - Subhead: 16px / line-height 24px (semi-bold 600)
  - Section Heading: 20px / line-height 28px (tracking -0.015em)
  - Display / Hero: 36px / line-height 42px (bold 700, editorial tracking -0.025em)
- **Metadata Mono:** `Geist Mono`, `JetBrains Mono`, `monospace`
  - Timestamps, score breakdowns, confidence indicators, raw transcripts, JSON chips: 12px / line-height 16px.

---

## 3. Spatial System & Metrics

- **Base Grid:** 8px rhythm (4px micro-increments: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px)
- **Corner Radii:** Strict 6px (`rounded-md`) to 8px (`rounded-lg`). **No bubbly 16px+ or pill-shaped giant cards.**
- **Hairline Borders:** `1px solid var(--border)` everywhere. No heavy drop-shadows; elevation is indicated by 1px borders and slight surface contrast (`#FAF9F6` vs `#FFFFFF`).
- **Data Density:** High information density with legible padding. Tables and lists have compact vertical rhythm (32px-40px row height).

---

## 4. Slop Audit Checklist (Mandatory Gates)

- [x] **NO** purple-to-blue neon gradient backgrounds
- [x] **NO** glossy glassmorphism / frosted glass overlays
- [x] **NO** decorative gradient blobs behind text
- [x] **NO** emojis as interface icons (all icons are Lucide SVG line icons)
- [x] **NO** centered hero saying "Supercharge your workflow with AI"
- [x] **NO** generic 3-card feature grids with floating circles
- [x] **NO** lorem ipsum or placeholder text
- [x] **NO** sparkles (✨) placed on every single button
- [x] **NO** rainbow/neon colored drop shadows
- [x] **NO** bubbly pill shapes
