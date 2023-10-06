import './globals.css'
import type { Metadata } from 'next'
import localFont from 'next/font/local'

const GTWalsheimPro = localFont({
  src: [
    {
      path: '../public/fonts/GTWalsheimPro/GTWalsheimPro-Light.woff2',
      weight: '300',
      style: 'light',
    },
    {
      path: '../public/fonts/GTWalsheimPro/GTWalsheimPro-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/GTWalsheimPro/GTWalsheimPro-Medium.woff2',
      weight: '500',
      style: 'medium',
    },
    {
      path: '../public/fonts/GTWalsheimPro/GTWalsheimPro-Bold.woff2',
      weight: '700',
      style: 'bold',
    },
  ],
})

export const metadata: Metadata = {
  title: 'Nikhil Sheoran',
  description: `I'm a 17-year-old student pursuing an Electronics and Communication engineering degree at BITS Goa.
  Currently, I'm working on two projects: Media Groww and FastCut.`,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={GTWalsheimPro.className}>{children}</body>
    </html>
  )
}
