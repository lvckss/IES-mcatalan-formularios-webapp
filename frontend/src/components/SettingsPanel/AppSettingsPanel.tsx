// AppSettingsPanel.tsx
import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import { Cycle, Law, Module, PostModule, Directivo } from "@/types";

type CyclePut = {
    curso: string;
    nombre: string;
    codigo: string;
    norma_1: string;
    norma_2: string;
    ley: number;
    tipo_ciclo: "GM" | "GS";
};

type CycleGroup = {
    codigo: string;
    nombre: string;
    tipo_ciclo: "GM" | "GS";
    ley: number;
    norma_1: string;
    norma_2: string;
    cursos: Cycle[]; // filas reales (cada una con id_ciclo + curso)
};

type IdentityUser = {
    id: string;
    email: string;
    name?: string | null;
    data?: { role?: string } | null; // better-auth suele meter custom fields aquí
};

// helpers

function normalizeList<T>(data: any, keys: string[]): T[] {
    if (Array.isArray(data)) return data as T[];
    for (const k of keys) {
        if (Array.isArray(data?.[k])) return data[k] as T[];
    }
    return [];
}

function groupCyclesByCodigo(cycles: Cycle[]): CycleGroup[] {
    const map = new Map<string, CycleGroup>();

    for (const c of cycles) {
        const key = c.codigo;
        const existing = map.get(key);

        if (!existing) {
            map.set(key, {
                codigo: c.codigo,
                nombre: c.nombre,
                tipo_ciclo: c.tipo_ciclo,
                ley: c.ley,
                norma_1: c.norma_1,
                norma_2: c.norma_2,
                cursos: [c],
            });
        } else {
            existing.cursos.push(c);
        }
    }

    // ordena cursos dentro del grupo, y los grupos
    const groups = Array.from(map.values());
    for (const g of groups) {
        g.cursos.sort((a, b) => String(a.curso).localeCompare(String(b.curso)));
    }
    groups.sort((a, b) => a.codigo.localeCompare(b.codigo));

    return groups;
}

function uniqueCursosFromGroup(g: CycleGroup): string[] {
    return Array.from(new Set(g.cursos.map((x) => String(x.curso)))).sort((a, b) =>
        a.localeCompare(b)
    );
}

function cicloIdFromGroupAndCurso(g: CycleGroup, curso: string): number | null {
    const found = g.cursos.find((x) => String(x.curso) === String(curso));
    return found?.id_ciclo ?? null;
}

function nextCursoNumber(existingCursos: string[]): number {
    // Convertimos a números solo los que sean números válidos
    const nums = existingCursos
        .map((c) => Number(String(c).replace(/[^\d]/g, ""))) // por si viene "1º" o "2º"
        .filter((n) => Number.isFinite(n) && n > 0);

    // Si no hay nada, empezamos en 1
    if (nums.length === 0) return 1;

    // siguiente = max + 1
    const max = Math.max(...nums);
    return max + 1;
}

// QUERIES

async function getLeyes(): Promise<Law[]> {
    const res = await api.laws.$get();
    const data = await res.json();
    return normalizeList<Law>(data, ["leyes", "data", "items"]);
}

async function createLey(nombre_ley: string) {
    const res = await api.laws.$post({ json: { nombre_ley } });
    if (!res.ok) throw new Error("No se pudo crear la ley");
    return res.json();
}

async function deleteLey(id: number) {
    const res = await api.laws[":id"].$delete({ param: { id: String(id) } });
    if (!res.ok) throw new Error("No se pudo eliminar la ley");
    return res.json();
}

// los ciclos se fetchean sin diferenciar por curso
async function getCiclosByLey(leyId: number): Promise<Cycle[]> {
    const res = await api.cycles.law[":ley"].$get({
        param: { ley: String(leyId) },
    });

    if (!res.ok) {
        throw new Error("no existen ciclos con esa ley");
    }

    const data: { ciclo: Cycle[] } = await res.json();
    return data.ciclo;
}

async function createCiclo(payload: Omit<Cycle, "id">) {
    const res = await api.cycles.$post({ json: payload });
    if (!res.ok) throw new Error("No se pudo crear el ciclo");
    return res.json();
}

async function updateCiclo(id: number, payload: CyclePut) {
    const res = await api.cycles[":id"].$put({
        param: { id: String(id) },
        json: payload,
    });
    if (!res.ok) throw new Error("No se pudo actualizar el ciclo");
    return res.json();
}

async function deleteCiclo(id: number) {
    const res = await api.cycles[":id"].$delete({ param: { id: String(id) } });
    if (!res.ok) throw new Error("No se pudo eliminar el ciclo");
    return res.json();
}

async function getModulosByCiclo(cicloId: number): Promise<Module[]> {
    // Si tu API es /modulos?id_ciclo=ID
    const res = await api.modules.cycle_id[":cycle_id"].$get({
        param: { cycle_id: String(cicloId) }
    });
    const data = await res.json();
    return normalizeList<Module>(data, ["modulos", "data", "items"]);
}

async function createModulo(payload: Omit<Module, "id_modulo">) {
    const res = await api.modules.$post({ json: payload });
    if (!res.ok) throw new Error("No se pudo crear el módulo");
    return res.json();
}

async function updateModulo(id: number, payload: PostModule) {
    const res = await api.modules[":id"].$put({
        param: { id: String(id) },
        json: payload,
    });
    if (!res.ok) throw new Error("No se pudo actualizar el módulo");
    return res.json();
}

async function deleteModulo(id: number) {
    const res = await api.modules[":id"].$delete({ param: { id: String(id) } });
    if (!res.ok) throw new Error("No se pudo eliminar el módulo");
    return res.json();
}

async function getDirectivos(): Promise<Directivo[]> {
    const res = await api.directivos.$get();
    if (!res.ok) throw new Error("No se pudieron cargar los directivos");
    const data = await res.json();
    return normalizeList<Directivo>(data, ["directivos", "data", "items"]);
}

async function updateDirectivo(cargo: string, nombre: string) {
    const res = await api.directivos[":cargo"].$put({
        param: { cargo },
        json: { nombre },
    });
    if (!res.ok) throw new Error("No se pudo actualizar el directivo");
    return res.json();
}

async function getIdentidades(): Promise<IdentityUser[]> {
    const res = await api.identidades.$get();
    if (!res.ok) throw new Error("No se pudieron cargar las cuentas");
    const data = await res.json();
    return normalizeList<IdentityUser>(data, ["users", "data", "items"]);
}

async function createIdentidad(payload: { email: string; password: string; name: string; role?: "user" | "admin" }) {
    const res = await api.identidades.$post({ json: payload });
    if (!res.ok) throw new Error("No se pudo crear la cuenta");
    return res.json();
}

// ----

// helper de invalidación de queries
function useInvalidate(keys: string[]) {
    const qc = useQueryClient();
    return React.useCallback(() => {
        keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
    }, [qc, keys]);
}

function DeleteCycleGroupDialog(props: {
    group: CycleGroup;
    onDeleteIds: (ids: number[]) => Promise<unknown>;
    disabled?: boolean;
}) {
    const { group, onDeleteIds, disabled } = props;

    const cursos = uniqueCursosFromGroup(group);

    const [open, setOpen] = React.useState(false);
    const [selected, setSelected] = React.useState<Record<string, boolean>>({});
    const [step, setStep] = React.useState<1 | 2>(1);
    const [text, setText] = React.useState("");
    const [isDoing, setIsDoing] = React.useState(false);

    React.useEffect(() => {
        if (!open) return;
        const initial: Record<string, boolean> = {};
        for (const c of cursos) initial[c] = cursos.length === 1; // si solo hay uno, preseleccionado
        setSelected(initial);
        setStep(1);
        setText("");
        setIsDoing(false);
    }, [open]);

    const selectedCursos = cursos.filter((c) => selected[c]);
    const canGoNext = selectedCursos.length > 0;
    const canConfirm = text.trim().toUpperCase() === "ELIMINAR";

    const idsToDelete = group.cursos
        .filter((x) => selected[String(x.curso)])
        .map((x) => x.id_ciclo);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={disabled}>
                    Eliminar
                </Button>
            </DialogTrigger>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Eliminar ciclo "{group.nombre}"</DialogTitle>
                    <DialogDescription>
                        Este ciclo tiene el mismo código ( <span className="font-mono">{group.codigo}</span> ) para uno o más cursos.
                        Selecciona qué cursos quieres eliminar. (Se borrarán también sus módulos.)
                    </DialogDescription>
                </DialogHeader>

                {step === 1 ? (
                    <div className="grid gap-3">
                        <div className="rounded-lg border p-3">
                            <div className="text-sm font-medium mb-2">Cursos a eliminar</div>
                            <div className="grid gap-2">
                                {cursos.map((c) => (
                                    <label key={c} className="flex items-center gap-2 text-sm">
                                        <Checkbox
                                            checked={!!selected[c]}
                                            onCheckedChange={(v) =>
                                                setSelected((prev) => ({ ...prev, [c]: Boolean(v) }))
                                            }
                                            disabled={cursos.length === 1}
                                        />
                                        <span>Curso {c}</span>
                                    </label>
                                ))}
                            </div>
                            {cursos.length > 1 ? (
                                <p className="mt-2 text-xs text-muted-foreground">
                                    Si seleccionas todos, se elimina el ciclo completo (todos los cursos).
                                </p>
                            ) : null}
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setOpen(false)} disabled={isDoing}>
                                Cancelar
                            </Button>
                            <Button
                                variant="destructive"
                                disabled={!canGoNext || isDoing}
                                onClick={() => setStep(2)}
                            >
                                Continuar
                            </Button>
                        </DialogFooter>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        <div className="rounded-lg border p-3 text-sm">
                            <div className="font-medium">Confirmación</div>
                            <div className="mt-2">
                                Vas a eliminar:{" "}
                                <span className="font-medium">
                                    {selectedCursos.map((c) => `Curso ${c}`).join(", ")}
                                </span>
                            </div>
                            <div className="mt-3 grid gap-2">
                                <Label htmlFor="confirm-del">Escribe <span className="font-mono">ELIMINAR</span></Label>
                                <Input
                                    id="confirm-del"
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="ELIMINAR"
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setStep(1)} disabled={isDoing}>
                                Volver
                            </Button>
                            <Button
                                variant="destructive"
                                disabled={!canConfirm || isDoing}
                                onClick={async () => {
                                    setIsDoing(true);
                                    try {
                                        await onDeleteIds(idsToDelete);
                                        setOpen(false);
                                    } finally {
                                        setIsDoing(false);
                                    }
                                }}
                            >
                                Confirmar eliminación
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

function AddCursoToCycleDialog(props: {
    group: CycleGroup;
    leyId: number;
    onCreate: (payload: Omit<Cycle, "id">) => Promise<unknown>;
    disabled?: boolean;
}) {
    const { group, leyId, onCreate, disabled } = props;

    const existingCursos = React.useMemo(() => uniqueCursosFromGroup(group), [group]);
    const [open, setOpen] = React.useState(false);
    const [uiError, setUiError] = React.useState<string | null>(null);
    const [isDoing, setIsDoing] = React.useState(false);

    const nextCurso = React.useMemo(() => {
        return String(nextCursoNumber(existingCursos));
    }, [existingCursos]);

    React.useEffect(() => {
        if (!open) return;
        setUiError(null);
        setIsDoing(false);
    }, [open]);

    // ahora siempre se puede guardar (si no está disabled / isDoing)
    const canSave = true;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="link" size="sm" disabled={disabled}>
                    Añadir curso
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[640px]">
                <DialogHeader>
                    <DialogTitle>Añadir curso a "{group.nombre}"</DialogTitle>
                    <DialogDescription>
                        Se creará una nueva fila en <span className="font-mono">Ciclos</span> con el mismo{" "}
                        <span className="font-mono">{group.codigo}</span>.
                    </DialogDescription>
                </DialogHeader>

                {uiError ? (
                    <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
                        {uiError}
                    </div>
                ) : null}

                <div className="grid gap-3">
                    <div className="rounded-lg border p-3 text-sm">
                        <div className="font-medium">Cursos existentes</div>
                        <div className="mt-1 text-muted-foreground">
                            {existingCursos.length ? existingCursos.join(", ") : "—"}
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Nuevo curso</Label>
                        <div className="rounded-md border px-3 py-2 text-sm">{nextCurso}º</div>
                        <p className="text-xs text-muted-foreground">
                            Se calcula automáticamente como el siguiente curso.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isDoing}>
                        Cancelar
                    </Button>
                    <Button
                        disabled={!canSave || isDoing || disabled}
                        onClick={async () => {
                            setIsDoing(true);
                            setUiError(null);
                            try {
                                await onCreate({
                                    curso: nextCurso,
                                    nombre: group.nombre,
                                    codigo: group.codigo,
                                    norma_1: group.norma_1,
                                    norma_2: group.norma_2,
                                    ley: leyId,
                                    tipo_ciclo: group.tipo_ciclo,
                                } as any);
                                setOpen(false);
                            } catch (e: any) {
                                setUiError(e?.message ?? "No se pudo crear el curso.");
                            } finally {
                                setIsDoing(false);
                            }
                        }}
                    >
                        Crear curso
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function TwoStepDeleteDialog(props: {
    title: string;
    description?: string;
    triggerLabel?: string;
    confirmLabel?: string;
    requireText?: string; // ej. "ELIMINAR"
    onConfirm: () => Promise<unknown>;
    disabled?: boolean;
}) {
    const {
        title,
        description,
        triggerLabel = "Eliminar",
        confirmLabel = "Confirmar eliminación",
        requireText = "ELIMINAR",
        onConfirm,
        disabled,
    } = props;

    const [open, setOpen] = React.useState(false);
    const [step, setStep] = React.useState<1 | 2>(1);
    const [text, setText] = React.useState("");
    const [isDoing, setIsDoing] = React.useState(false);
    const canProceed = text.trim().toUpperCase() === requireText;

    const reset = () => {
        setStep(1);
        setText("");
        setIsDoing(false);
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                setOpen(v);
                if (!v) reset();
            }}
        >
            <DialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={disabled}>
                    {triggerLabel}
                </Button>
            </DialogTrigger>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        {description ??
                            "Esta acción no se puede deshacer. Se te pedirá una doble confirmación."}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-3">
                    <div className="rounded-lg border p-3 text-sm">
                        <div className="flex items-center justify-between">
                            <span>Confirmación</span>
                            <Badge variant={step === 1 ? "outline" : "default"}>
                                Paso {step}/2
                            </Badge>
                        </div>

                        <div className="mt-3 grid gap-2">
                            <Label htmlFor="confirm-text">
                                Escribe <span className="font-mono">{requireText}</span> para
                                continuar
                            </Label>
                            <Input
                                id="confirm-text"
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder={requireText}
                                autoComplete="off"
                            />
                            <p className="text-xs text-muted-foreground">
                                Esto evita borrados accidentales.
                            </p>
                        </div>
                    </div>

                    {step === 2 ? (
                        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
                            Último aviso: si confirmas, se ejecutará la eliminación.
                        </div>
                    ) : null}
                </div>

                <DialogFooter>
                    {step === 1 ? (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => setOpen(false)}
                                disabled={isDoing}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="destructive"
                                disabled={!canProceed || isDoing}
                                onClick={() => setStep(2)}
                            >
                                Continuar
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => setStep(1)}
                                disabled={isDoing}
                            >
                                Volver
                            </Button>
                            <Button
                                variant="destructive"
                                disabled={!canProceed || isDoing}
                                onClick={async () => {
                                    try {
                                        setIsDoing(true);
                                        await onConfirm();
                                        setOpen(false);
                                    } finally {
                                        setIsDoing(false);
                                    }
                                }}
                            >
                                {confirmLabel}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function LeyFormDialog(props: {
    onCreate: (nombre_ley: string) => Promise<unknown>;
}) {
    const { onCreate } = props;
    const [open, setOpen] = React.useState(false);
    const [nombre, setNombre] = React.useState("");
    const [isDoing, setIsDoing] = React.useState(false);

    const canSave = nombre.trim().length > 0;

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                setOpen(v);
                if (!v) {
                    setNombre("");
                    setIsDoing(false);
                }
            }}
        >
            <DialogTrigger asChild>
                <Button size="sm">Nueva ley</Button>
            </DialogTrigger>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Crear ley</DialogTitle>
                    <DialogDescription>
                        Ejemplo: LOE, LOGSE, LFP…
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-2">
                    <Label htmlFor="nombre_ley">Nombre</Label>
                    <Input
                        id="nombre_ley"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="LOGSE"
                    />
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={isDoing}
                    >
                        Cancelar
                    </Button>
                    <Button
                        disabled={!canSave || isDoing}
                        onClick={async () => {
                            setIsDoing(true);
                            try {
                                await onCreate(nombre.trim());
                                setOpen(false);
                            } finally {
                                setIsDoing(false);
                            }
                        }}
                    >
                        Crear
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function CicloFormDialog(props: {
    leyId: number;
    mode: "create" | "edit";
    initial?: Partial<Cycle>;
    onSave: (payload: any) => Promise<unknown>;
    existingCodigos?: string[];
    trigger?: React.ReactNode;
}) {
    const { leyId, mode, initial, onSave, trigger } = props;

    const [open, setOpen] = React.useState(false);
    const [curso, setCurso] = React.useState(
        mode === "create" ? "1" : (initial?.curso ?? "1")
    );
    const [nombre, setNombre] = React.useState(initial?.nombre ?? "");
    const [codigo, setCodigo] = React.useState(initial?.codigo ?? "");
    const [norma1, setNorma1] = React.useState(initial?.norma_1 ?? "");
    const [norma2, setNorma2] = React.useState(initial?.norma_2 ?? "");
    const [tipo, setTipo] = React.useState(initial?.tipo_ciclo ?? "GM");
    const [isDoing, setIsDoing] = React.useState(false);
    const [uiError, setUiError] = React.useState<React.ReactNode>(null);

    React.useEffect(() => {
        if (open) setUiError(null);
    }, [open]);

    React.useEffect(() => {
        if (!open) return;

        setCurso(mode === "create" ? "1" : (initial?.curso ?? "1"));
        setNombre(initial?.nombre ?? "");
        setCodigo(initial?.codigo ?? "");
        setNorma1(initial?.norma_1 ?? "");
        setNorma2(initial?.norma_2 ?? "");
        setTipo(initial?.tipo_ciclo ?? "GM");
    }, [open, initial, mode]);

    const canSave = nombre.trim() && codigo.trim() && tipo.trim();

    const codigosLower = React.useMemo(() => {
        return new Set((props.existingCodigos ?? []).map((x) => x.toLowerCase()));
    }, [props.existingCodigos]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ?? (
                    <Button size="sm">{mode === "create" ? "Nuevo ciclo" : "Editar"}</Button>
                )}
            </DialogTrigger>

            <DialogContent className="sm:max-w-[720px]">
                <DialogHeader>
                    <DialogTitle>
                        {mode === "create" ? "Crear ciclo" : "Editar ciclo"}
                    </DialogTitle>
                    <DialogDescription>
                        Campos del ciclo según tu tabla (curso, nombre, código, normas, ley,
                        tipo).
                    </DialogDescription>
                </DialogHeader>

                {uiError ? (
                    <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
                        {uiError}
                    </div>
                ) : null}

                <div className="grid gap-4 sm:grid-cols-2 items-start">
                    {mode === "create" ? (
                        <>
                            <div className="grid gap-2">
                                <Label>Curso</Label>
                                <Input value="1" disabled />
                            </div>

                            <div className="grid gap-2 content-start">
                                <Label>Tipo ciclo</Label>
                                <Select
                                    value={tipo}
                                    onValueChange={(value) => setTipo(value as "GM" | "GS")}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="GM/GS" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem className="cursor-pointer" value="GM">GM</SelectItem>
                                        <SelectItem className="cursor-pointer" value="GS">GS</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <p className="text-xs text-muted-foreground sm:col-span-2 -mt-2">
                                El primer curso se crea siempre como 1º.
                            </p>
                        </>
                    ) : (
                        <div className="grid gap-2 content-start">
                            <Label>Tipo ciclo</Label>
                            <Select
                                value={tipo}
                                onValueChange={(value) => setTipo(value as "GM" | "GS")}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="GM/GS" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem className="cursor-pointer" value="GM">GM</SelectItem>
                                    <SelectItem className="cursor-pointer" value="GS">GS</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="grid gap-2 sm:col-span-2">
                        <Label>Nombre</Label>
                        <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
                    </div>

                    <div className="grid gap-2 sm:col-span-2">
                        <Label>Código</Label>
                        <Input value={codigo} onChange={(e) => setCodigo(e.target.value)} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Norma 1</Label>
                        <Input value={norma1} onChange={(e) => setNorma1(e.target.value)} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Norma 2</Label>
                        <Input value={norma2} onChange={(e) => setNorma2(e.target.value)} />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={isDoing}
                    >
                        Cancelar
                    </Button>
                    <Button
                        disabled={!canSave || isDoing}
                        onClick={async () => {
                            setIsDoing(true);
                            try {
                                const fixedCurso = mode === "create" ? "1" : String(initial?.curso ?? curso).trim();
                                const payload = {
                                    curso: fixedCurso,
                                    nombre: nombre.trim(),
                                    codigo: codigo.trim(),
                                    norma_1: norma1.trim(),
                                    norma_2: norma2.trim(),
                                    ley: leyId,
                                    tipo_ciclo: tipo as "GM" | "GS",
                                };

                                if (mode === "create") {
                                    if (codigosLower.has(payload.codigo.toLowerCase())) {
                                        setUiError(
                                            <>
                                                Ya existe un ciclo con el código <span className="font-mono">"{payload.codigo}"</span>.
                                                <br />
                                                Para añadir un nuevo curso, utiliza el botón <b>"Añadir curso"</b> en la columna acciones de la lista de ciclos.
                                            </>
                                        );
                                        return;
                                    }
                                }

                                await onSave(payload);
                                setOpen(false);
                            } finally {
                                setIsDoing(false);
                            }
                        }}
                    >
                        Guardar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function ModuloFormDialog(props: {
    cicloId: number;
    mode: "create" | "edit";
    initial?: Partial<Module>;
    onSave: (payload: any) => Promise<void>;
    trigger?: React.ReactNode;
}) {
    const { cicloId, mode, initial, onSave, trigger } = props;

    const [open, setOpen] = React.useState(false);
    const [nombre, setNombre] = React.useState(initial?.nombre ?? "");
    const [codigo, setCodigo] = React.useState(initial?.codigo_modulo ?? "");
    const [curso, setCurso] = React.useState(initial?.curso ?? "1º");
    const [isDoing, setIsDoing] = React.useState(false);

    React.useEffect(() => {
        if (!open) return;
        setNombre(initial?.nombre ?? "");
        setCodigo(initial?.codigo_modulo ?? "");
        setCurso(initial?.curso ?? "1º");
    }, [open, initial]);

    const canSave = nombre.trim() && codigo.trim() && curso.trim();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ?? (
                    <Button size="sm">{mode === "create" ? "Nuevo módulo" : "Editar"}</Button>
                )}
            </DialogTrigger>

            <DialogContent className="sm:max-w-[640px]">
                <DialogHeader>
                    <DialogTitle>
                        {mode === "create" ? "Crear módulo" : "Editar módulo"}
                    </DialogTitle>
                    <DialogDescription>
                        Módulo asociado al ciclo seleccionado.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2 sm:col-span-2">
                        <Label>Nombre</Label>
                        <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Código módulo</Label>
                        <Input value={codigo} onChange={(e) => setCodigo(e.target.value)} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Curso</Label>
                        <Input value={curso} disabled={mode === "create"} />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={isDoing}
                    >
                        Cancelar
                    </Button>
                    <Button
                        disabled={!canSave || isDoing}
                        onClick={async () => {
                            setIsDoing(true);
                            try {
                                await onSave({
                                    nombre: nombre.trim(),
                                    codigo_modulo: codigo.trim(),
                                    id_ciclo: cicloId,
                                    curso: curso.trim(),
                                });
                                setOpen(false);
                            } finally {
                                setIsDoing(false);
                            }
                        }}
                    >
                        Guardar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Card de directivos --------------------------

function DirectivoEditDialog(props: {
    directivo: Directivo;
    onSave: (cargo: string, nombre: string) => Promise<unknown>;
    disabled?: boolean;
}) {
    const { directivo, onSave, disabled } = props;

    const [open, setOpen] = React.useState(false);
    const [nombre, setNombre] = React.useState(directivo.nombre ?? "");
    const [isDoing, setIsDoing] = React.useState(false);

    React.useEffect(() => {
        if (!open) return;
        setNombre(directivo.nombre ?? "");
        setIsDoing(false);
    }, [open, directivo.nombre]);

    const canSave = nombre.trim().length > 0 && nombre.trim() !== (directivo.nombre ?? "").trim();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={disabled}>
                    Editar
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[640px]">
                <DialogHeader>
                    <DialogTitle>Editar {directivo.cargo}</DialogTitle>
                    <DialogDescription>
                        Actualiza el nombre del cargo <span className="font-mono">{directivo.cargo}</span>.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-2">
                    <Label>Nombre</Label>
                    <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
                    <p className="text-xs text-muted-foreground">
                        Ejemplo: <span className="font-mono">D. Ricardo Flores Montesinos</span>
                    </p>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isDoing}>
                        Cancelar
                    </Button>
                    <Button
                        disabled={!canSave || isDoing}
                        onClick={async () => {
                            setIsDoing(true);
                            try {
                                await onSave(directivo.cargo, nombre.trim());
                                setOpen(false);
                            } finally {
                                setIsDoing(false);
                            }
                        }}
                    >
                        Guardar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// crear cuentas

function IdentityCreateDialog(props: {
    onCreate: (p: { email: string; password: string; name: string; role?: "user" | "admin" }) => Promise<unknown>;
    disabled?: boolean;
}) {
    const { onCreate, disabled } = props;
    const [open, setOpen] = React.useState(false);
    const [email, setEmail] = React.useState("");
    const [name, setName] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [role, setRole] = React.useState<"user" | "admin">("user");
    const [isDoing, setIsDoing] = React.useState(false);
    const [uiError, setUiError] = React.useState<string | null>(null);

    const canSave = email.trim() && name.trim() && password.trim().length >= 6;

    return (
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setUiError(null); }}>
            <DialogTrigger asChild>
                <Button size="sm" disabled={disabled}>Nueva cuenta</Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[640px]">
                <DialogHeader>
                    <DialogTitle>Crear cuenta</DialogTitle>
                    <DialogDescription>
                        Crea una identidad (email/password). El registro público está desactivado.
                    </DialogDescription>
                </DialogHeader>

                {uiError ? (
                    <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
                        {uiError}
                    </div>
                ) : null}

                <div className="grid gap-3">
                    <div className="grid gap-2">
                        <Label>Email</Label>
                        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario@dominio.com" />
                    </div>

                    <div className="grid gap-2">
                        <Label>Nombre</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre Apellidos" />
                    </div>

                    <div className="grid gap-2">
                        <Label>Contraseña</Label>
                        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="mínimo 6 caracteres" />
                    </div>

                    <div className="grid gap-2">
                        <Label>Rol</Label>
                        <Select value={role} onValueChange={(v) => setRole(v as any)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem className="cursor-pointer" value="user">user</SelectItem>
                                <SelectItem className="cursor-pointer" value="admin">admin</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Solo asigna <span className="font-mono">admin</span> si esa persona debe administrar el sistema.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isDoing}>Cancelar</Button>
                    <Button
                        disabled={!canSave || isDoing}
                        onClick={async () => {
                            setIsDoing(true);
                            setUiError(null);
                            try {
                                await onCreate({ email: email.trim(), name: name.trim(), password: password.trim(), role });
                                setOpen(false);
                                setEmail(""); setName(""); setPassword(""); setRole("user");
                            } catch (e: any) {
                                setUiError(e?.message ?? "No se pudo crear la cuenta.");
                            } finally {
                                setIsDoing(false);
                            }
                        }}
                    >
                        Crear
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

const AppSettingsPanel: React.FC = () => {
    const [selectedCycleCode, setSelectedCycleCode] = React.useState<string | null>(null);
    const [selectedCurso, setSelectedCurso] = React.useState<string | null>(null);

    const qc = useQueryClient();

    // ---- Leyes
    const leyesQ = useQuery({
        queryKey: ["settings-leyes"],
        queryFn: getLeyes,
    });

    const invalidateLeyes = useInvalidate(["settings-leyes"]);
    const createLeyM = useMutation({
        mutationFn: (nombre_ley: string) => createLey(nombre_ley),
        onSuccess: () => invalidateLeyes(),
    });
    const deleteLeyM = useMutation({
        mutationFn: (id: number) => deleteLey(id),
        onSuccess: () => {
            invalidateLeyes();
            // también invalida posibles listados dependientes
            qc.invalidateQueries({ queryKey: ["settings-ciclos"] });
            qc.invalidateQueries({ queryKey: ["settings-modulos"] });
        },
    });

    const [selectedLeyId, setSelectedLeyId] = React.useState<number | null>(null);

    React.useEffect(() => {
        if (selectedLeyId != null) return;
        if (leyesQ.data?.length) setSelectedLeyId(leyesQ.data[0].id_ley);
    }, [leyesQ.data, selectedLeyId]);

    // ---- Ciclos por ley
    const ciclosQ = useQuery({
        queryKey: ["settings-ciclos", selectedLeyId],
        queryFn: () => getCiclosByLey(selectedLeyId as number),
        enabled: selectedLeyId != null,
    });

    const cycleGroups = React.useMemo(() => {
        return groupCyclesByCodigo(ciclosQ.data ?? []);
    }, [ciclosQ.data]);

    const selectedGroup = cycleGroups.find((g) => g.codigo === selectedCycleCode) ?? null;

    const createCicloM = useMutation({
        mutationFn: (payload: Omit<Cycle, "id">) => createCiclo(payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["settings-ciclos"] }),
    });
    const updateCicloM = useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: CyclePut }) =>
            updateCiclo(id, payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["settings-ciclos"] }),
    });
    const deleteCicloM = useMutation({
        mutationFn: (id: number) => deleteCiclo(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["settings-ciclos"] });
            qc.invalidateQueries({ queryKey: ["settings-modulos"] });
        },
    });

    const directivosQ = useQuery({
        queryKey: ["settings-directivos"],
        queryFn: getDirectivos,
    });

    const invalidateDirectivos = useInvalidate(["settings-directivos"]);

    const updateDirectivoM = useMutation({
        mutationFn: ({ cargo, nombre }: { cargo: string; nombre: string }) =>
            updateDirectivo(cargo, nombre),
        onSuccess: () => invalidateDirectivos(),
    });

    const identidadesQ = useQuery({
        queryKey: ["settings-identidades"],
        queryFn: getIdentidades,
    });

    const invalidateIdentidades = useInvalidate(["settings-identidades"]);

    const createIdentidadM = useMutation({
        mutationFn: createIdentidad,
        onSuccess: () => invalidateIdentidades(),
    });

    const [selectedCicloId, setSelectedCicloId] = React.useState<number | null>(null);

    React.useEffect(() => {
        // cuando cambia ley, resetea selección
        setSelectedCycleCode(null);
        setSelectedCurso(null);
        setSelectedCicloId(null);
    }, [selectedLeyId]);

    React.useEffect(() => {
        // si no hay selección aún, selecciona el primer grupo y su primer curso
        if (!cycleGroups.length) return;
        if (selectedCycleCode != null) return;

        const g0 = cycleGroups[0];
        setSelectedCycleCode(g0.codigo);

        const cursos = uniqueCursosFromGroup(g0);
        const c0 = cursos[0] ?? null;
        setSelectedCurso(c0);

        const id = c0 ? cicloIdFromGroupAndCurso(g0, c0) : null;
        setSelectedCicloId(id);
    }, [cycleGroups, selectedCycleCode]);

    React.useEffect(() => {
        // si cambia grupo, elige curso default y calcula id
        if (!selectedGroup) return;

        const cursos = uniqueCursosFromGroup(selectedGroup);
        const first = cursos[0] ?? null;

        // si el curso seleccionado no existe en el grupo, usa el primero
        const effectiveCurso =
            selectedCurso && cursos.includes(String(selectedCurso))
                ? String(selectedCurso)
                : first;

        setSelectedCurso(effectiveCurso);

        const id = effectiveCurso
            ? cicloIdFromGroupAndCurso(selectedGroup, effectiveCurso)
            : null;

        setSelectedCicloId(id);
    }, [selectedCycleCode]); // eslint-disable-line react-hooks/exhaustive-deps

    React.useEffect(() => {
        // si cambia curso, recalcula el id_ciclo “real”
        if (!selectedGroup || !selectedCurso) return;
        const id = cicloIdFromGroupAndCurso(selectedGroup, selectedCurso);
        setSelectedCicloId(id);
    }, [selectedCurso, selectedGroup]);

    // ---- Módulos por ciclo
    const modulosQ = useQuery({
        queryKey: ["settings-modulos", selectedCicloId],
        queryFn: () => getModulosByCiclo(selectedCicloId as number),
        enabled: selectedCicloId != null,
    });

    const createModuloM = useMutation({
        mutationFn: (payload: PostModule) => createModulo(payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["settings-modulos"] }),
    });
    const updateModuloM = useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: PostModule }) =>
            updateModulo(id, payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["settings-modulos"] }),
    });
    const deleteModuloM = useMutation({
        mutationFn: (id: number) => deleteModulo(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["settings-modulos"] }),
    });

    const selectedLey = leyesQ.data?.find((l) => l.id_ley === selectedLeyId) ?? null;
    const selectedCiclo = ciclosQ.data?.find((c) => c.id_ciclo === selectedCicloId) ?? null;

    const loadingTop = leyesQ.isPending;

    const availableCursos = React.useMemo(() => {
        if (!selectedGroup) return [];
        return uniqueCursosFromGroup(selectedGroup);
    }, [selectedGroup]);

    const cursoSelectDisabled = availableCursos.length <= 1;

    return (
        <main className="flex-1 p-4 md:p-6 overflow-hidden h-full min-h-0">
            <div className="h-full min-h-0 flex flex-col gap-6 overflow-hidden">
                <div className="flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-xl font-semibold">Configuración académica</h2>
                        <p className="text-sm text-muted-foreground">
                            Gestiona leyes, ciclos y módulos (IES Miguel Catalán).
                        </p>
                    </div>
                </div>

                <Separator className="shrink-0" />

                {leyesQ.error ? (
                    <div className="rounded-lg border p-4 text-sm shrink-0">
                        Error cargando leyes: {(leyesQ.error as any)?.message ?? "unknown"}
                    </div>
                ) : null}

                <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
                    {/* 60% */}
                    <div className="min-h-0 basis-0 flex-[3] overflow-hidden">
                        <Tabs defaultValue="leyes" className="w-full h-full flex flex-col overflow-hidden">
                            <TabsList className="shrink-0 w-fit">
                                <TabsTrigger value="leyes">Leyes</TabsTrigger>
                                <TabsTrigger value="ciclos" disabled={!selectedLeyId}>
                                    Ciclos
                                </TabsTrigger>
                                <TabsTrigger value="modulos" disabled={!selectedCicloId}>
                                    Módulos
                                </TabsTrigger>
                            </TabsList>

                            {/* Área fija para el contenido del tab (no empuja nada) */}
                            <div className="flex-1 min-h-0 mt-4 overflow-hidden">
                                {/* ------------------- LEYES ------------------- */}
                                <TabsContent
                                    value="leyes"
                                    className="m-0 h-full min-h-0 data-[state=inactive]:hidden overflow-hidden"
                                >
                                    <Card className="h-full min-h-0 flex flex-col overflow-hidden">
                                        <CardHeader className="flex flex-row items-center justify-between shrink-0">
                                            <CardTitle className="text-base">Leyes</CardTitle>
                                            <LeyFormDialog
                                                onCreate={async (nombre) => {
                                                    await createLeyM.mutateAsync(nombre);
                                                }}
                                            />
                                        </CardHeader>

                                        {/* ✅ aquí sí hay scroll */}
                                        <CardContent className="flex-1 min-h-0 overflow-y-auto">
                                            {loadingTop ? (
                                                <div className="grid gap-2">
                                                    {Array.from({ length: 6 }).map((_, i) => (
                                                        <Skeleton key={i} className="h-10 w-full" />
                                                    ))}
                                                </div>
                                            ) : (
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Nombre</TableHead>
                                                            <TableHead className="w-[220px] text-right">Acciones</TableHead>
                                                        </TableRow>
                                                    </TableHeader>

                                                    <TableBody>
                                                        {(leyesQ.data ?? []).map((ley) => (
                                                            <TableRow key={ley.id_ley}>
                                                                <TableCell className="font-medium">
                                                                    <div className="flex items-center gap-2">
                                                                        {ley.nombre_ley}
                                                                        {selectedLeyId === ley.id_ley ? (
                                                                            <Badge variant="outline">Seleccionada</Badge>
                                                                        ) : null}
                                                                    </div>
                                                                </TableCell>

                                                                <TableCell className="text-right">
                                                                    <div className="flex justify-end gap-2">
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => setSelectedLeyId(ley.id_ley)}
                                                                        >
                                                                            Usar
                                                                        </Button>

                                                                        <TwoStepDeleteDialog
                                                                            title={`Eliminar ley "${ley.nombre_ley}"`}
                                                                            description="Junto a esta ley, todos los ciclos asociados a esta ley y todos los módulos asociados a esos ciclos serán también eliminados PERMANENTEMENTE."
                                                                            onConfirm={async () => {
                                                                                await deleteLeyM.mutateAsync(ley.id_ley);
                                                                            }}
                                                                            disabled={deleteLeyM.isPending}
                                                                            requireText="ELIMINAR"
                                                                        />
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}

                                                        {(!leyesQ.data || leyesQ.data.length === 0) && (
                                                            <TableRow>
                                                                <TableCell colSpan={2} className="text-sm text-muted-foreground">
                                                                    No hay leyes registradas.
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                {/* ------------------- CICLOS ------------------- */}
                                <TabsContent
                                    value="ciclos"
                                    className="m-0 h-full min-h-0 data-[state=inactive]:hidden overflow-hidden"
                                >
                                    <div className="grid gap-4 lg:grid-cols-[360px_1fr] h-full min-h-0 items-stretch overflow-hidden">
                                        {/* Izquierda: NO scroll global, si quieres scroll aquí pon overflow-y-auto */}
                                        <Card className="h-full min-h-0 flex flex-col overflow-hidden">
                                            <CardHeader className="shrink-0">
                                                <CardTitle className="text-base">Ley activa</CardTitle>
                                            </CardHeader>

                                            <CardContent className="grid gap-3 min-h-0 overflow-y-auto">
                                                <Label>Selecciona ley</Label>
                                                <Select
                                                    value={selectedLeyId ? String(selectedLeyId) : undefined}
                                                    onValueChange={(v) => setSelectedLeyId(Number(v))}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue className="truncate" placeholder="Elige una ley" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {(leyesQ.data ?? []).map((l) => (
                                                            <SelectItem
                                                                className="cursor-pointer"
                                                                key={l.id_ley}
                                                                value={String(l.id_ley)}
                                                            >
                                                                {l.nombre_ley}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>

                                                <div className="rounded-lg border p-3 text-sm">
                                                    <div className="font-medium">{selectedLey?.nombre_ley ?? "-"}</div>
                                                    <div className="text-muted-foreground">ID: {selectedLeyId ?? "-"}</div>
                                                </div>

                                                {selectedLeyId ? (
                                                    <CicloFormDialog
                                                        leyId={selectedLeyId}
                                                        mode="create"
                                                        existingCodigos={(ciclosQ.data ?? []).map((c) => c.codigo)}
                                                        onSave={async (payload) => {
                                                            await createCicloM.mutateAsync(payload);
                                                        }}
                                                        trigger={<Button size="sm">Nuevo ciclo</Button>}
                                                    />
                                                ) : null}
                                            </CardContent>
                                        </Card>

                                        {/* Derecha: ✅ scroll solo aquí */}
                                        <Card className="h-full min-h-0 flex flex-col overflow-hidden">
                                            <CardHeader className="flex flex-row items-center justify-between shrink-0">
                                                <CardTitle className="text-base">
                                                    Ciclos {selectedLey ? `(${selectedLey.nombre_ley})` : ""}
                                                </CardTitle>
                                                <div className="text-sm text-muted-foreground">
                                                    {ciclosQ.isPending ? "Cargando..." : `${(ciclosQ.data ?? []).length} total`}
                                                </div>
                                            </CardHeader>

                                            <CardContent className="flex-1 min-h-0 overflow-y-auto">
                                                {ciclosQ.isPending ? (
                                                    <div className="grid gap-2">
                                                        {Array.from({ length: 8 }).map((_, i) => (
                                                            <Skeleton key={i} className="h-10 w-full" />
                                                        ))}
                                                    </div>
                                                ) : ciclosQ.error ? (
                                                    <div className="rounded-lg border p-4 text-sm">
                                                        Error cargando ciclos: {(ciclosQ.error as any)?.message ?? "unknown"}
                                                    </div>
                                                ) : (
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Nombre</TableHead>
                                                                <TableHead>Código</TableHead>
                                                                <TableHead>Curso</TableHead>
                                                                <TableHead>Tipo</TableHead>
                                                                <TableHead className="w-[320px] text-right">Acciones</TableHead>
                                                            </TableRow>
                                                        </TableHeader>

                                                        <TableBody>
                                                            {cycleGroups.map((g) => {
                                                                const cursos = uniqueCursosFromGroup(g);
                                                                const isSelected = selectedCycleCode === g.codigo;
                                                                const rowToEdit =
                                                                    g.cursos.find((x) => String(x.curso) === String(selectedCurso)) ??
                                                                    g.cursos[0];

                                                                return (
                                                                    <TableRow key={g.codigo}>
                                                                        <TableCell className="font-medium">
                                                                            <div className="flex items-center gap-2">
                                                                                {g.nombre}
                                                                                {isSelected ? <Badge variant="secondary">Seleccionado</Badge> : null}
                                                                                {cursos.length > 1 ? (
                                                                                    <Badge variant="outline">{cursos.length} cursos</Badge>
                                                                                ) : (
                                                                                    <Badge variant="outline">1 curso</Badge>
                                                                                )}
                                                                            </div>
                                                                            <div className="text-xs text-muted-foreground">
                                                                                {g.norma_1 ?? ""}
                                                                                {g.norma_2 ? ` · ${g.norma_2}` : ""}
                                                                            </div>
                                                                        </TableCell>

                                                                        <TableCell className="font-mono text-xs">{g.codigo}</TableCell>

                                                                        <TableCell>
                                                                            {cursos.length === 1
                                                                                ? `Curso ${cursos[0]}`
                                                                                : `Cursos: ${cursos.join(", ")}`}
                                                                        </TableCell>

                                                                        <TableCell>{g.tipo_ciclo}</TableCell>

                                                                        <TableCell className="text-right">
                                                                            <div className="flex justify-end gap-2">
                                                                                <Button
                                                                                    variant="outline"
                                                                                    size="sm"
                                                                                    onClick={() => {
                                                                                        setSelectedCycleCode(g.codigo);
                                                                                        const c0 = cursos[0] ?? null;
                                                                                        setSelectedCurso(c0);
                                                                                        const id = c0 ? cicloIdFromGroupAndCurso(g, c0) : null;
                                                                                        setSelectedCicloId(id);
                                                                                    }}
                                                                                >
                                                                                    Ver módulos
                                                                                </Button>

                                                                                <CicloFormDialog
                                                                                    leyId={selectedLeyId as number}
                                                                                    mode="edit"
                                                                                    initial={rowToEdit}
                                                                                    onSave={async (payload) => {
                                                                                        await updateCicloM.mutateAsync({
                                                                                            id: rowToEdit.id_ciclo,
                                                                                            payload,
                                                                                        });
                                                                                    }}
                                                                                    trigger={
                                                                                        <Button variant="outline" size="sm">
                                                                                            Editar
                                                                                        </Button>
                                                                                    }
                                                                                />

                                                                                <AddCursoToCycleDialog
                                                                                    group={g}
                                                                                    leyId={selectedLeyId as number}
                                                                                    disabled={createCicloM.isPending || !selectedLeyId}
                                                                                    onCreate={async (payload) => {
                                                                                        await createCicloM.mutateAsync(payload);
                                                                                        setSelectedCycleCode(g.codigo);
                                                                                        setSelectedCurso(String(payload.curso));
                                                                                    }}
                                                                                />

                                                                                <DeleteCycleGroupDialog
                                                                                    group={g}
                                                                                    disabled={deleteCicloM.isPending}
                                                                                    onDeleteIds={async (ids) => {
                                                                                        await Promise.all(ids.map((id) => deleteCicloM.mutateAsync(id)));
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                );
                                                            })}

                                                            {(!ciclosQ.data || ciclosQ.data.length === 0) && (
                                                                <TableRow>
                                                                    <TableCell colSpan={5} className="text-sm text-muted-foreground">
                                                                        No hay ciclos para esta ley.
                                                                    </TableCell>
                                                                </TableRow>
                                                            )}
                                                        </TableBody>
                                                    </Table>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>
                                </TabsContent>

                                {/* ------------------- MÓDULOS ------------------- */}
                                <TabsContent
                                    value="modulos"
                                    className="m-0 h-full min-h-0 data-[state=inactive]:hidden overflow-hidden"
                                >
                                    <div className="grid gap-4 lg:grid-cols-[360px_1fr] h-full min-h-0 items-stretch overflow-hidden">
                                        <Card className="h-full min-h-0 flex flex-col overflow-hidden">
                                            <CardHeader className="shrink-0">
                                                <CardTitle className="text-base">Ciclo activo</CardTitle>
                                            </CardHeader>

                                            <CardContent className="grid gap-3 min-h-0 overflow-y-auto">
                                                <Label>Selecciona ciclo</Label>

                                                <Select
                                                    value={selectedCycleCode ?? undefined}
                                                    onValueChange={(v) => setSelectedCycleCode(v)}
                                                    disabled={!cycleGroups.length}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Elige un ciclo" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {cycleGroups.map((g) => (
                                                            <SelectItem className="cursor-pointer" key={g.codigo} value={g.codigo}>
                                                                {g.codigo} — {g.nombre}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>

                                                {selectedCiclo ? (
                                                    <>
                                                        <Label>Curso</Label>
                                                        <Select
                                                            value={selectedCurso ?? undefined}
                                                            onValueChange={(v) => setSelectedCurso(v)}
                                                            disabled={cursoSelectDisabled}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Elige curso" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {availableCursos.map((c) => (
                                                                    <SelectItem className="cursor-pointer" key={c} value={c}>
                                                                        {c}º
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </>
                                                ) : null}

                                                <div className="rounded-lg border p-3 text-sm">
                                                    <div className="font-medium">{selectedCiclo?.nombre ?? "-"}</div>
                                                    <div className="text-muted-foreground">
                                                        {selectedLey?.nombre_ley ?? "-"} · ID ciclo: {selectedCicloId ?? "-"}
                                                    </div>
                                                    {selectedCiclo ? (
                                                        <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1 min-w-0">
                                                            <span className="font-mono truncate">{selectedCiclo.codigo}</span>
                                                            <span>·</span>
                                                            <span className="truncate">{selectedCiclo.tipo_ciclo}</span>
                                                            <span>·</span>
                                                            <span className="truncate">Curso {selectedCiclo.curso}</span>
                                                        </div>
                                                    ) : null}
                                                </div>

                                                {selectedCicloId ? (
                                                    <ModuloFormDialog
                                                        cicloId={selectedCicloId}
                                                        mode="create"
                                                        initial={{
                                                            curso: selectedCurso ? `${selectedCurso}º` : (selectedCiclo?.curso ?? "1º"),
                                                        }}
                                                        onSave={async (payload) => {
                                                            await createModuloM.mutateAsync(payload);
                                                        }}
                                                        trigger={<Button size="sm">Nuevo módulo</Button>}
                                                    />
                                                ) : null}
                                            </CardContent>
                                        </Card>

                                        <Card className="h-full min-h-0 flex flex-col overflow-hidden">
                                            <CardHeader className="flex flex-row items-center justify-between shrink-0">
                                                <CardTitle className="text-base">Módulos</CardTitle>
                                                <div className="text-sm text-muted-foreground">
                                                    {modulosQ.isPending ? "Cargando..." : `${(modulosQ.data ?? []).length} total`}
                                                </div>
                                            </CardHeader>

                                            <CardContent className="flex-1 min-h-0 overflow-y-auto">
                                                {!selectedCicloId ? (
                                                    <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                                                        Selecciona un ciclo para ver/gestionar sus módulos.
                                                    </div>
                                                ) : modulosQ.isPending ? (
                                                    <div className="grid gap-2">
                                                        {Array.from({ length: 10 }).map((_, i) => (
                                                            <Skeleton key={i} className="h-10 w-full" />
                                                        ))}
                                                    </div>
                                                ) : modulosQ.error ? (
                                                    <div className="rounded-lg border p-4 text-sm">
                                                        Error cargando módulos: {(modulosQ.error as any)?.message ?? "unknown"}
                                                    </div>
                                                ) : (
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Nombre</TableHead>
                                                                <TableHead>Código</TableHead>
                                                                <TableHead>Curso</TableHead>
                                                                <TableHead className="w-[300px] text-right">Acciones</TableHead>
                                                            </TableRow>
                                                        </TableHeader>

                                                        <TableBody>
                                                            {(modulosQ.data ?? []).map((m) => (
                                                                <TableRow key={m.id_modulo}>
                                                                    <TableCell className="font-medium">{m.nombre}</TableCell>
                                                                    <TableCell className="font-mono text-xs">{m.codigo_modulo}</TableCell>
                                                                    <TableCell>{m.curso}</TableCell>
                                                                    <TableCell className="text-right">
                                                                        <div className="flex justify-end gap-2">
                                                                            <ModuloFormDialog
                                                                                cicloId={selectedCicloId}
                                                                                mode="edit"
                                                                                initial={m}
                                                                                onSave={async (payload) => {
                                                                                    await updateModuloM.mutateAsync({
                                                                                        id: m.id_modulo,
                                                                                        payload,
                                                                                    });
                                                                                }}
                                                                                trigger={
                                                                                    <Button variant="outline" size="sm">
                                                                                        Editar
                                                                                    </Button>
                                                                                }
                                                                            />

                                                                            <TwoStepDeleteDialog
                                                                                title={`Eliminar módulo "${m.nombre}"`}
                                                                                onConfirm={async () => deleteModuloM.mutateAsync(m.id_modulo)}
                                                                                disabled={deleteModuloM.isPending}
                                                                                requireText="ELIMINAR"
                                                                            />
                                                                        </div>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}

                                                            {(!modulosQ.data || modulosQ.data.length === 0) && (
                                                                <TableRow>
                                                                    <TableCell colSpan={4} className="text-sm text-muted-foreground">
                                                                        No hay módulos para este ciclo.
                                                                    </TableCell>
                                                                </TableRow>
                                                            )}
                                                        </TableBody>
                                                    </Table>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>
                                </TabsContent>
                            </div>
                        </Tabs>
                    </div>

                    {/* 40% */}
                    <div className="min-h-0 basis-0 flex-[2] overflow-hidden">
                        <div className="grid gap-4 lg:grid-cols-2 h-full items-stretch min-h-0 overflow-hidden">
                            {/* DIRECTIVOS */}
                            <Card className="h-full min-h-0 flex flex-col overflow-hidden">
                                <CardHeader className="flex flex-row items-center justify-between shrink-0">
                                    <CardTitle className="text-base">Directivos</CardTitle>
                                    <div className="text-sm text-muted-foreground">
                                        {directivosQ.isPending ? "Cargando..." : `${(directivosQ.data ?? []).length} total`}
                                    </div>
                                </CardHeader>

                                <CardContent className="flex-1 min-h-0 overflow-y-auto">
                                    {directivosQ.isPending ? (
                                        <div className="grid gap-2">
                                            {Array.from({ length: 2 }).map((_, i) => (
                                                <Skeleton key={i} className="h-10 w-full" />
                                            ))}
                                        </div>
                                    ) : directivosQ.error ? (
                                        <div className="rounded-lg border p-4 text-sm">
                                            Error cargando directivos: {(directivosQ.error as any)?.message ?? "unknown"}
                                        </div>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Cargo</TableHead>
                                                    <TableHead>Nombre</TableHead>
                                                    <TableHead className="w-[220px] text-right">Acciones</TableHead>
                                                </TableRow>
                                            </TableHeader>

                                            <TableBody>
                                                {(directivosQ.data ?? [])
                                                    .sort((a, b) => a.cargo.localeCompare(b.cargo))
                                                    .map((d) => (
                                                        <TableRow key={d.cargo}>
                                                            <TableCell className="font-medium">{d.cargo}</TableCell>
                                                            <TableCell>{d.nombre}</TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex justify-end gap-2">
                                                                    <DirectivoEditDialog
                                                                        directivo={d}
                                                                        disabled={updateDirectivoM.isPending}
                                                                        onSave={async (cargo, nombre) => {
                                                                            await updateDirectivoM.mutateAsync({ cargo, nombre });
                                                                        }}
                                                                    />
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}

                                                {(!directivosQ.data || directivosQ.data.length === 0) && (
                                                    <TableRow>
                                                        <TableCell colSpan={3} className="text-sm text-muted-foreground">
                                                            No hay directivos registrados.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    )}
                                </CardContent>
                            </Card>

                            {/* CUENTAS */}
                            <Card className="h-full min-h-0 flex flex-col overflow-hidden">
                                <CardHeader className="flex flex-row items-center justify-between shrink-0">
                                    <CardTitle className="text-base">Cuentas</CardTitle>
                                    <IdentityCreateDialog
                                        disabled={createIdentidadM.isPending}
                                        onCreate={(p) => createIdentidadM.mutateAsync(p)}
                                    />
                                </CardHeader>

                                <CardContent className="flex-1 min-h-0 overflow-y-auto">
                                    {identidadesQ.isPending ? (
                                        <div className="grid gap-2">
                                            {Array.from({ length: 6 }).map((_, i) => (
                                                <Skeleton key={i} className="h-10 w-full" />
                                            ))}
                                        </div>
                                    ) : identidadesQ.error ? (
                                        <div className="rounded-lg border p-4 text-sm">
                                            Error cargando cuentas: {(identidadesQ.error as any)?.message ?? "unknown"}
                                        </div>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Email</TableHead>
                                                    <TableHead>Nombre</TableHead>
                                                    <TableHead>Rol</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {(identidadesQ.data ?? []).map((u) => (
                                                    <TableRow key={u.id}>
                                                        <TableCell className="font-mono text-xs">{u.email}</TableCell>
                                                        <TableCell>{u.name ?? "—"}</TableCell>
                                                        <TableCell>{u.data?.role ?? "user"}</TableCell>
                                                    </TableRow>
                                                ))}
                                                {(!identidadesQ.data || identidadesQ.data.length === 0) && (
                                                    <TableRow>
                                                        <TableCell colSpan={3} className="text-sm text-muted-foreground">
                                                            No hay cuentas.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default AppSettingsPanel;