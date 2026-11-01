import ExerciseCard from "../exercise/ExerciseCard";

export default function WorkoutDayCard({
  dayName,
  dayData,
  onExerciseClick,
  renderExerciseExtra,
  hideHeader = false,
}) {
  return (
    <section className="space-y-3">
      {!hideHeader && (
        <div>
          <h3 className="text-lg font-bold text-gray-900">{dayName}</h3>
          <p className="text-sm text-gray-500">{dayData?.focus}</p>
        </div>
      )}
      <div className="space-y-3">
        {(dayData?.exercises || []).map((exercise, index) => (
          <div key={`${exercise.id || exercise.name}-${index}`} className="space-y-2">
            <ExerciseCard
              exercise={exercise}
              index={index}
              onClick={() => onExerciseClick?.(exercise)}
            />
            {renderExerciseExtra ? renderExerciseExtra(exercise, index) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
