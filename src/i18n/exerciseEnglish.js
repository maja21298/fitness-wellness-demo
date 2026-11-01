/**
 * English coaching copy for the public, English-only portfolio demo.
 * Exercise names are the original English canonical names. The original
 * Croatian coaching content remains untouched in text.hr for future work.
 * This gives a useful English fallback when the exercise database has not
 * yet been manually localized. It does not represent an AI translation.
 */
const EQUIPMENT = {
  none: 'no equipment', mat: 'an exercise mat', band: 'a resistance band',
  dumbbell: 'a dumbbell', dumbbells: 'dumbbells', barbell: 'a barbell',
  cable: 'a cable machine', bench: 'a sturdy bench', wall: 'a wall',
  chair: 'a sturdy chair', kettlebell: 'a kettlebell',
  machine: 'the appropriate exercise machine', 'pull-up bar': 'a pull-up bar',
  'dip bars': 'parallel dip bars', 'rowing machine': 'a rowing machine',
  'bike/stationary': 'a stationary bike',
};
const template = (description, steps, mistakes) => ({
  description,
  instructions: steps,
  commonMistakes: mistakes,
});
const DEFAULT_MISTAKES = [
  'Avoid rushing through repetitions.',
  'Keep the movement controlled and your posture stable.',
  'Do not force a painful range of motion.',
];
const strength = (name) => template(
  `${name} is a strength exercise. Focus on steady technique and a comfortable range of motion.`,
  ['Set up in a stable position with your core engaged.', 'Perform the movement slowly and with control.', 'Return to the starting position without momentum.'],
  DEFAULT_MISTAKES,
);

export function getEnglishExerciseCopy(name = 'Exercise', muscleGroup = 'strength', equipment = []) {
  const title = String(name || 'Exercise');
  const n = title.toLowerCase();
  let copy = strength(title);

  if (/squat|leg press|wall sit|step-up|lunge/.test(n)) {
    copy = template(
      `${title} develops lower-body strength and control.`,
      ['Set your feet in a stable position and brace your core.', 'Bend your hips and knees in a controlled motion, keeping your knees aligned with your feet.', 'Push through your feet to return to the starting position.'],
      ['Avoid collapsing your knees inward.', 'Keep your heels supported and your back in a comfortable position.', 'Do not rush the lowering phase.'],
    );
  } else if (/deadlift|hip thrust|glute bridge|good morning/.test(n)) {
    copy = template(
      `${title} trains the hips and posterior chain with an emphasis on controlled movement.`,
      ['Set your feet firmly and engage your core.', 'Move through your hips while keeping your spine in a comfortable, neutral position.', 'Drive through your feet, squeeze your glutes and return with control.'],
      ['Avoid rounding your back under load.', 'Do not force your lower back into an exaggerated arch.', 'Keep the movement smooth.'],
    );
  } else if (/calf raise/.test(n)) {
    copy = template(`${title} works the calf muscles.`,
      ['Stand tall and use a stable support if needed.', 'Rise onto the balls of your feet in a controlled motion.', 'Lower your heels slowly to complete each repetition.'],
      ['Avoid bouncing at the bottom.', 'Keep your ankles aligned.', 'Do not rush repetitions.']);
  } else if (/push-up|press|dips|skull crushers|triceps extension|kickback/.test(n)) {
    copy = template(`${title} strengthens the upper body through a controlled pushing movement.`,
      ['Start in a balanced position with your shoulders set comfortably.', 'Push through the movement while keeping your core stable.', 'Return slowly to the starting position.'],
      ['Avoid shrugging or forcing your shoulders.', 'Do not let your back sag.', 'Choose a range of motion you can control.']);
  } else if (/pull-up|chin-up|row|pulldown|face pull/.test(n)) {
    copy = template(`${title} focuses on the pulling muscles of your back and arms.`,
      ['Set up with a stable torso and relaxed shoulders.', 'Pull steadily, drawing your elbows through the movement.', 'Release the resistance slowly without swinging.'],
      ['Avoid using momentum.', 'Keep your neck relaxed.', 'Do not round your back excessively.']);
  } else if (/curl/.test(n)) {
    copy = template(`${title} focuses on your arm muscles.`,
      ['Stand or sit tall with your elbows under control.', 'Bend your elbows to lift the resistance smoothly.', 'Lower slowly until your arms return to the start position.'],
      ['Avoid swinging your upper body.', 'Keep your elbows from drifting forward excessively.', 'Use a weight you can control.']);
  } else if (/fly|raise|shrug/.test(n)) {
    copy = template(`${title} targets the shoulders or upper body with controlled repetitions.`,
      ['Start with a stable stance and relaxed neck.', 'Lift or move your arms through a comfortable, controlled range.', 'Return slowly without using momentum.'],
      ['Avoid lifting with momentum.', 'Do not force the shoulder joint.', 'Keep your breathing steady.']);
  } else if (/plank|hollow|hold|side plank/.test(n)) {
    copy = template(`${title} helps build core stability and endurance.`,
      ['Set up with your body supported and your core gently engaged.', 'Hold a steady position while breathing normally.', 'Stop or take a break if you cannot maintain comfortable alignment.'],
      ['Avoid holding your breath.', 'Do not let your lower back collapse.', 'Prioritize form over duration.']);
  } else if (/crunch|twist|bicycle|leg raise|heel tap|dead bug|flutter|mountain climber/.test(n)) {
    copy = template(`${title} challenges your core and coordination.`,
      ['Set up in a stable position and engage your abdominal muscles.', 'Move through each repetition slowly, without pulling on your neck.', 'Return to the start with control and repeat.'],
      ['Avoid jerky movements.', 'Keep your lower back comfortable.', 'Focus on quality rather than speed.']);
  } else if (/run|jog|cycle|cycling|jump|rope|burpee|box|high knees|rowing machine|stairs|skater|shadow boxing/.test(n) || muscleGroup === 'cardio') {
    copy = template(`${title} is a cardio movement that can improve your endurance and coordination.`,
      ['Begin at a pace that feels comfortable for your fitness level.', 'Keep your breathing steady and your movements controlled.', 'Adjust your pace or take a short break when needed.'],
      ['Avoid starting too fast.', 'Land softly when jumping.', 'Take a break if you feel dizzy or unwell.']);
  } else if (/stretch|yoga|mobility|foam rolling|flexibility/.test(n) || muscleGroup === 'flexibility') {
    copy = template(`${title} supports mobility and recovery.`,
      ['Settle into a comfortable position and breathe slowly.', 'Move gently into a light stretch without bouncing.', 'Hold briefly or repeat the movement as comfortable.'],
      ['Never force a stretch into pain.', 'Avoid bouncing.', 'Keep your breathing relaxed.']);
  }

  const parts = (Array.isArray(equipment) ? equipment : String(equipment || 'none').split(/[+/]/))
    .map((token) => EQUIPMENT[String(token).trim().toLowerCase()] || String(token).replaceAll('_', ' '))
    .filter((value) => value && value !== 'none' && value !== 'no equipment');
  return {
    name: title,
    ...copy,
    equipmentGuide: parts.length
      ? `Equipment: ${parts.join(' and ')}. Choose a comfortable resistance and follow the exercise instructions.`
      : 'No special equipment required. Use a stable, safe exercise space.',
  };
}
