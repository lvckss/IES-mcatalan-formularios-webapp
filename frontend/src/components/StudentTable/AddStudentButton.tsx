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
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { UserRoundPlus } from "lucide-react";
import FormField from "@/components/StudentTable/FormField";
import DatePicker from "@/components/StudentTable/DatePicker";
import { api } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import SelectField from "@/components/StudentTable/SelectField";
import { PostStudent, PostRecord, PostEnrollment } from "@/types";

import PhoneFormField from "./phone-input/phone-form-field";

// ===================== API ===========================

// Fetch ciclos formativos data from API
async function getCiclos() {
    const response = await api.cycles.$get();
    const data = await response.json();
    return data;
}

// Fetch modulos data from API
async function getModulos() {
    const response = await api.modules.$get();
    const data = await response.json();
    return data.modulos;
}

async function createStudent(studentData: PostStudent) {
    const response = await api.students.$post({
        json: studentData,
    });
    if (!response.ok) {
        throw new Error('Error al crear el estudiante');
    }
    return response.json();
}

async function createRecord(recordData: PostRecord) {
    const response = await api.records.$post({
        json: recordData,
    });
    if (!response.ok) {
        throw new Error('Error al crear el expediente')
    }
    return response.json();
}

async function createMatriculas(enrollmentData: PostEnrollment) {
    const response = await api.enrollments.$post({
        json: enrollmentData,
    });
    if (!response.ok) {
        throw new Error('Error al crear las matrículas');
    }
    return response.json();
}

// =============================================================

const AddStudentButton: React.FC = () => {
    const [open, setOpen] = useState<boolean>(false); // useState QUE ABRE EL DIALOGO CUANDO CLICK EN EL BOTÓN
    const [nombre, setNombre] = useState<string>("");
    const [apellido_1, setApellido1] = useState<string>("");
    const [apellido_2, setApellido2] = useState<string | null>(null);
    const [num_tfno, setNum_tfno] = useState<string | null>(null);
    const [fechaNacimiento, setFechaNacimiento] = useState<Date | undefined>(undefined);
    const [selectedCiclo, setSelectedCiclo] = useState<string>("");
    const [selectedCicloCurso, setSelectedCicloCurso] = useState<string>("");
    const [turno, setTurno] = useState<'Diurno' | 'Vespertino' | 'Nocturno' | 'Distancia'>('Diurno');
    const [selectedModules, setSelectedModules] = useState<Record<number, string>>({});
    const [modulesFilter, setModulesFilter] = useState<string>("");
    const [selectedIDType, setSelectedIDType] = useState<string>("");
    const [selectedID, setSelectedID] = useState<string>("");
    const [errorLogicaID, setErrorLogicaID] = useState<string | null>(null);

    // Instantiate query client
    const queryClient = useQueryClient();

    const { isPending: ciclosLoading, error: ciclosError, data: ciclosData } = useQuery({
        queryKey: ['ciclos'],
        queryFn: getCiclos,
        staleTime: 5 * 60 * 1000, // Cacheamos los ciclos cada 5 minutos para evitar overloadear la API
    });

    const { isPending: modulosLoading, error: modulosError, data: modulosData } = useQuery({
        queryKey: ['modulos'],
        queryFn: getModulos,
        staleTime: 5 * 60 * 1000, // Cacheamos los módulos cada 5 minutos para evitar overloadear la API
    });

    const mutationStudent = useMutation({
        mutationFn: createStudent,
    });
    
    const mutationExpediente = useMutation({
        mutationFn: createRecord,
    });
    
    const mutationMatriculas = useMutation({
        mutationFn: createMatriculas,
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
                newState[moduleId] = "Matricula";
            }
            return newState;
        });
    };

    const handleModuleStatusChange = (moduleId: number, status: string) => {
        setSelectedModules(prev => ({
            ...prev,
            [moduleId]: status,
        }));
    };

    const handleDateChange = (date: Date | undefined) => {
        setFechaNacimiento(date);
    };

    /* const filteredModules = useMemo(() =>
        modulosData ? modulosData.filter((m) => m.cod_ciclo === selectedCiclo) : [],
        [modulosData, selectedCiclo]
    ); */

    const filteredModules = useMemo(() => {
        if (!modulosData) return [];
        const filter = modulesFilter.trim().toLowerCase();

        const cicloId = Number(selectedCiclo);
        let modules = modulosData.filter((m) => m.id_ciclo === cicloId && m.curso === selectedCicloCurso);
        console.log(selectedCiclo)
        console.log(modules)

        if (filter) {
            modules = modules.filter((m) => {
                // Create a combined string for each module
                const combinedString = `${m.id_modulo} - ${m.nombre} (${m.curso})`.toLowerCase();
                return combinedString.includes(filter);
            });
        }

        return modules;
    }, [modulosData, selectedCiclo, selectedCicloCurso, modulesFilter]);

    // Add this function to handle ciclo selection
    const handleCicloChange = (value: string) => {
        const [id, curso] = value.split("-");
        setSelectedCiclo(id);
        setSelectedCicloCurso(curso);
        setSelectedModules({});
        setModulesFilter("");
    };

    const handleIDType = (value: string) => {
        setSelectedIDType(value);
    };

    const calculateDNILetter = (number: string): string => {
        const letters = "TRWAGMYFPDXBNJZSQVHLCKE";
        const numericValue = parseInt(number, 10);
        const index = numericValue % 23;
        return letters[index];
    };

    const handleID = (id_type: string, value: string) => {
        // Siempre actualiza el valor del input
        setSelectedID(value);
        // Si no hay tipo de ID seleccionado, muestra un error
        if (!id_type) {
            setErrorLogicaID("Por favor, seleccione un tipo de ID.");
            return;
        }
    
        // Validación según el tipo de ID
        if (id_type === "dni") {
            const dniRegex = /^[0-9]{8}[A-Z]$/;
            if (!dniRegex.test(value)) {
                setErrorLogicaID("El DNI debe tener 8 dígitos y una letra mayúscula.");
            } else {
                const digits = value.slice(0, 8); // Los 8 dígitos
                const letter = value[8]; // La letra final
                const calculatedLetter = calculateDNILetter(digits);

                if (letter !== calculatedLetter) {
                    setErrorLogicaID(`DNI incorrecto.`);
                } else {
                setErrorLogicaID(null); // Limpia el error si es válido
                }
            }
        } else if (id_type === "nie") {
            const nieRegex = /^[XYZ][0-9]{7}[A-Z]$/;
            if (!nieRegex.test(value)) {
                setErrorLogicaID("El NIE debe comenzar con X, Y o Z, seguido de 7 dígitos y una letra mayúscula.");
            } else {
                const prefix = value[0] === "X" ? "0" : value[0] === "Y" ? "1" : "2"; // X=0, Y=1, Z=2
                const digits = prefix + value.slice(1, 8); // Construye un número de 8 dígitos
                const letter = value[8]; // La letra final
                const calculatedLetter = calculateDNILetter(digits);
                setErrorLogicaID(null); // Limpia el error si es válido
                if (letter !== calculatedLetter) {
                    setErrorLogicaID(`La lógica numérica del NIE es incorrecta.`);
                } else {
                    setErrorLogicaID(null); // NIE válido
                    }
                }
        } else if (id_type === "pasaporte") {
            setErrorLogicaID(null); // Sin validación específica para pasaporte
        } else {
            setErrorLogicaID("Tipo de ID no reconocido.");
        }
    };

    const [selectedYear, setSelectedYear] = useState<string>("");

    const generateSchoolYearOptions = (): { value: string; label: string }[] => {
        const currentYear = new Date().getFullYear(); // Año actual (2025 en este caso)
        const startYear = 2014; // Año de inicio
        const options: { value: string; label: string }[] = [];
    
        for (let year = currentYear; year >= startYear; year--) {
            const schoolYear = `${year}-${year + 1}`;
            options.push({
                value: schoolYear, // Ejemplo: "2024-2025"
                label: schoolYear, // Ejemplo: "2024-2025"
            });
        }
    
        return options;
    };

    if (ciclosLoading || modulosLoading) return 'Loading...';
    if (ciclosError) return 'An error has occurred: ' + ciclosError.message;
    if (modulosError) return 'An error has occurred: ' + modulosError.message;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); // Evita el comportamiento por defecto del formulario
    
        // Validar campos obligatorios
        if (!nombre || !apellido_1 || !selectedID || !fechaNacimiento || !selectedCiclo || !selectedYear) {
            toast("Complete todos los campos obligatorios.");
            return;
        }
    
        if (errorLogicaID) {
            toast("Por favor, corrija los errores en el ID.");
            return;
        }
    
        // Estructurar los datos para la solicitud POST
        const [anoInicio, anoFin] = selectedYear.split('-').map(Number);
        const studentData : PostStudent = {
                nombre: nombre,
                apellido_1: apellido_1,
                apellido_2: apellido_2 || null, // Puede ser opcional
                id_legal: selectedID,
                fecha_nac: fechaNacimiento, // Formato YYYY-MM-DD
                num_tfno: num_tfno,
        };
        
        const matriculas = Object.entries(selectedModules).map(([id, status]) => ({
                id_modulo: Number(id),
                status: status as "Matricula" | "Convalidada" | "Exenta" | "Trasladada",
        }));
    
        try {
            // Crear estudiante y obtener su ID
            const studentResponse = await mutationStudent.mutateAsync(studentData);
            const studentId = studentResponse.estudiante.id_estudiante;
    
            // Crear datos del expediente con el ID del estudiante
            const recordData : PostRecord = {
                id_estudiante: studentId,
                ano_inicio: anoInicio,
                ano_fin: anoFin,
                estado: "Activo" as "Activo" | "Finalizado" | "Abandonado" | "En pausa",
                turno: turno,
                id_ciclo: Number(selectedCiclo),
                curso: selectedCicloCurso,
            };            
    
            // Crear expediente y obtener su ID
            const recordResponse = await mutationExpediente.mutateAsync(recordData);
            const recordId = recordResponse.expediente.id_expediente;
    
            // Añadir el ID del expediente a cada matrícula
            const matriculasWithRecord = matriculas.map(matricula => ({
                ...matricula,
                id_expediente: recordId,
                completion_status: "En proceso" as "En proceso" | "Completado" | "Fallido" | "Retirado"
            }));
    
            // Crear matrículas
            await Promise.all(
                matriculasWithRecord.map(matricula => mutationMatriculas.mutateAsync(matricula))
            );

            // Invalidate the students query to trigger a refetch and update the list
            queryClient.invalidateQueries({ queryKey: ['get-total-students'] });
            
            // Cerrar diálogo y resetear formulario
            setOpen(false);
            setNombre("");
            setApellido1("");
            setApellido2(null);
            setSelectedID("");
            setSelectedIDType("");
            setFechaNacimiento(undefined);
            // Resetear otros campos si es necesario
            toast("Estudiante, expediente y matrículas creados con éxito.");
        } catch (error) {
            console.error('Error:', error);
            alert("Error al guardar los datos.");
        }
    };

    console.log(selectedModules)
    console.log("ciclo:" + selectedCiclo)
    console.log("curso:" + selectedCicloCurso)

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
                    transition-all duration-300 ease-in-out overflow-hidden max-h-[1800px]
                `}
                aria-describedby={undefined}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold mb-4">Añadir nuevo estudiante</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-nowrap gap-8">
                        <div className="flex-1 min-w-[395px] max-w-[450px]">
                            <div className="space-y-4">
                                <FormField label="Nombre" name="nombre" value={nombre} onChange={setNombre}/>
                                <FormField label="Apellido 1" name="apellido1" value={apellido_1} onChange={setApellido1} />
                                <FormField label="Apellido 2" name="apellido2" value={apellido_2 ?? ""} onChange={setApellido2} />
                                <PhoneFormField
                                    label="Teléfono"
                                    name="num_tfno"
                                    value={num_tfno ?? ''}
                                    onChange={setNum_tfno}
                                    placeholder="..."
                                    defaultCountry="ES"
                                    />
                                <>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="id_legal" className="text-right font-medium">ID Legal</Label>
                                        <SelectField
                                            label="Tipo ID"
                                            name="id_tipos"
                                            value={selectedIDType ? selectedIDType : ""}
                                            onValueChange={handleIDType}
                                            placeholder="Tipo ID"
                                            options={
                                                [
                                                    {value: "dni", label: "DNI"},
                                                    {value: "nie", label: "NIE"},
                                                    {value: "pasaporte", label: "Pasaporte"}
                                                ]
                                            }
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="id_legal" className="text-right font-medium"></Label>
                                        <Input 
                                            id="id_legal" 
                                            name="id_legal" 
                                            className="col-span-3"
                                            value={selectedID}
                                            onChange={(e) => handleID(selectedIDType, e.target.value)}
                                        />
                                    </div>
                                    {errorLogicaID && (
                                        <p style={{ color: "red", marginTop: "4px" }}>{errorLogicaID}</p>
                                    )}
                                </>
                                <div className="z-100">
                                    <DatePicker label="Fecha de nacimiento" name="fecha_nacimiento" onChange={handleDateChange} />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="ciclo_formativo" className="text-right font-medium">Ciclo Formativo</Label>
                                    <SelectField
                                        label="Ciclo Formativo"
                                        name="ciclo_formativo"
                                        value={selectedCiclo ? `${selectedCiclo}-${selectedCicloCurso}` : ""}
                                        onValueChange={handleCicloChange}
                                        placeholder="Seleccionar ciclo"
                                        options={ciclosData.ciclos.map((ciclo) => ({
                                            value: `${ciclo.id_ciclo}-${ciclo.curso}`,
                                            label: `${ciclo.nombre} (${ciclo.curso})`,
                                        }))}
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="turno" className="text-right font-medium">Turno</Label>
                                    <SelectField
                                        label="Turno"
                                        name="turno"
                                        value={turno ? turno : ""}
                                        onValueChange={(value => setTurno(value as "Diurno" | "Vespertino" | "Nocturno" | "Distancia"))}
                                        placeholder="Tipo ID"
                                        options={
                                            [
                                                {value: "Diurno", label: "Diurno"},
                                                {value: "Vespertino", label: "Vespertino"},
                                                {value: "Nocturno", label: "Nocturno"},
                                                {value: "Distancia", label: "Distancia"}
                                            ]
                                        }
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="ano_escolar" className="text-right font-medium">Año Escolar</Label>
                                    <SelectField
                                        label="Año Escolar"
                                        name="school_year"
                                        value={selectedYear}
                                        onValueChange={(value) => setSelectedYear(value)}
                                        placeholder="Seleccionar año escolar"
                                        options={generateSchoolYearOptions()}
                                    />
                                </div>
                            </div>
                        </div>
                        <Separator
                            orientation="vertical"
                            className={`h-auto transition-opacity duration-300 ease-in-out ${showSeparator ? 'opacity-100' : 'opacity-0'}`}
                        />
                        {showModules && (
                            <div className={`flex-1 transition-all duration-300 ease-in-out ${showModules ? 'opacity-100' : 'opacity-0'}`}>
                                {selectedCiclo && (
                                    <>
                                        <div className="flex gap-10">
                                            <h3 className="text-lg font-semibold mb-4">Módulos</h3>
                                            <input
                                                type="text"
                                                value={modulesFilter}
                                                onChange={(e) => setModulesFilter(e.target.value)}
                                                placeholder="Filtrar módulos"
                                                className="p-1 border border-gray-300 rounded mb-5 w-full mr-5 pl-3"
                                            />
                                        </div>
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
                        <Button type="submit" className="px-6 mr-4">Guardar estudiante</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

// Memoized ModuleList component
const ModuleList = React.memo(({ modules, selectedModules, onModuleToggle, onModuleStatusChange }: {
    modules: any[],
    selectedModules: Record<number, string>,
    onModuleToggle: (moduleId: number) => void,
    onModuleStatusChange: (moduleId: number, status: string) => void
}) => (
    <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {modules.map((module) => (
            <div key={module.id_modulo} className="grid grid-cols-[auto,1fr,auto] gap-3 items-center">
                <Checkbox
                    id={`module-${module.id_modulo}`}
                    checked={module.id_modulo in selectedModules}
                    onCheckedChange={() => onModuleToggle(module.id_modulo)}
                />
                <label htmlFor={`module-${module.id_modulo}`}
                    className="text-sm font-medium leading-none w-auto inline-block px-1">
                    {module.nombre}
                </label>
                <div className="w-[140px] p-2">
                    {module.id_modulo in selectedModules ? (
                        <div className="h-5">
                            <Select
                                value={selectedModules[module.id_modulo] || "Matricula"}
                                onValueChange={(value) => onModuleStatusChange(module.id_modulo, value as string)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Estado" />
                                </SelectTrigger>
                                <SelectContent position="popper" className="z-[100]">
                                    <SelectItem className="hover:bg-gray-100 cursor-pointer" value="Matricula">Matrícula</SelectItem>
                                    <SelectItem className="hover:bg-gray-100 cursor-pointer" value="Convalidada">Convalidada</SelectItem>
                                    <SelectItem className="hover:bg-gray-100 cursor-pointer" value="Exenta">Exenta</SelectItem>
                                    <SelectItem className="hover:bg-gray-100 cursor-pointer" value="Trasladada">Trasladada</SelectItem>
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
