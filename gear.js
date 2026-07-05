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
    description: "14 film simulation variants sharing one set of base settings — negative-inspired aesthetics designed to diverge significantly from the Film Dial set. Change only the Film Sim to explore each distinct look.",
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
      { film_sim: "Provia/STD",          label: "Universal Provia",        character: "Balanced, true-to-life with a slight analog vibe. Versatile in daylight." },
      { film_sim: "Velvia/Vivid",         label: "Velvia 100F",             character: "Vibrant without being garish. Best for colorful scenes in sunny or golden light." },
      { film_sim: "Astia/Soft",           label: "Indoor Astia",            character: "Soft tones, favorite for indoor natural light. Works across varied lighting." },
      { film_sim: "Classic Chrome",       label: "Elite Chrome",            character: "Kodak slide film feel. Best in direct sunny daylight." },
      { film_sim: "Reala Ace",            label: "Retro Negative",          character: "Evokes 1980s–90s color negative. Excellent at golden hour and blue hour." },
      { film_sim: "PRO Neg. Hi",          label: "Fuji Negative",           character: "General Fujicolor negative character. Performs well in overcast conditions." },
      { film_sim: "PRO Neg. Std",         label: "Pulled Negative",         character: "Low-contrast, mimics film pull processing. Ideal for artificial light." },
      { film_sim: "Classic Negative",     label: "Fujicolor Superia 200",   character: "Author's favorite. Indoor natural and artificial light. Versatile workhorse." },
      { film_sim: "Nostalgic Neg.",       label: "Americana Film",          character: "Warmest option. Modeled after American New Color photography from the 1970s." },
      { film_sim: "Eterna/Cinema",        label: "Eterna Film",             character: "Soft, cinematic. Tames high-contrast scenes. Limited but effective use cases." },
      { film_sim: "Eterna Bleach Bypass", label: "Chrome City",             character: "High contrast, low saturation. Reminiscent of LomoChrome Metropolis film." },
      { film_sim: "Acros",               label: "Acros Negative",          character: "Low-contrast B&W. Thrives in high-contrast scenes." },
      { film_sim: "Monochrome",           label: "B&W Negative",            character: "Harsher tonality than Acros. Benefits from filter adjustments." },
      { film_sim: "Sepia",               label: "B&W Sepia",               character: "Reddish-brown toning for stylistic or archival aesthetics." },
    ],
  },
  {
    slot: "C2",
    camera: "Fujifilm X-T50",
    name: "X-T50 Film Dial — Universal Recipe",
    source_url: "https://fujixweekly.com/2024/05/16/fujifilm-x-t50-film-dial-settings-14-new-film-simulation-recipes-yes-14/",
    type: "multi",
    description: "A unified recipe built for the X-T50's dedicated Film Simulation Dial. Save once in C2, then spin the dial to cycle through all simulations — each adapts well to the shared base settings.",
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
      { film_sim: "Provia/STD",          label: "Standard Film",           character: "Bright, warm, slightly Fujichrome Provia 100F with a warming filter feel." },
      { film_sim: "Velvia/Vivid",         label: "Velvia Film",             character: "Vibrant reversal film rendering. Avoid for portraits." },
      { film_sim: "Astia/Soft",           label: "Astia Summer",            character: "High saturation with flat tonality — between Provia and Velvia." },
      { film_sim: "Classic Chrome",       label: "Kodak Film",              character: "Contrasty, muted Kodak palette. Versatile including portraits." },
      { film_sim: "Reala Ace",            label: "Fujicolor PRO 160C Warm", character: "Warm professional color negative. Works in multiple situations." },
      { film_sim: "Classic Negative",     label: "Superia Negative",        character: "Lower saturation, higher contrast. Excels in low-contrast lighting." },
      { film_sim: "Nostalgic Neg.",       label: "Nostalgic Film",          character: "Warmest option. 1970s Kodak retro rendering." },
      { film_sim: "PRO Neg. Hi",          label: "PRO Negative Hi",         character: "Balanced professional rendering, slightly more saturated than Reala Ace." },
      { film_sim: "PRO Neg. Std",         label: "PRO Negative Std",        character: "Lower saturation than Hi. Particularly strong for portraiture." },
      { film_sim: "Eterna/Cinema",        label: "Cinematic Film",          character: "Lowest saturation, softest quality. Tames overly bright conditions." },
      { film_sim: "Eterna Bleach Bypass", label: "Reduced Bleach",          character: "Highest contrast, minimal color. Unique cinematic appearance." },
      { film_sim: "Acros",               label: "Neopan Negative",         character: "Low-contrast monochrome. Best in high-contrast scenes." },
      { film_sim: "Monochrome",           label: "Monochrome",              character: "Standard grayscale. Best with high-contrast subjects." },
      { film_sim: "Sepia",               label: "Sepia Print",             character: "Warm brown tone. Rarely used but available." },
    ],
  },
  {
    slot: "C3",
    camera: "both",
    name: "Reggie's Portra",
    source_url: "https://fujixweekly.com/2022/06/11/fujifilm-x-trans-iv-film-simulation-recipe-reggies-portra/",
    type: "single",
    description: "Emulates Kodak Portra 400 developed at Richard Photo Lab — warm, saturated color negative rendering with pleasant results across varied lighting. Versatile everyday recipe.",
    usage: "Everyday carry. Portraits, street, travel. Auto WB keeps it consistent across mixed lighting.",
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
    source_url: "https://fujixweekly.com/2022/11/28/kodachrome-64-fujifilm-x-t5-x-trans-v-film-simulation-recipe/",
    type: "single",
    description: "Mimics the third era of Kodachrome (1974–2009, ISO 64 emulsion) — warm tones, cyan-blue skies, moderate contrast. A classic slide film look tuned for daylight.",
    usage: "Sunny outdoor only. Landscapes, gardens, desert, architecture. Use Daylight WB.",
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
    source_url: "https://fujixweekly.com/2023/10/24/kodak-gold-200-fujifilm-x-t5-x-trans-v-film-simulation-recipe/",
    type: "single",
    description: "Emulates Kodak Gold 200 (introduced 1986) — warm, vintage color negative feel with characteristic golden shifts and saturated tones. Works best in sunny daylight.",
    usage: "Sunny daylight. Outdoor landscapes, nature, travel. Lean into the warmth.",
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
    source_url: "https://fujixweekly.com/2022/12/06/pacific-blues-fujifilm-x-t5-x-trans-v-film-simulation-recipe/",
    type: "single",
    description: "Inspired by Lucy Laucht's Spirit of Summer series — warm, dreamy, soft tones. Surprisingly versatile across beach, fog, overcast, desert, and even portraits at night.",
    usage: "Summer beach, golden hour, moody overcast, garden, portraits. Very versatile — try it everywhere.",
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
    description: "Classic high-grain B&W emulating Kodak Tri-X 400. Elegant tonality with strong grain — looks like newer Tri-X at ISO 1600–3200, older/grittier stock at ISO 6400–12800.",
    usage: "B&W street and documentary. Shoot at ISO 1600+ to get the film-grain look. The grain IS the point.",
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
const MY_RECIPES = [
  {
    recipe_name:    "TODO — paste exact recipe name from Grid tab",
    camera:         "Fujifilm X-M5",
    slot:           "C1",
    usage:          "TODO — e.g. 'Street photography in golden hour, works great for warm shadows'",
    personal_notes: "TODO — optional extra notes.",
  },
  {
    recipe_name:    "TODO",
    camera:         "Fujifilm X-M5",
    slot:           "C2",
    usage:          "TODO",
    personal_notes: "",
  },
  {
    recipe_name:    "TODO",
    camera:         "Fujifilm X-M5",
    slot:           "C3",
    usage:          "TODO",
    personal_notes: "",
  },
  {
    recipe_name:    "TODO",
    camera:         "Fujifilm X-M5",
    slot:           "C4",
    usage:          "TODO",
    personal_notes: "",
  },
  {
    recipe_name:    "TODO",
    camera:         "Fujifilm X-T50",
    slot:           "C1",
    usage:          "TODO",
    personal_notes: "",
  },
  {
    recipe_name:    "TODO",
    camera:         "Fujifilm X-T50",
    slot:           "C2",
    usage:          "TODO",
    personal_notes: "",
  },
  {
    recipe_name:    "TODO",
    camera:         "Fujifilm X-T50",
    slot:           "C3",
    usage:          "TODO",
    personal_notes: "",
  },
];
