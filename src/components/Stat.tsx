export function Stat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={"mb-stat" + (accent ? " hot" : "")}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
