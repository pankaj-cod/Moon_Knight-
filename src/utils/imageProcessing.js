/**
 * Image Processing Utilities
 * Professional-grade image adjustments for Canvas API
 */

/**
 * RGB to HSL conversion
 */
export const rgbToHsl = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }

    return [h * 360, s * 100, l * 100];
};

/**
 * HSL to RGB conversion
 */
export const hslToRgb = (h, s, l) => {
    h /= 360;
    s /= 100;
    l /= 100;

    let r, g, b;

    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;

        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
};

/**
 * Apply basic adjustments (exposure, contrast, highlights, shadows, whites, blacks)
 */
export const applyBasicAdjustments = (imageData, adjustments) => {
    const { exposure = 0, contrast = 0, highlights = 0, shadows = 0, whites = 0, blacks = 0 } = adjustments;
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // Calculate luminance
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

        // Apply exposure (affects all tones equally)
        const exposureFactor = Math.pow(2, exposure);
        r *= exposureFactor;
        g *= exposureFactor;
        b *= exposureFactor;

        // Apply highlights (affects bright areas)
        if (luminance > 170) {
            const highlightFactor = 1 + (highlights / 100) * ((luminance - 170) / 85);
            r *= highlightFactor;
            g *= highlightFactor;
            b *= highlightFactor;
        }

        // Apply shadows (affects dark areas)
        if (luminance < 85) {
            const shadowFactor = 1 + (shadows / 100) * ((85 - luminance) / 85);
            r *= shadowFactor;
            g *= shadowFactor;
            b *= shadowFactor;
        }

        // Apply whites (affects near-white areas)
        if (luminance > 200) {
            const whiteFactor = 1 + (whites / 100);
            r *= whiteFactor;
            g *= whiteFactor;
            b *= whiteFactor;
        }

        // Apply blacks (affects near-black areas)
        if (luminance < 55) {
            const blackFactor = 1 + (blacks / 100);
            r *= blackFactor;
            g *= blackFactor;
            b *= blackFactor;
        }

        // Apply contrast
        const contrastFactor = (contrast + 100) / 100;
        r = ((r / 255 - 0.5) * contrastFactor + 0.5) * 255;
        g = ((g / 255 - 0.5) * contrastFactor + 0.5) * 255;
        b = ((b / 255 - 0.5) * contrastFactor + 0.5) * 255;

        // Clamp values
        data[i] = Math.max(0, Math.min(255, r));
        data[i + 1] = Math.max(0, Math.min(255, g));
        data[i + 2] = Math.max(0, Math.min(255, b));
    }

    return imageData;
};

/**
 * Apply temperature and tint adjustments
 */
export const applyTemperatureAndTint = (imageData, temperature, tint) => {
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // Apply temperature
        if (temperature > 0) {
            // Warm: increase red, decrease blue
            r += temperature * 0.5;
            b -= temperature * 0.3;
        } else {
            // Cool: decrease red, increase blue
            r += temperature * 0.3;
            b -= temperature * 0.5;
        }

        // Apply tint
        if (tint > 0) {
            // Magenta: increase red and blue, decrease green
            r += tint * 0.3;
            g -= tint * 0.3;
            b += tint * 0.3;
        } else {
            // Green: increase green, decrease red and blue
            r += tint * 0.3;
            g -= tint * 0.3;
            b += tint * 0.3;
        }

        data[i] = Math.max(0, Math.min(255, r));
        data[i + 1] = Math.max(0, Math.min(255, g));
        data[i + 2] = Math.max(0, Math.min(255, b));
    }

    return imageData;
};

/**
 * Apply vibrance and saturation
 */
export const applyVibrance = (imageData, vibrance, saturation) => {
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Calculate current saturation
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const currentSat = max === 0 ? 0 : (max - min) / max;

        // Vibrance: affects less saturated colors more
        const vibranceFactor = 1 + (vibrance / 100) * (1 - currentSat);

        // Saturation: affects all colors equally
        const saturationFactor = 1 + (saturation / 100);

        // Calculate average
        const avg = (r + g + b) / 3;

        // Apply vibrance
        let newR = avg + (r - avg) * vibranceFactor;
        let newG = avg + (g - avg) * vibranceFactor;
        let newB = avg + (b - avg) * vibranceFactor;

        // Apply saturation
        newR = avg + (newR - avg) * saturationFactor;
        newG = avg + (newG - avg) * saturationFactor;
        newB = avg + (newB - avg) * saturationFactor;

        data[i] = Math.max(0, Math.min(255, newR));
        data[i + 1] = Math.max(0, Math.min(255, newG));
        data[i + 2] = Math.max(0, Math.min(255, newB));
    }

    return imageData;
};

/**
 * Apply tone curve
 */
export const applyToneCurve = (imageData, toneCurve) => {
    const data = imageData.data;
    const lut = toneCurve.lookupTable;

    for (let i = 0; i < data.length; i += 4) {
        data[i] = lut[data[i]];         // Red
        data[i + 1] = lut[data[i + 1]]; // Green
        data[i + 2] = lut[data[i + 2]]; // Blue
    }

    return imageData;
};

/**
 * Apply HSL adjustments to specific color ranges
 */
export const applyHSLAdjustments = (imageData, hslAdjustments) => {
    const colorRanges = {
        red: [345, 15],
        orange: [15, 45],
        yellow: [45, 75],
        green: [75, 165],
        aqua: [165, 195],
        blue: [195, 255],
        purple: [255, 285],
        magenta: [285, 345]
    };

    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        let [h, s, l] = rgbToHsl(r, g, b);

        // Find which color range this pixel falls into
        for (const [colorName, [minHue, maxHue]] of Object.entries(colorRanges)) {
            if (!hslAdjustments[colorName]) continue;

            let inRange = false;

            if (minHue > maxHue) {
                // Wraps around (e.g., red: 345-15)
                inRange = h >= minHue || h <= maxHue;
            } else {
                inRange = h >= minHue && h <= maxHue;
            }

            if (inRange) {
                const adj = hslAdjustments[colorName];

                // Calculate blend factor (how close to center of range)
                let distance;
                const center = minHue > maxHue ? (minHue + maxHue + 360) / 2 % 360 : (minHue + maxHue) / 2;

                if (minHue > maxHue) {
                    distance = Math.min(
                        Math.abs(h - center),
                        Math.abs(h - center + 360),
                        Math.abs(h - center - 360)
                    );
                } else {
                    distance = Math.abs(h - center);
                }

                const rangeSize = minHue > maxHue ? (360 - minHue + maxHue) : (maxHue - minHue);
                const blendFactor = 1 - Math.min(1, distance / (rangeSize / 2));

                // Apply adjustments with blending
                if (adj.hue) h += adj.hue * blendFactor;
                if (adj.saturation) s += adj.saturation * blendFactor;
                if (adj.luminance) l += adj.luminance * blendFactor;

                // Normalize hue
                h = ((h % 360) + 360) % 360;

                // Clamp saturation and luminance
                s = Math.max(0, Math.min(100, s));
                l = Math.max(0, Math.min(100, l));
            }
        }

        const [newR, newG, newB] = hslToRgb(h, s, l);
        data[i] = newR;
        data[i + 1] = newG;
        data[i + 2] = newB;
    }

    return imageData;
};

/**
 * Separable two-pass box blur — O(n × 2r) instead of O(n × r²).
 * Pass 1: horizontal. Pass 2: vertical on the intermediate result.
 * For radius=5 this is 22 ops/pixel vs the naive 121 ops/pixel.
 */
function separableBoxBlur(src, width, height, radius) {
    const size = 2 * radius + 1;
    const tmp = new Uint8ClampedArray(src.length);

    // ── Horizontal pass: src → tmp ──
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let r = 0, g = 0, b = 0;
            for (let dx = -radius; dx <= radius; dx++) {
                const nx = Math.max(0, Math.min(width - 1, x + dx));
                const i  = (y * width + nx) * 4;
                r += src[i]; g += src[i + 1]; b += src[i + 2];
            }
            const i = (y * width + x) * 4;
            tmp[i] = r / size; tmp[i + 1] = g / size; tmp[i + 2] = b / size;
            tmp[i + 3] = src[i + 3];
        }
    }

    // ── Vertical pass: tmp → src (in-place output) ──
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let r = 0, g = 0, b = 0;
            for (let dy = -radius; dy <= radius; dy++) {
                const ny = Math.max(0, Math.min(height - 1, y + dy));
                const i  = (ny * width + x) * 4;
                r += tmp[i]; g += tmp[i + 1]; b += tmp[i + 2];
            }
            const i = (y * width + x) * 4;
            src[i] = r / size; src[i + 1] = g / size; src[i + 2] = b / size;
        }
    }
    return src;
}

/**
 * Apply clarity (local mid-tone contrast enhancement)
 * Uses separable blur for ~5.5× faster box blur step.
 */
export const applyClarity = (imageData, amount) => {
    if (amount === 0) return imageData;

    const data    = imageData.data;
    const width   = imageData.width;
    const height  = imageData.height;
    const factor  = amount / 100;
    const radius  = 5;

    // Snapshot original, then blur it in-place via separable pass
    const original = new Uint8ClampedArray(data);
    const blurred  = new Uint8ClampedArray(original); // copy to blur
    separableBoxBlur(blurred, width, height, radius);

    // Enhance: add scaled detail (original - blurred), weighted to midtones
    for (let i = 0; i < data.length; i += 4) {
        const r = original[i], g = original[i + 1], b = original[i + 2];
        const luminance     = 0.299 * r + 0.587 * g + 0.114 * b;
        const midtoneFactor = 1 - Math.abs(luminance - 128) / 128;
        const f = factor * midtoneFactor;
        data[i]     = Math.max(0, Math.min(255, r + (r - blurred[i])     * f));
        data[i + 1] = Math.max(0, Math.min(255, g + (g - blurred[i + 1]) * f));
        data[i + 2] = Math.max(0, Math.min(255, b + (b - blurred[i + 2]) * f));
    }
    return imageData;
};

/**
 * Apply dehaze effect
 */
export const applyDehaze = (imageData, amount) => {
    if (amount === 0) return imageData;

    const data = imageData.data;
    const factor = amount / 100;

    // Estimate atmospheric light (brightest pixels)
    let maxLuminance = 0;
    let atmosphericLight = [0, 0, 0];

    for (let i = 0; i < data.length; i += 4) {
        const luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        if (luminance > maxLuminance) {
            maxLuminance = luminance;
            atmosphericLight = [data[i], data[i + 1], data[i + 2]];
        }
    }

    for (let i = 0; i < data.length; i += 4) {
        // Dark channel prior for dehaze
        const darkChannel = Math.min(
            data[i] / Math.max(atmosphericLight[0], 1),
            data[i + 1] / Math.max(atmosphericLight[1], 1),
            data[i + 2] / Math.max(atmosphericLight[2], 1)
        );

        const transmission = 1 - factor * (1 - darkChannel);

        // Recover scene radiance
        data[i] = Math.max(0, Math.min(255,
            (data[i] - atmosphericLight[0] * (1 - transmission)) / Math.max(transmission, 0.1)
        ));
        data[i + 1] = Math.max(0, Math.min(255,
            (data[i + 1] - atmosphericLight[1] * (1 - transmission)) / Math.max(transmission, 0.1)
        ));
        data[i + 2] = Math.max(0, Math.min(255,
            (data[i + 2] - atmosphericLight[2] * (1 - transmission)) / Math.max(transmission, 0.1)
        ));
    }

    return imageData;
};

/**
 * Apply vignette effect
 */
export const applyVignette = (imageData, amount, midpoint = 0.5) => {
    if (amount === 0) return imageData;

    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const dx = x - centerX;
            const dy = y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const normalizedDistance = distance / maxDistance;

            // Smooth falloff
            let vignetteFactor = 1;
            if (normalizedDistance > midpoint) {
                vignetteFactor = 1 - ((normalizedDistance - midpoint) / (1 - midpoint)) * (amount / 100);
            }

            const idx = (y * width + x) * 4;
            data[idx] *= vignetteFactor;
            data[idx + 1] *= vignetteFactor;
            data[idx + 2] *= vignetteFactor;
        }
    }

    return imageData;
};

/**
 * Apply grain/texture effect
 */
export const applyGrain = (imageData, amount, size = 1) => {
    if (amount === 0) return imageData;

    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        // Generate noise
        const noise = (Math.random() - 0.5) * amount * size;

        data[i] = Math.max(0, Math.min(255, data[i] + noise));
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
    }

    return imageData;
};

/**
 * Apply blur effect — uses separable box blur for O(n×2r) performance.
 */
export const applyBlur = (imageData, radius) => {
    if (!radius || radius === 0) return imageData;
    const data   = new Uint8ClampedArray(imageData.data); // copy to blur
    separableBoxBlur(data, imageData.width, imageData.height, radius);
    imageData.data.set(data);
    return imageData;
};
