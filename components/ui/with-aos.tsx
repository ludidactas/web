'use client'
import { PropsWithChildren, useEffect } from "react";
import AOS from 'aos'
import 'aos/dist/aos.css'

export default function WithAOS({children} : PropsWithChildren){
    useEffect(() => {
        AOS.init();
    }, [])

    return children
}