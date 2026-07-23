"use client";

import {
  useCallback,
  useLayoutEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

export type HomeSection = "activities" | "meals";
export type ActivityPick = "today" | "tomorrow" | "week";
export type MealPick = "today" | "tomorrow";

type HomeNavigationState = {
  section: HomeSection;
  activityPick: ActivityPick;
  mealPick: MealPick;
};

const STORAGE_KEY = "magnolia-home-navigation";
const CHANGE_EVENT = "magnolia-home-navigation-change";
const DEFAULT_STATE: HomeNavigationState = {
  section: "activities",
  activityPick: "today",
  mealPick: "today",
};
const DEFAULT_SNAPSHOT = JSON.stringify(DEFAULT_STATE);

let documentInitialized = false;
let volatileSnapshot = DEFAULT_SNAPSHOT;

function parseSnapshot(snapshot: string): HomeNavigationState {
  try {
    const value = JSON.parse(snapshot) as Partial<HomeNavigationState>;
    return {
      section: value.section === "meals" ? "meals" : "activities",
      activityPick:
        value.activityPick === "tomorrow" || value.activityPick === "week"
          ? value.activityPick
          : "today",
      mealPick: value.mealPick === "tomorrow" ? "tomorrow" : "today",
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function readSnapshot() {
  if (!documentInitialized) return DEFAULT_SNAPSHOT;
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) ?? volatileSnapshot;
  } catch {
    return volatileSnapshot;
  }
}

function writeSnapshot(state: HomeNavigationState) {
  const snapshot = JSON.stringify(state);
  volatileSnapshot = snapshot;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, snapshot);
  } catch {
    // The in-memory fallback still supports privacy-focused browsing modes.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function updateSnapshot(update: (current: HomeNavigationState) => HomeNavigationState) {
  writeSnapshot(update(parseSnapshot(readSnapshot())));
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CHANGE_EVENT, onChange);
}

/**
 * Initializes one independent navigation session per loaded browser document
 * and applies the return defaults whenever the user leaves the home route.
 */
export function HomeNavigationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useLayoutEffect(() => {
    if (!documentInitialized) {
      documentInitialized = true;
      writeSnapshot(DEFAULT_STATE);
      return;
    }

    if (pathname !== "/") {
      updateSnapshot((current) => ({
        ...current,
        activityPick: "today",
        mealPick: "today",
      }));
    }
  }, [pathname]);

  return children;
}

export function useHomeNavigation() {
  const snapshot = useSyncExternalStore(subscribe, readSnapshot, () => DEFAULT_SNAPSHOT);
  const { section, activityPick, mealPick } = parseSnapshot(snapshot);

  const selectSection = useCallback((next: HomeSection) => {
    updateSnapshot((current) => ({
      ...current,
      section: next,
      activityPick:
        next === "activities" && current.section !== "activities"
          ? "today"
          : current.activityPick,
      mealPick: next === "meals" ? "today" : current.mealPick,
    }));
  }, []);

  const selectActivityPick = useCallback((pick: ActivityPick) => {
    updateSnapshot((current) => ({ ...current, activityPick: pick }));
  }, []);

  const selectMealPick = useCallback((pick: MealPick) => {
    updateSnapshot((current) => ({ ...current, mealPick: pick }));
  }, []);

  return {
    section,
    activityPick,
    mealPick,
    selectSection,
    selectActivityPick,
    selectMealPick,
  };
}
