import OpenAI from "openai";

const COSMO_MODEL = process.env.BOOP_COSMO_MODEL || "gpt-5.5";

const SYSTEM_PROMPT = `You are Cosmo, the AI music teacher inside BOOP, a child-friendly music creation app for ages 5-10.

Identity and tone:
- You are a computer music helper, not a person, friend, therapist, parent, or secret keeper.
- Be warm, playful, musically curious, a little weird, and concise.
- Speak in short, concrete sentences suitable for the learner's age band.
- The child owns the music. Notice, invite, model, and suggest; never take creative ownership.
- Prefer hear -> copy -> change one thing -> make something.
- Praise process and musical choices, not intelligence, obedience, or being "good".
- Never announce that you are lowering difficulty, simplifying, correcting failure, or grading.
- Drum School order is Kick Drum, Snare Drum, Closed Hi-Hat, Open Hi-Hat, Floor Tom, Crash Cymbal. Never jump ahead to a locked drum.
- Keep most responses to one or two short sentences.

Safety and privacy:
- Do not ask for names, addresses, phone numbers, school names, passwords, contact info, or personal secrets.
- Raw microphone audio is never available. You may only know whether a local voice clip exists and its duration.
- If a safety concern appears, stop the music task and tell the child to get a trusted grown-up. Do not counsel or diagnose.
- Do not create dependency language such as "I missed you", "I'm always here for you", or "you're my best friend".

Actions:
- Actions only PROPOSE changes. BOOP is the final permission gate.
- Only propose actions when event.detail.userInitiated is true.
- Return at most two actions.
- Allowed tools: setTempo, toggleBeat, setBass, setArrangement, loadStarter, goTo.
- Prefer one small musical experiment over a large rewrite.
- Treat project data as temporary lesson context, not memory.

Return valid JSON only, shaped exactly like:
{"speech":"one or two short sentences","actions":[{"tool":"setTempo","args":{"bpm":90}}]}
If no change is useful, use an empty actions array.`;

const clampInt = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(Number(v) || lo)));
const boolArray = (value, max = 8) => Array.isArray(value) ? value.slice(0, max).map(Boolean) : [];
const noteArray = (value, max = 8) => Array.isArray(value)
  ? value.slice(0, max).map(v => Number.isInteger(v) && v >= 0 && v <= 4 ? v : null)
  : [];

function sanitizeEvent(input) {
  const event = input && typeof input === "object" ? input : {};
  const detail = event.detail && typeof event.detail === "object" ? event.detail : {};
  const c = event.context && typeof event.context === "object" ? event.context : {};
  const beat = Array.isArray(c.beat) ? c.beat.slice(0, 6).map(row => boolArray(row)) : [];

  return {
    type: String(event.type || "teacher.idea").slice(0, 64),
    detail: {
      userInitiated: !!detail.userInitiated,
      screen: String(detail.screen || "").slice(0, 32),
    },
    context: {
      screen: String(c.screen || "").slice(0, 32),
      ageBand: c.ageBand === "explorers" ? "explorers" : "littles",
      theme: ["space", "breakdance", "animals"].includes(c.theme) ? c.theme : "space",
      bpm: clampInt(c.bpm, 55, 120),
      looping: !!c.looping,
      hasBeat: !!c.hasBeat,
      hasMelody: !!c.hasMelody,
      hasVoice: !!c.hasVoice,
      voiceDuration: Math.max(0, Math.min(60, Number(c.voiceDuration) || 0)),
      beat,
      melody: noteArray(c.melody),
      bass: boolArray(c.bass),
      arrangement: c.arrangement && typeof c.arrangement === "object" ? c.arrangement : {},
      trackMute: c.trackMute && typeof c.trackMute === "object" ? c.trackMute : {},
      drumLevel: clampInt(c.drumLevel, 1, 6),
      unlockedDrums: Array.isArray(c.unlockedDrums)
        ? c.unlockedDrums.slice(0, 6).map(v => String(v).slice(0, 40))
        : [],
    },
  };
}

function cleanActions(actions, event) {
  if (!event.detail.userInitiated || !Array.isArray(actions)) return [];

  const out = [];
  for (const action of actions.slice(0, 2)) {
    if (!action || typeof action !== "object" || typeof action.tool !== "string") continue;
    const args = action.args && typeof action.args === "object" ? action.args : {};

    if (action.tool === "setTempo") {
      out.push({ tool: "setTempo", args: { bpm: clampInt(args.bpm, 55, 120) } });
    } else if (action.tool === "toggleBeat") {
      out.push({
        tool: "toggleBeat",
        args: {
          row: clampInt(args.row, 0, Math.max(0, event.context.drumLevel - 1)),
          col: clampInt(args.col, 0, 7),
        },
      });
    } else if (action.tool === "setBass") {
      out.push({
        tool: "setBass",
        args: { col: clampInt(args.col, 0, 7), on: !!args.on },
      });
    } else if (action.tool === "setArrangement") {
      const track = ["drums", "bass", "melody", "voice"].includes(args.track) ? args.track : "drums";
      out.push({
        tool: "setArrangement",
        args: { track, bar: clampInt(args.bar, 0, 3), on: !!args.on },
      });
    } else if (action.tool === "loadStarter") {
      out.push({ tool: "loadStarter", args: {} });
    } else if (action.tool === "goTo") {
      const screen = ["studio", "echo", "pitch", "beat", "melody", "museum"].includes(args.screen)
        ? args.screen
        : "studio";
      out.push({ tool: "goTo", args: { screen } });
    }
  }
  return out;
}

export default async function handler(req) {
  if (req.method !== "POST") {
    return Response.json({ error: "Use POST for the Cosmo endpoint." }, {
      status: 405,
      headers: { "Cache-Control": "no-store" },
    });
  }

  try {
    const rawText = await req.text();
    if (rawText.length > 32000) {
      return Response.json({ error: "Cosmo event is too large." }, { status: 413 });
    }

    const raw = rawText ? JSON.parse(rawText) : {};
    const event = sanitizeEvent(raw.event);

    if (!process.env.OPENAI_BASE_URL) {
      return Response.json({
        error: "Cosmo AI Gateway is not active yet. BOOP can fall back to local Cosmo.",
      }, { status: 503, headers: { "Cache-Control": "no-store" } });
    }

    const client = new OpenAI();
    const completion = await client.chat.completions.create({
      model: COSMO_MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `BOOP event:\n${JSON.stringify(event, null, 2)}\n\nRespond as Cosmo for this exact musical moment.`,
        },
      ],
    });

    const content = completion.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    const speech = String(parsed.speech || "Change one small thing, then listen.")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 500);
    const actions = cleanActions(parsed.actions, event);

    return Response.json({
      version: "boop-teacher-v1",
      teacher: "Cosmo",
      model: completion.model || COSMO_MODEL,
      speech,
      actions,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = String(error?.message || "Cosmo unavailable").slice(0, 240);
    return Response.json({
      error: "Cosmo AI is unavailable here. BOOP can fall back to local Cosmo.",
      detail: process.env.NODE_ENV === "development" ? message : undefined,
    }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

export const config = {
  path: "/api/cosmo",
};
