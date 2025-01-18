import { Meta } from '@/md/schema'
import {glob} from 'glob'
import { ReactNode } from 'react'

export default async function Page() {
    const mds = await glob("./md/*.mdx")
    console.log(`mds:`, mds)

    const mdMap: Record<string, {default: ReactNode, meta: Meta}> = {}
    for(const fn of mds){
        const importAddr = `@/md/${fn.split('\\')[1]}`
        console.log(`Importando ${importAddr}...`)
        const { default: Post, meta } = await import(`@/md/${fn.split('\\')[1]}`)
        mdMap[fn] = {default: Post, meta }
    }
    console.log(mdMap)

    const metas = Object.fromEntries(Object.entries(mdMap).map(([k, v]) => [k, v.meta]))
   
    return <p>{JSON.stringify(mdMap)}</p>
  }
