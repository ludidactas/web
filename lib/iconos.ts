import streamlinePixel from '@iconify-json/streamline-pixel/icons.json'
import { first, sample } from 'remeda'

export type StreamlinePixelIcons = keyof typeof streamlinePixel.icons

export type IconosStreamlinePixel = `streamline-pixel:${StreamlinePixelIcons}`

export type IconosDisponibles = IconosStreamlinePixel

export const iconosDisponibles = Object.keys(streamlinePixel.icons).filter((i) => i.includes('pet'))

export const IconoRandom = () => {
  return `streamline-pixel:${first(sample(iconosDisponibles, 1))}`
}
