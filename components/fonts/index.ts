import {
  Chelsea_Market,
  Funnel_Sans,
  Inter,
  Jersey_10,
  Lexend,
  Nova_Flat,
  Pangolin,
  Pixelify_Sans,
  Press_Start_2P,
} from 'next/font/google'
import localFont from 'next/font/local'

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

// Chakra_Petch, Share_Tech, Space_Grotesk

export const body = Chelsea_Market({
  weight: '400',
  subsets: ['latin'],
})
export const titulo = Chelsea_Market({
  weight: '400',
  subsets: ['latin'],
})

// Pangolin, Iceland, Walter_Turncoat

export const boton = Pangolin({
  weight: '400',
  subsets: ['latin'],
})
