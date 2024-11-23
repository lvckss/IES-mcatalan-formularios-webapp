import React, { useState, useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { UserRoundPlus } from "lucide-react";
import FormField from "@/components/StudentTable/FormField";
import DatePicker from "@/components/StudentTable/DatePicker";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import SelectField from "@/components/StudentTable/SelectField";

// Define type for module status
type ModuleStatus = "matricula" | "convalidada" | null;

// ================== DATA FETCHING ===========================

// Fetch ciclos formativos data from API
async function getCiclosFormativos() {
    const response = await api.ciclos.$get();
    const data = await response.json();
    return data.ciclos_unicos;
}

// Fetch modulos data from API
async function getModulos() {
    const response = await api.modulos.$get();
    const data = await response.json();
    return data.modulos;
}

// =============================================================

const AddStudentButton: React.FC = () => {
    const [open, setOpen] = useState<boolean>(false); // useState QUE ABRE EL DIALOGO CUANDO CLICK EN EL BOTÓN
    const [selectedCiclo, setSelectedCiclo] = useState<string>("");
    const [selectedModules, setSelectedModules] = useState<Record<number, ModuleStatus>>({});

    const { isPending: ciclosLoading, error: ciclosError, data: ciclosData } = useQuery({
        queryKey: ['ciclos-formativos'],
        queryFn: getCiclosFormativos,
        staleTime: 5 * 60 * 1000, // Cacheamos los ciclos cada 5 minutos para evitar overloadear la API
    });

    const { isPending: modulosLoading, error: modulosError, data: modulosData } = useQuery({
        queryKey: ['modulos'],
        queryFn: getModulos,
        staleTime: 5 * 60 * 1000, // Cacheamos los módulos cada 5 minutos para evitar overloadear la API
    });

    const showSeparator = selectedCiclo && selectedCiclo !== "unassigned";
    const showModules = showSeparator

    // gestiona el estado de los modulos
    const handleModuleToggle = (moduleId: number) => {
        setSelectedModules(prev => {
            const newState = { ...prev };
            if (moduleId in newState) {
                delete newState[moduleId];
            } else {
                newState[moduleId] = "matricula";
            }
            return newState;
        });
    };

    const handleModuleStatusChange = (moduleId: number, status: ModuleStatus) => {
        setSelectedModules(prev => ({
            ...prev,
            [moduleId]: status,
        }));
    };

    const handleDateChange = (date: Date | undefined) => {
        console.log("Selected date:", date);
    };

    const filteredModules = useMemo(() =>
        modulosData ? modulosData.filter((m) => m.cod_ciclo === selectedCiclo) : [],
        [modulosData, selectedCiclo]
    );

    // Add this function to handle ciclo selection
    const handleCicloChange = (value: string) => {
        setSelectedCiclo(value);
        setSelectedModules({});
    };

    if (ciclosLoading || modulosLoading) return 'Loading...';
    if (ciclosError) return 'An error has occurred: ' + ciclosError.message;
    if (modulosError) return 'An error has occurred: ' + modulosError.message;

    console.log(selectedModules)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <UserRoundPlus className="mr-2 h-5 w-5" />Añadir estudiante
                </Button>
            </DialogTrigger>
            <DialogContent
                className={`
                    ${selectedCiclo && selectedCiclo !== "unassigned" ? 'sm:max-w-[900px]' : 'sm:max-w-[450px]'}
                    transition-all duration-300 ease-in-out overflow-hidden
                `}
                aria-describedby={undefined}
            >
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold mb-4">Añadir nuevo estudiante</DialogTitle>
                </DialogHeader>
                <div className="flex flex-nowrap gap-8 h-[calc(100%-7rem)]">
                    <div className="flex-1 min-w-[330px] max-w-[450px]">
                        <form className="space-y-4">
                            <FormField label="Nombre" name="nombre" />
                            <FormField label="Apellido 1" name="apellido1" />
                            <FormField label="Apellido 2" name="apellido2" />
                            <FormField label="ID Legal" name="id_legal" />
                            <DatePicker label="Fecha de nacimiento" name="fecha_nacimiento" onChange={handleDateChange} />
                            <FormField label="Código de Expediente" name="codigo_expediente" />
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="ciclo_formativo" className="text-right font-medium">Ciclo Formativo</Label>
                                <SelectField
                                    label="Ciclo Formativo"
                                    name="ciclo_formativo"
                                    value={selectedCiclo}
                                    onValueChange={handleCicloChange}
                                    placeholder="Seleccionar ciclo"
                                    options={ciclosData.ciclos.map((ciclo) => ({
                                        value: ciclo.codigo.toString(),
                                        label: ciclo.nombre
                                    }))}
                                />
                            </div>
                            <FormField label="Año Escolar" name="ano_escolar" />
                        </form>
                    </div>
                    <Separator
                        orientation="vertical"
                        className={`h-auto transition-opacity duration-300 ease-in-out ${showSeparator ? 'opacity-100' : 'opacity-0'}`}
                    />
                    {showModules && (
                        <div className={`flex-1 transition-all duration-300 ease-in-out ${showModules ? 'opacity-100' : 'opacity-0'}`}>
                            {selectedCiclo && (
                                <>
                                    <h3 className="text-lg font-semibold mb-4">Módulos</h3>
                                    <ModuleList
                                        modules={filteredModules}
                                        selectedModules={selectedModules}
                                        onModuleToggle={handleModuleToggle}
                                        onModuleStatusChange={handleModuleStatusChange}
                                    />
                                </>
                            )}
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button type="submit" className="px-6">Guardar estudiante</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// Memoized ModuleList component
const ModuleList = React.memo(({ modules, selectedModules, onModuleToggle, onModuleStatusChange }: {
    modules: any[],
    selectedModules: Record<number, ModuleStatus>,
    onModuleToggle: (moduleId: number) => void,
    onModuleStatusChange: (moduleId: number, status: ModuleStatus) => void
}) => (
    <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {modules.map((module) => (
            <div key={module.cod_mod} className="grid grid-cols-[auto,1fr,auto] gap-3 items-center">
                <Checkbox
                    id={`module-${module.cod_mod}`}
                    checked={module.cod_mod in selectedModules}
                    onCheckedChange={() => onModuleToggle(module.cod_mod)}
                />
                <label htmlFor={`module-${module.cod_mod}`}
                    className="text-sm font-medium leading-none w-auto inline-block px-2">
                    {module.cod_mod} - {module.nombre}
                </label>
                <div className="w-[140px] p-2">
                    {module.cod_mod in selectedModules ? (
                        <div className="h-5">
                            <Select
                                value={selectedModules[module.cod_mod] || ""}
                                onValueChange={(value) => onModuleStatusChange(module.cod_mod, value as ModuleStatus)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Estado" />
                                </SelectTrigger>
                                <SelectContent position="popper" className="z-[100]">
                                    <SelectItem value="matricula">Matrícula</SelectItem>
                                    <SelectItem value="convalidada">Convalidada</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    ) : (
                        <div className="h-5"></div>
                    )}
                </div>
            </div>
        ))}
    </div>
));

export default AddStudentButton;
