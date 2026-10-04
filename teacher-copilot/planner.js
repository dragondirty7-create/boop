import { knowledge, bands, goals, materials, accessOptions, situations, reflectionOptions } from './content.js';
export { knowledge, bands, goals, materials, accessOptions, situations, reflectionOptions };
const own = (object, key) => Object.hasOwn(object, key);
function option(object, key, label) {
  if (typeof key !== 'string' || !own(object, key)) throw new Error(`Choose a supported ${label}.`);
  return key;
}
export function validateInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Choose session settings.');
  const allowed = ['band','duration','goal','review','material','group','access'];
  if (Object.keys(input).some(key => !allowed.includes(key))) throw new Error('Use session settings only; no personal details or instructions.');
  const band = option(bands, input.band, 'age band');
  const duration = Number(input.duration);
  if (!Number.isInteger(duration) || !own(bands[band].timings, duration)) throw new Error('Choose a duration for this age band.');
  const access = input.access ?? {};
  if (typeof access !== 'object' || Array.isArray(access) || Object.keys(access).some(key => !own(accessOptions,key))) throw new Error('Choose supported access settings only.');
  const defaults = { sound:'comfortable', language:'short', response:'flexible', notation:'sound', movement:'choice', theme:'music', visuals:'calm' };
  return { band, duration, goal: option(goals,input.goal,'musical goal'), review: option(goals,input.review,'review focus'), material: option(materials,input.material,'materials'), group: option({solo:1,small:1,class:1},input.group,'group format'), access: Object.fromEntries(Object.entries(defaults).map(([key,value])=>[key,option(accessOptions[key].values,access[key] ?? value,key)])) };
}
export function buildPlan(raw) {
  const input = validateInput(raw), goal = goals[input.goal], review = goals[input.review];
  const instructions = [
    `${review.review} Hear it, then sing, tap, move, play, or point.`,
    `${review.game}: ${review.review} Switch roles so the adult echoes a group-made phrase.`,
    goal.learn,
    goal.make,
    'Offer an optional musical share. Ask: “What would you play again?” Pointing or listening is welcome. End without pressure.',
  ];
  return {
    input, title: goal.label, knowledgeVersion: knowledge.version, reviewStatus: knowledge.reviewStatus,
    materials: materials[input.material][input.goal],
    groupNote: { solo:'Trade phrases with the adult.', small:'Offer turns or paired echoes; a listening turn is valid.', class:'Model to the group; use optional small-group turns without public ranking.' }[input.group],
    balance: 'Aim for 70% familiar/review musical attempts and 30% new attempts. This is a teaching intention, not a measured outcome or time split. Weave review into Make.',
    sections: ['Launch','Play','Learn','Make','Land'].map((name,index)=>({ name, minutes: bands[input.band].timings[input.duration][index], instruction: instructions[index], phrase: ['Listen, then try your way.','Your turn. I will copy you.','Listen first. Then try one change.','Make your phrase. Choose one thing to change.','Play again, point, or finish.'][index] })),
    adaptations: Object.entries(input.access).map(([key,value])=>({key,label:accessOptions[key].label,choice:accessOptions[key].values[value],instruction:accessOptions[key].advice[value]})),
    evidence: goal.evidence,
    breakNote: input.band === 'littles' ? 'Offer a movement or quiet break at least every five minutes and whenever requested. Timing includes pauses; shorten repeats to preserve Make and Land.' : 'Offer breaks whenever requested; shorten repeats to preserve Make and Land.',
    extension: 'With a responsible adult, repeat the phrase off screen using comfortable taps, humming, or an available instrument. Invent one small change.',
  };
}
export function facilitate(key) {
  const move = situations[option(situations,key,'situation')];
  return {...move,stop:'Stop option: pause or end immediately; no completion is required.',handoff:key==='safety'};
}
export function reflect(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || Object.keys(raw).some(key=>!own(reflectionOptions,key))) throw new Error('Use musical observations only; no learner details.');
  return Object.fromEntries(Object.entries(reflectionOptions).map(([key,definition])=>[key,definition.values[option(definition.values,raw[key],definition.label)]]));
}
export function exportMarkdown(plan, reflection = null) {
  // Rebuild from validated inputs: arbitrary strings cannot enter the export path.
  const p = buildPlan(plan.input);
  const notes = reflection === null ? null : reflect(reflection);
  const lines = [ '# EEC Teacher Copilot — Session plan', '', '**Prototype for adult review; not market-ready.**', `Content: ${p.knowledgeVersion} · ${p.reviewStatus}`, '', `## ${p.title}`, `${bands[p.input.band].label} · ${p.input.duration} minutes · ${materials[p.input.material].label}`, p.groupNote, '', '### Preparation', p.materials, p.balance, p.breakNote, '', 'Teacher owns pacing, access, sound levels, breaks, and stopping. No learner account, recording, upload, or automated safety service is included.', '', '### Five-part session' ];
  for (const part of p.sections) lines.push('',`#### ${part.name} · ${part.minutes} min`,part.instruction,`Teacher phrase: “${part.phrase}”`);
  lines.push('', '### Access choices');
  for (const a of p.adaptations) lines.push(`- ${a.label} — ${a.choice}: ${a.instruction}`);
  lines.push('', '### Look for musical evidence', `${p.evidence} This is an observation prompt, not a recorded result.`, '', '### Off-screen extension',p.extension,'','### Facilitation and handoff');
  for (const key of Object.keys(situations)) { const s=facilitate(key); lines.push(`- ${s.label}: “${s.phrase}” ${s.fallback} ${s.stop}`); }
  lines.push('', '### After teaching — de-identified reflection');
  for (const [key,d] of Object.entries(reflectionOptions)) lines.push(`- ${d.label}: ${notes ? notes[key] : 'Not recorded'}`);
  lines.push('', '### Source register');
  for (const source of knowledge.sources) lines.push(`- ${source.title}: ${source.url} — ${source.section}`);
  lines.push('', 'Human support: no staffed service or response commitment is configured in this prototype. Ask your program lead for teaching review; use your organization’s safeguarding procedure for safety concerns.', '', 'Launch remains gated on EEC content review, adult pilots, access/safety quality review, legal review of data flow and claims, and staffed operations.');
  return lines.join('\n')+'\n';
}
