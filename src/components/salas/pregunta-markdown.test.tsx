import { afterEach, describe, expect, test } from 'bun:test'
import { cleanup, render } from '@testing-library/react'
import { PreguntaMarkdown } from './pregunta-markdown'

afterEach(cleanup)

describe('PreguntaMarkdown', () => {
  test('las imágenes llevan referrerPolicy=no-referrer y los links rel=noreferrer', () => {
    const { container } = render(
      <PreguntaMarkdown texto={'Mira ![una imagen](https://ejemplo.com/img.png) y este [link](https://ejemplo.com)'} />
    )

    const img = container.querySelector('img')!
    expect(img.getAttribute('src')).toBe('https://ejemplo.com/img.png')
    expect(img.getAttribute('referrerpolicy')).toBe('no-referrer')

    const a = container.querySelector('a')!
    expect(a.getAttribute('href')).toBe('https://ejemplo.com')
    expect(a.getAttribute('rel')).toBe('noreferrer')
  })

  test('las fórmulas siguen renderizando con KaTeX', () => {
    const { container } = render(<PreguntaMarkdown texto={'Una fórmula: $x^2$'} />)

    expect(container.querySelector('math')).not.toBeNull()
  })
})
