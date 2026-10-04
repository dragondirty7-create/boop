// Source-derived draft content. Human pedagogy/access review is still a launch gate.
export const knowledge = Object.freeze({
  version: 'eec-teacher-copilot-0.1.0',
  reviewStatus: 'Draft — EEC human review pending',
  sources: [
    { title: 'EEC Product Portfolio — Project 01', url: 'https://docs.google.com/document/d/1P9mj_Q18vRQ94bNE_-VXbUGvuH4yKyWrkgqSlse21so/edit', section: 'Project 01 and cross-product launch gates' },
    { title: 'EEC Music Teacher Agent — Build Plan', url: 'https://docs.google.com/document/d/1VcppobVxtbFxMJJWgqxfr6y9hhuwpf0mHJy5c8sNBNw/edit', section: 'Lesson engine, games, and adaptive support only; older learner architecture excluded' },
    { title: 'EEC General First Music Lesson', url: 'https://docs.google.com/document/d/12iVe954aGphnaviWbWuAyE5VEAv-9YbadZoQsUMxWxg/edit', section: 'Rhythm echo, role reversal, instrument exploration, and take-home challenge' },
  ],
});
export const bands = {
  littles: { label: 'Littles · ages 5–7', timings: { 12: [2,3,3,3,1], 15: [3,3,4,4,1], 17: [3,4,4,4,2] } },
  explorers: { label: 'Explorers · ages 8–10', timings: { 21: [3,4,6,6,2], 25: [3,4,7,8,3], 29: [3,5,8,10,3] } },
};
export const goals = {
  rhythm: { label: 'Create a four-count rhythm', game: 'Echo Clap', review: 'Copy a familiar four-count pulse.', learn: 'Hear a four-count phrase with one silent count; echo it.', make: 'Invent a four-count rhythm with one silent count. Teach it to the adult, then change one count.', evidence: 'A four-count phrase was played, repeated, and changed.' },
  pitch: { label: 'Create a two-pitch phrase', game: 'High–Low / Call-and-Response', review: 'Echo two familiar sounds, one higher and one lower.', learn: 'Hear a two-pitch phrase; sing or play it back before naming high and low.', make: 'Choose an order for two comfortable pitches. Repeat the phrase, then swap one pitch.', evidence: 'A two-pitch phrase was made, repeated, and changed.' },
  timbre: { label: 'Create a two-sound pattern', game: 'Name That Sound / Call-and-Response', review: 'Repeat a familiar pulse using one sound.', learn: 'Listen to two contrasting sounds at comfortable levels; copy their order.', make: 'Choose a four-count order for two sounds. Teach it to the adult, then change one sound.', evidence: 'A two-sound pattern was made, repeated, and changed.' },
};
export const materials = {
  body: { label: 'Body percussion / voice', rhythm: 'Use soft knee taps or comfortable claps.', pitch: 'The adult models two comfortable sung pitches; humming or pointing is optional.', timbre: 'Contrast a soft knee tap with a quiet clap.' },
  percussion: { label: 'Hand percussion', rhythm: 'Use one hand drum or shaker at a comfortable level.', pitch: 'Use two tuned instruments if available; otherwise the adult models two sung pitches.', timbre: 'Contrast a soft drum tap with a shaker; with one instrument, model two gentle playing sounds.' },
  keyboard: { label: 'Keyboard / piano', rhythm: 'Tap a comfortable single key on the pulse.', pitch: 'The adult chooses two comfortable keys, one higher and one lower.', timbre: 'Use two keyboard sounds if available; otherwise contrast a key with a soft knee tap.' },
  strings: { label: 'Guitar / ukulele', rhythm: 'The adult demonstrates one comfortable muted strum or single-string sound.', pitch: 'The adult chooses two accessible pitches; avoid stretches or forced fingering.', timbre: 'Contrast a gentle muted strum with a single-string sound.' },
};
export const accessOptions = {
  sound: { label: 'Sound level', values: { comfortable: 'Comfortable', quiet: 'Quiet' }, advice: { comfortable: 'Check comfortable sound levels before playing; avoid sudden loud sounds.', quiet: 'Use soft taps or humming, one sound at a time. Check comfort; reduce or stop sound on request.' } },
  language: { label: 'Language', values: { short: 'Short and concrete', literal: 'Extra literal' }, advice: { short: 'Model first; give one short instruction at a time.', literal: 'Use literal words: “Listen. Tap four times.” Give one step, model it, then wait.' } },
  response: { label: 'Response time', values: { flexible: 'Flexible', extended: 'Extended', untimed: 'No timer' }, advice: { flexible: 'Wait for a response; repeats and breaks are welcome.', extended: 'Leave extra quiet time after each model; do not fill the pause or count down.', untimed: 'Use no response countdown. The teacher may repeat, skip, or stop at any point.' } },
  notation: { label: 'Notation', values: { sound: 'Sound first', icons: 'Simple icons', enlarged: 'Enlarged marks' }, advice: { sound: 'Hear and play before symbols; no reading required.', icons: 'After hearing and playing, offer four large dots for counts; a blank dot can represent silence.', enlarged: 'After hearing and playing, use large, well-spaced count marks; keep one phrase visible.' } },
  movement: { label: 'Movement', values: { choice: 'Free choice', seated: 'Seated', hands: 'Hands only' }, advice: { choice: 'Offer sway, tap, play, or point; never require speech, eye contact, or stillness.', seated: 'Offer seated taps or pointing; keep materials within comfortable reach.', hands: 'Use comfortable finger taps or pointing; no standing or whole-body movement required.' } },
  theme: { label: 'Theme', values: { music: 'Music', space: 'Space', animals: 'Animals' }, advice: { music: 'Let the group choose a sound or phrase.', space: 'Offer a “signal” phrase; keep the musical task unchanged.', animals: 'Offer a gentle animal-call phrase; keep the musical task unchanged.' } },
  visuals: { label: 'Visual density', values: { calm: 'Calm', simple: 'Simple schedule' }, advice: { calm: 'Show one step at a time with no animation or decorative clutter.', simple: 'Show a simple five-part schedule; point out the next step before changing activity.' } },
};
export const situations = {
  ready: { label: 'Ready for the next move', phrase: 'Keep that phrase. Change one sound, then listen.', fallback: 'Model one change; offer copy, point, or listen.' },
  stuck: { label: 'Needs another way in', phrase: 'Listen to mine. Try one sound, or point.', fallback: 'Use a slower pulse and a shorter pattern. Offer a repeat or a break.' },
  quiet: { label: 'Waiting for a response', phrase: 'Would you like to listen, try, or take a break?', fallback: 'Wait without a countdown; model once if invited. Do not infer why someone is quiet.' },
  stop: { label: 'Wants to stop', phrase: 'We can stop. Your music can wait.', fallback: 'End the activity without pressure; an optional quiet share is enough.' },
  safety: { label: 'Safety concern reported by adult', phrase: 'Pause the music. A responsible adult needs to help.', fallback: 'Follow your organization’s safeguarding or emergency procedure. This tool cannot assess danger, monitor safety, or send alerts.' },
};
export const reflectionOptions = {
  evidence: { label: 'Musical action observed', values: { notObserved: 'Not observed', pulse: 'A pulse was repeated', echoed: 'A phrase was echoed', changed: 'A phrase was changed', created: 'An original phrase was made' } },
  support: { label: 'Support that helped', values: { notObserved: 'Not observed', model: 'Adult model', slower: 'Slower pulse', quiet: 'Quieter sound', wait: 'Extra wait time', seated: 'Seated / hands-only choice', icons: 'Simple marks', break: 'Break or stopping' } },
  creation: { label: 'Creation completed', values: { notObserved: 'Not observed', yes: 'Yes — musical phrase completed', partial: 'Partly — revisit next time', stopped: 'Stopped by choice' } },
  next: { label: 'Next review target', values: { pulse: 'Steady pulse', rhythm: 'Four-count rhythm', pitch: 'High / low phrase', timbre: 'Two-sound pattern' } },
};
