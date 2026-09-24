/** Sidebar / top bar logo: custom app icon or fallback letter. */
export default function AppIconMark({
  appIconUrl,
  fallbackLetter = 'K',
  className = 'h-10 w-10',
  imgClassName = 'h-full w-full object-cover',
  letterClassName = 'text-lg font-extrabold text-white',
  roundedClassName = 'rounded-xl',
  showGradientFallback = true,
}) {
  if (appIconUrl) {
    return (
      <div
        className={`${className} shrink-0 overflow-hidden ${roundedClassName} bg-white/10 shadow-lg ring-1 ring-white/20`}
      >
        <img src={appIconUrl} alt="" className={imgClassName} />
      </div>
    );
  }

  return (
    <div
      className={`${className} flex shrink-0 items-center justify-center ${roundedClassName} shadow-lg ${
        showGradientFallback
          ? 'bg-gradient-to-br from-accent to-secondary text-white'
          : 'bg-navy text-white'
      }`}
    >
      <span className={letterClassName}>{fallbackLetter}</span>
    </div>
  );
}
