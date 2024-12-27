import { AlignCenter, CircleChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"

interface ButtonIconProps { onClick: () => void }

export function ButtonIcon({ onClick }: ButtonIconProps) {

    return (

        <Button variant="outline" size="icon" onClick={onClick}>
            <CircleChevronDown className="w-full h-full" />
        </Button>

    )
}

