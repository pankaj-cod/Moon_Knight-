/**
 * ToneCurve - Manages tone curve adjustments for image editing
 * Uses cubic spline interpolation for smooth curves
 */
export class ToneCurve {
    constructor(points = [[0, 0], [255, 255]]) {
        this.points = points.sort((a, b) => a[0] - b[0]);
        this.lookupTable = this.generateLookupTable();
    }

    /**
     * Generate a 256-value lookup table for fast processing
     */
    generateLookupTable() {
        const table = new Uint8Array(256);

        for (let i = 0; i < 256; i++) {
            table[i] = this.interpolate(i);
        }

        return table;
    }

    /**
     * Cubic spline interpolation for smooth curves
     */
    interpolate(x) {
        const points = this.points;

        // Find surrounding points
        let i = 0;
        while (i < points.length - 1 && points[i + 1][0] < x) {
            i++;
        }

        if (i === points.length - 1) {
            return Math.max(0, Math.min(255, points[i][1]));
        }

        const x0 = points[i][0];
        const y0 = points[i][1];
        const x1 = points[i + 1][0];
        const y1 = points[i + 1][1];

        // Cubic hermite spline for smoother curves
        if (i > 0 && i < points.length - 2) {
            const xPrev = points[i - 1][0];
            const yPrev = points[i - 1][1];
            const xNext = points[i + 2][0];
            const yNext = points[i + 2][1];

            // Calculate tangents
            const m0 = (y1 - yPrev) / (x1 - xPrev);
            const m1 = (yNext - y0) / (xNext - x0);

            const t = (x - x0) / (x1 - x0);
            const t2 = t * t;
            const t3 = t2 * t;

            const h00 = 2 * t3 - 3 * t2 + 1;
            const h10 = t3 - 2 * t2 + t;
            const h01 = -2 * t3 + 3 * t2;
            const h11 = t3 - t2;

            const y = h00 * y0 + h10 * (x1 - x0) * m0 + h01 * y1 + h11 * (x1 - x0) * m1;
            return Math.max(0, Math.min(255, Math.round(y)));
        }

        // Linear interpolation for edge cases
        const t = (x - x0) / (x1 - x0);
        const y = y0 + t * (y1 - y0);

        return Math.max(0, Math.min(255, Math.round(y)));
    }

    /**
     * Add a new control point
     */
    addPoint(x, y) {
        // Don't add if too close to existing point
        const tooClose = this.points.some(point =>
            Math.abs(point[0] - x) < 5
        );

        if (!tooClose) {
            this.points.push([x, y]);
            this.points.sort((a, b) => a[0] - b[0]);
            this.lookupTable = this.generateLookupTable();
        }
    }

    /**
     * Remove a control point
     */
    removePoint(index) {
        // Keep at least 2 points (start and end)
        if (this.points.length > 2 && index > 0 && index < this.points.length - 1) {
            this.points.splice(index, 1);
            this.lookupTable = this.generateLookupTable();
        }
    }

    /**
     * Update an existing control point
     */
    updatePoint(index, x, y) {
        if (index >= 0 && index < this.points.length) {
            // Lock first and last points to corners
            if (index === 0) {
                this.points[index] = [0, Math.max(0, Math.min(255, y))];
            } else if (index === this.points.length - 1) {
                this.points[index] = [255, Math.max(0, Math.min(255, y))];
            } else {
                this.points[index] = [
                    Math.max(0, Math.min(255, x)),
                    Math.max(0, Math.min(255, y))
                ];
            }
            this.points.sort((a, b) => a[0] - b[0]);
            this.lookupTable = this.generateLookupTable();
        }
    }

    /**
     * Reset to linear curve
     */
    reset() {
        this.points = [[0, 0], [255, 255]];
        this.lookupTable = this.generateLookupTable();
    }

    /**
     * Clone the curve
     */
    clone() {
        return new ToneCurve(this.points.map(p => [...p]));
    }

    /**
     * Serialize to JSON
     */
    toJSON() {
        return {
            points: this.points
        };
    }

    /**
     * Deserialize from JSON
     */
    static fromJSON(json) {
        return new ToneCurve(json.points || [[0, 0], [255, 255]]);
    }
}
