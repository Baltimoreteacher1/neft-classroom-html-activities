// Task-specific teaching guidance. These helpers never estimate proficiency.
export function wordBank(activity) {
  const seen = new Set();
  return [...(activity.wordBank || []), ...(activity.vocabulary || []).map((v) => v[0])]
    .filter((word) => {
      const key = String(word).normalize('NFKC').trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function purposeOf(activity) {
  const text = [activity.skill, activity.prompt, ...(activity.wida || [])].join(' ').toLowerCase();
  if (/claim|argument|opinion|argue|persuad|counterclaim|\bcer\b/.test(text)) return 'argue';
  if (/narrat|retell|story|sequence|in order/.test(text)) return 'narrate';
  if (/explain|cause|experiment|why|reasoning/.test(text)) return 'explain';
  return 'inform';
}

const GUIDANCE = {
  inform: ['Name the person, object, or idea you are describing.', 'Add a specific action, fact, or detail from the task.'],
  narrate: ['Tell the important events in an order the reader can follow.', 'Add a detail that helps the reader understand what happened.'],
  explain: ['Describe what happened or how something works.', 'Explain why, using a detail or result from the task.'],
  argue: ['State your claim or choice clearly.', 'Support it with a reason and specific evidence from the task.'],
};

export function taskCriteria(activity) {
  return activity.successCriteria?.length ? activity.successCriteria : GUIDANCE[purposeOf(activity)];
}

export function strategyFor(domain) {
  return {
    Listening: 'Listen for the main message first. Then listen again for the detail the question asks about.',
    Reading: 'Read the question, then find the part of the text that helps you answer. Check your choice against it.',
    Speaking: 'Plan your main idea. Say it aloud, add one useful detail, and listen to your explanation.',
    Writing: 'Say your idea first. Write it, then reread it with the question beside you.',
  }[domain] || 'Read the directions, try one step, then check your work.';
}

export const EVIDENCE_LABELS = {
  independent: 'Correct without opened help',
  supported: 'Correct after help or a retry',
  attempted: 'Answer attempted · revisit',
  draft: 'Draft changed · review needed',
  writing: 'Written response · self-reviewed',
  revised: 'Writing revised · improvement described',
  speaking: 'Speaking practiced · self-reported',
  recorded: 'Speaking practiced · recording made in this tab',
  worksheet: 'Paper practice · self-reported',
};

export function evidenceLabel(result) {
  return EVIDENCE_LABELS[result?.evidence] || 'Earlier practice · support use not recorded';
}

export function estimateMinutes(rows) {
  return rows.reduce((sum, row) => sum + (Number(row.minutes) || ({constructed: 6, worksheet: 8}[row.type] || 3)), 0);
}
