import Math, { meta } from '@/md/matematica.mdx'
import { PropsWithChildren } from 'react'

// Demo de cómo interceptar la producción de HTML a partir del MD

function CustomH1({ children }: PropsWithChildren) {
  return <h1 style={{ color: 'blue', fontSize: '100px' }}>{children}</h1>
}

const overrideComponents = {
  h1: CustomH1,
}

export default function Page() {
  // Este meta lo podríamos usar para definir el CustomH1 (y por ejemplo usar en el título un color definido en el front-matter)
  console.log(meta)
  return <Math components={overrideComponents} />
}
