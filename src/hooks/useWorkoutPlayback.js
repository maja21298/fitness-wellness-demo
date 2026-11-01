import { useCallback, useEffect, useState } from "react";

export default function useWorkoutPlayback(exercises, onComplete) {
  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [phase, setPhase] = useState("exercise");
  const [restResumeSet, setRestResumeSet] = useState(1);
  const [timer, setTimer] = useState(0);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState([]);

  const currentEx = exercises[currentExIdx];

  const moveToNextExercise = useCallback((skipRest = false) => {
    setCompleted((prev) => [...new Set([...prev, currentExIdx])]);
    if (currentExIdx < exercises.length - 1) {
      setCurrentExIdx((idx) => idx + 1);
      setCurrentSet(1);
      setRestResumeSet(1);
      setPhase(skipRest ? "exercise" : "rest");
      setTimer(skipRest ? getExerciseDuration(exercises[currentExIdx + 1]) : 30);
      setRunning(true);
      return;
    }

    setCompleted(exercises.map((_, idx) => idx));
    setRunning(false);
    setTimer(0);
    setPhase("exercise");
    onComplete?.();
  }, [currentExIdx, exercises, onComplete]);

  const handleTimerEnd = useCallback(() => {
    setRunning(false);
    if (phase === "rest") {
      // Between exercises the index already points to the upcoming exercise.
      // A set break resumes the same exercise at its next set instead.
      setCurrentSet(restResumeSet);
      setPhase("exercise");
      setTimer(getExerciseDuration(currentEx));
      setRunning(true);
      return;
    }

    if (currentSet < (currentEx?.sets || 1)) {
      setRestResumeSet(currentSet + 1);
      setPhase("rest");
      setTimer(currentEx?.rest || 60);
      setRunning(true);
      return;
    }

    moveToNextExercise();
  }, [currentEx, currentSet, moveToNextExercise, phase, restResumeSet]);

  useEffect(() => {
    if (!running) return;
    // Keep transitions outside the state updater, which React may run twice.
    const timeout = setTimeout(() => {
      if (timer <= 1) handleTimerEnd();
      else setTimer((value) => value - 1);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [running, timer, handleTimerEnd]);

  const startPlayback = () => {
    if (!exercises[0]) return;
    setCompleted([]);
    setCurrentExIdx(0);
    setCurrentSet(1);
    setPhase("exercise");
    setTimer(getExerciseDuration(exercises[0]));
    setRunning(true);
  };

  const toggleTimer = () => setRunning((value) => !value);

  const skipExercise = () => {
    if (phase === "rest") {
      handleTimerEnd();
    } else {
      moveToNextExercise(true);
    }
  };

  const goToPreviousExercise = () => {
    if (currentExIdx <= 0) return;
    const prevIdx = currentExIdx - 1;
    const prev = exercises[prevIdx];
    setCurrentExIdx(prevIdx);
    setCurrentSet(1);
    setPhase("exercise");
    setTimer(getExerciseDuration(prev));
    setRunning(false);
  };

  return { currentExIdx, currentSet, phase, timer, running, completed,
    startPlayback, toggleTimer, skipExercise, goToPreviousExercise };
}

export function getExerciseDuration(exercise) {
  if (!exercise) return 60;
  if (exercise.sets === 1) return exercise.duration * 60;
  return Math.max(Math.floor((exercise.duration * 60) / exercise.sets), 20);
}

