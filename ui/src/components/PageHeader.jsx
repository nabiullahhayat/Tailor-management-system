export default function PageHeader({ title, subtitle }) {
  return (
    <header className="border-b border-black/5 bg-gradient-to-r from-navy to-navy-light px-4 py-5 text-white sm:px-6 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Khayati</p>
      <h1 className="mt-1 text-2xl font-extrabold tracking-tight">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-white/70">{subtitle}</p>}
    </header>
  );
}
