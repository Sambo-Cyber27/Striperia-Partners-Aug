(() => {
  const OLD_SUPABASE_ORIGIN = 'https://abnzzlduqodliuvwmvdj.supabase.co';
  const nativeFetch = window.fetch.bind(window);

  const jsonResponse = (body, status = 200) => new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

  const stageIdFor = (name) => String(name || '').toLowerCase() === 'qualified'
    ? 'google-sheet-qualified'
    : 'google-sheet-unqualified';

  const parseBody = (body) => {
    if (!body) return {};
    if (typeof body === 'string') {
      try { return JSON.parse(body); } catch { return {}; }
    }
    return {};
  };

  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url;
    if (!url || !url.startsWith(OLD_SUPABASE_ORIGIN)) {
      return nativeFetch(input, init);
    }

    const requestUrl = new URL(url);
    const method = String(init.method || (typeof input !== 'string' ? input?.method : '') || 'GET').toUpperCase();

    if (requestUrl.pathname === '/rest/v1/stages') {
      const stageName = (requestUrl.searchParams.get('name') || '').replace(/^eq\./, '');
      return jsonResponse([{ id: stageIdFor(stageName) }]);
    }

    if (requestUrl.pathname === '/rest/v1/leads' && method !== 'GET') {
      const lead = parseBody(init.body);
      const response = await nativeFetch('/api/lead/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...lead,
          qualified: lead.stage_id === 'google-sheet-qualified',
          source: window.location.hostname,
        }),
      });

      if (!response.ok) {
        return jsonResponse({ message: 'Lead webhook failed' }, 500);
      }

      return jsonResponse(Array.isArray(lead) ? lead : [lead], 201);
    }

    if (requestUrl.pathname.startsWith('/functions/v1/')) {
      return jsonResponse({ ok: true, redirected_from_old_supabase: true });
    }

    return jsonResponse({ ok: true, redirected_from_old_supabase: true });
  };
})();
