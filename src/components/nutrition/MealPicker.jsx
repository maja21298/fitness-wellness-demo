import { useEffect, useId, useRef, useState } from "react";
import { HiCheck, HiChevronDown } from "react-icons/hi2";
import { translateMealLabel } from "../../i18n/nutritionTranslations";

const MEALS = ["Breakfast", "Lunch", "Dinner", "Snack"];

export default function MealPicker({ value, onChange, label, language }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const root = useRef(null);
  const trigger = useRef(null);
  const options = useRef([]);

  useEffect(() => {
    if (!open) return;
    options.current[Math.max(0, MEALS.indexOf(value))]?.focus();
    const dismiss = (event) => {
      if (!root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open, value]);

  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };

  return (
    <div className="np-form-group np-custom-field np-meal-picker" ref={root}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.preventDefault();
          event.stopPropagation();
          close();
        }
      }}
    >
      <span id={`${id}-label`}>{label}</span>
      <button type="button" ref={trigger}
        className="np-form-field np-custom-input np-custom-select np-meal-picker-trigger"
        aria-labelledby={`${id}-label ${id}-value`}
        aria-haspopup="menu" aria-expanded={open} aria-controls={open ? `${id}-menu` : undefined}
        onClick={() => setOpen((previous) => !previous)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span id={`${id}-value`}>{translateMealLabel(value, language)}</span>
        <HiChevronDown aria-hidden="true" />
      </button>
      {open && (
        <div id={`${id}-menu`} className="np-meal-picker-menu" role="menu"
          aria-labelledby={`${id}-label`}
          onKeyDown={(event) => {
            const current = options.current.indexOf(document.activeElement);
            let next;
            if (event.key === "ArrowDown") next = (current + 1) % MEALS.length;
            if (event.key === "ArrowUp") next = (current + MEALS.length - 1) % MEALS.length;
            if (event.key === "Home") next = 0;
            if (event.key === "End") next = MEALS.length - 1;
            if (next !== undefined) {
              event.preventDefault();
              options.current[next]?.focus();
            }
          }}
        >
          {MEALS.map((meal, index) => (
            <button key={meal} type="button" role="menuitemradio" aria-checked={value === meal}
              ref={(element) => { options.current[index] = element; }}
              className={`np-meal-picker-option${value === meal ? " is-active" : ""}`}
              onClick={() => { onChange(meal); close(); }}
            >
              <span>{translateMealLabel(meal, language)}</span>
              {value === meal && <HiCheck aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
