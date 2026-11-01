import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getEnglishExerciseCopy } from '../src/i18n/exerciseEnglish.js';
import { translations } from '../src/i18n/translations.js';

assert.deepEqual(Object.keys(translations), ['en'], 'Only the English dictionary should be exported in this preview');
for (const exercise of [
  ['Bicep Curls','arms',['dumbbells']],
  ['Squat','legs',['none']],
  ['Plank','core',['mat']],
  ['Running','cardio',['none']],
  ['Stretching / Yoga','flexibility',['mat']],
]) {
  const copy=getEnglishExerciseCopy(...exercise);
  assert.ok(copy.name && copy.description && copy.instructions.length>=3 && copy.commonMistakes.length>=3);
  assert.ok(!/[čćžšđ]/i.test([copy.name,copy.description,...copy.instructions,...copy.commonMistakes,copy.equipmentGuide].join(' ')));
}
const files=[
  'src/pages/Dashboard.jsx','src/pages/WorkoutPlan.jsx','src/pages/WorkoutDay.jsx',
  'src/pages/NutritionPlan.jsx','src/pages/SavedRecipes.jsx',
  'src/components/layout/AppLayout.jsx','src/components/exercise/ExerciseDetail.tsx',
  'src/components/exercise/ExerciseInstructions.tsx',
];
const text=files.map((f)=>readFileSync(new URL(`../${f}`,import.meta.url),'utf8')).join('\n');
const missing=[];
const rex=/\bt\(\s*["'`]([\w.-]+)["'`]/g;
for(const match of text.matchAll(rex)){
  const key=match[1];if(!key.includes('.'))continue;
  const value=key.split('.').reduce((value,part)=>value?.[part],translations.en);
  if(value===undefined)missing.push(key);
}
assert.deepEqual(missing,[],`Missing English labels: ${missing.join(', ')}`);
const instructions=readFileSync(new URL('../src/components/exercise/ExerciseInstructions.tsx',import.meta.url),'utf8');
assert.ok(instructions.includes('exercise?.text?.en'), 'Exercise instructions must render English copy');
assert.ok(!instructions.includes('hr.equipmentGuide'), 'English equipment guide should not refer to Croatian content');
const workout=readFileSync(new URL('../src/pages/WorkoutPlan.jsx',import.meta.url),'utf8');
assert.ok(workout.includes('ex.text?.en?.name || ex.name'));
console.log('English preview checks passed: EN labels, workout copy, instructions, and five movement types.');
