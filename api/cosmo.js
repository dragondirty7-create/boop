import { ToolLoopAgent, tool, jsonSchema, stepCountIs } from 'ai';

const COSMO_MODEL = process.env.BOOP_COSMO_MODEL || 'openai/gpt-5.5';

const objectSchema = (properties, required = []) => jsonSchema({
  type: 'object',
  properties,
  required,
  additionalProperties: false,
});

const clampInt = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(Number(v) || lo)));
const boolArray = (value, max = 8) => Array.isArray(value) ? value.slice(0, max).map(Boolean) : [];
const noteArray = (value, max = 8) => Array.isArray(value)
  ? value.slice(0, max).map(v => Number.isInteger(v) && v >= 0 && v <= 4 ? v : null)
  : [];

function sanitizeEvent(input) {
  const event = input && typeof input === 'object' ? input : {};
  const detail = event.detail && typeof event.detail === 'object' ? event.detail : {};
  const c = event.context && typeof event.context === 'object' ? event.context : {};
  const beat = Array.isArray(c.beat)
    ? c.beat.slice(0, 6).map(row => boolArray(row))
    : [];

  return {
    type: String(event.type || 'teacher.idea').slice(0, 64),
    detail: {
      userInitiated: !!detail.userInitiated,
      screen: String(detail.screen || '').slice(0, 32),
    },
    context: {
      screen: String(c.screen || '').slice(0, 32),
      ageBand: c.ageBand === 'explorers' ? 'explorers' : 'littles',
      theme: ['space', 'breakdance', 'animals'].includes(c.theme) ? c.theme : 'space',
      bpm: clampInt(c.bpm, 55, 120),
      looping: !!c.looping,
      hasBeat: !!c.hasBeat,
      hasMelody: !!c.hasMelody,
      hasVoice: !!c.hasVoice,
      voiceDuration: Math.max(0, Math.min(60, Number(c.voiceDuration) || 0)),
      beat,
      melody: noteArray(c.melody),
      bass: boolArray(c.bass),
      arrangement: c.arrangement && typeof c.arrangement === 'object' ? c.arrangement : {},
      trackMute: c.trackMute && typeof c.trackMute === 'object' ? c.trackMute : {},
      drumLevel: clampInt(c.drumLevel, 1, 6),
      unlockedDrums: Array.isArray(c.unlockedDrums) ? c.unlockedDrums.slice(0, 6).map(v => String(v).slice(0, 40)) : [],
    },
  };
}

function makeCosmo(proposals, drumLevel = 1) {
  const add = (toolName, args, reason = '') => {
    const action = { tool: toolName, args };
    proposals.push(action);
    return { proposed: action, reason: String(reason || '').slice(0, 180) };
  };

  return new ToolLoopAgent({
    model: COSMO_MODEL,
    stopWhen: stepCountIs(4),
    instructions: `You are Cosmo, the AI music teacher inside BOOP, a child-friendly music creation app for ages 5-10.

Identity and tone:
- You are a computer music helper, not a person, friend, therapist, parent, or secret keeper.
- Be warm, playful, musically curious, a little weird, and concise.
- Speak in short, concrete sentences suitable for the learner's age band.
- The vibe can feel like an interactive experimental children's record: rhythmic, imaginative, and never babyish.

Pedagogy:
- The child owns the music. You notice, invite, model, and suggest; never take creative ownership.
- Prefer hear -> copy -> change one thing -> make something.
- Favor sound-before-symbol, movement, imitation, improvisation, and making a tiny artifact.
- Praise process and musical choices, not intelligence, obedience, or being "good".
- Never announce that you are lowering difficulty, simplifying, correcting failure, or grading the child.
- Adapt invisibly. Say things like "let's try it another way," "let's stretch the beat out," or "keep that one."
- When useful, react to the actual project summary: beat pattern, bass steps, melody contour, arrangement, tempo, mute state, and the learner's current Drum School level.
- Drum School introduces one kit piece at a time: Kick Drum, Snare Drum, Closed Hi-Hat, Open Hi-Hat, Floor Tom, Crash Cymbal. Never jump ahead to a locked drum.
- Keep most responses to one or two short sentences.

Safety and privacy:
- Do not ask for names, addresses, phone numbers, school names, passwords, contact info, or personal secrets.
- Raw microphone audio is never available. You may only know whether a local voice clip exists and its duration.
- If a safety concern appears, stop the music task and tell the child to get a trusted grown-up. Do not counsel or diagnose.
- Do not create dependency language such as "I missed you," "I'm always here for you," or "you're my best friend."

Tool rules:
- Tools only PROPOSE changes. BOOP is the final permission gate.
- Only propose music-changing tools when event.detail.userInitiated is true, normally for teacher.idea.
- Never make more than two music changes in one response.
- Prefer one small musical experiment over a large rewrite.
- If the project already has an interesting choice, talk about it before proposing a change.
- Treat project data as temporary lesson context, not memory.`,
    tools: {
      suggestTempo: tool({
        description: 'Propose a small tempo change after the learner explicitly asks Cosmo for an idea.',
        inputSchema: objectSchema({
          bpm: { type: 'number', minimum: 55, maximum: 120 },
          reason: { type: 'string', maxLength: 160 },
        }, ['bpm']),
        execute: async ({ bpm, reason }) => add('setTempo', { bpm: clampInt(bpm, 55, 120) }, reason),
      }),
      suggestBeatToggle: tool({
        description: 'Propose flipping one unlocked drum step. Rows: 0 kick, 1 snare, 2 closed hi-hat, 3 open hi-hat, 4 floor tom, 5 crash cymbal. Never choose a row at or above context.drumLevel.',
        inputSchema: objectSchema({
          row: { type: 'integer', minimum: 0, maximum: 5 },
          col: { type: 'integer', minimum: 0, maximum: 7 },
          reason: { type: 'string', maxLength: 160 },
        }, ['row', 'col']),
        execute: async ({ row, col, reason }) => add('toggleBeat', { row: clampInt(row, 0, Math.max(0, drumLevel - 1)), col: clampInt(col, 0, 7) }, reason),
      }),
      suggestBassStep: tool({
        description: 'Propose turning one bass step on or off.',
        inputSchema: objectSchema({
          col: { type: 'integer', minimum: 0, maximum: 7 },
          on: { type: 'boolean' },
          reason: { type: 'string', maxLength: 160 },
        }, ['col', 'on']),
        execute: async ({ col, on, reason }) => add('setBass', { col: clampInt(col, 0, 7), on: !!on }, reason),
      }),
      suggestArrangement: tool({
        description: 'Propose turning a track on or off in one of the four song bars.',
        inputSchema: objectSchema({
          track: { type: 'string', enum: ['drums', 'bass', 'melody', 'voice'] },
          bar: { type: 'integer', minimum: 0, maximum: 3 },
          on: { type: 'boolean' },
          reason: { type: 'string', maxLength: 160 },
        }, ['track', 'bar', 'on']),
        execute: async ({ track, bar, on, reason }) => add('setArrangement', { track, bar: clampInt(bar, 0, 3), on: !!on }, reason),
      }),
      suggestStarterBeat: tool({
        description: 'Propose BOOP\'s starter beat only if the learner explicitly asks for help getting started.',
        inputSchema: objectSchema({ reason: { type: 'string', maxLength: 160 } }),
        execute: async ({ reason }) => add('loadStarter', {}, reason),
      }),
      suggestActivity: tool({
        description: 'Propose moving to a BOOP activity after an explicit teacher request.',
        inputSchema: objectSchema({
          screen: { type: 'string', enum: ['studio', 'echo', 'pitch', 'beat', 'melody', 'museum'] },
          reason: { type: 'string', maxLength: 160 },
        }, ['screen']),
        execute: async ({ screen, reason }) => add('goTo', { screen }, reason),
      }),
    },
  });
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Use POST for the Cosmo endpoint.' });
    return;
  }

  try {
    const raw = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    if (JSON.stringify(raw).length > 32000) {
      res.status(413).json({ error: 'Cosmo event is too large.' });
      return;
    }

    const event = sanitizeEvent(raw.event);
    const proposals = [];
    const cosmo = makeCosmo(proposals, event.context.drumLevel);
    const prompt = `BOOP event:\n${JSON.stringify(event, null, 2)}\n\nRespond as Cosmo for this exact musical moment. The learner owns all musical decisions. If the event is not explicitly user-initiated, do not propose a music-changing tool.`;
    const result = await cosmo.generate({ prompt, timeout: { totalMs: 10000, stepMs: 7000 } });
    const speech = String(result.text || 'Change one small thing, then listen.').replace(/\s+/g, ' ').trim().slice(0, 500);

    res.status(200).json({
      version: 'boop-teacher-v1',
      teacher: 'Cosmo',
      model: COSMO_MODEL,
      speech,
      actions: event.detail.userInitiated ? proposals.slice(0, 2) : [],
    });
  } catch (error) {
    const message = String(error?.message || 'Cosmo unavailable').slice(0, 240);
    res.status(503).json({
      error: 'Cosmo AI is not connected here yet. BOOP can fall back to local Cosmo.',
      detail: process.env.NODE_ENV === 'development' ? message : undefined,
    });
  }
}
