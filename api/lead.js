const DEFAULT_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbxEadRTbEkfmJw4mIXbMZwziI-Cs2XOZBBog9MOoQfF-AJ7Ywu1fLqplva3Gf6QbRcq/exec';

// Future ads launch note:
// When ads launch, add the new Meta Pixel ID and CAPI access token here.
// Keep Google Sheets as the lead destination, then send a Meta Lead event only
// for qualified submissions where account_transactions is $10k+ or higher.

const escapeSheetFormula = (value) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trimStart();
  return /^[=+\-@]/.test(trimmed) ? `'${value}` : value;
};

const escapeLeadForSheet = (lead) => Object.fromEntries(
  Object.entries(lead).map(([key, value]) => [key, escapeSheetFormula(value)]),
);


export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  try {
    const webhookUrl = process.env.LEAD_WEBHOOK_URL || DEFAULT_WEBHOOK_URL;
    const lead = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

    const isDraft = req.query?.draft === '1' || lead.status === 'draft';
    const hasDraftData = [
      lead.name,
      lead.email,
      lead.phone,
      lead.account_transactions,
      lead.account_age,
      lead.account_region,
    ].some((value) => typeof value === 'string' && value.trim());

    if (!isDraft && (!lead.name || !lead.email || !lead.phone)) {
      res.status(400).json({ ok: false, error: 'Missing required lead fields' });
      return;
    }

    if (isDraft && !hasDraftData) {
      res.status(204).end();
      return;
    }

    const now = new Date().toISOString();
    const sheetLead = escapeLeadForSheet({
      ...lead,
      status: isDraft ? 'draft' : 'submitted',
      draft_id: lead.draft_id || lead.id || '',
      captured_at: now,
      submitted_at: isDraft ? (lead.submitted_at || '') : now,
      source: lead.source || req.headers.host || 'striperia-partners-aug',
    });

    if (req.query && req.query.dryRun === '1') {
      res.status(200).json({ ok: true, dryRun: true, lead: sheetLead });
      return;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(sheetLead),
      redirect: 'follow',
    });

    const responseText = await response.text();
    if (!response.ok) {
      res.status(502).json({ ok: false, error: 'Lead webhook failed', status: response.status, response: responseText.slice(0, 500) });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
