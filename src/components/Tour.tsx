import { AWARDS, CERTS, TOUR } from '#/data/content'
import { Reveal } from '#/components/Reveal'

export function Tour() {
  return (
    <div>
      <ol className="border-t border-line">
        {TOUR.map((role, i) => (
          <li key={role.company}>
            <Reveal delay={i * 90}>
              <article className="grid gap-5 border-b border-line py-9 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-10">
                <header>
                  <p className="flex items-center gap-2 font-mono text-[0.65rem] tracking-[0.15em] text-muted uppercase">
                    {role.current && (
                      <span
                        aria-hidden
                        className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-ember shadow-[0_0_8px_var(--color-ember)]"
                      />
                    )}
                    {role.when}
                  </p>
                  <p className="mt-1 font-mono text-[0.65rem] text-muted">
                    {role.where}
                  </p>
                </header>

                <div className="max-w-2xl">
                  <h3 className="font-display text-2xl tracking-tight sm:text-3xl">
                    {role.company}
                  </h3>
                  <p className="mt-1 font-mono text-xs tracking-[0.12em] text-ember uppercase">
                    {role.title}
                  </p>

                  <ul className="mt-5 space-y-3">
                    {role.points.map((point) => (
                      <li
                        key={point}
                        className="flex gap-3 text-[0.95rem] leading-relaxed text-ink/75"
                      >
                        <span
                          aria-hidden
                          className="mt-2.5 h-px w-4 shrink-0 bg-line"
                        />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {role.stack.map((s) => (
                      <span
                        key={s}
                        className="rounded-full border border-line px-3 py-1 font-mono text-[0.65rem] tracking-wide text-muted"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            </Reveal>
          </li>
        ))}
      </ol>

      <Reveal delay={120}>
        <div className="mt-14 grid gap-10 sm:grid-cols-2 sm:gap-16">
          <div>
            <h3 className="font-mono text-[0.65rem] tracking-[0.2em] text-muted uppercase">
              Encores
            </h3>
            <ul className="mt-5 space-y-4">
              {AWARDS.map((a) => (
                <li key={a.title} className="border-l border-ember/40 pl-4">
                  <p className="text-[0.95rem] text-ink">{a.title}</p>
                  <p className="mt-0.5 font-mono text-[0.65rem] text-muted">
                    {a.what} · {a.when}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-mono text-[0.65rem] tracking-[0.2em] text-muted uppercase">
              Certified
            </h3>
            <ul className="mt-5 space-y-2.5 font-mono text-[0.7rem] text-muted">
              {CERTS.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        </div>
      </Reveal>
    </div>
  )
}
