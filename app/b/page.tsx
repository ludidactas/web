import Math, { meta } from '@/md/matematica.mdx'
import { PropsWithChildren } from 'react'
 
 
function CustomH1({ children }: PropsWithChildren) {
  return <h1 style={{ color: 'blue', fontSize: '100px' }}>{children}</h1>
}
 
const overrideComponents = {
  h1: CustomH1,
}
 
export default function Page() {
  console.log(meta)
  return <Math components={overrideComponents} />
}