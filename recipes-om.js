// OM System / Olympus recipe family — sourced from om-recipes.com
// Distinct schema from Fuji RECIPES_* — do not mix fields with the Fuji recipe shape.
var RECIPES_OM = [
{
name: "Bleached", author: "Alberto Torrejon", source_url: "https://www.facebook.com/groups/868676745364735/permalink/973880794844329/?mibextid=wwXIfr&rdid=eIuZdgPMcZYS1FAX#", recipe_type: "COLOR",
color_wheel: { yellow:-4, orange:0, orangeRed:0, red:0, magenta:-1, violet:-1, blue:-1, blueCyan:0, cyan:0, greenCyan:0, green:0, yellowGreen:-4 },
contrast: 0, sharpness: 0, highlights: -3, shadows: 3, midtones: 0, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Custom WB 1", wb_temperature: 7400, wb_amber_offset: -2, wb_green_offset: 5,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["faded", "soft", "desaturated", "cool"], scenario_keywords: ["overcast", "everyday"]
},
{
name: "OMTC Cool", author: "Ali O'Keefe", source_url: "https://omtc.substack.com/p/5-jpeg-recipes-for-the-om-system", recipe_type: "COLOR",
color_wheel: { yellow:2, orange:2, orangeRed:3, red:0, magenta:0, violet:0, blue:4, blueCyan:2, cyan:5, greenCyan:3, green:0, yellowGreen:-1 },
contrast: 2, sharpness: 0, highlights: -2, shadows: -1, midtones: 2, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Auto (Keep Warm Color Off)", wb_temperature: null, wb_amber_offset: 2, wb_green_offset: -1,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["clean", "cool", "versatile"], scenario_keywords: ["sunset", "travel", "everyday"]
},
{
name: "OMTC Chrome", author: "Ali O'Keefe", source_url: "https://omtc.substack.com/p/5-jpeg-recipes-for-the-om-system", recipe_type: "COLOR",
color_wheel: { yellow:0, orange:1, orangeRed:2, red:5, magenta:-1, violet:-1, blue:5, blueCyan:4, cyan:0, greenCyan:5, green:2, yellowGreen:-2 },
contrast: 2, sharpness: -1, highlights: -3, shadows: 2, midtones: 0, shading_effect: 0,
exposure_compensation: -5,
white_balance: "Custom WB 1", wb_temperature: 5600, wb_amber_offset: 1, wb_green_offset: -2,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["punchy", "dramatic", "moody"], scenario_keywords: ["city", "golden-hour", "architecture"]
},
{
name: "OMTC Soft", author: "Ali O'Keefe", source_url: "https://omtc.substack.com/p/5-jpeg-recipes-for-the-om-system", recipe_type: "COLOR",
color_wheel: { yellow:-1, orange:0, orangeRed:-1, red:-2, magenta:0, violet:-1, blue:-2, blueCyan:-1, cyan:1, greenCyan:-2, green:1, yellowGreen:-3 },
contrast: 2, sharpness: -2, highlights: -6, shadows: 2, midtones: 0, shading_effect: 0,
exposure_compensation: 5,
white_balance: "Auto (Keep Warm Color Off)", wb_temperature: null, wb_amber_offset: 2, wb_green_offset: 0,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["soft", "dreamy", "faded"], scenario_keywords: ["overcast", "shade", "twilight"]
},
{
name: "OMTC Warm", author: "Ali O'Keefe", source_url: "https://omtc.substack.com/p/5-jpeg-recipes-for-the-om-system", recipe_type: "COLOR",
color_wheel: { yellow:2, orange:2, orangeRed:3, red:0, magenta:0, violet:0, blue:4, blueCyan:2, cyan:5, greenCyan:3, green:0, yellowGreen:-1 },
contrast: 2, sharpness: -1, highlights: -2, shadows: -1, midtones: 2, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Auto (Keep Warm Color Off)", wb_temperature: null, wb_amber_offset: 4, wb_green_offset: -1,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["warm", "punchy", "nostalgic"], scenario_keywords: ["daylight", "beach", "outdoor"]
},
{
name: "Rose Gold", author: "Andrew Gow", source_url: null, recipe_type: "COLOR",
color_wheel: { yellow:2, orange:2, orangeRed:2, red:0, magenta:0, violet:-1, blue:-1, blueCyan:-1, cyan:-1, greenCyan:2, green:1, yellowGreen:1 },
contrast: 0, sharpness: 1, highlights: 1, shadows: -1, midtones: 0, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Auto (Keep Warm Color Off)", wb_temperature: null, wb_amber_offset: 4, wb_green_offset: -1,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["warm", "natural"], scenario_keywords: ["landscape", "outdoor", "sunny"]
},
{
name: "Kodachrome 25", author: "Angelo Gabelli", source_url: null, recipe_type: "COLOR",
color_wheel: { yellow:-2, orange:-1, orangeRed:-2, red:-1, magenta:0, violet:-2, blue:2, blueCyan:1, cyan:0, greenCyan:-1, green:0, yellowGreen:-1 },
contrast: 0, sharpness: -2, highlights: 1, shadows: -2, midtones: 1, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Auto", wb_temperature: null, wb_amber_offset: 1, wb_green_offset: 1,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["nostalgic", "vintage", "muted"], scenario_keywords: ["everyday", "travel"]
},
{
name: "Asteroid City", author: "Burak Yilmaz", source_url: "https://www.mu-43.com/threads/wes-anderson-asteroid-city-inspired-om-3-recipe.129007/#post-1834929", recipe_type: "COLOR",
color_wheel: { yellow:3, orange:1, orangeRed:2, red:2, magenta:1, violet:0, blue:0, blueCyan:-5, cyan:5, greenCyan:-2, green:-1, yellowGreen:-1 },
contrast: -2, sharpness: -1, highlights: -2, shadows: 4, midtones: 0, shading_effect: 0,
exposure_compensation: 0,
white_balance: "5300K (Fine Weather)", wb_temperature: 5300, wb_amber_offset: 7, wb_green_offset: 7,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["cinematic", "retro", "dreamy"], scenario_keywords: ["travel", "daylight", "architecture"]
},
{
name: "The Night Mayor", author: "Burak Yilmaz", source_url: null, recipe_type: "COLOR",
color_wheel: { yellow:-1, orange:0, orangeRed:5, red:5, magenta:-4, violet:-3, blue:-1, blueCyan:3, cyan:5, greenCyan:4, green:2, yellowGreen:1 },
contrast: 0, sharpness: -2, highlights: -3, shadows: -2, midtones: 1, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Auto (Keep Warm Color Off)", wb_temperature: null, wb_amber_offset: -5, wb_green_offset: 7,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["moody", "cinematic", "gritty"], scenario_keywords: ["night", "low-light", "street", "urban"]
},
{
name: "A Bit More Vivid", author: "Chris Brogan", source_url: null, recipe_type: "COLOR",
color_wheel: { yellow:1, orange:3, orangeRed:5, red:5, magenta:5, violet:5, blue:4, blueCyan:4, cyan:4, greenCyan:2, green:1, yellowGreen:0 },
contrast: 0, sharpness: -1, highlights: 4, shadows: -4, midtones: 0, shading_effect: 0,
exposure_compensation: 0,
white_balance: "6000K (Cloudy)", wb_temperature: 6000, wb_amber_offset: 0, wb_green_offset: 0,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["vibrant", "punchy"], scenario_keywords: ["everyday", "outdoor"]
},
{
name: "Vibrant Chrome", author: "Dave Herring", source_url: null, recipe_type: "COLOR",
color_wheel: { yellow:3, orange:4, orangeRed:5, red:4, magenta:4, violet:4, blue:3, blueCyan:3, cyan:3, greenCyan:2, green:1, yellowGreen:1 },
contrast: -2, sharpness: -1, highlights: 2, shadows: -6, midtones: 0, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Custom WB 1", wb_temperature: 5200, wb_amber_offset: -1, wb_green_offset: -1,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["vibrant", "punchy", "saturated"], scenario_keywords: ["daylight", "outdoor"]
},
{
name: "Emily's Custom Color Profile With Custom White Balance", author: "Emily Lowrey", source_url: "https://youtu.be/54nTIMdOCGQ?t=611", recipe_type: "COLOR",
color_wheel: { yellow:3, orange:3, orangeRed:3, red:1, magenta:3, violet:-1, blue:3, blueCyan:2, cyan:4, greenCyan:0, green:0, yellowGreen:2 },
contrast: 1, sharpness: -1, highlights: -4, shadows: 4, midtones: 0, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Custom WB 1", wb_temperature: 7000, wb_amber_offset: 4, wb_green_offset: 1,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["warm", "vibrant"], scenario_keywords: ["outdoor", "everyday"]
},
{
name: "Rusty Vintage", author: "Gal Root", source_url: "https://www.mu-43.com/threads/my-kodachrome-classic-chrome-pen-f-settings-update.92950/post-1754625", recipe_type: "COLOR",
color_wheel: { yellow:-3, orange:1, orangeRed:2, red:-1, magenta:-2, violet:-1, blue:-4, blueCyan:-3, cyan:-4, greenCyan:-3, green:-4, yellowGreen:-2 },
contrast: 2, sharpness: 1, highlights: -1, shadows: 1, midtones: 0, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Auto", wb_temperature: null, wb_amber_offset: 1, wb_green_offset: 1,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["vintage", "desaturated", "earthy", "warm"], scenario_keywords: ["everyday", "travel"]
},
{
name: "Kodachrome 25", author: "Gareth B.", source_url: "https://www.mu-43.com/threads/my-kodachrome-classic-chrome-pen-f-settings-update.92950/", recipe_type: "COLOR",
color_wheel: { yellow:-2, orange:1, orangeRed:1, red:-1, magenta:-1, violet:2, blue:-3, blueCyan:-2, cyan:-4, greenCyan:-4, green:-4, yellowGreen:-5 },
contrast: 2, sharpness: 0, highlights: -2, shadows: -5, midtones: 2, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Auto", wb_temperature: null, wb_amber_offset: -2, wb_green_offset: 2,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["nostalgic", "vintage", "high-contrast", "desaturated"], scenario_keywords: ["everyday", "travel"]
},
{
name: "Kodachrome 64", author: "Gareth B.", source_url: "https://www.mu-43.com/threads/my-kodachrome-classic-chrome-pen-f-settings-update.92950/", recipe_type: "COLOR",
color_wheel: { yellow:-3, orange:0, orangeRed:0, red:1, magenta:-2, violet:-1, blue:-2, blueCyan:-1, cyan:-3, greenCyan:-2, green:-4, yellowGreen:-4 },
contrast: 0, sharpness: 0, highlights: -2, shadows: -6, midtones: 2, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Auto", wb_temperature: null, wb_amber_offset: 1, wb_green_offset: 0,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["nostalgic", "vintage", "high-contrast"], scenario_keywords: ["everyday", "travel"]
},
{
name: "Filmed", author: "George Holden", source_url: "https://www.youtube.com/watch?v=QtchurMwHIo&t=372s", recipe_type: "COLOR",
color_wheel: { yellow:0, orange:0, orangeRed:-2, red:0, magenta:0, violet:-5, blue:-1, blueCyan:-1, cyan:-1, greenCyan:-1, green:-3, yellowGreen:0 },
contrast: 1, sharpness: -2, highlights: 2, shadows: -3, midtones: 1, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Auto", wb_temperature: null, wb_amber_offset: null, wb_green_offset: null,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["filmic", "analog"], scenario_keywords: ["everyday", "street"]
},
{
name: "Cool Spring", author: "Ian Will", source_url: null, recipe_type: "COLOR",
color_wheel: { yellow:1, orange:1, orangeRed:1, red:2, magenta:3, violet:4, blue:4, blueCyan:4, cyan:3, greenCyan:1, green:1, yellowGreen:0 },
contrast: 0, sharpness: 1, highlights: -1, shadows: -2, midtones: 1, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Auto", wb_temperature: null, wb_amber_offset: 0, wb_green_offset: 0,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["cool", "vibrant"], scenario_keywords: ["nature", "landscape", "daylight"]
},
{
name: "Ode to Ansel", author: "Ian Will", source_url: null, recipe_type: "MONO",
color_wheel: { yellow:null, orange:null, orangeRed:null, red:null, magenta:null, violet:null, blue:null, blueCyan:null, cyan:null, greenCyan:null, green:null, yellowGreen:null },
contrast: 1, sharpness: 1, highlights: 4, shadows: -4, midtones: 2, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Auto", wb_temperature: null, wb_amber_offset: 0, wb_green_offset: 0,
monochrome_profile: "Monochrome Profile 3", monochrome_color: "Red Filter", monochrome_color_strength: 3,
film_grain: "Off", film_hue: "Normal", monochrome_vignetting: 0,
mood_keywords: ["dramatic", "high-contrast", "stark"], scenario_keywords: ["landscape", "outdoor"]
},
{
name: "PNW", author: "Ian Will", source_url: null, recipe_type: "COLOR",
color_wheel: { yellow:0, orange:-1, orangeRed:1, red:1, magenta:-1, violet:-1, blue:0, blueCyan:1, cyan:2, greenCyan:3, green:3, yellowGreen:2 },
contrast: 0, sharpness: -2, highlights: -2, shadows: 2, midtones: 1, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Auto", wb_temperature: null, wb_amber_offset: 0, wb_green_offset: 0,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["cool", "hazy", "moody", "muted"], scenario_keywords: ["overcast", "forest", "landscape"]
},
{
name: "Warm and Bright", author: "Ian Will", source_url: null, recipe_type: "COLOR",
color_wheel: { yellow:2, orange:3, orangeRed:2, red:2, magenta:0, violet:-1, blue:-3, blueCyan:-2, cyan:-1, greenCyan:0, green:0, yellowGreen:2 },
contrast: 0, sharpness: 0, highlights: -1, shadows: -2, midtones: 2, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Auto (Keep Warm Color Off)", wb_temperature: null, wb_amber_offset: 4, wb_green_offset: -1,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["warm", "versatile", "natural"], scenario_keywords: ["everyday", "portrait"]
},
{
name: "Dreamy White", author: "Isaac Mitropoulos", source_url: "https://www.dpreview.com/forums/threads/micro-fun-thirds-om-3.4827548/", recipe_type: "COLOR",
color_wheel: { yellow:-5, orange:-3, orangeRed:-1, red:-1, magenta:-1, violet:-1, blue:-1, blueCyan:-2, cyan:-2, greenCyan:-2, green:-2, yellowGreen:-3 },
contrast: -2, sharpness: 0, highlights: 3, shadows: 1, midtones: 2, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Custom WB 1", wb_temperature: 5300, wb_amber_offset: 1, wb_green_offset: 0,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["dreamy", "soft", "ethereal"], scenario_keywords: ["overcast", "shade"]
},
{
name: "Kodachrome 25", author: "Isaac Mitropoulos", source_url: "https://www.dpreview.com/forums/threads/micro-fun-thirds-om-3.4827548/", recipe_type: "COLOR",
color_wheel: { yellow:-2, orange:1, orangeRed:1, red:-1, magenta:-1, violet:2, blue:-3, blueCyan:-2, cyan:-4, greenCyan:-4, green:-4, yellowGreen:-5 },
contrast: 2, sharpness: 0, highlights: -2, shadows: -5, midtones: 2, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Custom WB 1", wb_temperature: 5300, wb_amber_offset: -2, wb_green_offset: 2,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["nostalgic", "vintage", "high-contrast"], scenario_keywords: ["everyday", "travel"]
},
{
name: "Kodachrome 64", author: "Isaac Mitropoulos", source_url: "https://www.dpreview.com/forums/threads/micro-fun-thirds-om-3.4827548/", recipe_type: "COLOR",
color_wheel: { yellow:-3, orange:0, orangeRed:0, red:1, magenta:-2, violet:-1, blue:-2, blueCyan:-1, cyan:-3, greenCyan:-2, green:-4, yellowGreen:-4 },
contrast: 0, sharpness: 0, highlights: -2, shadows: -6, midtones: 2, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Custom WB 1", wb_temperature: 5300, wb_amber_offset: 1, wb_green_offset: 0,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["nostalgic", "vintage", "high-contrast"], scenario_keywords: ["everyday", "travel"]
},
{
name: "Portra 160", author: "Isaac Mitropoulos", source_url: "https://www.dpreview.com/forums/threads/micro-fun-thirds-om-3.4827548/", recipe_type: "COLOR",
color_wheel: { yellow:-2, orange:1, orangeRed:-1, red:-1, magenta:-2, violet:-3, blue:-1, blueCyan:-2, cyan:-2, greenCyan:-2, green:-3, yellowGreen:-2 },
contrast: -1, sharpness: 1, highlights: -1, shadows: 1, midtones: 0, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Custom WB 1", wb_temperature: 5300, wb_amber_offset: 0, wb_green_offset: 0,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["soft", "natural", "warm"], scenario_keywords: ["portrait", "everyday"]
},
{
name: "Portra 400", author: "Isaac Mitropoulos", source_url: "https://www.dpreview.com/forums/threads/micro-fun-thirds-om-3.4827548/", recipe_type: "COLOR",
color_wheel: { yellow:-2, orange:0, orangeRed:-1, red:-2, magenta:-3, violet:-5, blue:-2, blueCyan:-4, cyan:-4, greenCyan:-3, green:-4, yellowGreen:-3 },
contrast: -2, sharpness: 1, highlights: -1, shadows: 2, midtones: 0, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Custom WB 1", wb_temperature: 5300, wb_amber_offset: -3, wb_green_offset: 2,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["warm", "natural", "soft"], scenario_keywords: ["portrait", "travel"]
},
{
name: "Velvia 50", author: "Isaac Mitropoulos", source_url: "https://www.dpreview.com/forums/threads/micro-fun-thirds-om-3.4827548/", recipe_type: "COLOR",
color_wheel: { yellow:1, orange:2, orangeRed:2, red:-1, magenta:-3, violet:2, blue:3, blueCyan:1, cyan:-1, greenCyan:-1, green:1, yellowGreen:0 },
contrast: 1, sharpness: 0, highlights: 2, shadows: -1, midtones: 2, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Custom WB 1", wb_temperature: 5300, wb_amber_offset: 0, wb_green_offset: 1,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["vibrant", "punchy", "saturated"], scenario_keywords: ["landscape", "nature", "daylight"]
},
{
name: "Fuji Astia", author: "IsaacBD", source_url: "https://cameraderie.org/threads/i-made-a-software-to-find-settings-that-match-the-jpeg-output-between-cameras.56900/", recipe_type: "COLOR",
color_wheel: { yellow:0, orange:0, orangeRed:0, red:0, magenta:-1, violet:0, blue:2, blueCyan:2, cyan:2, greenCyan:-5, green:1, yellowGreen:0 },
contrast: 1, sharpness: 0, highlights: -2, shadows: -1, midtones: 0, shading_effect: 0,
exposure_compensation: 3,
white_balance: "Auto", wb_temperature: null, wb_amber_offset: 1, wb_green_offset: 1,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["soft", "natural"], scenario_keywords: ["portrait", "daylight"]
},
{
name: "Fuji Classic Chrome", author: "IsaacBD", source_url: "https://cameraderie.org/threads/i-made-a-software-to-find-settings-that-match-the-jpeg-output-between-cameras.56900/", recipe_type: "COLOR",
color_wheel: { yellow:-1, orange:-1, orangeRed:-1, red:-1, magenta:-1, violet:0, blue:-2, blueCyan:-1, cyan:-1, greenCyan:-2, green:-1, yellowGreen:-1 },
contrast: 0, sharpness: 0, highlights: 0, shadows: 0, midtones: 2, shading_effect: 0,
exposure_compensation: -3,
white_balance: "Auto", wb_temperature: null, wb_amber_offset: 2, wb_green_offset: 1,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["desaturated", "filmic", "muted"], scenario_keywords: ["documentary", "everyday", "street"]
},
{
name: "Fuji Classic Neg", author: "IsaacBD", source_url: "https://cameraderie.org/threads/i-made-a-software-to-find-settings-that-match-the-jpeg-output-between-cameras.56900/", recipe_type: "COLOR",
color_wheel: { yellow:-2, orange:0, orangeRed:3, red:1, magenta:-1, violet:-1, blue:-1, blueCyan:4, cyan:4, greenCyan:-5, green:-1, yellowGreen:-2 },
contrast: 0, sharpness: 0, highlights: 3, shadows: -2, midtones: 6, shading_effect: 0,
exposure_compensation: -7,
white_balance: "Auto", wb_temperature: null, wb_amber_offset: 4, wb_green_offset: 3,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["filmic", "vintage"], scenario_keywords: ["everyday", "street"]
},
{
name: "Fuji Eterna", author: "IsaacBD", source_url: "https://cameraderie.org/threads/i-made-a-software-to-find-settings-that-match-the-jpeg-output-between-cameras.56900/", recipe_type: "COLOR",
color_wheel: { yellow:-2, orange:-1, orangeRed:-1, red:-1, magenta:-1, violet:-1, blue:-2, blueCyan:-2, cyan:-2, greenCyan:-3, green:-2, yellowGreen:-2 },
contrast: 0, sharpness: 0, highlights: -1, shadows: 2, midtones: 1, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Auto", wb_temperature: null, wb_amber_offset: 1, wb_green_offset: 2,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["cinematic", "muted", "cool", "low-contrast"], scenario_keywords: ["everyday", "documentary"]
},
{
name: "Fuji Pro Neg Hi", author: "IsaacBD", source_url: "https://cameraderie.org/threads/i-made-a-software-to-find-settings-that-match-the-jpeg-output-between-cameras.56900/", recipe_type: "COLOR",
color_wheel: { yellow:0, orange:-1, orangeRed:-1, red:-1, magenta:-1, violet:0, blue:0, blueCyan:0, cyan:0, greenCyan:-2, green:0, yellowGreen:0 },
contrast: 0, sharpness: 0, highlights: -2, shadows: 0, midtones: 0, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Auto", wb_temperature: null, wb_amber_offset: 2, wb_green_offset: 1,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["soft", "natural"], scenario_keywords: ["portrait"]
},
{
name: "Fuji Pro Neg Std", author: "IsaacBD", source_url: "https://cameraderie.org/threads/i-made-a-software-to-find-settings-that-match-the-jpeg-output-between-cameras.56900/", recipe_type: "COLOR",
color_wheel: { yellow:-1, orange:-1, orangeRed:-1, red:-1, magenta:-1, violet:-1, blue:-1, blueCyan:-2, cyan:-1, greenCyan:-1, green:0, yellowGreen:-1 },
contrast: 1, sharpness: 0, highlights: -1, shadows: 2, midtones: 1, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Auto", wb_temperature: null, wb_amber_offset: 1, wb_green_offset: 1,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["soft", "muted", "natural"], scenario_keywords: ["portrait", "everyday"]
},
{
name: "Fuji Provia", author: "IsaacBD", source_url: "https://cameraderie.org/threads/i-made-a-software-to-find-settings-that-match-the-jpeg-output-between-cameras.56900/", recipe_type: "COLOR",
color_wheel: { yellow:0, orange:0, orangeRed:0, red:0, magenta:0, violet:0, blue:0, blueCyan:0, cyan:0, greenCyan:0, green:1, yellowGreen:0 },
contrast: 0, sharpness: 0, highlights: 0, shadows: 0, midtones: 0, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Auto", wb_temperature: null, wb_amber_offset: 1, wb_green_offset: 1,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["natural", "versatile"], scenario_keywords: ["everyday", "travel"]
},
{
name: "Fuji Velvia", author: "IsaacBD", source_url: "https://cameraderie.org/threads/i-made-a-software-to-find-settings-that-match-the-jpeg-output-between-cameras.56900/", recipe_type: "COLOR",
color_wheel: { yellow:3, orange:2, orangeRed:1, red:1, magenta:1, violet:5, blue:4, blueCyan:5, cyan:2, greenCyan:0, green:3, yellowGreen:3 },
contrast: 1, sharpness: 0, highlights: -3, shadows: -1, midtones: -2, shading_effect: 0,
exposure_compensation: 3,
white_balance: "Auto", wb_temperature: null, wb_amber_offset: 1, wb_green_offset: 1,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["vibrant", "punchy", "saturated"], scenario_keywords: ["landscape", "nature"]
},
{
name: "Fuji Classic Chrome", author: "Jack Wang", source_url: "https://jackwang.com.au/blog/recipe-quit-adobe", recipe_type: "COLOR",
color_wheel: { yellow:-1, orange:-1, orangeRed:-1, red:-1, magenta:-1, violet:0, blue:-2, blueCyan:-1, cyan:-1, greenCyan:-2, green:-1, yellowGreen:-1 },
contrast: 0, sharpness: 0, highlights: 4, shadows: -4, midtones: 0, shading_effect: 0,
exposure_compensation: 5,
white_balance: "Auto (Keep Warm Color Off)", wb_temperature: null, wb_amber_offset: 2, wb_green_offset: 1,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["filmic", "punchy", "muted"], scenario_keywords: ["street", "everyday"]
},
{
name: "Fujicolor SUPERIA Premium 400", author: "James Bloomer", source_url: "https://studioarchitecturecom.wordpress.com/2026/02/18/om-3-fujifilm-superia-premium-400-film-emulation-profile/", recipe_type: "COLOR",
color_wheel: { yellow:1, orange:1, orangeRed:2, red:1, magenta:0, violet:1, blue:0, blueCyan:2, cyan:3, greenCyan:0, green:2, yellowGreen:1 },
contrast: -1, sharpness: -2, highlights: 1, shadows: 0, midtones: 1, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Auto (Keep Warm Color Off)", wb_temperature: null, wb_amber_offset: 3, wb_green_offset: 1,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["warm", "nostalgic", "soft"], scenario_keywords: ["everyday", "travel"]
},
{
name: "Kodachrome 64 (early version)", author: "James Bloomer", source_url: "https://studioarchitecturecom.wordpress.com/2026/02/15/om-3-kodachrome-64-film-emulation-profile/", recipe_type: "COLOR",
color_wheel: { yellow:1, orange:2, orangeRed:3, red:4, magenta:5, violet:3, blue:1, blueCyan:2, cyan:3, greenCyan:1, green:2, yellowGreen:2 },
contrast: 1, sharpness: 1, highlights: 2, shadows: -3, midtones: -2, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Auto (Keep Warm Color Off)", wb_temperature: null, wb_amber_offset: 3, wb_green_offset: -1,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["nostalgic", "vintage", "punchy"], scenario_keywords: ["everyday", "travel"]
},
{
name: "Kodachrome 64", author: "James Bloomer", source_url: "https://studioarchitecturecom.wordpress.com/2026/02/15/om-3-kodachrome-64-film-emulation-profile/#jp-carousel-4351", recipe_type: "COLOR",
color_wheel: { yellow:1, orange:3, orangeRed:3, red:4, magenta:2, violet:1, blue:4, blueCyan:2, cyan:1, greenCyan:1, green:2, yellowGreen:2 },
contrast: 1, sharpness: 1, highlights: 2, shadows: -3, midtones: -3, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Auto (Keep Warm Color Off)", wb_temperature: null, wb_amber_offset: 3, wb_green_offset: 1,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["nostalgic", "vintage", "punchy"], scenario_keywords: ["everyday", "travel"]
},
{
name: "Kodak Gold 200", author: "James Bloomer", source_url: "https://studioarchitecturecom.wordpress.com/2026/02/16/om-3-kodak-gold-film-emulation-profile/", recipe_type: "COLOR",
color_wheel: { yellow:4, orange:3, orangeRed:1, red:0, magenta:-1, violet:-2, blue:-2, blueCyan:-2, cyan:-1, greenCyan:-1, green:0, yellowGreen:2 },
contrast: -1, sharpness: -2, highlights: -2, shadows: 1, midtones: 1, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Auto (Keep Warm Color Off)", wb_temperature: null, wb_amber_offset: 4, wb_green_offset: 1,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["warm", "nostalgic"], scenario_keywords: ["everyday", "travel"]
},
{
name: "OM-3 Fujicolor 200", author: "James Bloomer", source_url: "https://studioarchitecturecom.wordpress.com/2026/04/27/om-3-fujicolor-200-film-emulation-profile/", recipe_type: "COLOR",
color_wheel: { yellow:3, orange:3, orangeRed:3, red:1, magenta:-1, violet:-1, blue:1, blueCyan:1, cyan:0, greenCyan:0, green:2, yellowGreen:2 },
contrast: -1, sharpness: -1, highlights: 0, shadows: -3, midtones: 1, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Auto (Keep Warm Color Off)", wb_temperature: null, wb_amber_offset: 2, wb_green_offset: 1,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["natural", "cool", "clean"], scenario_keywords: ["everyday", "daylight"]
},
{
name: "OM-3 X-Monochrome Film Emulation Profile", author: "James Bloomer", source_url: "https://studioarchitecturecom.wordpress.com/2026/04/25/om-3-x-monochrome-film-emulation-profile/", recipe_type: "MONO",
color_wheel: { yellow:null, orange:null, orangeRed:null, red:null, magenta:null, violet:null, blue:null, blueCyan:null, cyan:null, greenCyan:null, green:null, yellowGreen:null },
contrast: 0, sharpness: 0, highlights: 3, shadows: -5, midtones: -1, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Auto (Keep Warm Color Off)", wb_temperature: null, wb_amber_offset: -2, wb_green_offset: 0,
monochrome_profile: "Monochrome Profile 2", monochrome_color: "Orange Filter", monochrome_color_strength: 2,
film_grain: "Off", film_hue: "Normal", monochrome_vignetting: 0,
mood_keywords: ["moody", "dramatic", "high-contrast"], scenario_keywords: ["landscape", "outdoor"]
},
{
name: "Portra 400", author: "James Bloomer", source_url: "https://studioarchitecturecom.wordpress.com/2026/02/17/om-3-portra-400-film-emulation-profile/", recipe_type: "COLOR",
color_wheel: { yellow:1, orange:2, orangeRed:3, red:1, magenta:0, violet:-1, blue:-2, blueCyan:-3, cyan:-1, greenCyan:-1, green:-2, yellowGreen:-1 },
contrast: -1, sharpness: -2, highlights: -4, shadows: 2, midtones: 1, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Auto (Keep Warm Color Off)", wb_temperature: null, wb_amber_offset: 2, wb_green_offset: 1,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["warm", "natural", "soft"], scenario_keywords: ["portrait", "travel"]
},
{
name: "Kodachrome Slim Aarons", author: "James Bloomer", source_url: "https://studioarchitecturecom.wordpress.com/2026/02/17/om-3-kodachrome-slim-aarons-film-emulation-profile/", recipe_type: "COLOR",
color_wheel: { yellow:1, orange:2, orangeRed:-1, red:-1, magenta:-1, violet:-1, blue:4, blueCyan:1, cyan:1, greenCyan:2, green:1, yellowGreen:1 },
contrast: -1, sharpness: 1, highlights: -1, shadows: 0, midtones: 0, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Auto", wb_temperature: null, wb_amber_offset: 2, wb_green_offset: -1,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["nostalgic", "muted", "vintage"], scenario_keywords: ["travel", "daylight"]
},
{
name: "Eternal Sunshine", author: "Jerred Z", source_url: "https://www.megapixelroad.com/p/eternal-sun-om-3-jpeg-recipe", recipe_type: "COLOR",
color_wheel: { yellow:-1, orange:4, orangeRed:2, red:5, magenta:4, violet:2, blue:5, blueCyan:3, cyan:2, greenCyan:1, green:4, yellowGreen:4 },
contrast: -1, sharpness: -1, highlights: -1, shadows: 2, midtones: 6, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Custom WB 1", wb_temperature: 5300, wb_amber_offset: 7, wb_green_offset: -5,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["dreamy", "soft", "vibrant"], scenario_keywords: ["urban", "everyday"]
},
{
name: "OM Chrome", author: "Jonathan Paragas", source_url: "https://explore.omsystem.com/us/en/creative-recipes", recipe_type: "COLOR",
color_wheel: { yellow:2, orange:2, orangeRed:3, red:2, magenta:0, violet:0, blue:0, blueCyan:0, cyan:0, greenCyan:0, green:0, yellowGreen:0 },
contrast: 1, sharpness: -2, highlights: -2, shadows: -3, midtones: 0, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Auto", wb_temperature: null, wb_amber_offset: null, wb_green_offset: null,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["vibrant", "punchy"], scenario_keywords: ["urban", "street", "city"]
},
{
name: "Vintage Teal", author: "Karol Mizunia", source_url: "https://www.facebook.com/groups/868676745364735/posts/1147768507455556/", recipe_type: "COLOR",
color_wheel: { yellow:3, orange:3, orangeRed:3, red:2, magenta:2, violet:0, blue:0, blueCyan:4, cyan:4, greenCyan:3, green:0, yellowGreen:3 },
contrast: 1, sharpness: -1, highlights: -1, shadows: -2, midtones: 0, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Custom WB 1", wb_temperature: 5400, wb_amber_offset: 2, wb_green_offset: -1,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["vintage", "cool", "moody"], scenario_keywords: ["everyday", "urban"]
},
{
name: "Red Soda Pop", author: "Kitty Marie", source_url: "https://explore.omsystem.com/us/en/creative-recipes", recipe_type: "COLOR",
color_wheel: { yellow:-2, orange:1, orangeRed:2, red:1, magenta:-3, violet:-3, blue:-3, blueCyan:-3, cyan:-2, greenCyan:-3, green:-2, yellowGreen:-3 },
contrast: -2, sharpness: -1, highlights: 1, shadows: -1, midtones: -2, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Custom WB 1", wb_temperature: 5200, wb_amber_offset: 1, wb_green_offset: -1,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["warm", "dreamy", "punchy"], scenario_keywords: ["everyday", "portrait"]
},
{
name: "Nostalgic Summer", author: "Kyler Steele", source_url: "https://explore.omsystem.com/us/en/creative-recipes", recipe_type: "COLOR",
color_wheel: { yellow:3, orange:2, orangeRed:1, red:-1, magenta:-1, violet:-1, blue:-1, blueCyan:-1, cyan:-1, greenCyan:1, green:2, yellowGreen:3 },
contrast: 2, sharpness: -1, highlights: -6, shadows: 3, midtones: -3, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Auto", wb_temperature: null, wb_amber_offset: 4, wb_green_offset: 2,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["nostalgic", "vibrant", "filmic"], scenario_keywords: ["sunny", "outdoor", "landscape"]
},
{
name: "Dirty Pop", author: "Luis Chavez", source_url: "https://explore.omsystem.com/us/en/creative-recipes", recipe_type: "COLOR",
color_wheel: { yellow:2, orange:2, orangeRed:2, red:0, magenta:1, violet:1, blue:1, blueCyan:0, cyan:1, greenCyan:1, green:0, yellowGreen:1 },
contrast: -1, sharpness: -1, highlights: 3, shadows: -3, midtones: -1, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Custom WB 1", wb_temperature: 4200, wb_amber_offset: 0, wb_green_offset: 0,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["punchy", "natural"], scenario_keywords: ["portrait", "everyday"]
},
{
name: "Rainforest Vibes", author: "Mindy Michaels", source_url: "https://explore.omsystem.com/us/en/creative-recipes", recipe_type: "COLOR",
color_wheel: { yellow:5, orange:4, orangeRed:5, red:5, magenta:0, violet:0, blue:0, blueCyan:0, cyan:0, greenCyan:0, green:5, yellowGreen:5 },
contrast: 0, sharpness: 0, highlights: 0, shadows: 0, midtones: 0, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Auto", wb_temperature: null, wb_amber_offset: null, wb_green_offset: null,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["vibrant", "saturated"], scenario_keywords: ["nature", "forest", "travel"]
},
{
name: "Real", author: "Murder Pink", source_url: "https://www.youtube.com/watch?v=QY_x_aSh4F4", recipe_type: "COLOR",
color_wheel: { yellow:1, orange:1, orangeRed:0, red:0, magenta:0, violet:2, blue:2, blueCyan:2, cyan:2, greenCyan:2, green:1, yellowGreen:1 },
contrast: 1, sharpness: 1, highlights: -2, shadows: 2, midtones: 0, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Auto", wb_temperature: null, wb_amber_offset: null, wb_green_offset: null,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["natural", "versatile"], scenario_keywords: ["everyday"]
},
{
name: "Subdued", author: "Murder Pink", source_url: "https://www.youtube.com/watch?v=pG-4qUe0YwA", recipe_type: "COLOR",
color_wheel: { yellow:-2, orange:-2, orangeRed:-1, red:-2, magenta:-5, violet:-5, blue:-2, blueCyan:-4, cyan:-4, greenCyan:-4, green:-3, yellowGreen:-2 },
contrast: -1, sharpness: 1, highlights: -1, shadows: 0, midtones: 1, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Auto", wb_temperature: null, wb_amber_offset: null, wb_green_offset: null,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["muted", "soft"], scenario_keywords: ["everyday", "indoor"]
},
{
name: "Default - 1", author: "OM System", source_url: null, recipe_type: "COLOR",
color_wheel: { yellow:0, orange:0, orangeRed:0, red:0, magenta:0, violet:0, blue:0, blueCyan:0, cyan:0, greenCyan:0, green:0, yellowGreen:0 },
contrast: 0, sharpness: 0, highlights: 0, shadows: 0, midtones: 0, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Auto", wb_temperature: null, wb_amber_offset: null, wb_green_offset: null,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["natural", "clean"], scenario_keywords: ["everyday"]
},
{
name: "Default - 2", author: "OM System", source_url: null, recipe_type: "COLOR",
color_wheel: { yellow:1, orange:1, orangeRed:0, red:0, magenta:0, violet:0, blue:1, blueCyan:1, cyan:0, greenCyan:0, green:1, yellowGreen:1 },
contrast: 0, sharpness: 0, highlights: 3, shadows: -3, midtones: 0, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Auto", wb_temperature: null, wb_amber_offset: null, wb_green_offset: null,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["warm", "punchy"], scenario_keywords: ["everyday"]
},
{
name: "Default - 3", author: "OM System", source_url: null, recipe_type: "COLOR",
color_wheel: { yellow:4, orange:4, orangeRed:4, red:4, magenta:4, violet:3, blue:4, blueCyan:4, cyan:4, greenCyan:4, green:4, yellowGreen:4 },
contrast: 0, sharpness: 0, highlights: 4, shadows: -4, midtones: 0, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Auto", wb_temperature: null, wb_amber_offset: null, wb_green_offset: null,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["vibrant", "punchy", "saturated"], scenario_keywords: ["everyday", "outdoor"]
},
{
name: "Default - 4", author: "OM System", source_url: null, recipe_type: "COLOR",
color_wheel: { yellow:-4, orange:0, orangeRed:0, red:0, magenta:-1, violet:-1, blue:-1, blueCyan:0, cyan:0, greenCyan:0, green:0, yellowGreen:-4 },
contrast: 0, sharpness: 0, highlights: -3, shadows: 3, midtones: 0, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Auto", wb_temperature: null, wb_amber_offset: null, wb_green_offset: null,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["soft", "muted"], scenario_keywords: ["everyday", "overcast"]
},
{
name: "Paul Clark recipe", author: "Paul Clark", source_url: "https://explore.omsystem.com/us/en/creative-recipes", recipe_type: "COLOR",
color_wheel: { yellow:1, orange:2, orangeRed:2, red:2, magenta:0, violet:0, blue:3, blueCyan:2, cyan:4, greenCyan:1, green:0, yellowGreen:0 },
contrast: -2, sharpness: -1, highlights: -3, shadows: 3, midtones: 0, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Custom WB 1", wb_temperature: 5300, wb_amber_offset: null, wb_green_offset: null,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["natural", "soft"], scenario_keywords: ["everyday"]
},
{
name: "Night Market", author: "Peter Turner", source_url: null, recipe_type: "COLOR",
color_wheel: { yellow:0, orange:1, orangeRed:3, red:3, magenta:1, violet:0, blue:-2, blueCyan:-2, cyan:-1, greenCyan:-2, green:-2, yellowGreen:-1 },
contrast: 0, sharpness: -2, highlights: -2, shadows: -3, midtones: 0, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Auto (Keep Warm Color Off)", wb_temperature: null, wb_amber_offset: 2, wb_green_offset: 1,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["moody", "muted"], scenario_keywords: ["night", "low-light", "urban", "street"]
},
{
name: "Portra 400", author: "Peter Turner", source_url: null, recipe_type: "COLOR",
color_wheel: { yellow:1, orange:2, orangeRed:2, red:2, magenta:0, violet:0, blue:-2, blueCyan:-1, cyan:0, greenCyan:0, green:0, yellowGreen:2 },
contrast: 0, sharpness: 0, highlights: -1, shadows: -2, midtones: 2, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Auto", wb_temperature: null, wb_amber_offset: 3, wb_green_offset: 1,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["warm", "natural"], scenario_keywords: ["portrait", "everyday"]
},
{
name: "Sydney Grain", author: "Peter Turner", source_url: null, recipe_type: "MONO",
color_wheel: { yellow:null, orange:null, orangeRed:null, red:null, magenta:null, violet:null, blue:null, blueCyan:null, cyan:null, greenCyan:null, green:null, yellowGreen:null },
contrast: 2, sharpness: 2, highlights: 3, shadows: -4, midtones: 0, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Auto", wb_temperature: null, wb_amber_offset: 0, wb_green_offset: 0,
monochrome_profile: "Monochrome Profile 2", monochrome_color: "Red Filter", monochrome_color_strength: 0,
film_grain: "High", film_hue: "Normal", monochrome_vignetting: 0,
mood_keywords: ["gritty", "dramatic", "high-contrast"], scenario_keywords: ["street", "urban"]
},
{
name: "CityEurope", author: "Robson Cabanas", source_url: null, recipe_type: "COLOR",
color_wheel: { yellow:2, orange:1, orangeRed:0, red:0, magenta:-1, violet:1, blue:2, blueCyan:2, cyan:4, greenCyan:3, green:1, yellowGreen:2 },
contrast: 1, sharpness: 1, highlights: -5, shadows: 2, midtones: -1, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Auto (Keep Warm Color Off)", wb_temperature: null, wb_amber_offset: -1, wb_green_offset: 1,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["vintage", "cool", "moody"], scenario_keywords: ["urban", "city", "landscape"]
},
{
name: "Q116", author: "RobsonCabanas", source_url: null, recipe_type: "COLOR",
color_wheel: { yellow:2, orange:1, orangeRed:2, red:0, magenta:0, violet:1, blue:1, blueCyan:1, cyan:1, greenCyan:1, green:1, yellowGreen:1 },
contrast: 2, sharpness: 1, highlights: -5, shadows: 3, midtones: 0, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Auto (Keep Warm Color Off)", wb_temperature: null, wb_amber_offset: 0, wb_green_offset: 0,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["punchy", "saturated"], scenario_keywords: ["everyday", "outdoor"]
},
{
name: "carte postal", author: "Stella toul", source_url: null, recipe_type: "COLOR",
color_wheel: { yellow:5, orange:4, orangeRed:3, red:1, magenta:1, violet:1, blue:1, blueCyan:1, cyan:1, greenCyan:3, green:4, yellowGreen:5 },
contrast: -2, sharpness: -2, highlights: 3, shadows: -6, midtones: -3, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Custom WB 1", wb_temperature: 5800, wb_amber_offset: 2, wb_green_offset: 1,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["vibrant", "punchy", "saturated"], scenario_keywords: ["beach", "travel", "sunny"]
},
{
name: "Terry McLaughlin recipe", author: "Terry McLaughlin", source_url: "https://explore.omsystem.com/us/en/creative-recipes", recipe_type: "COLOR",
color_wheel: { yellow:-4, orange:0, orangeRed:4, red:5, magenta:0, violet:0, blue:-5, blueCyan:-2, cyan:0, greenCyan:0, green:1, yellowGreen:0 },
contrast: 1, sharpness: -1, highlights: -3, shadows: 3, midtones: 0, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Custom WB 1", wb_temperature: 7500, wb_amber_offset: null, wb_green_offset: null,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["nostalgic", "cinematic", "warm"], scenario_keywords: ["golden-hour", "travel"]
},
{
name: "City Look", author: "Giuseppe Ardica", source_url: "https://myolympusomd.blogspot.com/p/olympus-pen-f-color-profiles.html", recipe_type: "COLOR",
color_wheel: { yellow:3, orange:1, orangeRed:-4, red:0, magenta:-1, violet:-1, blue:-1, blueCyan:-1, cyan:-5, greenCyan:-1, green:1, yellowGreen:-1 },
contrast: 0, sharpness: 0, highlights: 0, shadows: 0, midtones: 0, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Auto", wb_temperature: null, wb_amber_offset: null, wb_green_offset: null,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["warm", "moody", "gritty"], scenario_keywords: ["night", "urban", "street"]
},
{
name: "Velvia 50", author: "VideoPic", source_url: "https://www.dpreview.com/forums/threads/pen-f-owners-i-developed-a-fuji-velvia-50-profile-you-can-try.4375658/", recipe_type: "COLOR",
color_wheel: { yellow:1, orange:2, orangeRed:2, red:-1, magenta:-3, violet:2, blue:3, blueCyan:1, cyan:-1, greenCyan:-1, green:1, yellowGreen:0 },
contrast: 0, sharpness: 0, highlights: 2, shadows: -1, midtones: 0, shading_effect: 0,
exposure_compensation: 0,
white_balance: "Auto", wb_temperature: null, wb_amber_offset: 0, wb_green_offset: 0,
monochrome_profile: null, monochrome_color: null, monochrome_color_strength: null,
film_grain: null, film_hue: null, monochrome_vignetting: null,
mood_keywords: ["vibrant", "punchy", "saturated"], scenario_keywords: ["landscape", "nature"]
}
];
