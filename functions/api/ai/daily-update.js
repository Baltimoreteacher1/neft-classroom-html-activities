export async function onRequestPost(context) {
  try {
    const apiKey = context.env.OPENAI_API_KEY;
    if (!apiKey) {
      return json({ error: 'OPENAI_API_KEY is not configured in Cloudflare secrets yet.' }, 500);
    }

    const body = await context.request.json().catch(() => ({}));
    const assignments = Array.isArray(body.assignments) ? body.assignments.slice(0, 12) : [];
    const classes = Array.isArray(body.classes) ? body.classes : [];
    const settings = body.settings || {};
    const goal = body.goal || '';

    const safePayload = {
      studentName: settings.studentName || 'Noam',
      tone: settings.aiTone || 'calm',
      focus: settings.aiFocus || 'short checklist',
      goal,
      classes: classes.map(c => ({ name: c.name, teacher: c.teacher || '' })),
      assignments: assignments.map(a => ({
        title: a.title,
        className: (classes.find(c => c.id === a.classId) || {}).name || 'Class',
        due: a.due || '',
        priority: a.priority || 'Medium',
        status: a.status || 'Not Started',
        notes: a.notes || ''
      }))
    };

    const prompt = `Create a very short, student-friendly daily school update for a middle-school student.\n\nRules:\n- Use calm, encouraging language.\n- Do not invent assignments.\n- Prioritize due today, overdue, and high priority work.\n- Output exactly 4 sections: Today First, Next, Ask For Help, Encouragement.\n- Keep it easy to read.\n\nData:\n${JSON.stringify(safePayload, null, 2)}`;

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: context.env.OPENAI_MODEL || 'gpt-4.1-mini',
        input: prompt,
        max_output_tokens: 450
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return json({ error: data.error?.message || 'OpenAI request failed.' }, response.status);
    }

    const update = extractText(data) || 'No update returned.';
    return json({ update });
  } catch (err) {
    return json({ error: err.message || 'AI update failed.' }, 500);
  }
}

function extractText(data) {
  if (typeof data.output_text === 'string') return data.output_text;
  const parts = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.type === 'output_text' && content.text) parts.push(content.text);
    }
  }
  return parts.join('\n').trim();
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}
