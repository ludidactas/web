import Math, { meta } from '@/md/matematica.mdx'
import { PropsWithChildren, useEffect } from 'react'
import { Button } from '@/components/ui/button'

function CustomH1({ children }: PropsWithChildren) {
  return <h1 style={{ color: 'blue', fontSize: '100px' }}>{children}</h1>
}

const overrideComponents = {
  h1: CustomH1,
}

export default function Page() {
  useEffect(() => {
    console.log(meta)
  }, [])
  return (
    <>
      <Button>Click me</Button>
      <Math components={overrideComponents} />
    </>
  )
}
