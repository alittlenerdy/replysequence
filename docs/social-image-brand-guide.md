# Social Image Brand Guide — ReplySequence

## Weekly Color Rotation

| Day | Theme Name | Primary Color | Accent Color |
|-----|-----------|---------------|--------------|
| Monday | Electric Blue | `#2563EB` | `#60A5FA` |
| Tuesday | Indigo Purple | `#5B6CFF` | `#818CF8` |
| Wednesday | Emerald Green | `#059669` | `#34D399` |
| Thursday | Warm Amber | `#D97706` | `#FBBF24` |
| Friday | Teal Cyan | `#0891B2` | `#22D3EE` |

## Gemini Image Generation Prompt Template

Used with model: `gemini-2.5-flash-image`

### Base prompt (appended to every image-specific prompt):

```
Color palette: primary {DAY_COLOR} ({DAY_NAME}), accent {DAY_ACCENT}, dark background.
Style: abstract, geometric, minimalist, modern SaaS aesthetic.
16:9 aspect ratio. High contrast.
NO text, NO words, NO letters anywhere in the image.
```

### Image-specific prompt structure:

```
{SCENE_DESCRIPTION}. {STYLE_KEYWORDS}.
{DAY_COLOR_NAME} gradient background, {MOOD_KEYWORDS}, NO TEXT.
```

### Style keywords to always include:
- `minimalist`
- `geometric`
- `abstract`
- `modern SaaS aesthetic`
- `NO TEXT` (critical — Gemini will add text otherwise)
- `dark background`
- `high contrast`

## Example Prompts by Category

### Pain Point / Problem (Monday style)
```
Abstract illustration of chaotic email inbox overflowing, scattered meeting notes, clock showing late hour.
Minimalist style, electric blue gradient background, geometric shapes, NO TEXT.
```

### Feature Spotlight (Tuesday style)
```
Abstract illustration of meeting recording transforming into polished email draft in 8 seconds.
Indigo purple gradient, flowing transformation lines, speed particles, NO TEXT.
```

### Tips / Wisdom (Wednesday style)
```
Abstract illustration of personalized follow-up hitting target, bullseye, precision communication.
Emerald green gradient, sharp geometric lines, NO TEXT.
```

### Founder Story (Thursday style)
```
Abstract origin story illustration, spark of idea, problem discovery moment.
Warm amber gradient, creative energy, geometric shapes, NO TEXT.
```

### Vision / Future (Friday style)
```
Abstract futuristic illustration of AI-powered sales assistant, holographic interface, next-gen communication.
Teal cyan gradient, futuristic geometric shapes, NO TEXT.
```

### LinkedIn (4:5 aspect ratio override)
Add `4:5 aspect ratio.` to the prompt for LinkedIn-specific images.

### Personal Account (warmer tone)
Add `warm undertones` or `warm {color} gradient` to make personal account images feel slightly different from the product account.

## Technical Details

- **Model**: `gemini-2.5-flash-image` via `@google/genai` SDK
- **Config**: `{ responseModalities: ['image', 'text'] }`
- **Output**: Base64 PNG from `response.candidates[0].content.parts[].inlineData.data`
- **Rate limiting**: 2-second delay between requests to avoid throttling
- **Env var**: `GOOGLE_GENAI_API_KEY`

## Script Location

Generator script: `/private/tmp/claude-501/generate-social-images.mjs`
(Move to `scripts/generate-social-images.mjs` to persist)
