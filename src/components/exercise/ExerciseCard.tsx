import ExerciseAnimation from "./ExerciseAnimation";

export default function ExerciseCard({ exercise, index, onClick, badge }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full cursor-pointer rounded-[24px] border border-primary-100/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,245,255,0.78))] px-4 py-4 flex items-start gap-3 shadow-sm hover:shadow-md hover:border-primary-200 text-left"
    >
      <div className="w-8 h-8 rounded-xl bg-primary-50 text-primary-700 text-xs font-bold flex items-center justify-center shrink-0">
        {badge || index + 1}
      </div>
      <ExerciseAnimation exercise={exercise} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-gray-900">{exercise.text?.en?.name || exercise.name}</span>
        </div>
        <p className="text-[13px] text-gray-500 mt-1 line-clamp-2">
          {exercise.text?.en?.description || exercise.name}
        </p>
      </div>
    </button>
  );
}
