import React from "react"
import type { Metadata, Viewport } from 'next'
import '../styles/globals.css'
import { CityProvider } from '@/context/CityContext'
import { ToasterProvider } from '@/components/toaster-provider'

export const metadata: Metadata = {
  title: 'Breathe Map | Air Quality Simulation & Analysis',
  description: 'Explore air quality patterns and simulate pollution reduction scenarios. Mock estimates and educational simulations only.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0F172A',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased bg-background text-foreground flex flex-col min-h-screen">
        <CityProvider>
          <div className="flex-1">{children}</div>
          <ToasterProvider />
          {/* Footer will be added dynamically by pages or as a wrapper */}
        </CityProvider>
      </body>
    </html>
  )
}
