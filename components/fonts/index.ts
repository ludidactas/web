import localFont from 'next/font/local'
import { Inter, Nova_Flat, Press_Start_2P, Pixelify_Sans, Jersey_10, Funnel_Sans, Lexend } from 'next/font/google'

export const inter = Inter({ subsets: ['latin'] })

export const novaF = Nova_Flat({
  subsets: ['latin'],
  display: 'swap',
  weight: '400',
})

export const funnelSans = Funnel_Sans({
  subsets: ['latin'],
  display: 'swap',
  weight: '400',
})

export const lexend = Lexend({
  subsets: ['latin'],
  display: 'swap',
  weight: '400',
})

export const jersey = Jersey_10({
  weight: '400',
  subsets: ['latin'],
})

export const pixelify = Pixelify_Sans({
  weight: '400',
  subsets: ['latin'],
})

export const press2P = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
})

export const geistSans = localFont({
  src: './GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})

export const geistMono = localFont({
  src: './GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
})

export const body = lexend
export const titulo = jersey
export const boton = titulo
