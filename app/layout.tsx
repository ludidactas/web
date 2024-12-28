import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import './md.css'
import { ThemeProvider } from '@/components/theme-provider'
import { ModeToggle } from '@/components/ui/mode-toggle'
import { Inter, Nova_Flat } from 'next/font/google'
 
// If loading a variable font, you don't need to specify the font weight
const NovaF = Nova_Flat({
  subsets: ['latin'],
  display: 'swap',
  weight: "400",
})

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
})

export const metadata: Metadata = {
  title: 'Ludidactas',
  description: 'Educación Emergente',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // Warning: suppressHydrationWarning está porque https://github.com/shadcn-ui/ui/issues/5552
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} ${NovaF.className} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <div className='flex justify-between w-full p-4'>
            <h1 className='text-2xl'>Roadmap</h1>
            <ModeToggle />
          </div>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
