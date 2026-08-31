"use client";

import RentPaymentSummary from "@/components/RentPaymentSummary";
import { useRentReminder } from "@/components/useRentReminder";

export default function RentReminder({ date }: { date: string }) {
  const { reminder, acknowledge } = useRentReminder(date);
  if (!reminder) return null;

  return (
    <section
      aria-label="Rent payment reminder"
      className="mb-4 grid grid-cols-[3rem_minmax(0,1fr)] items-center gap-2.5 rounded-xl border border-copper/40 bg-copper/15 px-3 py-2.5 shadow-md"
    >
      <RentPaymentSummary reminder={reminder} onPaid={acknowledge} variant="card" />
    </section>
  );
}
