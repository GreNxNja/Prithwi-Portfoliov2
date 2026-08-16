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
      // The .ico carries 16/32/48 so the browser picks a size rather than
      // downsampling one badly; the PNGs cover everything that prefers them.
      { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/favicon-32.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '96x96',
        href: '/favicon-96.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '192x192',
        href: '/favicon-192.png',
      },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/apple-touch-icon.png',
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
      <h1 className="signature mt-5 text-[clamp(3rem,11vw,7.5rem)]">
        Dead string.
      </h1>
      <p className="mt-6 max-w-md text-xl text-muted">
        Nothing rings at this address.
      </p>
      <a
        href="/"
        className="wipe mt-10 w-fit font-mono text-xs tracking-[0.2em] text-ember uppercase"
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
            <div className="backdrop-spot" />
          </div>
          <div className="backdrop-scan" />
        </div>
        <div className="progress" aria-hidden />
        {children}
        <Scripts />
      </body>
    </html>
  )
}
