import React, { useState, useMemo, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";

import { cn } from "@/lib/utils";

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
import { useQuery, useQueries, useMutation, useQueryClient } from "@tanstack/react-query";
import SelectField from "@/components/StudentTable/SelectField";
import { PostStudent, PostRecord, PostEnrollment } from "@/types";

import PhoneFormField from "./phone-input/phone-form-field";

// typing de las notas

export type GradeCode =
    | "NE"
    | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "10-MH"
    | "CV" | "CV-5" | "CV-6" | "CV-7" | "CV-8" | "CV-9" | "CV-10"
    | "AM"
    | "RC"
    | "APTO"
    | "NO APTO";

export interface MatriculaPrevia {
    id_modulo: number;
    nota: GradeCode;
}

// ===================== API ===========================

// Fetch ciclos formativos data from API
async function getCiclosByCodigo({ codigo }: { codigo: string }) {
    const response = await api.cycles.code[':codigo'].$get({
        param: { codigo }
    });

    if (!response) {
        throw new Error("server error");
    }

    const data = await response.json();      // { ciclo: … }
    return data.ciclo;
}

// Fetch ciclos sin diferenciar curso
// Función para obtener los ciclos sin duplicados (por nombre) 
async function getCiclosUnicos() {
    // La nueva ruta es GET /por-nombre bajo el controlador de ciclos
    // En tu cliente generado por Hono queda algo así:
    const response = await api.cycles['by-name'].$get();
    const data = await response.json();
    // La respuesta es { ciclos: [...] }
    return data.ciclos;
}

async function getModulosByCycleId({ ciclo_id }: { ciclo_id: number }) {
    const response = await api.modules.cycle_id[':cycle_id'].$get({
        param: { cycle_id: String(ciclo_id) }
    });

    if (!response) {
        throw new Error("server error");
    }

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

// ===========================================================================================================================

const AddStudentButton: React.FC = () => {
    const [open, setOpen] = useState<boolean>(false); // useState QUE ABRE EL DIALOGO CUANDO CLICK EN EL BOTÓN
    const [nombre, setNombre] = useState<string>("");
    const [apellido_1, setApellido1] = useState<string>("");
    const [apellido_2, setApellido2] = useState<string | null>(null);
    const [num_tfno, setNum_tfno] = useState<string | null>(null);
    const [num_expediente, setNum_expediente] = useState<string>("");
    const [fechaNacimiento, setFechaNacimiento] = useState<Date | undefined>(undefined);
    const [selectedCiclo, setSelectedCiclo] = useState<string>("");
    const [selectedModules, setSelectedModules] = useState<Record<number, [string, number | null]>>({});
    const [modulesFilter, setModulesFilter] = useState<string>("");
    const [selectedIDType, setSelectedIDType] = useState<string>("");
    const [selectedID, setSelectedID] = useState<string>("");
    const [errorLogicaID, setErrorLogicaID] = useState<string | null>(null);
    const [selectedYear, setSelectedYear] = useState<string>("");
    const [fechaPagoTitulo, setFechaPagoTitulo] = useState<Date | undefined>(undefined);
    // Instantiate query client
    const queryClient = useQueryClient();

    const { isPending: ciclosLoading, error: ciclosError, data: ciclosData } = useQuery({
        queryKey: ['ciclos'],
        queryFn: getCiclosUnicos,
        staleTime: 5 * 60 * 1000, // Cacheamos los ciclos cada 5 minutos para evitar overloadear la API
    });

    const {
        data: cicloData, // objeto/array devuelto por la API
    } = useQuery({
        queryKey: ['ciclo', selectedCiclo],            // <‑‑ clave de caché
        queryFn: () => getCiclosByCodigo({ codigo: selectedCiclo! }),
        enabled: Boolean(selectedCiclo),               // solo dispara si hay código
        staleTime: 5 * 60 * 1000,               // 5 min de frescura
    });

    const cursoIds = useMemo(
        () =>
            cicloData?.reduce((acc, ciclo) => {
                //   ↳ ciclo.curso might be '1º', '2º', etc.
                acc[ciclo.curso] = ciclo.id_ciclo;
                return acc;
            }, {} as Record<string, number>) ?? {},
        [cicloData],
    );

    const modulosQueries = useQueries({
        queries: Object.entries(cursoIds).map(([curso, id]) => ({
            queryKey: ['modulos', id],                   // caches each curso separately
            queryFn: () => getModulosByCycleId({ ciclo_id: id }),
            enabled: Boolean(id),                        // skip if the id is still undefined
            staleTime: 5 * 60 * 1000,                   // 5 min cache, same policy as the rest
        })),
    });

    const modulosByCurso = useMemo(() => {
        const out: Record<string, any[]> = {};
        modulosQueries.forEach((q, idx) => {
            const curso = Object.keys(cursoIds)[idx];    // '1º', '2º', …
            out[curso] = q.data ?? [];                   // data might be undefined while loading
        });
        return out;
    }, [modulosQueries, cursoIds]);

    /* —–––––––––––––––––––––––––––– módulos en bruto —––––––––––––––––––––––––– */
    const modulosPrimerCurso = modulosByCurso['1º'] ?? [];
    const modulosSegundoCurso = modulosByCurso['2º'] ?? [];

    /* —–––––––––––––––––––– filtrados por texto ––––––––––––––––––––––––––––––– */
    const filteredPrimer = useMemo(
        () =>
            modulosPrimerCurso.filter(m =>
                m.nombre.toLowerCase().includes(modulesFilter.toLowerCase())
            ),
        [modulosPrimerCurso, modulesFilter],
    );

    const filteredSegundo = useMemo(
        () =>
            modulosSegundoCurso.filter(m =>
                m.nombre.toLowerCase().includes(modulesFilter.toLowerCase())
            ),
        [modulosSegundoCurso, modulesFilter],
    );


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
                newState[moduleId] = ["Matricula", 0];
            }
            return newState;
        });
    };

    const handleDateChange = (date: Date | undefined) => {
        setFechaNacimiento(date);
    };

    const handleFechaPagoTituloChange = (date: Date | undefined) => {
        setFechaPagoTitulo(date);
    }

    // Add this function to handle ciclo selection
    const handleCicloChange = (value: string) => {
        setSelectedCiclo(value);
        setSelectedModules({});
        setModulesFilter("");
    };

    if (ciclosLoading) return 'Loading...';
    if (ciclosError) return 'An error has occurred: ' + ciclosError.message;

    const handleIDType = (value: string) => {
        setErrorLogicaID(null);
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
        const studentData: PostStudent = {
            nombre: nombre,
            apellido_1: apellido_1,
            apellido_2: apellido_2 || null, // Puede ser opcional
            id_legal: selectedID,
            tipo_id_legal: selectedIDType,
            fecha_nac: fechaNacimiento, // Formato YYYY-MM-DD
            num_tfno: num_tfno,
            num_expediente: num_expediente
        };

        const matriculas: MatriculaPrevia[] = Object.entries(selectedModules).map(([id]) => ({
            id_modulo: Number(id),
            nota: 'NE',
        }));

        // da igual si pillamos la id de primero o segundo, nos importa para luego pillar el código e.g (SAN301-LOE)
        const cicloIDPrimero = cursoIds['1º'];

        try {
            // Crear estudiante y obtener su ID
            const studentResponse = await mutationStudent.mutateAsync(studentData);
            const studentId = studentResponse.estudiante.id_estudiante;

            // Crear datos de los expedientes con el ID del estudiante
            const recordData: PostRecord = {
                id_estudiante: studentId,
                ano_inicio: anoInicio,
                ano_fin: anoFin,
                convocatoria: "Ordinaria" as "Ordinaria" | "Extraordinaria",
                id_ciclo: Number(cicloIDPrimero),
                fecha_pago_titulo: fechaPagoTitulo || null,
            };

            const recordResponse = await mutationExpediente.mutateAsync(recordData);
            const recordId = recordResponse.expediente.id_expediente;

            // Añadir el ID del expediente a cada matrícula
            const matriculasWithRecord = matriculas.map(matricula => ({
                ...matricula,
                id_expediente: recordId,
            }));

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
            setNum_tfno(null);
            setNum_expediente("");
            setFechaNacimiento(undefined);
            setSelectedCiclo("");
            setFechaPagoTitulo(undefined);
            setSelectedModules({});
            setModulesFilter("");
            setSelectedIDType("");
            setSelectedID("");
            setErrorLogicaID(null);
            setSelectedYear("");
            // Resetear otros campos si es necesario
            toast("Estudiante, expediente y matrículas creados con éxito.");
        } catch (error) {
            console.error('Error:', error);
            alert("Error al guardar los datos.");
        }
    };

    const closeDialog = (next: boolean) => {
        if (!next) {
            // about to close → move focus out
            const el = document.activeElement as HTMLElement | null;
            el?.blur();
        }
        setOpen(next);
    };

    return (
        <Dialog open={open} onOpenChange={closeDialog}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <UserRoundPlus className="mr-2 h-5 w-5" />Añadir estudiante
                </Button>
            </DialogTrigger>
            <DialogContent
                /* 1. keep the two possible widths you already had */
                className={cn(
                    selectedCiclo && selectedCiclo !== "unassigned"
                        ? "sm:max-w-[1000px]"
                        : "sm:max-w-[450px]",
                    /* 2. NEW ­– freeze the height */
                    "min-h-[680px] max-h-[680px]",   // pick any value / use 75vh, etc.
                    /* 3. do NOT clip children, only show a vertical scrollbar if
                        something outside your module column spills */
                )}
                aria-describedby={undefined}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold mb-4">Añadir nuevo estudiante (matrícula)</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-nowrap gap-8">
                        <div className="flex-1 min-w-[320px] max-w-[420px]">
                            <div className="space-y-4">
                                <FormField label="Nombre" name="nombre" value={nombre} onChange={setNombre} />
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
                                                    { value: "dni", label: "DNI" },
                                                    { value: "nie", label: "NIE" },
                                                    { value: "pasaporte", label: "Pasaporte" }
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
                                <FormField label="Núm. de expediente" name="num_expediente" value={num_expediente ?? ""} onChange={setNum_expediente} />
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="ciclo_formativo" className="text-right font-medium">Ciclo Formativo</Label>
                                    <SelectField
                                        label="Ciclo Formativo"
                                        name="ciclo_formativo"
                                        value={selectedCiclo ? `${selectedCiclo}` : ""}
                                        onValueChange={handleCicloChange}
                                        placeholder="Seleccionar ciclo"
                                        options={ciclosData.map((ciclo) => ({
                                            value: `${ciclo.codigo}`,
                                            label: `${ciclo.nombre} (${ciclo.codigo})`,
                                        }))}
                                    />
                                </div>
                                <div className="z-100">
                                    <DatePicker label="Fecha pago del título:" name="fecha_pago_titulo" onChange={handleFechaPagoTituloChange} />
                                </div>
                            </div>
                        </div>
                        <Separator
                            orientation="vertical"
                            className={`h-auto transition-opacity duration-500 ease-in-out ${showSeparator ? 'opacity-100' : 'opacity-0'
                                }`}
                        />
                        {showModules && (
                            <div
                                className={`flex-1 transition-all duration-500 ease-in-out mb-3 max-h-[480px] ${showModules ? 'opacity-100' : 'opacity-0'
                                    }`}
                            >
                                <input
                                    type="text"
                                    value={modulesFilter}
                                    onChange={(e) => setModulesFilter(e.target.value)}
                                    placeholder="Filtrar módulos"
                                    className="p-1 border border-gray-300 rounded mb-5 mr-5 w-full pl-3"
                                />
                                {selectedCiclo && (
                                    <>
                                        {/* search bar … unchanged … */}
                                        {/* ▸▸▸ NEW WRAPPER ◂◂◂  — 60 % viewport height max */}
                                        <div className="max-h-[450px] overflow-y-auto pr-2 space-y-6 pb-5">
                                            <div className="grid grid-cols-5 items-center mb-1 mt-1">
                                                <Label htmlFor="ano_escolar" className="font-medium">Año Escolar:</Label>
                                                <SelectField
                                                    label="Año Escolar"
                                                    name="school_year"
                                                    value={selectedYear}
                                                    onValueChange={(value) => setSelectedYear(value)}
                                                    placeholder="Seleccionar año escolar"
                                                    options={generateSchoolYearOptions()}
                                                />
                                            </div>
                                            <Separator/>
                                            {/* ºººº 1º CURSO ºººº */}
                                            {filteredPrimer.length > 0 && (
                                                <>
                                                    <h4 className="font-medium mb-2 top-0 bg-white/90 backdrop-blur">
                                                        Primer curso
                                                    </h4>
                                                    <ModuleList
                                                        modules={filteredPrimer}
                                                        selectedModules={selectedModules}
                                                        onModuleToggle={handleModuleToggle}
                                                    />
                                                </>
                                            )}
                                            <Separator />
                                            {/* ºººº 2º CURSO ºººº */}
                                            {filteredSegundo.length > 0 && (
                                                <>
                                                    <h4 className="font-medium mb-2 sticky top-0 bg-white/90 backdrop-blur">
                                                        Segundo curso
                                                    </h4>
                                                    <ModuleList
                                                        modules={filteredSegundo}
                                                        selectedModules={selectedModules}
                                                        onModuleToggle={handleModuleToggle}
                                                    />
                                                </>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="submit" className="px-5 mr-4">Guardar estudiante</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

// Memoized ModuleList component
const ModuleList = React.memo(({ modules, selectedModules, onModuleToggle }: {
    modules: any[],
    selectedModules: Record<number, [string, number | null]>,
    onModuleToggle: (moduleId: number) => void,
}) => (
    <div className="space-y-3">
        {modules.map((module) => {
            return (
                <div key={module.id_modulo} className="flex">
                    <Checkbox
                        id={`module-${module.id_modulo}`}
                        checked={module.id_modulo in selectedModules}
                        onCheckedChange={() => onModuleToggle(module.id_modulo)}
                    />
                    <span className="text-sm font-medium leading-none w-auto inline-block ml-3">
                        {module.nombre}
                    </span>
                </div>
            )
        })}
    </div>
));

export default AddStudentButton;
