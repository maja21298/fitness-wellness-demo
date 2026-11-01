/**
 * Resolve exercise illustration URLs from wger.de with strict label matching
 * and filename filtering (exercise_base alone returns unrelated images).
 */
export const WGER_BASE = "https://wger.de";

/** Fallback search terms when the display name returns weak matches */
export const WGER_SEARCH_ALIASES = {
  "Push-ups": ["push up"],
  "Incline Push-ups": ["incline push up"],
  "Close-grip Push-ups": ["close grip push up", "narrow grip push up"],
  "Decline Push-ups": ["decline push up"],
  "Wide Push-ups": ["wide push up"],
  "Archer Push-ups": ["archer push up"],
  "Pike Push-ups": ["pike push up"],
  "Diamond Push-ups": ["diamond push up"],
  "Dumbbell Bench Press": ["dumbbell bench press", "flat dumbbell press"],
  "Chest Press Machine": ["chest press machine", "machine chest press"],
  "Pull-ups": ["pull up"],
  "Chin-ups": ["chin up"],
  "Svend Press": ["plate squeeze press", "standing plate press"],
  "Towel Rows": ["resistance band row", "seated row band"],
  "Inverted Rows": ["inverted row", "bodyweight row"],
  "Resistance Band Rows": ["resistance band row", "band row"],
  "Straight-arm Pulldown": ["straight arm pulldown", "straight arm lat pulldown"],
  "Wall Handstand Hold": ["wall handstand"],
  "Single-leg Deadlift": ["single leg deadlift"],
  "Romanian Deadlift": ["romanian deadlift", "rdl"],
  "Lateral Lunges": ["lateral lunge", "side lunge"],
  "Hip Thrust": ["hip thrust", "barbell hip thrust"],
  "Sumo Squat": ["sumo squat"],
  "Leg Raises": ["lying leg raise"],
  "Bicycle Crunches": ["bicycle crunch"],
  "Russian Twists": ["russian twist"],
  "Hollow Hold": ["hollow hold", "hollow body hold"],
  "Heel Taps": ["heel taps", "oblique heel touch"],
  "Bear Crawl": ["bear crawl"],
  "Jump Rope": ["jump rope"],
  "Rowing Machine": ["rowing ergometer", "seated row machine"],
  "Stair Climbing": ["stair climber", "step up"],
  "Shadow Boxing": ["shadow boxing", "boxing stance"],
  "Stretching / Yoga": ["stretching", "yoga"],
  "Dynamic Stretching": ["dynamic stretch", "leg swing stretch"],
  "Mobility Flow": ["hip mobility", "thoracic rotation"],
  "Hip Flexor Stretch": ["hip flexor stretch", "kneeling hip flexor stretch"],
  "Child's Pose Flow": ["child pose", "child's pose stretch"],
  "Foam Rolling": ["foam roller", "quadriceps foam roll"],
  "Running": ["jogging", "treadmill run"],
  "Cycling": ["stationary bike", "bicycle ergometer"],
  "High Knees": ["high knee"],
  "Jumping Jacks": ["jumping jack"],
  "Box Jumps": ["box jump"],
  "Burpees": ["burpee"],
  "Skater Hops": ["skater hop", "speed skater jump"],
  "Butt Kicks": ["butt kicks", "running butt kicks"],
  "Bicep Curls": ["dumbbell curl", "biceps curl"],
  "Hammer Curls": ["hammer curl"],
  "Cross-body Hammer Curls": ["cross body hammer curl", "cross-body hammer curl"],
  "Reverse Curls": ["reverse curl", "overhand curl"],
  "Concentration Curls": ["concentration curl"],
  "Triceps Kickbacks": ["triceps kickback"],
  "Overhead Triceps Extension": ["overhead triceps", "triceps extension dumbbell"],
  "Skull Crushers": ["skull crusher", "lying triceps extension"],
  "Triceps Dips": ["bench dip", "chair dip"],
  "Face Pulls": ["face pull", "rope face pull"],
  "Chest Flyes": ["dumbbell fly", "chest fly"],
  "Reverse Flyes": ["reverse fly", "rear delt fly"],
  "Lat Pulldowns": ["lat pulldown"],
  "Seated Cable Rows": ["seated cable row", "cable row"],
  "Leg Curls": ["lying leg curl", "hamstring curl"],
  "Bulgarian Split Squat": ["bulgarian split squat"],
  "Goblet Squat": ["goblet squat"],
  "Bodyweight Squats": ["air squat", "bodyweight squat"],
  "Jump Squats": ["jump squat", "squat jump"],
  "Glute Bridge": ["glute bridge", "hip bridge"],
  "Wall Sit": ["wall sit", "wall squat"],
  "Calf Raises": ["standing calf raise", "calf raise"],
  "Step-ups": ["step up", "dumbbell step up"],
  "Superman Hold": ["superman exercise", "superman back extension"],
  "Dead Bug": ["dead bug"],
  "Flutter Kicks": ["flutter kick"],
  "Mountain Climbers": ["mountain climber"],
  "Dumbbell Rows": ["dumbbell row", "one arm row"],
  "Barbell Rows": ["barbell row", "bent over row barbell"],
  "Overhead Press": ["shoulder press", "military press"],
  "Squat": ["barbell squat", "back squat"],
  "Lunges": ["forward lunge", "walking lunge"],
  "Shrugs": ["barbell shrug", "dumbbell shrug"],
  "Cable Crossover": ["cable crossover", "cable fly"],
  "Dips": ["parallel bar dip", "chest dip"],
  "Plank": ["forearm plank", "plank hold"],
  "Side Plank": ["side plank"],
  "Crunches": ["abdominal crunch", "crunch"],
  "Arnold Press": ["arnold press"],
  "Lateral Raises": ["lateral raise", "side raise"],
  "Front Raises": ["front raise"],
  "Upright Rows": ["upright row"],
  "Rear Delt Rows": ["rear delt row", "rear delt dumbbell row"],
  "Leg Press": ["leg press"],
  "Deadlift": ["deadlift", "barbell deadlift"],
};

export function norm(s) {
  return String(s)
    .toLowerCase()
    .replace(/[\u2019']/g, "")
    .replace(/[-/|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenAppearsInCandidate(token, candidateNorm) {
  const c = candidateNorm;
  if (
    token === "overhead" &&
    (c.includes("shoulder") ||
      c.includes("military") ||
      c.includes("overhead") ||
      c.includes("arnold") ||
      c.includes("push press"))
  )
    return true;
  if (c.includes(token)) return true;
  if (token.length > 3 && token.endsWith("s") && c.includes(token.slice(0, -1))) return true;
  if (token === "rows" && c.includes("row")) return true;
  if (token === "ups" && (c.includes("up") || c.includes("push"))) return true;
  if (token === "pulldowns" && (c.includes("pulldown") || c.includes("pull down")))
    return true;
  if (token === "flyes" && c.includes("fly")) return true;
  return false;
}

/** Penalize suggestions that omit important words from the app exercise name */
export function labelMatchScore(query, candidateLabel) {
  const q = norm(query);
  const c = norm(candidateLabel);
  if (c === q) return 1_000_000;
  if (c.startsWith(q) || q.startsWith(c)) return 800_000;

  const qTokens = q.split(/\s+/).filter((t) => t.length > 1);
  if (qTokens.length === 0) return 0;

  let hits = 0;
  for (const t of qTokens) {
    if (tokenAppearsInCandidate(t, c)) hits++;
  }
  const ratio = hits / qTokens.length;
  const miss = qTokens.length - hits;
  if (ratio < 1) {
    return ratio * 60_000 - miss * 25_000;
  }
  return 700_000 - Math.abs(c.length - q.length);
}

function fileMatchesToken(t, fileNorm) {
  if (
    t === "overhead" &&
    (fileNorm.includes("shoulder") ||
      fileNorm.includes("military") ||
      fileNorm.includes("overhead") ||
      fileNorm.includes("arnold") ||
      fileNorm.includes("push press"))
  )
    return true;
  if (fileNorm.includes(t)) return true;
  if (t.endsWith("ups") && fileNorm.includes(t.replace(/ups$/, "up"))) return true;
  if (t.endsWith("ing") && t.length > 4 && fileNorm.includes(t.slice(0, -3))) return true;
  if (t === "rows" && fileNorm.includes("row")) return true;
  if (t.length >= 5 && t.endsWith("s") && fileNorm.includes(t.slice(0, -1))) return true;
  if (t === "dips" && fileNorm.includes("dip")) return true;
  if (t === "kicks" && fileNorm.includes("kick")) return true;
  if (t === "pulldowns" && (fileNorm.includes("pulldown") || fileNorm.includes("pull down")))
    return true;
  if (t === "flyes" && fileNorm.includes("fly")) return true;
  return false;
}

/** These words need not appear in the image filename (pose / equipment photos omit them). */
const OPTIONAL_FILENAME_TOKENS = new Set([
  "hold",
  "machine",
  "stretch",
  "stretching",
  "flow",
  "climbing",
  "rope",
  "sit",
]);


const FILENAME_EXTRA_WORDS = [
  "narrow",
  "wide",
  "close",
  "grip",
  "incline",
  "decline",
  "cable",
  "smith",
  "assisted",
  "machine",
  "kettlebell",
  "reverse",
  "single",
  "leg",
  "seated",
  "standing",
  "lying",
  "bent",
  "over",
  "rear",
  "delt",
  "front",
];

export function filenameMatchScore(exerciseName, imageUrl) {
  try {
    const last = decodeURIComponent(imageUrl.split("/").pop() || "");
    const file = last.replace(/\.[^.]+$/i, "").toLowerCase().replace(/-/g, " ");
    const q = norm(exerciseName);
    const tokens = q.split(/\s+/).filter((t) => t.length > 1);
    const required = tokens.filter((t) => !OPTIONAL_FILENAME_TOKENS.has(t));
    const check = required.length > 0 ? required : tokens;
    if (check.length === 0) return 0;

    let hit = 0;
    for (const t of check) {
      if (fileMatchesToken(t, file)) hit++;
    }
    if (hit < check.length) return 0;

    let penalty = 0;
    for (const w of FILENAME_EXTRA_WORDS) {
      if (file.includes(w) && !q.includes(w)) penalty += 38;
    }
    if (file.includes("dumbbell") && !q.includes("dumbbell")) penalty += 95;
    if (file.includes("barbell") && !q.includes("barbell") && !q.includes("bar")) penalty += 35;
    return Math.max(5, 100 + hit * 30 - penalty);
  } catch {
    return 0;
  }
}

export function pickBestSuggestion(suggestions, originalName) {
  let best = null;
  let bestScore = -Infinity;
  for (const s of suggestions) {
    const label = s.value || s.data?.name || "";
    const bid = s.data?.base_id ?? s.data?.id;
    if (!bid) continue;
    const sc = labelMatchScore(originalName, label);
    if (sc > bestScore) {
      bestScore = sc;
      best = s;
    }
  }
  return { suggestion: best, score: bestScore };
}

function absUrl(pathOrUrl) {
  if (!pathOrUrl) return null;
  return pathOrUrl.startsWith("http") ? pathOrUrl : `${WGER_BASE}${pathOrUrl}`;
}

async function fetchJson(url) {
  let last;
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(25000) });
      if (!r.ok) throw new Error(String(r.status));
      return await r.json();
    } catch (e) {
      last = e;
      await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
  }
  throw last;
}

async function searchWger(term) {
  const url = `${WGER_BASE}/api/v2/exercise/search/?term=${encodeURIComponent(term)}&language=english&format=json`;
  const j = await fetchJson(url);
  return j.suggestions || [];
}

async function fetchImagesForBase(baseId) {
  const url = `${WGER_BASE}/api/v2/exerciseimage/?exercise_base=${baseId}&format=json&limit=100`;
  const j = await fetchJson(url);
  return (j.results || [])
    .map((row) => absUrl(row?.image))
    .filter(Boolean);
}

/**
 * @param {string} exerciseName
 * @returns {Promise<string[]>} 0–2 image URLs
 */
export async function resolveWgerExerciseImages(exerciseName) {
  const terms = [exerciseName, ...(WGER_SEARCH_ALIASES[exerciseName] || [])];
  /** @type {{ score: number, suggestion: object }[]} */
  const scored = [];

  for (const term of terms) {
    const sugs = await searchWger(term);
    for (const s of sugs) {
      const label = s.value || s.data?.name || "";
      const sc = labelMatchScore(exerciseName, label);
      scored.push({ score: sc, suggestion: s });
    }
    await new Promise((r) => setTimeout(r, 120));
  }

  scored.sort((a, b) => b.score - a.score);
  let chosen = scored[0]?.suggestion;
  const topScore = scored[0]?.score ?? 0;
  if (chosen && !chosen.data?.image && topScore > 0) {
    const floor = Math.min(topScore * 0.72, topScore - 1);
    const withThumb = scored.find(
      (x) => x.suggestion?.data?.image && x.score >= floor,
    );
    if (withThumb) chosen = withThumb.suggestion;
  }

  const sug = chosen;
  if (!sug?.data) return [];

  const baseId = sug.data.base_id ?? sug.data.id;
  const direct = absUrl(sug.data.image);

  let pool = [];
  try {
    pool = await fetchImagesForBase(baseId);
  } catch {
    pool = [];
  }

  const ranked = pool
    .map((u) => ({ u, s: filenameMatchScore(exerciseName, u) }))
    .sort((a, b) => b.s - a.s);

  const out = [];
  const push = (u) => {
    if (u && !out.includes(u)) out.push(u);
  };

  if (direct) push(direct);

  const minFileScore = 28;
  for (const { u, s } of ranked) {
    if (out.length >= 2) break;
    if (s >= minFileScore) push(u);
  }

  if (out.length < 2) {
    for (const { u, s } of ranked) {
      if (out.length >= 2) break;
      if (s >= 12) push(u);
    }
  }

  if (out.length === 0 && direct) return [direct];
  if (out.length === 0 && pool.length > 0) {
    const best = ranked[0];
    if (best && best.s > 0) return [best.u].filter(Boolean);
  }

  return out.slice(0, 2);
}
