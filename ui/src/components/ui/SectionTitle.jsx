export default function SectionTitle({ title, subtitle }) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-extrabold tracking-tight text-ink">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
    </div>
  );
}
