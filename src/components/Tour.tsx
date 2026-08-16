import { AWARDS, CERTS, TOUR } from '#/data/content'
import { Reveal } from '#/components/Reveal'

export function Tour() {
  return (
    <div className="relative">
      {/* The spine, drawn top-to-bottom once the section arrives. It sits in
          the gutter the dates already occupy, so it costs no layout. */}
      <span
        aria-hidden
        className="spine absolute top-0 bottom-0 -left-[2vw] hidden w-px bg-gradient-to-b from-ember/50 via-line to-transparent lg:block"
      />

      <ol className="border-t border-line">
        {TOUR.map((role, i) => (
          <li key={role.company}>
            <Reveal delay={i * 90}>
              <article className="group grid gap-5 border-b border-line py-9 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-10">
                <header>
                  <p className="flex items-center gap-2 font-mono text-[0.65rem] tracking-[0.15em] text-muted uppercase">
                    {role.current && (
                      <span
                        aria-hidden
                        className="pulse inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-ember"
                      />
                    )}
                    {role.when}
                  </p>
                  <p className="mt-1 font-mono text-[0.65rem] text-muted">
                    {role.where}
                  </p>
                </header>

                <div className="max-w-2xl">
                  <h3 className="font-display text-2xl tracking-tight transition-colors duration-300 group-hover:text-ember sm:text-3xl">
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
                          className="mt-2.5 h-px w-4 shrink-0 bg-line transition-all duration-500 group-hover:w-7 group-hover:bg-ember/60"
                        />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {role.stack.map((s) => (
                      <span
                        key={s}
                        className="surface rounded-full border border-line px-3 py-1 font-mono text-[0.65rem] tracking-wide text-muted transition-colors duration-300 hover:border-ember/50 hover:text-ember"
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
                <li
                  key={a.title}
                  className="group border-l border-ember/40 pl-4 transition-all duration-300 hover:border-ember hover:pl-5"
                >
                  {a.href ? (
                    <a
                      href={a.href}
                      target="_blank"
                      rel="noreferrer"
                      className="wipe inline-flex items-baseline gap-1.5 text-[0.95rem] text-ink transition-colors group-hover:text-ember"
                    >
                      {a.title}
                      <span aria-hidden className="text-[0.7rem]">
                        ↗
                      </span>
                    </a>
                  ) : (
                    <p className="text-[0.95rem] text-ink transition-colors group-hover:text-ember">
                      {a.title}
                    </p>
                  )}
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
                <li
                  key={c}
                  className="flex items-baseline gap-3 transition-colors duration-300 hover:text-ink"
                >
                  <span
                    aria-hidden
                    className="inline-block h-1 w-1 shrink-0 rotate-45 bg-line transition-colors duration-300 hover:bg-ember"
                  />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Reveal>
    </div>
  )
}
