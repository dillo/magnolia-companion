export default function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-hairline bg-card px-6 py-10 text-center">
      <p className="text-xl text-moss">{message}</p>
    </div>
  );
}
