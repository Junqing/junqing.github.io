// =============================================================
// gear.js — Your personal camera kit data for junqing.github.io
// =============================================================
// HOW TO EDIT FROM ANOTHER DEVICE:
//   1. Go to https://github.com/junqing/junqing.github.io
//   2. Click gear.js → pencil icon (Edit this file)
//   3. Make your changes, then click "Commit changes"
//   4. GitHub Pages rebuilds in ~1 minute — refresh the site to see updates.
//
// RECIPE NAMES: MY_RECIPES[].recipe_name must exactly match a recipe's
// "name" field in the main dataset (e.g. "Classic Neg. — Cool"). You can
// browse names on the Grid tab, then copy them here precisely.
// =============================================================


// ─── YOUR CAMERAS ────────────────────────────────────────────
const MY_CAMERAS = [
  {
    name: "Fujifilm X-M5",
    subtitle: "Compact / content creator",
    icon: "📷",
    image: "images/gear/x-m5.jpg",
    specs: [
      ["Model",      "X-M5"],
      ["Sensor",     "26.1MP X-Trans CMOS 4"],
      ["Processor",  "X-Processor 5"],
      ["Mount",      "Fujifilm X"],
      ["IBIS",       "None"],
      ["EVF",        "None"],
      ["Released",   "November 2024"],
    ],
    notes: "Compact, lightweight vlog-friendly body. Great for everyday carry and travel — pairs beautifully with the pancake primes."
  },
  {
    name: "Fujifilm X-T50",
    subtitle: "High-resolution primary body",
    icon: "📷",
    image: "images/gear/x-t50.jpg",
    specs: [
      ["Model",      "X-T50"],
      ["Sensor",     "40.2MP X-Trans CMOS 5 HR"],
      ["Processor",  "X-Processor 5"],
      ["Mount",      "Fujifilm X"],
      ["IBIS",       "Up to 7.0 stops"],
      ["Film Sim Dial", "Yes"],
      ["Released",   "June 2024"],
    ],
    notes: "The main workhorse. 40MP gives headroom to crop, and the dedicated film-simulation dial makes swapping between recipes tactile and fast."
  },
];


// ─── YOUR LENSES ─────────────────────────────────────────────
const MY_LENSES = [
  {
    name: "XF 23mm f/2.8 R WR",
    subtitle: "Pancake wide prime · 35mm equiv.",
    icon: "🔭",
    image: "images/gear/xf23f28.jpg",
    specs: [
      ["Focal length",   "23mm (35mm equiv.)"],
      ["Max aperture",   "f/2.8"],
      ["Type",           "Prime — pancake"],
      ["Weather sealed", "Yes"],
      ["Filter thread",  "39mm"],
      ["Weight",         "90g"],
    ],
    notes: "Featherweight pancake that barely adds any size to either body. Great walk-around lens when you want to travel light."
  },
  {
    name: "XF 27mm f/2.8 R WR",
    subtitle: "Pancake standard prime · 41mm equiv.",
    icon: "🔭",
    image: "images/gear/xf27f28.jpg",
    specs: [
      ["Focal length",   "27mm (41mm equiv.)"],
      ["Max aperture",   "f/2.8"],
      ["Type",           "Prime — pancake"],
      ["Weather sealed", "Yes"],
      ["Filter thread",  "39mm"],
      ["Weight",         "84g"],
    ],
    notes: "The flattest lens in the kit — virtually disappears on the X-M5. A natural field-of-view close to how the eye sees."
  },
  {
    name: "XF 23mm f/2 R WR",
    subtitle: "Compact wide prime · 35mm equiv.",
    icon: "🔭",
    image: "images/gear/xf23f2.png",
    specs: [
      ["Focal length",   "23mm (35mm equiv.)"],
      ["Max aperture",   "f/2"],
      ["Type",           "Prime"],
      ["Weather sealed", "Yes"],
      ["Filter thread",  "43mm"],
      ["Weight",         "180g"],
    ],
    notes: "One stop faster than the f/2.8 pancake with only a modest size increase. Good balance for low-light street work."
  },
  {
    name: "XF 35mm f/2 R WR",
    subtitle: "Compact standard prime · 53mm equiv.",
    icon: "🔭",
    image: "images/gear/xf35f2.png",
    specs: [
      ["Focal length",   "35mm (53mm equiv.)"],
      ["Max aperture",   "f/2"],
      ["Type",           "Prime"],
      ["Weather sealed", "Yes"],
      ["Filter thread",  "43mm"],
      ["Weight",         "170g"],
    ],
    notes: "Versatile and sharp from wide open. Reaches a classic portrait field-of-view and handles casual street and food shots equally well."
  },
  {
    name: "XF 35mm f/1.4 R",
    subtitle: "Classic fast prime · 53mm equiv.",
    icon: "🔭",
    image: "images/gear/xf35f14.webp",
    specs: [
      ["Focal length",   "35mm (53mm equiv.)"],
      ["Max aperture",   "f/1.4"],
      ["Type",           "Prime"],
      ["Weather sealed", "No"],
      ["Filter thread",  "52mm"],
      ["Weight",         "187g"],
    ],
    notes: "The OG Fuji lens with that distinctive creamy rendering. Slower to focus but the character at f/1.4–f/2 is unmatched in the kit."
  },
  {
    name: "XF 16-50mm f/2.8-4.8 R LM WR",
    subtitle: "Standard zoom · 24-76mm equiv.",
    icon: "🔭",
    image: "images/gear/xf16-50.jpg",
    specs: [
      ["Focal length",   "16-50mm (24-76mm equiv.)"],
      ["Max aperture",   "f/2.8-4.8"],
      ["Type",           "Zoom"],
      ["Weather sealed", "Yes"],
      ["Filter thread",  "58mm"],
      ["Weight",         "240g"],
    ],
    notes: "The kit lens bundled with the X-T50. Surprisingly capable — covers wide through short tele and is compact enough not to feel burdensome."
  },
  {
    name: "XF 18-55mm f/2.8-4 R LM OIS",
    subtitle: "Standard zoom with OIS · 27-84mm equiv.",
    icon: "🔭",
    image: "images/gear/xf18-55.png",
    specs: [
      ["Focal length",   "18-55mm (27-84mm equiv.)"],
      ["Max aperture",   "f/2.8-4"],
      ["Type",           "Zoom"],
      ["Weather sealed", "No"],
      ["OIS",            "Yes (4-stop)"],
      ["Filter thread",  "58mm"],
      ["Weight",         "310g"],
    ],
    notes: "The tried-and-true X-mount kit zoom. Slightly longer reach than the 16-50, and the OIS helps on the X-M5 which lacks IBIS."
  },
];


// ─── CUSTOM SLOTS C1–C7 ──────────────────────────────────────
// type "multi"  → one set of base settings shared across all film simulations.
//                 Rotate the film dial or change Film Sim in the menu to explore each look.
// type "single" → one recipe per slot; settings listed below.
const MY_CUSTOM_SLOTS = [
  {
    slot: "C1",
    camera: "both",
    name: "Universal Negative 14",
    source_url: "https://fujixweekly.com/2025/03/28/universal-negative-14-fujifilm-x100vi-x-trans-v-film-simulation-recipes-yes-14/",
    type: "multi",
    description: "14 distinct looks sharing one set of base settings — dial-style exploration without saving 14 separate recipes. Settings are tuned for a negative-film character: pulled contrast, restrained color, heavy DR400 shadow recovery. Rotate through simulations to find the right mood; the base settings hold across all of them.",
    pros: [
      "Single recipe to remember — only the Film Sim changes",
      "Covers the entire tonal spectrum from punchy color to gritty B&W",
      "DR400 + Shadow −2 gives excellent dynamic range for backlit or tricky light",
      "Great for learning what each simulation actually does side-by-side",
    ],
    cons: [
      "14 options is a lot to keep in mind — takes time to internalize which to reach for",
      "Eterna and Sepia sims have narrow situational use and are easy to forget",
      "Color −2 means saturated subjects may look a bit muted — may want +⅔ EV more",
      "Not optimized for portraits (cooler WB and reduced color can flatten skin tones)",
    ],
    base_settings: [
      ["Dynamic Range", "DR400"],
      ["Grain", "Strong, Small"],
      ["CCE", "Strong"],
      ["CCE Blue", "Strong"],
      ["White Balance", "4000K  R0 / B−5"],
      ["Highlight", "0"],
      ["Shadow", "−2"],
      ["Color", "−2"],
      ["Sharpness", "−2"],
      ["ISO Max", "6400"],
      ["Exposure", "−⅓ to +⅔"],
    ],
    simulations: [
      { film_sim: "Provia/STD",          label: "Universal Provia",        recipe_name: "Universal Provia", character: "Balanced, true-to-life with a slight analog vibe. Versatile in daylight." },
      { film_sim: "Velvia/Vivid",         label: "Velvia 100F",             recipe_name: "Velvia 100F", character: "Vibrant without being garish. Best for colorful scenes in sunny or golden light." },
      { film_sim: "Astia/Soft",           label: "Indoor Astia",            recipe_name: "Indoor Astia", character: "Soft tones, favorite for indoor natural light. Works across varied lighting." },
      { film_sim: "Classic Chrome",       label: "Elite Chrome",            recipe_name: "Elite Chrome", character: "Kodak slide film feel. Best in direct sunny daylight." },
      { film_sim: "Reala Ace",            label: "Retro Negative",          recipe_name: "Retro Negative", character: "Evokes 1980s–90s color negative. Excellent at golden hour and blue hour." },
      { film_sim: "PRO Neg. Hi",          label: "Fuji Negative",           recipe_name: "Fuji Negative", character: "General Fujicolor negative character. Performs well in overcast conditions." },
      { film_sim: "PRO Neg. Std",         label: "Pulled Negative",         recipe_name: "Pulled Negative", character: "Low-contrast, mimics film pull processing. Ideal for artificial light." },
      { film_sim: "Classic Negative",     label: "Fujicolor Superia 200",   recipe_name: "Fujicolor Superia 200", character: "Author's favorite. Indoor natural and artificial light. Versatile workhorse." },
      { film_sim: "Nostalgic Neg.",       label: "Americana Film",          recipe_name: "Americana Film", character: "Warmest option. Modeled after American New Color photography from the 1970s." },
      { film_sim: "Eterna/Cinema",        label: "Eterna Film",             recipe_name: "Eterna Film", character: "Soft, cinematic. Tames high-contrast scenes. Limited but effective use cases." },
      { film_sim: "Eterna Bleach Bypass", label: "Chrome City",             recipe_name: "Chrome City", character: "High contrast, low saturation. Reminiscent of LomoChrome Metropolis film." },
      { film_sim: "Acros",               label: "Acros Negative",          recipe_name: "Acros Negative", character: "Low-contrast B&W. Thrives in high-contrast scenes." },
      { film_sim: "Monochrome",           label: "B&W Negative",            recipe_name: "B&W Negative", character: "Harsher tonality than Acros. Benefits from filter adjustments." },
      { film_sim: "Sepia",               label: "B&W Sepia",               recipe_name: "B&W Sepia", character: "Reddish-brown toning for stylistic or archival aesthetics." },
    ],
  },
  {
    slot: "C2",
    camera: "Fujifilm X-T50",
    name: "X-T50 Film Dial — Universal Recipe",
    source_url: "https://fujixweekly.com/2024/05/16/fujifilm-x-t50-film-dial-settings-14-new-film-simulation-recipes-yes-14/",
    type: "multi",
    description: "One recipe saved in C2, used across all 14 film simulations via the X-T50's physical Film Dial. Base settings are warm-leaning (Auto WB White Priority, Color +3) — designed so each simulation looks good without per-sim tweaking. Spinning the dial mid-shoot is instant and tactile, making it easy to experiment on the fly.",
    pros: [
      "Physical dial makes switching simulations instant — no menu diving",
      "Warm color tuning (R+2/B−4) works well in natural light and golden hour",
      "Covers both color and B&W in a single saved slot",
      "Relatively forgiving — Auto WB adapts to mixed indoor/outdoor light",
    ],
    cons: [
      "X-T50 only — not usable on X-M5 (no film dial)",
      "Color +3 can clip saturation in vivid sims like Velvia — meter carefully",
      "Some sims (Sepia, Reduced Bleach) are rarely useful day-to-day",
      "Auto WB can shift noticeably between shots in changing light",
    ],
    base_settings: [
      ["Dynamic Range", "DR400"],
      ["Grain", "Weak, Small"],
      ["CCE", "Strong"],
      ["CCE Blue", "Weak"],
      ["White Balance", "Auto White Priority  R+2 / B−4"],
      ["Highlight", "−1.5"],
      ["Shadow", "−1"],
      ["Color", "+3"],
      ["Sharpness", "−1"],
      ["Clarity", "−2"],
      ["ISO Max", "6400"],
      ["Exposure", "0 to +1"],
    ],
    simulations: [
      { film_sim: "Provia/STD",          label: "Standard Film",           recipe_name: "Standard Film (X-T50 Film Dial)", character: "Bright, warm, slightly Fujichrome Provia 100F with a warming filter feel." },
      { film_sim: "Velvia/Vivid",         label: "Velvia Film",             recipe_name: "Velvia Film (X-T50 Film Dial)", character: "Vibrant reversal film rendering. Avoid for portraits." },
      { film_sim: "Astia/Soft",           label: "Astia Summer",            recipe_name: "Astia Summer (X-T50 Film Dial)", character: "High saturation with flat tonality — between Provia and Velvia." },
      { film_sim: "Classic Chrome",       label: "Kodak Film",              recipe_name: "Kodak Film (X-T50 Film Dial)", character: "Contrasty, muted Kodak palette. Versatile including portraits." },
      { film_sim: "Reala Ace",            label: "Fujicolor PRO 160C Warm", recipe_name: "Fujicolor PRO 160C Warm (X-T50 Film Dial)", character: "Warm professional color negative. Works in multiple situations." },
      { film_sim: "Classic Negative",     label: "Superia Negative",        recipe_name: "Superia Negative (X-T50 Film Dial)", character: "Lower saturation, higher contrast. Excels in low-contrast lighting." },
      { film_sim: "Nostalgic Neg.",       label: "Nostalgic Film",          recipe_name: "Nostalgic Film (X-T50 Film Dial)", character: "Warmest option. 1970s Kodak retro rendering." },
      { film_sim: "PRO Neg. Hi",          label: "PRO Negative Hi",         recipe_name: "Fujicolor PRO Film (X-T50 Film Dial)", character: "Balanced professional rendering, slightly more saturated than Reala Ace." },
      { film_sim: "PRO Neg. Std",         label: "PRO Negative Std",        recipe_name: "Fujicolor PRO 160S (X-T50 Film Dial)", character: "Lower saturation than Hi. Particularly strong for portraiture." },
      { film_sim: "Eterna/Cinema",        label: "Cinematic Film",          recipe_name: "Cinematic Film (X-T50 Film Dial)", character: "Lowest saturation, softest quality. Tames overly bright conditions." },
      { film_sim: "Eterna Bleach Bypass", label: "Reduced Bleach",          recipe_name: "Reduced Bleach (X-T50 Film Dial)", character: "Highest contrast, minimal color. Unique cinematic appearance." },
      { film_sim: "Acros",               label: "Neopan Negative",         recipe_name: "Neopan Negative (X-T50 Film Dial)", character: "Low-contrast monochrome. Best in high-contrast scenes." },
      { film_sim: "Monochrome",           label: "Monochrome",              recipe_name: "Monochrome Film (X-T50 Film Dial)", character: "Standard grayscale. Best with high-contrast subjects." },
      { film_sim: "Sepia",               label: "Sepia Print",             recipe_name: "Sepia Print (X-T50 Film Dial)", character: "Warm brown tone. Rarely used but available." },
    ],
  },
  {
    slot: "C3",
    camera: "both",
    name: "Reggie's Portra",
    source_url: "https://fujixweekly.com/2022/06/11/fujifilm-x-trans-iv-film-simulation-recipe-reggies-portra/",
    type: "single",
    recipe_name: "Reggie's Portra",
    description: "Emulates Kodak Portra 400 processed at Richard Photo Lab — not a clinical Portra clone, but a warm and slightly saturated take on what premium C-41 looks like with a skilled developing lab. Classic Chrome + CCE Strong lifts midtones and adds depth without going full slide-film punchy. Auto WB keeps it usable anywhere.",
    usage: "Everyday carry. Portraits, street, travel, casual events. Auto WB keeps it consistent across mixed lighting.",
    pros: [
      "Auto WB means you can leave it on all day without thinking",
      "Flattering for portraits — warm tones and −1 shadow lift skin tones nicely",
      "Soft sharpness (−2) hides harsh edges and makes files feel more filmic",
      "Classic Chrome gives a slight muted quality without losing saturation",
    ],
    cons: [
      "Not a faithful Portra clone — more like a 'Portra-inspired' interpretation",
      "Color +2 can push already-saturated subjects (sunsets, flowers) a bit far",
      "No recipe_name link — not in the main dataset, so no sample gallery to browse",
      "DR Auto may underexpose highlights in tricky high-contrast scenes; consider DR200",
    ],
    settings: [
      ["Film Sim",       "Classic Chrome"],
      ["Dynamic Range",  "DR Auto"],
      ["Grain",          "Weak, Small"],
      ["CCE",            "Strong"],
      ["CCE Blue",       "Weak"],
      ["White Balance",  "Auto  R+2 / B−4"],
      ["Highlight",      "−1"],
      ["Shadow",         "−1"],
      ["Color",          "+2"],
      ["Sharpness",      "−2"],
      ["ISO Max",        "6400"],
    ],
  },
  {
    slot: "C4",
    camera: "both",
    name: "Kodachrome 64",
    recipe_name: "Kodachrome 64",
    source_url: "https://fujixweekly.com/2022/11/28/kodachrome-64-fujifilm-x-t5-x-trans-v-film-simulation-recipe/",
    type: "single",
    description: "Mimics the third era of Kodachrome (1974–2009) — that specific ISO 64 emulsion with its warm skin tones, cyan-shifted skies, and moderately punchy contrast. Clarity +3 and Sharpness +1 give it the crisp, defined quality that made Kodachrome a standard for photojournalism and National Geographic. Strictly a daylight recipe.",
    usage: "Sunny outdoor only. Landscapes, gardens, desert, city architecture, travel. Use Daylight WB — avoid indoors.",
    pros: [
      "Iconic cyan-blue sky rendering — looks instantly like classic Kodachrome slides",
      "Clarity +3 + Sharpness +1 gives excellent micro-contrast and edge definition",
      "DR200 handles midday contrast well without blown highlights",
      "Daylight WB means consistent color across all sunny shots",
    ],
    cons: [
      "Strictly sunny daylight only — falls apart quickly in overcast, shade, or indoors",
      "Warm skin tones from the WB shift can look ruddy on some complexions",
      "Sharpness +1 makes noise more visible at higher ISO — keep it at base ISO",
      "Low-ISO nature means less latitude in exposure; nail it in-camera",
    ],
    settings: [
      ["Film Sim",       "Classic Chrome"],
      ["Dynamic Range",  "DR200"],
      ["Grain",          "Weak, Small"],
      ["CCE",            "Strong"],
      ["CCE Blue",       "Off"],
      ["White Balance",  "Daylight  R+2 / B−5"],
      ["Highlight",      "0"],
      ["Shadow",         "+0.5"],
      ["Color",          "+2"],
      ["Sharpness",      "+1"],
      ["Clarity",        "+3"],
      ["ISO Max",        "6400"],
      ["Exposure",       "0 to +⅔"],
    ],
  },
  {
    slot: "C5",
    camera: "both",
    name: "Kodak Gold 200",
    recipe_name: "Kodak Gold 200",
    source_url: "https://fujixweekly.com/2023/10/24/kodak-gold-200-fujifilm-x-t5-x-trans-v-film-simulation-recipe/",
    type: "single",
    description: "Emulates Kodak Gold 200 (introduced 1986) — that consumer-tier color negative with its characteristic warm, slightly yellow-shifted look and dense shadows. R+4/B−5 is an extreme WB push that makes sunlit scenes glow; the strong grain and lifted shadows give it the slightly rough, memory-photo quality that defines Gold 200's character.",
    usage: "Sunny daylight — beach, travel, nature, outdoor events. Lean into the warmth; expose a stop above camera meter.",
    pros: [
      "Authentic Kodak Gold warmth — sunlit scenes have a rich, nostalgic glow",
      "Strong, Small grain adds texture that feels genuinely filmic",
      "Shadow +0.5 + DR400 lifts shadow detail for a luminous, airy quality",
      "Works beautifully on film-centric subjects: people at the beach, summer events",
    ],
    cons: [
      "Extreme WB shift (R+4/B−5) makes indoor or artificial-light shots very yellow",
      "Color +3 + Highlight −1.5 means oversaturated subjects (red flowers, neon signs) may clip",
      "Not for portraits where accurate skin tone matters",
      "Requires EV +⅔ to +1 — easy to underexpose if you forget to dial it in",
    ],
    settings: [
      ["Film Sim",       "Classic Chrome"],
      ["Dynamic Range",  "DR400"],
      ["Grain",          "Strong, Small"],
      ["CCE",            "Weak"],
      ["CCE Blue",       "Off"],
      ["White Balance",  "Daylight  R+4 / B−5"],
      ["Highlight",      "−1.5"],
      ["Shadow",         "+0.5"],
      ["Color",          "+3"],
      ["Sharpness",      "−2"],
      ["Clarity",        "−2"],
      ["ISO Max",        "6400"],
      ["Exposure",       "+⅔ to +1"],
    ],
  },
  {
    slot: "C6",
    camera: "both",
    name: "Pacific Blues",
    recipe_name: "Pacific Blues",
    source_url: "https://fujixweekly.com/2022/12/06/pacific-blues-fujifilm-x-t5-x-trans-v-film-simulation-recipe/",
    type: "single",
    description: "Inspired by Lucy Laucht's Spirit of Summer series — warm and ethereal, with heavily lifted shadows (Shadow +3) and soft clarity that make the image feel like memory rather than documentation. Classic Negative + CCE Strong gives depth without harshness. Despite the dreamy look it's unusually versatile: Laucht's original samples span fog, desert, interiors, and portraits.",
    usage: "Golden hour, beach, garden, dreamy portraits, overcast or foggy days. Try it in more situations than you'd expect — it adapts.",
    pros: [
      "Shadow +3 + Clarity −3 produces a distinctly dreamy, lifted quality that's hard to replicate in post",
      "Surprisingly versatile — handles soft light, overcast, and even night portraits well",
      "Large grain adds tactile film texture without looking gritty",
      "Classic Negative has the most filmic tonal roll-off of all Fuji sims",
    ],
    cons: [
      "Shadow +3 removes shadow depth — very flat-looking in scenes that need contrast",
      "Large grain can look excessive at high ISO; best at ISO 400 or below",
      "Color +4 may oversaturate vivid subjects (tropical flowers, neon lights)",
      "5800K WB shift can cast warm on skin in mixed/cool indoor lighting",
    ],
    settings: [
      ["Film Sim",       "Classic Negative"],
      ["Dynamic Range",  "DR400"],
      ["Grain",          "Strong, Large"],
      ["CCE",            "Strong"],
      ["CCE Blue",       "Weak"],
      ["White Balance",  "5800K  R+1 / B−3"],
      ["Highlight",      "−2"],
      ["Shadow",         "+3"],
      ["Color",          "+4"],
      ["Sharpness",      "−2"],
      ["Clarity",        "−3"],
      ["ISO Max",        "6400"],
      ["Exposure",       "+⅔ to +1"],
    ],
  },
  {
    slot: "C7",
    camera: "both",
    name: "Kodak Tri-X 400",
    source_url: "https://fujixweekly.com/2020/06/18/fujifilm-x100v-film-simulation-recipe-kodak-tri-x-400/",
    type: "single",
    recipe_name: "Kodak Tri-X 400",
    description: "Emulates Kodak Tri-X 400 — the definitive high-grain documentary B&W film. The extreme WB shift (R+9/B−9) manipulates tonal rendering so that the Acros simulation responds more like Tri-X's warm-tonality silver halide base. Clarity +4 and Shadow +3 together give bold shadow separation with crisp micro-contrast. ISO is intentionally high to generate grain as the creative element, not something to suppress.",
    usage: "Street, documentary, journalism, gritty urban. Shoot at ISO 1600–6400. Let the grain breathe — this is not a clean B&W recipe.",
    pros: [
      "Authentic Tri-X grain texture — looks genuinely like scanned film at ISO 3200",
      "Clarity +4 + Shadow +3 gives excellent tonal separation in flat or low-light scenes",
      "Acros simulation has the best B&W tonal rendering in the Fuji lineup",
      "Extreme WB shift adds subtle warmth to highlights for a silver gelatin feel",
    ],
    cons: [
      "Extreme R+9/B−9 WB shift looks wrong in color preview mode — disorienting until you commit to JPEG/film",
      "Must shoot at high ISO to activate grain; at ISO 400 it's just a flat, clean B&W",
      "No WR lenses matter here — grain hides sharpness, so Clarity +4 is more important than optics",
      "Acros Standard filter chosen; other filters (Y/R/G) would change sky/skin tones — worth experimenting later",
    ],
    settings: [
      ["Film Sim",       "Acros (Standard — no filter)"],
      ["Dynamic Range",  "DR200"],
      ["Grain",          "Strong, Large"],
      ["CCE",            "Strong"],
      ["CCE Blue",       "Off"],
      ["White Balance",  "Daylight  R+9 / B−9"],
      ["Highlight",      "0"],
      ["Shadow",         "+3"],
      ["Sharpness",      "+1"],
      ["Clarity",        "+4"],
      ["ISO",            "1600–12800"],
      ["Exposure",       "+⅓ to +1"],
    ],
    filter_variants: [
      {
        filter: "Standard",
        active: true,
        summary: "Neutral, balanced tonality. No color adjustment applied.",
        best_for: "Any subject. A reliable baseline for indoor, outdoor, and mixed light.",
      },
      {
        filter: "+Y  Yellow",
        active: false,
        summary: "Slightly darkens blue sky, gentle contrast boost.",
        best_for: "Everyday urban and street photography. Natural-looking with a mild punch.",
      },
      {
        filter: "+R  Red",
        active: false,
        summary: "Dramatically darkens sky, water, and blue tones. Strong graphic contrast. Lightens warm/skin tones.",
        best_for: "Dramatic skies, architectural photography, bold clouds.",
      },
      {
        filter: "+G  Green",
        active: false,
        summary: "Lightens foliage and skin tones, slightly darkens sky and red tones.",
        best_for: "Outdoor portraits and nature photography with lots of greenery.",
      },
    ],
  },
];


// ─── YOUR SAVED RECIPES (7 custom slots) ─────────────────────
// recipe_name: must EXACTLY match the name in the dataset (Grid tab).
// camera:      which of your bodies this is saved on.
// slot:        C1–C7 (the camera's custom setting slot).
// usage:       when/why you reach for this recipe (shown prominently).
// personal_notes: freeform observations (optional).
const MY_RECIPES = [];

// ─── RECIPE METADATA PATCHES ─────────────────────────────────
// Override computed badge labels for specific recipes without touching RECIPES.
// Keys must exactly match RECIPES[].name.
const RECIPE_META_PATCHES = {
  // "Recipe Name": { warmth_override: "warm", punch_override: "flat" }
  //
  // warmth_override: "warm" | "neutral" | "cool"
  // punch_override:  "punchy" | "balanced" | "flat"
};
