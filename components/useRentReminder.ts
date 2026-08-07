"use client";

import { useCallback, useSyncExternalStore } from "react";
import { rentReminderFor } from "@/lib/reminders";

const STORAGE_KEY = "mc-rent-paid-through";
const CHANGE_EVENT = "mc-rent-reminder-change";
let volatileAcknowledgedDueDate = "";

function readAcknowledgedDueDate(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? volatileAcknowledgedDueDate;
  } catch {
    return volatileAcknowledgedDueDate;
  }
}

function subscribe(onChange: () => void): () => void {
  function onStorage(event: StorageEvent) {
    if (event.key === STORAGE_KEY) onChange();
  }

  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function acknowledgeDueDate(dueDate: string) {
  volatileAcknowledgedDueDate = dueDate;
  try {
    window.localStorage.setItem(STORAGE_KEY, dueDate);
  } catch {
    // The reminder still closes for this document through the custom event.
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: dueDate }));
}

export function useRentReminder(date: string) {
  const acknowledgedDueDate = useSyncExternalStore(subscribe, readAcknowledgedDueDate, () => "");
  const reminder = /^\d{4}-\d{2}-\d{2}$/.test(date) ? rentReminderFor(date) : null;
  const visibleReminder = reminder?.dueDate === acknowledgedDueDate ? null : reminder;

  const acknowledge = useCallback(() => {
    if (reminder) acknowledgeDueDate(reminder.dueDate);
  }, [reminder]);

  return { reminder: visibleReminder, acknowledge };
}
