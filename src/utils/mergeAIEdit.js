/**
 * mergeAIEdit.js
 *
 * Converts a flat AI-generated adjustment diff (e.g. { exposure: 0.2, temperature: 25 })
 * into the nested adjustments structure used by the editor pipeline, and returns
 * a fully merged new adjustments object.
 *
 * The AI always returns ABSOLUTE target values, so we simply SET the values
 * (not add them as deltas). This keeps behaviour predictable across absolute
 * commands ("make it cinematic") and relative ones ("reduce contrast a bit" —
 * the LLM already factored in the current state via the context we sent it).
 */

/** Which nested category each flat key belongs to */
const KEY_MAP = {
  // basic
  exposure:    'basic',
  contrast:    'basic',
  highlights:  'basic',
  shadows:     'basic',
  whites:      'basic',
  blacks:      'basic',
  // color
  temperature: 'color',
  tint:        'color',
  vibrance:    'color',
  saturation:  'color',
  // effects
  clarity:     'effects',
  dehaze:      'effects',
  vignette:    'effects',
  grain:       'effects',
};

/** Safety clamp ranges (server also clamps, but defence-in-depth) */
const RANGES = {
  exposure:    { min: -2,   max: 2   },
  contrast:    { min: -100, max: 100 },
  highlights:  { min: -100, max: 100 },
  shadows:     { min: -100, max: 100 },
  whites:      { min: -100, max: 100 },
  blacks:      { min: -100, max: 100 },
  temperature: { min: -100, max: 100 },
  tint:        { min: -100, max: 100 },
  vibrance:    { min: -100, max: 100 },
  saturation:  { min: -100, max: 100 },
  clarity:     { min: -100, max: 100 },
  dehaze:      { min: -100, max: 100 },
  vignette:    { min: 0,    max: 100 },
  grain:       { min: 0,    max: 100 },
};

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, Number(v)));
}

/**
 * @param {object} current   - Full current adjustments object (nested structure from App.jsx)
 * @param {object} flatDiff  - Flat { key: value } from the AI endpoint
 * @returns {object}         - New full adjustments object (deep-cloned, diffs applied)
 */
export function mergeAIEdit(current, flatDiff) {
  // Deep-clone only the mutable parts; preserve toneCurve and hsl references
  const next = {
    ...current,
    basic:     { ...current.basic },
    color:     { ...current.color },
    effects:   { ...current.effects },
    hsl:       { ...current.hsl },
    toneCurve: current.toneCurve,   // immutable — ToneCurve instance
    blur:      current.blur,
  };

  for (const [key, value] of Object.entries(flatDiff)) {
    const category = KEY_MAP[key];
    if (!category || typeof value !== 'number' || !isFinite(value)) continue;

    const range = RANGES[key];
    next[category][key] = clamp(value, range.min, range.max);
  }

  return next;
}

/**
 * Returns a human-readable summary of the applied changes (for the success toast).
 * e.g. "Applied: contrast +35, temperature +25, vignette 30"
 */
export function describeAIEdit(flatDiff, prevAdjustments) {
  const parts = [];
  for (const [key, value] of Object.entries(flatDiff)) {
    if (!KEY_MAP[key]) continue;
    const category = KEY_MAP[key];
    const prev = prevAdjustments?.[category]?.[key] ?? 0;
    const delta = value - prev;
    const sign = delta >= 0 ? '+' : '';
    parts.push(`${key} ${sign}${key === 'exposure' ? delta.toFixed(2) : Math.round(delta)}`);
  }
  return parts.length > 0 ? parts.join(', ') : 'No changes';
}
