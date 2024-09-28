import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { UserRoundPlus } from "lucide-react"
import FormField from './FormField';
import DatePicker from './DatePicker';


const ciclosFormativos = [
    { id: 1, nombre_ciclo: "Desarrollo de Aplicaciones Web", nivel: "Grado Superior" },
    { id: 2, nombre_ciclo: "Administración de Sistemas Informáticos en Red", nivel: "Grado Superior" },
    { id: 3, nombre_ciclo: "Sistemas Microinformáticos y Redes", nivel: "Grado Medio" },
]

const modulos = [
    { id: 1, codigo_modulo: "M01", nombre_modulo: "Sistemas Informáticos", ciclo_asignado: 1, duracion: 170 },
    { id: 2, codigo_modulo: "M02", nombre_modulo: "Bases de Datos", ciclo_asignado: 1, duracion: 170 },
    { id: 3, codigo_modulo: "M03", nombre_modulo: "Programación", ciclo_asignado: 1, duracion: 230 },
    { id: 4, codigo_modulo: "M04", nombre_modulo: "Lenguajes de Marcas", ciclo_asignado: 1, duracion: 140 },
]

type ModuleStatus = "matricula" | "convalidada" | null;

const AddStudentButton: React.FC = () => {
    const [open, setOpen] = useState(false)
    const [selectedCiclo, setSelectedCiclo] = useState("")
    const [showSeparator, setShowSeparator] = useState(false)
    const [showModules, setShowModules] = useState(false)
    const [selectedModules, setSelectedModules] = useState<Record<number, ModuleStatus>>({})

    useEffect(() => {
        if (selectedCiclo && selectedCiclo !== "unassigned") {
            const separatorTimer = setTimeout(() => setShowSeparator(true), 300);
            const modulesTimer = setTimeout(() => setShowModules(true), 600);
            return () => {
                clearTimeout(separatorTimer);
                clearTimeout(modulesTimer);
            };
        } else {
            setShowSeparator(false);
            setShowModules(false);
            setSelectedModules({});
        }
    }, [selectedCiclo]);

    const handleModuleToggle = (moduleId: number) => {
        setSelectedModules(prev => {
          const newState = { ...prev }
          if (moduleId in newState) {
            delete newState[moduleId]
          } else {
            newState[moduleId] = null
          }
          return newState
        })
    }

    const handleModuleStatusChange = (moduleId: number, status: ModuleStatus) => {
        setSelectedModules(prev => ({
          ...prev,
          [moduleId]: status,
        }))
    }

    const handleDateChange = (date: Date | undefined) => {
        console.log("Selected date:", date)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <UserRoundPlus className="mr-2 h-5 w-5" />Añadir estudiante
                </Button>
            </DialogTrigger>
            <DialogContent className={` ${selectedCiclo && selectedCiclo !== "unassigned" ? 'sm:max-w-[1000px]' : 'sm:max-w-[450px]'} transition-all duration-300 ease-in-out overflow-hidden`}>
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold mb-4">Añadir nuevo estudiante</DialogTitle>
                </DialogHeader>
                <div className="flex flex-wrap gap-8 h-[calc(100%-7rem)]">
                    <div className="flex-1 min-w-[300px] max-w-[450px]">
                        <form className="space-y-4">
                            <FormField label="Nombre" name="nombre" />
                            <FormField label="Apellido 1" name="apellido1" />
                            <FormField label="Apellido 2" name="apellido2" />
                            <FormField label="ID Legal" name="id_legal" />
                            <DatePicker 
                                label="Fecha de nacimiento" 
                                name="fecha_nacimiento" 
                                onChange={handleDateChange}
                            />
                            {/* <FormField label="Fecha de nacimiento" name="fecha_nacimiento" type="date" /> */}
                            <FormField label="Código de Expediente" name="codigo_expediente" />
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="ciclo_formativo" className="text-right font-medium">Ciclo Formativo</Label>
                                <Select onValueChange={(value) => setSelectedCiclo(value)} value={selectedCiclo}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Seleccionar ciclo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="unassigned">Seleccionar ciclo</SelectItem>
                                        {ciclosFormativos.map((ciclo) => (
                                            <SelectItem key={ciclo.id} value={ciclo.id.toString()}>
                                                {ciclo.nombre_ciclo} ({ciclo.nivel})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <FormField label="Año Escolar" name="ano_escolar" />
                        </form>
                    </div>
                    <Separator 
                        orientation="vertical"
                        className={`h-auto transition-opacity duration-300 ease-in-out ${showSeparator ? 'opacity-100' : 'opacity-0'}`}
                    />
                    <div 
                        className={`flex-1 transition-all duration-300 ease-in-out ${
                        showModules ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
                        }`}
                    >
                        { selectedCiclo && (
                            <>
                                <h3 className="text-lg font-semibold mb-4">Módulos</h3>
                                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                    {modulos
                                        .filter(m => m.ciclo_asignado === parseInt(selectedCiclo))
                                        .map((module) => (
                                            <div key={module.id} className="grid grid-cols-[auto,1fr,auto] gap-3 items-center">
                                                <Checkbox
                                                    id={`module-${module.id}`}
                                                    checked={module.id in selectedModules}
                                                    onCheckedChange={() => handleModuleToggle(module.id)}
                                                />
                                                <label htmlFor={`module-${module.id}`} className="text-sm font-medium leading-none">
                                                    {module.codigo_modulo} - {module.nombre_modulo} ({module.duracion} horas)
                                                </label>
                                                <div className="w-[140px] p-2">
                                                    {module.id in selectedModules ? (
                                                        <Select
                                                        value={selectedModules[module.id] || ""}
                                                        onValueChange={(value) => handleModuleStatusChange(module.id, value as ModuleStatus)}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Estado" />
                                                            </SelectTrigger>
                                                            <SelectContent position="popper" className="z-[100]">
                                                                <SelectItem value="matricula">Matrícula</SelectItem>
                                                                <SelectItem value="convalidada">Convalidada</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    ) : ( 
                                                        <div className="h-10"></div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
                <div className="flex justify-end mt-6">
                    <Button type="submit" className="px-6">Guardar estudiante</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AddStudentButton;