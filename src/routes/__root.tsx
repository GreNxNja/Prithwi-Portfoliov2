import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Prithwijit Ghosh — Engineer',
      },
      {
        name: 'description',
        content:
          'Portfolio of Prithwijit Ghosh. Building sentient AI so I can enjoy my guitar sessions in peace.',
      },
      {
        name: 'theme-color',
        content: '#0a0a0c',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  notFoundComponent: NotFound,
  shellComponent: RootDocument,
})

function NotFound() {
  return (
    <main className="flex min-h-svh flex-col justify-center px-[5vw]">
      <p className="font-mono text-xs tracking-[0.28em] text-ember uppercase">
        404
      </p>
      <h1 className="mt-5 font-display text-[clamp(2.5rem,10vw,7rem)] leading-[0.9]">
        Dead string.
      </h1>
      <p className="mt-6 max-w-md font-display text-xl text-muted">
        Nothing rings at this address.
      </p>
      <a
        href="/"
        className="mt-10 w-fit font-mono text-xs tracking-[0.2em] text-ember uppercase hover:underline hover:underline-offset-4"
      >
        ← Back to the top string
      </a>
    </main>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <div className="backdrop" aria-hidden>
          <div className="backdrop-energy">
            <div className="backdrop-sweep" />
            <div className="backdrop-glow" />
          </div>
        </div>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
