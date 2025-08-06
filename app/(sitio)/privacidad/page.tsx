import Link from 'next/link'
import Politicas from './privacidad.mdx'
import './privacidad.css'

export default function Privacidad() {
  return (
    <div className='bg-slate-100  rounded-lg m-10 '>

    <div className="politicas max-w-[700px] bg-white m-10 p-10  flex flex-col mt-12 mb-24">
        <Politicas/>
    </div>
    </div>
  )
}
