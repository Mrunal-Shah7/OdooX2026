export function YearCalendar() {
  const months = ['Jul', 'Aug', 'Sep'];
  return (
    <div className="grid grid-cols-3 gap-4">
      {months.map((month) => (
        <div key={month}>
          <h3 className="m-0 mb-2 text-label font-semibold text-text-muted">{month} 2026</h3>
          <div className="grid grid-cols-7 gap-1 text-center font-mono text-caption">
            {Array.from({ length: 28 }, (_, i) => (
              <span
                key={i}
                className={`rounded-sm py-1 ${i === 9 || i === 14 ? 'bg-accent-subtle text-accent' : 'bg-surface-sunken text-text-muted'}`}
              >
                {i + 1}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
