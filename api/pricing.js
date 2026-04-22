// Vercel serverless function — Azure Retail Prices API proxy.
// Fetches pricing server-side to avoid CORS restrictions.

const MAX_MODEL_LENGTH = 100;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { model = 'gpt-5.3-chat' } = req.query;
  if (typeof model !== 'string' || model.length > MAX_MODEL_LENGTH) {
    return res.status(400).json({ error: 'Invalid model parameter' });
  }

  try {
    const normalized = model
      .replace(/-chat$/i, '')
      .replace(/-preview$/i, '')
      .replace(/^gpt-/i, 'GPT-');

    const filter = `serviceName eq 'Azure OpenAI' and contains(tolower(skuName), tolower('${normalized}'))`;
    const url = `https://prices.azure.com/api/retail/prices?api-version=2023-01-01-preview&$filter=${encodeURIComponent(filter)}`;

    const azureRes = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!azureRes.ok) throw new Error(`Azure API HTTP ${azureRes.status}`);

    const data = await azureRes.json();
    const items = data.Items ?? [];

    if (!items.length) return res.json({ input: 0, output: 0, status: 'not-found' });

    let input = 0;
    let output = 0;

    for (const item of items) {
      const meter = (item.meterName ?? '').toLowerCase();
      const unit = (item.unitOfMeasure ?? '').toLowerCase();

      let perMillion = item.retailPrice;
      if (unit.includes('1k') || unit.includes('1,000 token')) perMillion *= 1000;

      const isInput = meter.includes('input') || meter.includes('prompt');
      const isOutput = meter.includes('output') || meter.includes('completion');

      if (isInput && !input) input = perMillion;
      if (isOutput && !output) output = perMillion;
    }

    if (input || output) return res.json({ input, output, status: 'found' });
    return res.json({ input: 0, output: 0, status: 'not-found' });
  } catch (e) {
    return res.status(502).json({ input: 0, output: 0, status: 'error', error: e.message });
  }
}
