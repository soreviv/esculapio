import { useState, useEffect } from "react";

export type ColorTheme = "azul" | "verde" | "morado" | "naranja";
export type DateFormat = "dd-mm-yyyy" | "mm-dd-yyyy" | "yyyy-mm-dd";
export type TimeFormat = "24h" | "12h";

export interface UserPreferences {
  colorTheme: ColorTheme;
  notifCitas: boolean;
  notifLab: boolean;
  notifAlergias: boolean;
  sounds: boolean;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
}

const STORAGE_KEY = "medirecord-preferences";

const DEFAULTS: UserPreferences = {
  colorTheme: "azul",
  notifCitas: true,
  notifLab: true,
  notifAlergias: true,
  sounds: false,
  dateFormat: "dd-mm-yyyy",
  timeFormat: "24h",
};

// HSL values for --primary, --ring, --sidebar-primary per theme
const COLOR_THEMES: Record<ColorTheme, { primary: string; ring: string; accent: string }> = {
  azul:    { primary: "203 89% 45%", ring: "203 89% 53%", accent: "203 15% 90%" },
  verde:   { primary: "142 71% 35%", ring: "142 71% 45%", accent: "142 20% 90%" },
  morado:  { primary: "262 52% 47%", ring: "262 52% 55%", accent: "262 15% 90%" },
  naranja: { primary: "25 95% 45%",  ring: "25 95% 53%",  accent: "25 20% 90%"  },
};

export function applyColorTheme(theme: ColorTheme) {
  const root = document.documentElement;
  const { primary, ring, accent } = COLOR_THEMES[theme];
  root.style.setProperty("--primary", primary);
  root.style.setProperty("--ring", ring);
  root.style.setProperty("--sidebar-primary", ring);
  root.style.setProperty("--sidebar-ring", ring);
  root.style.setProperty("--accent", accent);
  root.style.setProperty("--chart-1", primary);
}

function load(): UserPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

function save(prefs: UserPreferences) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function usePreferences() {
  const [prefs, setPrefs] = useState<UserPreferences>(load);

  // Apply color theme on mount and on change
  useEffect(() => {
    applyColorTheme(prefs.colorTheme);
  }, [prefs.colorTheme]);

  const update = (patch: Partial<UserPreferences>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      save(next);
      return next;
    });
  };

  return { prefs, update };
}
