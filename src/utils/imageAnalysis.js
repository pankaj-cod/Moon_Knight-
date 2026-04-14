/**
 * imageAnalysis.js
 *
 * Client-side image analysis that extracts quality metrics from canvas pixel data.
 * These metrics are sent to the auto-enhance endpoint so the LLM can make
 * informed corrective adjustments.
 *
 * All analysis runs on the preview canvas (max 1200px) — fast enough for real-time.
 */

/**
 * Analyze the current canvas and return structured quality metrics.
 * @param {HTMLCanvasElement} canvas - The preview canvas
 * @returns {object} Analysis report with scores and diagnostics
 */
export function analyzeImage(canvas) {
  if (!canvas) return null;

  const ctx  = canvas.getContext('2d', { willReadFrequently: true });
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const totalPixels = width * height;

  // ── Histograms ──
  const histR = new Uint32Array(256);
  const histG = new Uint32Array(256);
  const histB = new Uint32Array(256);
  const histL = new Uint32Array(256); // luminance

  let totalR = 0, totalG = 0, totalB = 0, totalL = 0;
  let totalSat = 0;
  let minL = 255, maxL = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];

    histR[r]++;
    histG[g]++;
    histB[b]++;

    // Luminance (perceived brightness — ITU-R BT.709)
    const lum = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
    histL[lum]++;

    totalR += r;
    totalG += g;
    totalB += b;
    totalL += lum;

    if (lum < minL) minL = lum;
    if (lum > maxL) maxL = lum;

    // Saturation (HSL model, simplified)
    const cMax = Math.max(r, g, b);
    const cMin = Math.min(r, g, b);
    const lightness = (cMax + cMin) / 2;
    const sat = cMax === cMin ? 0 : (cMax - cMin) / (lightness > 127.5 ? (510 - cMax - cMin) : (cMax + cMin));
    totalSat += sat;
  }

  // ── Means ──
  const meanR   = totalR / totalPixels;
  const meanG   = totalG / totalPixels;
  const meanB   = totalB / totalPixels;
  const meanL   = totalL / totalPixels;
  const meanSat = totalSat / totalPixels;

  // ── Percentiles (5th and 95th for dynamic range) ──
  const p5  = percentile(histL, totalPixels, 0.05);
  const p95 = percentile(histL, totalPixels, 0.95);
  const dynamicRange = p95 - p5;

  // ── Standard deviation of luminance (contrast proxy) ──
  let varianceSum = 0;
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    varianceSum += (lum - meanL) ** 2;
  }
  const stdDevL = Math.sqrt(varianceSum / totalPixels);

  // ── Clipped pixel percentages ──
  const shadowClipped    = countBelow(histL, 10) / totalPixels;
  const highlightClipped = countAbove(histL, 245) / totalPixels;

  // ── Color cast detection ──
  const avgChannel = (meanR + meanG + meanB) / 3;
  const colorCast = {
    red:   Number(((meanR - avgChannel) / avgChannel * 100).toFixed(1)),
    green: Number(((meanG - avgChannel) / avgChannel * 100).toFixed(1)),
    blue:  Number(((meanB - avgChannel) / avgChannel * 100).toFixed(1)),
  };

  // ── Histogram shape (skewness) ──
  let skewSum = 0;
  for (let v = 0; v < 256; v++) {
    skewSum += histL[v] * ((v - meanL) ** 3);
  }
  const skewness = skewSum / (totalPixels * (stdDevL ** 3));

  // ── Quality scores (0–100) ──
  const exposureScore   = scoreExposure(meanL, p5, p95);
  const contrastScore   = scoreContrast(dynamicRange, stdDevL);
  const colorScore      = scoreColor(colorCast, meanSat);
  const overallScore    = Math.round(exposureScore * 0.4 + contrastScore * 0.35 + colorScore * 0.25);

  // ── Diagnostics (human-readable issues) ──
  const issues = [];
  if (meanL < 80)  issues.push('underexposed');
  if (meanL > 190) issues.push('overexposed');
  if (dynamicRange < 120) issues.push('low_dynamic_range');
  if (stdDevL < 35)  issues.push('low_contrast');
  if (stdDevL > 80)  issues.push('high_contrast');
  if (highlightClipped > 0.08) issues.push('blown_highlights');
  if (shadowClipped > 0.10)    issues.push('crushed_shadows');
  if (Math.abs(colorCast.red) > 10 || Math.abs(colorCast.blue) > 10) issues.push('color_cast');
  if (meanSat < 0.12) issues.push('desaturated');
  if (meanSat > 0.65) issues.push('oversaturated');
  if (skewness < -0.5) issues.push('histogram_left_skewed');
  if (skewness > 0.5)  issues.push('histogram_right_skewed');

  return {
    dimensions: { width, height },
    luminance: {
      mean:         Number(meanL.toFixed(1)),
      stdDev:       Number(stdDevL.toFixed(1)),
      min:          minL,
      max:          maxL,
      p5,
      p95,
      dynamicRange,
      skewness:     Number(skewness.toFixed(2)),
    },
    color: {
      meanR: Number(meanR.toFixed(1)),
      meanG: Number(meanG.toFixed(1)),
      meanB: Number(meanB.toFixed(1)),
      cast:  colorCast,
      meanSaturation: Number(meanSat.toFixed(3)),
    },
    clipping: {
      shadowPercent:    Number((shadowClipped * 100).toFixed(1)),
      highlightPercent: Number((highlightClipped * 100).toFixed(1)),
    },
    scores: {
      exposure:  exposureScore,
      contrast:  contrastScore,
      color:     colorScore,
      overall:   overallScore,
    },
    issues,
  };
}

// ── Helpers ──

function percentile(hist, total, p) {
  const target = Math.floor(total * p);
  let cumulative = 0;
  for (let i = 0; i < 256; i++) {
    cumulative += hist[i];
    if (cumulative >= target) return i;
  }
  return 255;
}

function countBelow(hist, threshold) {
  let count = 0;
  for (let i = 0; i < threshold; i++) count += hist[i];
  return count;
}

function countAbove(hist, threshold) {
  let count = 0;
  for (let i = threshold + 1; i < 256; i++) count += hist[i];
  return count;
}

function scoreExposure(meanL, p5, p95) {
  // Ideal mean luminance ~120-135 (slightly above midpoint)
  const idealMean = 128;
  const meanPenalty = Math.abs(meanL - idealMean) / idealMean;

  // Penalize clipping
  const clipPenalty = (p5 < 5 ? 0.1 : 0) + (p95 > 250 ? 0.1 : 0);

  return Math.max(0, Math.min(100, Math.round((1 - meanPenalty - clipPenalty) * 100)));
}

function scoreContrast(dynamicRange, stdDev) {
  // Ideal dynamic range ~160-220, ideal stdDev ~45-65
  const drScore  = dynamicRange >= 160 ? 100 : (dynamicRange / 160) * 100;
  const sdScore  = stdDev >= 40 && stdDev <= 70 ? 100 : Math.max(0, 100 - Math.abs(stdDev - 55) * 2);
  return Math.round(drScore * 0.5 + sdScore * 0.5);
}

function scoreColor(cast, meanSat) {
  // Penalize strong casts and extreme saturation
  const castPenalty = (Math.abs(cast.red) + Math.abs(cast.green) + Math.abs(cast.blue)) / 3;
  const satScore = meanSat >= 0.15 && meanSat <= 0.55 ? 100 : Math.max(0, 100 - Math.abs(meanSat - 0.35) * 200);
  const castScore = Math.max(0, 100 - castPenalty * 5);
  return Math.round(castScore * 0.5 + satScore * 0.5);
}
