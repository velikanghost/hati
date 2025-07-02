import React from 'react'
import type { Metadata } from 'next'
import '@mantine/core/styles.css'
import './globals.scss'
import { ReduxProvider } from '@/components/providers/ReduxProvider'
import {
  ColorSchemeScript,
  MantineProvider,
  mantineHtmlProps,
} from '@mantine/core'

export const metadata: Metadata = {
  title: 'Hati | MetaMask Card-Powered Smart Payment Gateway',
  description:
    'Experience the future of Web3 payments with MetaMask Dev Card integration, Circle developer-controlled wallets, and automatic DeFi yield generation.',
  icons: {
    icon: [
      { url: '/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      {
        url: '/favicon/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
  manifest: '/favicon/site.webmanifest',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript />
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
        <MantineProvider>
          <ReduxProvider>{children}</ReduxProvider>
        </MantineProvider>
      </body>
    </html>
  )
}
