import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Encuesta } from '@/wss/tipos'
import { useConexionProfe } from '@/wss-cli/providers/wss-profe-context'
import { cn } from "@/lib/utils"
import { BotonEncuesta } from "./acciones"
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Icon } from "@iconify/react/dist/iconify.js"


export function AccionesToggle({ encuesta }: { encuesta: Encuesta }) {
    const { revelar, ocultar, enfocar, publicar, esconder, abrir, cerrar, borrar } = useConexionProfe()


    return (<div className="flex flex-col  my-4 gap-2">
        <div className="flex items-center space-x-2">
            <Switch
                checked={encuesta.isPublished}
                className="data-[state=checked]:bg-indigo-500"
                onCheckedChange={(checked) => checked ? publicar(encuesta.id) : esconder(encuesta.id)}
                id="publicar" />
            <Label className={cn(encuesta.isPublished && 'text-indigo-500')}
                htmlFor="publicar">La encuesta es visible para los estudiantes</Label>
        </div>
        <div className="flex items-center space-x-2">
            <Switch
                checked={encuesta.isOpen}
                className="data-[state=checked]:bg-emerald-500"
                disabled={!encuesta.isPublished}
                onCheckedChange={(checked) => checked ? abrir(encuesta.id) : cerrar(encuesta.id)}
                id="abrir" />
            <Label
                htmlFor="abrir"
                className={cn(encuesta.isOpen && 'text-emerald-500')}>
                Los estudiantes pueden votar
            </Label>
        </div>
        <div className="flex items-center space-x-2">
            <Switch
                className="data-[state=checked]:bg-cyan-500"
                disabled={!encuesta.isPublished}
                checked={encuesta.isRevealed}
                onCheckedChange={(checked) => checked ? revelar(encuesta.id) : ocultar(encuesta.id)}
                id="votos" />
            <Label
                htmlFor="votos"
                className={cn(encuesta.isRevealed && 'text-cyan-500')}>
                Los estudiantes pueden ver los votos
            </Label>
        </div>

        <div className="flex justify-center my-2 gap-4">
            {/* Enfocar */}

            <BotonEncuesta
                className='bg-purple-500 text-white px-4 py-2 disabled:bg-slate-100 disabled:border-slate-500 disabled:text-slate-500'
                onClick={() => enfocar(encuesta.id)}
                disabled={!encuesta.isPublished || encuesta.isFocused}
                texto="Enfocar"
                icon="material-symbols:center-focus-weak-rounded"
            />


            {/* Eliminar */}
            <Dialog>
                <DialogTrigger>
                    <p className="hidden sm:flex bg-rose-700 text-white px-4 py-2 rounded-xl flex-col items-center gap-1 w-20 text-xs md:min-w-24 border'">
                        Eliminar
                    </p>
                    <p className="flex sm:hidden bg-rose-700 text-white px-4 py-2 rounded-xl flex-col items-center gap-1 w-20 text-xs md:min-w-24 border'">
                        <Icon icon={'lucide:trash-2'} />
                    </p>
                </DialogTrigger>
                <DialogContent className="flex flex-col items-center">
                    <DialogHeader>
                        <DialogTitle className="text-center leading-6">
                            ¿Estás seguro/a de que deseas eliminar la pregunta?
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex gap-2">
                        <DialogClose className="flex gap-4">
                            <p className="bg-emerald-700/90 text-white px-4 py-2 min-w-40 text-xl rounded-full">Cancelar</p>
                            <p
                            className="bg-rose-700 text-white px-4 py-2 min-w-40 text-xl rounded-full"
                            onClick={() => borrar(encuesta.id)}>
                                Eliminar
                            </p>
                        </DialogClose>
                        
                    </div>
                </DialogContent>
            </Dialog>
        </div>

    </div>
    )
}