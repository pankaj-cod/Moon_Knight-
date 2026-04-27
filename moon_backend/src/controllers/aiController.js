const aiService = require('../services/aiService');

exports.aiEdit = async (req, res) => {
  const { prompt, currentAdjustments } = req.body;

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'Prompt is required' });
  }
  if (prompt.trim().length > 500) {
    return res.status(400).json({ error: 'Prompt must be under 500 characters' });
  }

  const flat = aiService.flattenAdjustments(currentAdjustments);
  const nonZero = Object.entries(flat).filter(([, v]) => v !== 0);
  const currentContext = nonZero.length > 0
    ? `\n\nCurrent adjustment values: ${JSON.stringify(Object.fromEntries(nonZero))}`
    : '';

  const userMessage = prompt.trim() + currentContext;

  try {
    const groqData = await aiService.callGroqAPI(aiService.AI_SYSTEM_PROMPT, userMessage, 300);
    const rawContent = groqData.choices?.[0]?.message?.content?.trim();

    if (!rawContent) {
      return res.status(502).json({ error: 'Empty response from AI service.' });
    }

    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      console.error('Failed to parse AI JSON:', rawContent);
      return res.status(502).json({ error: 'AI returned malformed JSON. Please rephrase your command.' });
    }

    const sanitized = aiService.sanitizeAIOutput(parsed);

    if (Object.keys(sanitized).length === 0) {
      return res.status(422).json({
        error: 'Could not extract valid adjustments. Try a more specific command like "make it warmer" or "add cinematic contrast".',
      });
    }

    console.log(`[AI Edit] prompt="${prompt.trim()}" → adjustments:`, sanitized);
    res.json({ adjustments: sanitized, prompt: prompt.trim() });

  } catch (error) {
    if (error.message === 'AI_NOT_CONFIGURED') {
      return res.status(503).json({ error: 'AI editing is not configured. Add GROQ_API_KEY to your .env file.' });
    }
    console.error('AI edit route error:', error);
    res.status(500).json({ error: 'Server error while processing your command.' });
  }
};

exports.autoEnhance = async (req, res) => {
  const { analysis } = req.body;

  if (!analysis || !analysis.scores || !analysis.luminance) {
    return res.status(400).json({ error: 'Image analysis data is required' });
  }

  const summary = [
    `Image Analysis Report:`,
    `Luminance: mean=${analysis.luminance.mean}, stdDev=${analysis.luminance.stdDev}, min=${analysis.luminance.min}, max=${analysis.luminance.max}`,
    `Percentiles: p5=${analysis.luminance.p5}, p95=${analysis.luminance.p95}, dynamicRange=${analysis.luminance.dynamicRange}`,
    `Histogram skewness: ${analysis.luminance.skewness}`,
    `Color: R=${analysis.color.meanR}, G=${analysis.color.meanG}, B=${analysis.color.meanB}`,
    `Color cast: red=${analysis.color.cast.red}%, green=${analysis.color.cast.green}%, blue=${analysis.color.cast.blue}%`,
    `Mean saturation: ${analysis.color.meanSaturation}`,
    `Clipping: shadows=${analysis.clipping.shadowPercent}%, highlights=${analysis.clipping.highlightPercent}%`,
    `Quality scores: exposure=${analysis.scores.exposure}, contrast=${analysis.scores.contrast}, color=${analysis.scores.color}, overall=${analysis.scores.overall}`,
    `Issues detected: ${analysis.issues.length > 0 ? analysis.issues.join(', ') : 'none'}`,
  ].join('\n');

  try {
    const groqData = await aiService.callGroqAPI(aiService.AUTO_ENHANCE_PROMPT, summary, 400);
    const rawContent = groqData.choices?.[0]?.message?.content?.trim();

    if (!rawContent) {
      return res.status(502).json({ error: 'Empty response from AI.' });
    }

    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      console.error('Auto-enhance JSON parse fail:', rawContent);
      return res.status(502).json({ error: 'AI returned malformed response.' });
    }

    const sanitized = aiService.sanitizeAIOutput(parsed.adjustments || {});
    const qualityScore = Math.max(0, Math.min(100, Math.round(Number(parsed.qualityScore) || analysis.scores.overall)));
    const explanation = typeof parsed.explanation === 'string' ? parsed.explanation.slice(0, 500) : 'Auto-enhance applied.';

    console.log(`[Auto-Enhance] score=${qualityScore} → adjustments:`, sanitized);
    res.json({
      adjustments: sanitized,
      qualityScore,
      explanation,
      analysis: analysis.scores,
    });

  } catch (error) {
    if (error.message === 'AI_NOT_CONFIGURED') {
      return res.status(503).json({ error: 'AI editing is not configured. Add GROQ_API_KEY to your .env file.' });
    }
    console.error('Auto-enhance error:', error);
    res.status(500).json({ error: 'Server error during auto-enhance.' });
  }
};
