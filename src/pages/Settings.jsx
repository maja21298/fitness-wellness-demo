import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useA11y, LANGUAGES, THEMES } from "../contexts/AccessibilityContext";
import { useToast } from "../components/common/Toast";
import { useTranslation } from "../i18n/useTranslation";
import MobilePageHeader from "../components/layout/MobilePageHeader";
import { translateExperience } from "../i18n/workoutTranslations";
import {
  HiArrowRightOnRectangle,
  HiPencil,
  HiXMark,
  HiEye,
} from "react-icons/hi2";

const ALLERGY_OPTIONS = [
  { id: "gluten", labelKey: "settings.allergyOptions.gluten" },
  { id: "dairy", labelKey: "settings.allergyOptions.dairy" },
  { id: "nuts", labelKey: "settings.allergyOptions.nuts" },
  { id: "eggs", labelKey: "settings.allergyOptions.eggs" },
  { id: "shellfish", labelKey: "settings.allergyOptions.shellfish" },
  { id: "soy", labelKey: "settings.allergyOptions.soy" },
  { id: "fish", labelKey: "settings.allergyOptions.fish" },
];

export default function Settings() {
  const { t } = useTranslation();
  const { user, userGoal, dietary, saveGoal, saveDietary, logout } = useAuth();
  const {
    mode,
    fontSize,
    language,
    theme,
    setMode,
    setFontSize,
    setLanguage,
    setTheme,
    resetAll,
  } = useA11y();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [editingDiet, setEditingDiet] = useState(false);
  const [form, setForm] = useState({
    height: userGoal?.height || "",
    weight: userGoal?.weight || "",
    age: userGoal?.age || "",
    gender: userGoal?.gender || "female",
    goal: userGoal?.goal || "lose",
    period: userGoal?.period || 3,
    activityLevel: userGoal?.activityLevel || "moderate",
    experience: userGoal?.experience || "beginner",
    location: userGoal?.location || localStorage.getItem("workout_location") || "gym",
  });

  const [dietForm, setDietForm] = useState({
    diet: dietary?.diet || "none",
    allergies: dietary?.allergies || [],
    dislikes: dietary?.dislikes || [],
  });
  const [dislikeInput, setDislikeInput] = useState("");

  const goalLabel = {
    lose: t("settings.goalLose"),
    gain: t("settings.goalGain"),
    only_training: t("settings.goalTrain"),
  };
  const activityLabel = {
    sedentary: t("settings.sedentary"),
    light: t("settings.light"),
    moderate: t("settings.moderate"),
    active: t("settings.activeLevel"),
    very_active: t("settings.veryActive"),
  };
  const dietLabel = {
    none: t("settings.noRestriction"),
    vegetarian: t("settings.vegetarian"),
    vegan: t("settings.vegan"),
    pescatarian: t("settings.pescatarian"),
  };

  const experienceLabel = (exp) => {
    if (!exp) return "-";
    const key = `onboarding.${exp}`;
    const value = t(key);
    return value !== key ? value : translateExperience(exp, language);
  };

  const handleSave = async () => {
    const height = Number(form.height);
    const weight = Number(form.weight);
    const age = Number(form.age);
    const period = Number(form.period);
    if (!height || height < 50 || height > 300 || !weight || weight < 20 || weight > 500
        || !age || age < 10 || age > 120 || !period || period < 1 || period > 60) {
      addToast(t("settings.validationInvalid"), "error");
      return;
    }
    const result = await saveGoal({
      ...form,
      height,
      weight,
      age,
      period,
    });
    if (!result?.ok) {
      addToast(t("settings.saveFailedToast"), "error");
      return;
    }
    localStorage.setItem("workout_location", form.location);
    setEditing(false);
    addToast(t("settings.profileUpdated"));
  };

  const handleSaveDiet = async () => {
    const result = await saveDietary(dietForm);
    if (!result?.ok) {
      addToast(t("settings.saveFailedToast"), "error");
      return;
    }
    setEditingDiet(false);
    addToast(t("settings.dietarySaved"));
  };

  const toggleAllergy = (id) =>
    setDietForm((current) => ({
      ...current,
      allergies: current.allergies.includes(id)
        ? current.allergies.filter((allergy) => allergy !== id)
        : [...current.allergies, id],
    }));

  const addDislike = () => {
    const value = dislikeInput.trim().toLowerCase();
    if (value && !dietForm.dislikes.includes(value)) {
      setDietForm((current) => ({ ...current, dislikes: [...current.dislikes, value] }));
    }
    setDislikeInput("");
  };

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  const handleSaveAccessibility = () => {
    addToast(t("settings.settingsSaved"));
  };

  return (
    <div className="app-mobile-page p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      <MobilePageHeader title={t("settings.title")} />
      <h1 className="app-hide-on-mobile-header text-2xl font-bold text-gray-900">{t("settings.title")}</h1>

      <Section
        title={t("settings.profile")}
        editing={editing}
        onToggle={() => setEditing((value) => !value)}
        editLabel={t("common.edit")}
        cancelLabel={t("common.cancel")}
      >
        {editing ? (
          <div className="space-y-4">
            <Row label={t("settings.height")}>
              <input
                type="number"
                value={form.height}
                onChange={(event) => setForm({ ...form, height: event.target.value })}
                className="input-field"
              />
            </Row>
            <Row label={t("settings.weight")}>
              <input
                type="number"
                value={form.weight}
                onChange={(event) => setForm({ ...form, weight: event.target.value })}
                className="input-field"
              />
            </Row>
            <Row label={t("settings.age")}>
              <input
                type="number"
                value={form.age}
                onChange={(event) => setForm({ ...form, age: event.target.value })}
                className="input-field"
              />
            </Row>
            <Row label={t("settings.gender")}>
              <select
                value={form.gender}
                onChange={(event) => setForm({ ...form, gender: event.target.value })}
                className="input-field"
              >
                <option value="female">{t("common.female")}</option>
                <option value="male">{t("common.male")}</option>
              </select>
            </Row>
            <Row label={t("settings.goalLabel")}>
              <select
                value={form.goal}
                onChange={(event) => setForm({ ...form, goal: event.target.value })}
                className="input-field"
              >
                <option value="lose">{t("settings.goalLose")}</option>
                <option value="gain">{t("settings.goalGain")}</option>
                <option value="only_training">{t("settings.goalTrain")}</option>
              </select>
            </Row>
            <Row label={t("settings.timelineMonths")}>
              <input
                type="number"
                value={form.period}
                onChange={(event) => setForm({ ...form, period: event.target.value })}
                className="input-field"
              />
            </Row>
            <Row label={t("settings.activityLevel")}>
              <select
                value={form.activityLevel}
                onChange={(event) => setForm({ ...form, activityLevel: event.target.value })}
                className="input-field"
              >
                <option value="sedentary">{t("settings.sedentary")}</option>
                <option value="light">{t("settings.light")}</option>
                <option value="moderate">{t("settings.moderate")}</option>
                <option value="active">{t("settings.activeLevel")}</option>
                <option value="very_active">{t("settings.veryActive")}</option>
              </select>
            </Row>
            <Row label={t("settings.experience")}>
              <select
                value={form.experience}
                onChange={(event) => setForm({ ...form, experience: event.target.value })}
                className="input-field"
              >
                <option value="beginner">{t("onboarding.beginner")}</option>
                <option value="intermediate">{t("onboarding.intermediate")}</option>
                <option value="advanced">{t("onboarding.advanced")}</option>
              </select>
            </Row>
            <Row label={t("workout.locationLabel")}>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "gym", label: t("workout.locationGym") },
                  { value: "home", label: t("workout.locationHome") },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setForm({ ...form, location: option.value })}
                    className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                      form.location === option.value
                        ? "bg-primary-50 border-primary-300 text-primary-700"
                        : "border-gray-200 text-gray-500 hover:bg-primary-50/30"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </Row>
            <button
              type="button"
              onClick={handleSave}
              className="w-full py-2.5 gradient-bg text-white font-medium rounded-xl hover:opacity-90"
            >
              {t("settings.saveChanges")}
            </button>
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <InfoRow label={t("settings.email")} value={user?.email} />
            <InfoRow label={t("settings.height")} value={userGoal?.height ? `${userGoal.height} cm` : "-"} />
            <InfoRow label={t("settings.weight")} value={userGoal?.weight ? `${userGoal.weight} kg` : "-"} />
            <InfoRow label={t("settings.age")} value={userGoal?.age || "-"} />
            <InfoRow label={t("settings.gender")} value={userGoal?.gender === "male" ? t("common.male") : t("common.female")} />
            <InfoRow label={t("settings.goalLabel")} value={goalLabel[userGoal?.goal] || "-"} />
            <InfoRow label={t("settings.timeline")} value={userGoal?.period ? `${userGoal.period} ${t("settings.months")}` : "-"} />
            <InfoRow label={t("settings.activity")} value={activityLabel[userGoal?.activityLevel] || "-"} />
            <InfoRow label={t("settings.experience")} value={experienceLabel(userGoal?.experience)} />
            <InfoRow
              label={t("workout.locationLabel")}
              value={
                (userGoal?.location || localStorage.getItem("workout_location") || "gym") === "home"
                  ? t("workout.locationHome")
                  : t("workout.locationGym")
              }
            />
          </div>
        )}
      </Section>

      <Section
        title={t("settings.dietaryPrefs")}
        editing={editingDiet}
        onToggle={() => setEditingDiet((value) => !value)}
        editLabel={t("common.edit")}
        cancelLabel={t("common.cancel")}
      >
        {editingDiet ? (
          <div className="space-y-4">
            <Row label={t("settings.dietType")}>
              <select
                value={dietForm.diet}
                onChange={(event) => setDietForm({ ...dietForm, diet: event.target.value })}
                className="input-field"
              >
                <option value="none">{t("settings.noRestriction")}</option>
                <option value="vegetarian">{t("settings.vegetarian")}</option>
                <option value="vegan">{t("settings.vegan")}</option>
                <option value="pescatarian">{t("settings.pescatarian")}</option>
              </select>
            </Row>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("settings.allergies")}
              </label>
              <div className="flex flex-wrap gap-2">
                {ALLERGY_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleAllergy(option.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      dietForm.allergies.includes(option.id)
                        ? "bg-red-50 border-red-300 text-red-700"
                        : "border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {t(option.labelKey)}
                    {dietForm.allergies.includes(option.id) ? " x" : ""}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("settings.dislikedFoods")}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={dislikeInput}
                  onChange={(event) => setDislikeInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addDislike();
                    }
                  }}
                  placeholder={t("onboarding.dislikesPlaceholder")}
                  className="input-field flex-1"
                />
                <button
                  type="button"
                  onClick={addDislike}
                  disabled={!dislikeInput.trim()}
                  className="px-4 py-2 gradient-bg text-white text-sm font-medium rounded-xl disabled:opacity-40"
                >
                  {t("common.add")}
                </button>
              </div>
              {dietForm.dislikes.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {dietForm.dislikes.map((dislike) => (
                    <span
                      key={dislike}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600"
                    >
                      {dislike}
                      <button
                        type="button"
                        onClick={() =>
                          setDietForm((current) => ({
                            ...current,
                            dislikes: current.dislikes.filter((item) => item !== dislike),
                          }))
                        }
                      >
                        <HiXMark className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleSaveDiet}
              className="w-full py-2.5 gradient-bg text-white font-medium rounded-xl hover:opacity-90"
            >
              {t("settings.savePrefs")}
            </button>
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <InfoRow label={t("settings.diet")} value={dietLabel[dietary?.diet] || t("settings.noRestriction")} />
            <InfoRow label={t("settings.allergies")} value={dietary?.allergies?.length ? dietary.allergies.join(", ") : t("settings.none")} />
            <InfoRow label={t("settings.dislikedFoods")} value={dietary?.dislikes?.length ? dietary.dislikes.join(", ") : t("settings.none")} />
          </div>
        )}
      </Section>

      <div className="app-card">
        <div className="flex items-center gap-2 mb-4">
          <HiEye className="w-5 h-5 text-primary-600" />
          <h2 className="font-semibold text-gray-900">{t("settings.accessibility")}</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("settings.displayMode")}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "normal", label: t("settings.normal") },
                { value: "highContrast", label: t("settings.highContrast") },
                { value: "dyslexia", label: t("settings.dyslexia") },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setMode(option.value)}
                  className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                    mode === option.value
                      ? "bg-primary-50 border-primary-300 text-primary-700"
                      : "border-gray-200 text-gray-500 hover:bg-primary-50/30"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("settings.language")}
            </label>
            <select value={language} onChange={(event) => setLanguage(event.target.value)} className="input-field">
              {LANGUAGES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("settings.fontSize")}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "small", label: t("settings.small") },
                { value: "medium", label: t("settings.medium") },
                { value: "large", label: t("settings.large") },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFontSize(option.value)}
                  className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                    fontSize === option.value
                      ? "bg-primary-50 border-primary-300 text-primary-700"
                      : "border-gray-200 text-gray-500 hover:bg-primary-50/30"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("settings.theme")}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {THEMES.map((themeOption) => (
                <button
                  key={themeOption.id}
                  type="button"
                  onClick={() => setTheme(themeOption.id)}
                  className={`py-3 px-2 rounded-xl text-sm font-medium border transition-all text-center ${
                    (theme || "default") === themeOption.id
                      ? "bg-primary-50 border-primary-300 text-primary-700 ring-2 ring-primary-200"
                      : "border-gray-200 text-gray-500 hover:bg-primary-50/30"
                  }`}
                >
                  <span className="block font-semibold text-xs">{themeOption.label}</span>
                  <span className="block text-[10px] text-gray-400 mt-0.5">{themeOption.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={resetAll}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            {t("settings.resetDefaults")}
          </button>

          <button
            type="button"
            onClick={handleSaveAccessibility}
            className="w-full py-2.5 gradient-bg text-white font-medium rounded-xl hover:opacity-90"
          >
            {t("settings.saveSettings")}
          </button>
        </div>
      </div>

      <p className="text-center text-sm">
        <Link to="/privacy" className="text-primary-600 hover:underline">
          {t("privacy.link")}
        </Link>
      </p>

      <div className="app-card">
        <h2 className="font-semibold text-gray-900 mb-4">{t("settings.account")}</h2>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2.5 border border-red-200 text-red-500 rounded-xl hover:bg-red-50 transition-colors text-sm font-medium"
        >
          <HiArrowRightOnRectangle className="w-5 h-5" /> {t("nav.logout")}
        </button>
      </div>
    </div>
  );
}

function Section({ title, editing, onToggle, children, editLabel, cancelLabel }) {
  return (
    <div className="app-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900">{title}</h2>
        <button type="button" onClick={onToggle} className="flex items-center gap-1 text-sm text-primary-600 hover:underline">
          <HiPencil className="w-4 h-4" /> {editing ? cancelLabel : editLabel}
        </button>
      </div>
      {children}
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-primary-50 last:border-0">
      <span className="text-gray-400">{label}</span>
      <span className="font-medium text-gray-900 capitalize">{value}</span>
    </div>
  );
}
