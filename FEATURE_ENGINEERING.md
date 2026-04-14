# Feature Engineering in Luminary — Interview Deep Dive

> This document explains how feature engineering is implemented in Luminary's Auto-Enhance pipeline, written as a technical reference for AI/ML interviews.

---

## 1. What Problem Does It Solve?

The Auto-Enhance feature needs to **automatically detect what's wrong with a photo and fix it**. The challenge is that our AI model (Llama 3.3 70B) is a language model — it can't see pixels. So we need to:

1. **Extract meaningful features** from raw pixel data (feature engineering)
2. **Encode those features** into a structured representation the LLM can reason about
3. **Generate corrective actions** based on the analysis

This is a classic **feature engineering → model inference → action** pipeline.

---

## 2. The Pipeline Architecture

```
Raw Pixels (RGBA array, ~4M values for a 1200×800 image)
     │
     ▼
┌─────────────────────────────────────────────┐
│  FEATURE EXTRACTION  (client-side, JS)      │
│                                             │
│  Input:  canvas.getImageData() → Uint8[]    │
│  Output: 20+ structured numeric features    │
└─────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│  FEATURE ENCODING  (server-side, Node.js)   │
│                                             │
│  Converts structured JSON into a natural    │
│  language report the LLM can understand     │
└─────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│  MODEL INFERENCE  (Groq API, Llama 3.3)     │
│                                             │
│  System prompt contains domain knowledge    │
│  about photography correction principles    │
│  Model outputs corrective adjustment JSON   │
└─────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│  POST-PROCESSING  (server-side)             │
│                                             │
│  Sanitization, range clamping, validation   │
└─────────────────────────────────────────────┘
```

---

## 3. Feature Extraction — The Core Engineering

### 3.1 Raw Data

We start with `ImageData` from the HTML Canvas API:
```js
const imageData = ctx.getImageData(0, 0, width, height);
const data = imageData.data; // Uint8ClampedArray [R,G,B,A, R,G,B,A, ...]
```

For a 1200×800 image, this is **3,840,000 values** (960K pixels × 4 channels). We need to compress this into ~20 meaningful numbers.

### 3.2 Extracted Features (20+ metrics)

Here's every feature we extract, **why** we chose it, and **how** it's computed:

---

#### Group 1: Luminance Features (Exposure Assessment)

| Feature | Type | How It's Computed | Why It Matters |
|---|---|---|---|
| `meanLuminance` | float | Weighted average: `0.2126R + 0.7152G + 0.0722B` (ITU-R BT.709) | Single most important indicator of exposure. < 80 = underexposed, > 190 = overexposed |
| `stdDevLuminance` | float | √(Σ(L - mean)² / N) | Proxy for contrast. Low stddev = flat/low contrast, high = punchy/contrasty |
| `minLuminance` | int 0-255 | Global minimum across all pixels | Detects if blacks are crushed or lifted |
| `maxLuminance` | int 0-255 | Global maximum across all pixels | Detects if whites are blown out or muted |
| `p5` | int 0-255 | 5th percentile of luminance histogram | More robust than min — represents shadow floor |
| `p95` | int 0-255 | 95th percentile of luminance histogram | More robust than max — represents highlight ceiling |
| `dynamicRange` | int 0-255 | `p95 - p5` | How much of the 0-255 range the image uses. < 120 = low DR, needs contrast |
| `skewness` | float | Third moment: Σ((L - mean)³) / (N × σ³) | Histogram shape. Negative = left-skewed (dark image), positive = right-skewed (bright) |

**Interview talking point:** *"We use percentiles (5th/95th) instead of raw min/max because individual outlier pixels (dead pixels, specular highlights) would give misleading readings. This is the same principle as using median instead of mean in robust statistics."*

**Code:**
```js
// Luminance per pixel (BT.709 perceptual weights)
const lum = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
histL[lum]++;
totalL += lum;
```

**Why BT.709 weights?** Human eyes are most sensitive to green (~71%), less to red (~21%), least to blue (~7%). Using equal weights (R+G+B)/3 would overvalue blue and undervalue green, giving inaccurate brightness readings.

---

#### Group 2: Color Features (White Balance & Saturation)

| Feature | Type | How It's Computed | Why It Matters |
|---|---|---|---|
| `meanR`, `meanG`, `meanB` | float | Average of each channel independently | Raw channel means for cast detection |
| `colorCast.red` | float % | `(meanR - avgChannel) / avgChannel × 100` | How much the red channel deviates from neutral. > +8% = warm/red cast |
| `colorCast.green` | float % | Same formula for green | > +5% = green cast (fluorescent lighting) |
| `colorCast.blue` | float % | Same formula for blue | > +8% = cool/blue cast (shade, cloudy) |
| `meanSaturation` | float 0-1 | HSL saturation: `(cMax - cMin) / (L > 0.5 ? (2 - cMax - cMin) : (cMax + cMin))` | Overall color vibrancy. < 0.15 = washed out, > 0.60 = oversaturated |

**Interview talking point:** *"Color cast detection uses relative deviation from the neutral axis rather than absolute channel values. This is important because a naturally warm sunset shouldn't be flagged the same way as a white-balance error. By measuring percentage deviation, we get a more nuanced signal."*

**Code:**
```js
const avgChannel = (meanR + meanG + meanB) / 3;
const colorCast = {
  red:   ((meanR - avgChannel) / avgChannel * 100).toFixed(1),
  green: ((meanG - avgChannel) / avgChannel * 100).toFixed(1),
  blue:  ((meanB - avgChannel) / avgChannel * 100).toFixed(1),
};
```

---

#### Group 3: Clipping Features (Detail Recovery)

| Feature | Type | How It's Computed | Why It Matters |
|---|---|---|---|
| `shadowPercent` | float % | Count of pixels with luminance < 10, as % of total | High % = crushed shadows, detail is lost in blacks |
| `highlightPercent` | float % | Count of pixels with luminance > 245, as % of total | High % = blown highlights, detail is lost in whites |

**Interview talking point:** *"We chose thresholds of 10 and 245 rather than 0 and 255 because truly clipped pixels (0 or 255) are a small subset. Pixels in the 1-10 and 246-254 range are 'near-clipped' — they look pure black/white to the human eye and represent recoverable detail that lifting shadows or pulling highlights can restore."*

---

#### Group 4: Composite Scores (Decision Support)

These are **engineered composite features** — they combine multiple raw features into actionable scores:

| Score | Formula | Rationale |
|---|---|---|
| `exposureScore` (0-100) | Penalizes deviation from ideal mean (128) + clipping at extremes | Single number: "Is this image properly exposed?" |
| `contrastScore` (0-100) | 50% dynamic range score + 50% std deviation score | Balances range usage with tonal distribution |
| `colorScore` (0-100) | 50% cast penalty + 50% saturation deviation from ideal range | Balances white balance accuracy with vibrancy |
| `overallScore` (0-100) | `0.4 × exposure + 0.35 × contrast + 0.25 × color` | Weighted average — exposure matters most for perceived quality |

**Why these weights (40/35/25)?**

```
Exposure (40%):  A badly exposed image looks broken regardless of color.
                 This is the most critical factor.

Contrast (35%):  Low contrast makes images look "flat" and amateur.
                 Second most impactful visual quality.

Color (25%):     Color casts are noticeable but less jarring than
                 exposure/contrast issues. Users tolerate warm tones
                 more than they tolerate darkness.
```

**Interview talking point:** *"The weight distribution (40/35/25) was determined empirically by testing against common photographic failure modes. Exposure errors are the most destructive to perceived quality, which is why it gets the highest weight. This is similar to how loss functions in ML are weighted differently for different error types."*

---

## 4. Feature Encoding for the LLM

Raw numbers aren't enough — the LLM needs **context**. We encode features into a structured natural language report:

```
Image Analysis Report:
Luminance: mean=72.3, stdDev=31.5, min=2, max=218
Percentiles: p5=8, p95=165, dynamicRange=157
Histogram skewness: -0.42
Color: R=85.2, G=68.1, B=63.7
Color cast: red=12.5%, green=-2.1%, blue=-10.4%
Mean saturation: 0.18
Clipping: shadows=11.2%, highlights=0.8%
Quality scores: exposure=45, contrast=62, color=55, overall=52
Issues detected: underexposed, crushed_shadows, color_cast, histogram_left_skewed
```

**Key design decisions:**

1. **We include both raw features AND derived scores.** The raw features let the LLM reason about specific corrections (e.g., "temperature -15 to counter red cast of +12.5%"). The scores give a quick quality assessment.

2. **The `issues` array is a categorical encoding.** Instead of making the LLM interpret `meanLuminance=72` as "underexposed," we pre-classify it. This reduces reasoning error — the LLM just needs to fix known issues, not diagnose them.

3. **We don't send the full histogram** (256 bins × 3 channels = 768 numbers). That would be noise. The 5th/95th percentiles and skewness capture the shape efficiently — this is **dimensionality reduction**.

---

## 5. Prompt Engineering as Domain Knowledge Injection

The system prompt for Auto-Enhance contains **correction logic** — essentially encoding photography expert knowledge into rules:

```
EXPOSURE:
  - Mean luminance < 80 → increase exposure (underexposed)
  - Formula hint: exposure ≈ (128 - meanLuminance) / 128 × 1.2

HIGHLIGHTS / SHADOWS:
  - highlightClipped > 5% → negative highlights to recover
  - shadowClipped > 8% → positive shadows to lift detail
  - Histogram left-skewed → lift shadows and increase exposure

COLOR CAST:
  - Red cast > 8% → decrease temperature
  - Blue cast > 8% → increase temperature
```

**Interview talking point:** *"This is essentially a rule-based expert system encoded as prompt context. The LLM acts as a fuzzy executor — it follows the rules but can interpolate between them and handle cases the rules don't explicitly cover. This is more flexible than a pure rule engine but more controllable than giving the LLM raw pixels."*

---

## 6. Why Not Just Send the Image to a Vision Model?

This is a common interview question. The answer involves trade-offs:

| Approach | Pros | Cons |
|---|---|---|
| **Our approach (feature engineering + LLM)** | Fast (~200ms analysis), predictable, debuggable, interpretable, no image upload needed | Can't understand semantic content ("this is a sunset") |
| **Vision model (e.g., GPT-4 Vision)** | Understands scene context | Slow (~3-5s), expensive ($0.01-0.05/call), black box, large payload upload |
| **Trained regression model** | Fastest inference, no API cost | Requires training data, hard to update, can't explain decisions |

**Our hybrid approach is optimal for this use case because:**
1. Photo correction is primarily about **tonal and color statistics** — you don't need to "see" the image to know it's underexposed
2. The feature extraction is **deterministic and interpretable** — we can debug exactly why a score is low
3. The LLM provides **natural language explanations** — users understand "Your image is underexposed with a warm cast" better than a raw score
4. **No image data leaves the client** — only 20 numbers are sent to the server (privacy benefit)

---

## 7. End-to-End Example

**Input image:** A dark indoor photo with warm tungsten lighting

**Step 1 — Feature Extraction** (client, ~15ms):
```json
{
  "luminance": { "mean": 72.3, "stdDev": 31.5, "p5": 8, "p95": 165, "dynamicRange": 157, "skewness": -0.42 },
  "color": { "cast": { "red": 12.5, "green": -2.1, "blue": -10.4 }, "meanSaturation": 0.18 },
  "clipping": { "shadowPercent": 11.2, "highlightPercent": 0.8 },
  "scores": { "exposure": 45, "contrast": 62, "color": 55, "overall": 52 },
  "issues": ["underexposed", "crushed_shadows", "color_cast"]
}
```

**Step 2 — LLM Inference** (server, ~800ms):
```json
{
  "adjustments": {
    "exposure": 0.55,
    "contrast": 20,
    "shadows": 30,
    "temperature": -15,
    "vibrance": 15,
    "clarity": 10
  },
  "qualityScore": 52,
  "explanation": "Your image is underexposed with crushed shadows and a warm color cast. I've lifted the exposure, opened up the shadows, and cooled the temperature to neutralize the reddish tint."
}
```

**Step 3 — Application** (client, ~8ms):
- `mergeAIEdit()` maps the flat diff to the nested adjustments structure
- `setAdjustments()` pushes to undo stack
- Canvas re-renders via `requestAnimationFrame`
- Quality score overlay animates in with Framer Motion

---

## 8. Interview Q&A Cheat Sheet

**Q: "What features did you engineer and why?"**
> We extracted 20+ features across 4 groups: luminance stats (mean, stddev, percentiles, skewness), color features (channel means, cast deviation, saturation), clipping metrics (shadow/highlight percentages), and composite quality scores. Each feature maps directly to a correctable photographic defect.

**Q: "Why not use deep learning for image assessment?"**
> For this use case, hand-crafted statistical features outperform because: (1) photo quality issues are largely statistical (brightness, contrast, color balance), not semantic; (2) our features are interpretable and debuggable; (3) no training data or GPU needed; (4) ~15ms extraction vs seconds for a neural network. We use the LLM as a fuzzy rule executor, not a feature extractor.

**Q: "How do you handle the 'garbage in, garbage out' problem?"**
> Three layers of defense: (1) Feature-level: percentiles instead of raw min/max for robustness to outliers; (2) Score-level: composite scores with tuned weights prevent any single bad feature from dominating; (3) Output-level: server-side sanitization clamps all LLM outputs to valid ranges and strips unknown keys.

**Q: "How would you improve this system?"**
> Three ideas: (1) Add scene detection using a lightweight vision model (classify as portrait/landscape/food) to customize correction strategy; (2) Build a feedback loop — log whether users undo the auto-enhance to create a quality signal for prompt tuning; (3) Use histogram equalization as a baseline comparator to validate the LLM's corrections aren't worse than a simple algorithm.

**Q: "What's the computational complexity?"**
> Feature extraction is O(n) where n = total pixels. We iterate the pixel array twice — once for histogram/means and once for variance. For a 1200×800 preview canvas (960K pixels), this takes ~15ms. The LLM call is the bottleneck at ~800ms.

---

## 9. Files Involved

| File | Role | Lines |
|---|---|---|
| `src/utils/imageAnalysis.js` | Feature extraction from canvas pixels | ~180 |
| `moon_backend/server.js` (`/api/auto-enhance`) | Feature encoding + LLM call + output sanitization | ~160 |
| `src/pages/Editor.jsx` (`handleAutoEnhance`) | Orchestration: analyze → fetch → merge → display | ~45 |
| `src/utils/mergeAIEdit.js` | Maps flat AI output to nested adjustment structure | ~60 |

---

*This pipeline demonstrates: feature engineering, dimensionality reduction, composite scoring, domain-knowledge-driven prompt engineering, and interpretable AI — all without training a single model.*
