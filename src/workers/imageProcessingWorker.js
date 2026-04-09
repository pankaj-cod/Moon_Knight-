/**
 * imageProcessingWorker.js
 *
 * Runs the full adjustment pipeline for high-resolution export
 * entirely off the main thread, keeping the UI responsive.
 *
 * Receives a transferred ArrayBuffer (zero-copy) containing the
 * full-resolution original pixel data, applies all adjustments,
 * and transfers the result back.
 */
import {
    applyBasicAdjustments,
    applyTemperatureAndTint,
    applyVibrance,
    applyToneCurve,
    applyHSLAdjustments,
    applyClarity,
    applyDehaze,
    applyVignette,
    applyGrain,
    applyBlur,
} from '../utils/imageProcessing.js';

self.onmessage = (e) => {
    const { buffer, width, height, adjustments: adj } = e.data;

    if (!buffer || !adj) {
        self.postMessage({ error: 'Missing buffer or adjustments' });
        return;
    }

    try {
        // Reconstruct ImageData from transferred buffer
        let imageData = new ImageData(new Uint8ClampedArray(buffer), width, height);

        // 1. Basic
        if (adj.basic) {
            imageData = applyBasicAdjustments(imageData, adj.basic);
        }

        // 2. Color — skip if all zero
        if (adj.color) {
            const { temperature = 0, tint = 0, vibrance = 0, saturation = 0 } = adj.color;
            if (temperature !== 0 || tint !== 0) {
                imageData = applyTemperatureAndTint(imageData, temperature, tint);
            }
            if (vibrance !== 0 || saturation !== 0) {
                imageData = applyVibrance(imageData, vibrance, saturation);
            }
        }

        // 3. Tone curve — lookupTable arrives as a plain Array; wrap in Uint8Array
        if (adj.toneCurve?.lookupTable) {
            const fakeCurve = { lookupTable: new Uint8Array(adj.toneCurve.lookupTable) };
            imageData = applyToneCurve(imageData, fakeCurve);
        }

        // 4. HSL
        if (adj.hsl) {
            imageData = applyHSLAdjustments(imageData, adj.hsl);
        }

        // 5. Effects
        if (adj.effects) {
            const { clarity = 0, dehaze = 0, vignette = 0, grain = 0 } = adj.effects;
            if (clarity  !== 0) imageData = applyClarity(imageData, clarity);
            if (dehaze   !== 0) imageData = applyDehaze(imageData, dehaze);
            if (vignette !== 0) imageData = applyVignette(imageData, vignette);
            if (grain    !== 0) imageData = applyGrain(imageData, grain);
        }

        // 6. Blur
        if (adj.blur > 0) imageData = applyBlur(imageData, adj.blur);

        // Transfer processed data back (zero-copy)
        const out = imageData.data.buffer;
        self.postMessage({ processedBuffer: out, width, height }, [out]);

    } catch (err) {
        self.postMessage({ error: err.message });
    }
};
