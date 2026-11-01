const EQUIPMENT_GUIDE_BY_TOKEN = {
  barbell: {
    en: "a barbell setup or squat rack",
    hr: "sipku i rack odnosno slobodnu zonu za utege",
  },
  bench: {
    en: "ravnu ili podesivu klupu",
    hr: "ravnu ili podesivu klupu",
  },
  dumbbells: {
    en: "a pair of dumbbells from the rack",
    hr: "par bucica sa stalka",
  },
  dumbbell: {
    en: "a dumbbell from the free weights area",
    hr: "bucicu iz zone sa slobodnim utezima",
  },
  machine: {
    en: "the dedicated machine for this movement",
    hr: "spravu namijenjenu bas za taj pokret",
  },
  cable: {
    en: "a cable station with the matching attachment",
    hr: "cable stanicu s odgovarajucom ruckom ili uzetom",
  },
  band: {
    en: "a resistance band",
    hr: "gumu za vjezbanje",
  },
  mat: {
    en: "an exercise mat",
    hr: "prostirku za vjezbanje",
  },
  "pull-up bar": {
    en: "a pull-up station or assisted pull-up machine",
    hr: "zgib stanicu ili assisted pull-up spravu",
  },
  "dip bars": {
    en: "a dip station or parallel bars",
    hr: "dip stanicu ili paralelne sipke",
  },
  "rowing machine": {
    en: "a rowing ergometer",
    hr: "veslacki ergometar",
  },
  "bike/stationary": {
    en: "a stationary or spin bike",
    hr: "sobni ili spinning bicikl",
  },
};

export function splitEquipmentTokens(equipment) {
  if (Array.isArray(equipment)) return equipment.filter(Boolean).map((part) => String(part).trim().toLowerCase());
  return String(equipment || "")
    .split(/[+/]/)
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
}

export function formatEquipmentLabel(equipment) {
  return splitEquipmentTokens(equipment)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" / ");
}

function toSentenceHr(list) {
  if (list.length === 0) return "";
  if (list.length === 1) return list[0];
  if (list.length === 2) return `${list[0]} i ${list[1]}`;
  return `${list.slice(0, -1).join(", ")} i ${list[list.length - 1]}`;
}

export function buildGenericGymGuide(equipment) {
  const parts = splitEquipmentTokens(equipment)
    .map((token) => EQUIPMENT_GUIDE_BY_TOKEN[token])
    .filter(Boolean);

  if (parts.length === 0) {
    return "Koristi spravu ili opremu koja najbolje odgovara ovom pokretu i radi ga kontrolirano kroz puni opseg.";
  }

  return `Koristi ${toSentenceHr(parts.map((part) => part.hr))}.`;
}
