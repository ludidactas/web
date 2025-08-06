import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function nombre(username: string | null | undefined): string {
  if (!username) return 'Anónimx'
  if (username.includes(' ')) return username.split(' ')[0]
  return username
}