/// <reference types="vite/client" />

import { siteConfig } from '@/services'
import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import type { ReactNode } from 'react'

import appCss from '@/styles/app.css?url'

export const Route = createRootRoute({
  head: () => {
    return {
      meta: [
        {
          charSet: 'utf-8',
        },
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1',
        },
        {
          title: siteConfig.title,
        },
      ],
      links: [
        {
          rel: 'stylesheet',
          href: appCss,
        },
      ],
    }
  },
  component: RootComponent,
  notFoundComponent: () => {
    // TODO: replace this
    return (
      <div>
        <p>Not found!</p>
        <Link to="/">Go home</Link>
      </div>
    )
  },
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
