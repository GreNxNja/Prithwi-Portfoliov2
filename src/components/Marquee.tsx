/**
 * The venue marquee — a strip of running text between movements.
 *
 * The list is rendered twice and the track slides exactly -50%, so the seam
 * lands where the copy repeats and the loop is invisible. Duplicating in the
 * markup rather than cloning at runtime keeps the server and client trees
 * identical, and the whole thing animates on transform alone.
 */
export function Marquee({
  items,
  className = '',
}: {
  items: Array<string>
  className?: string
}) {
  const run = [...items, ...items]

  return (
    <div
      aria-hidden
      className={`marquee-mask overflow-hidden border-y border-line py-3.5 ${className}`}
    >
      <div className="marquee">
        {run.map((item, i) => (
          <span
            key={i}
            className="flex shrink-0 items-center gap-8 pr-8 font-mono text-[0.7rem] tracking-[0.28em] whitespace-nowrap text-muted uppercase"
          >
            {item}
            <span className="inline-block h-1 w-1 rotate-45 bg-ember/50" />
          </span>
        ))}
      </div>
    </div>
  )
}
