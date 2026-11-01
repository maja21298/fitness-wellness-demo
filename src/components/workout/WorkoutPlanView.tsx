import WorkoutDayCard from "./WorkoutDayCard";

export default function WorkoutPlanView({
  plan,
  onExerciseClick,
  renderExerciseExtra,
  hideDayHeaders = false,
}) {
  return (
    <div className="space-y-6">
      {Object.entries(plan || {}).map(([dayName, dayData]) => (
        <WorkoutDayCard
          key={dayName}
          dayName={dayName}
          dayData={dayData}
          onExerciseClick={onExerciseClick}
          renderExerciseExtra={renderExerciseExtra}
          hideHeader={hideDayHeaders}
        />
      ))}
    </div>
  );
}
