import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '../ui/button';
import { ContactRound, Trash, FolderPlus } from 'lucide-react';
import { Input } from "@/components/ui/input";
import StudentProfilePanel from '../StudentPanel/StudentProfilePanel';
import NewEnrollmentDialog from './NewEnrollmentDialog';
import { toast } from 'sonner';
import { Checkbox } from "@/components/ui/checkbox";
import { Student } from '@/types';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable
} from '@tanstack/react-table';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import { Switch } from "@/components/ui/switch";

import { RotateCcw } from "lucide-react";

import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";

import { Label } from "@/components/ui/label";

import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem
} from "@/components/ui/select";

import { FullStudentData } from '@/types';

import { api } from '@/lib/api';

import { useState } from 'react';

async function deleteStudent({ id }: { id: number }) {
  const response = await api.students[':id'].$delete({ param: { id: id.toString() } });

  if (!response.ok) {
    throw new Error("server error");
  }
}

async function getAllStudentsFullInfo(): Promise<FullStudentData[]> {
  const res = await api.students.allFullInfo.$get();
  if (!res.ok) throw new Error("server error");
  const json = await res.json();

  const apiData = json.allFullInfo;

  return apiData.map(({ student, records }) => ({
    student: {
      ...student,
      fecha_nac: new Date(student.fecha_nac),
    },
    records: records.map(r => ({
      ...r,
      fecha_pago_titulo: r.fecha_pago_titulo ? new Date(r.fecha_pago_titulo) : null,
    })),
  }));
}

// =========================== QUERIES DE GRUPOS ================================================

// ====== API helpers para grupos (adaptados a tus routes Hono) ======
type GroupDTO = { id_grupo: number; nombre: string; descripcion: string; num_miembros?: number };

// GET /groups/withCounts
async function listGroupsWithCounts(): Promise<GroupDTO[]> {
  const res = await api.groups.withCounts.$get();
  if (!res.ok) throw new Error("server error");
  const json = await res.json();
  return json.grupos as GroupDTO[];
}

// POST /groups
async function createGroupApi(payload: { nombre: string; descripcion: string }): Promise<GroupDTO> {
  const res = await api.groups.$post({ json: payload });
  if (!res.ok) throw new Error("server error");
  const json = await res.json();
  return json.grupo as GroupDTO;
}

// DELETE /groups/:id_grupo
async function deleteGroupApi(id_grupo: number): Promise<void> {
  const res = await api.groups[':id_grupo'].$delete({ param: { id_grupo: String(id_grupo) } });
  if (!res.ok) throw new Error("server error");
}

// GET /groups/:id_grupo/members  -> { miembros: number[] }
async function getGroupMemberIdsApi(id_grupo: number): Promise<number[]> {
  const res = await api.groups[':id_grupo'].members.$get({ param: { id_grupo: String(id_grupo) } });
  if (!res.ok) throw new Error("server error");
  const json = await res.json();
  return json.miembros as number[];
}

// POST /groups/:id_grupo/members  -> body { id_estudiantes: number[] }
async function addGroupMembersApi(id_grupo: number, ids: number[]): Promise<void> {
  const res = await api.groups[':id_grupo'].members.$post({
    param: { id_grupo: String(id_grupo) },
    json: { id_estudiantes: ids },
  });
  if (!res.ok) throw new Error("server error");
}

interface StudentTableProps {
  students: Student[];
}

const StudentTable: React.FC<StudentTableProps> = ({ students }) => {

  // filtros de las columnas
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [turno, setTurno] = React.useState<string>("__all__");
  const [schoolCycle, setSchoolCycle] = React.useState<string>("__all__");
  const [schoolYear, setSchoolYear] = React.useState<string>("__all__");
  const [schoolCourse, setSchoolCourse] = React.useState<string>("__all__");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false);
  const [trasladoEnabled, setTrasladoEnabled] = React.useState(false);
  const [trasladoValue, setTrasladoValue] = React.useState(true); // checked = viene por traslado
  const [requisitoEnabled, setRequisitoEnabled] = React.useState(false);
  const [requisitoValue, setRequisitoValue] = React.useState(true); // checked = tiene requisito

  const resetFilters = () => {
    setSchoolYear("__all__");
    setSchoolCycle("__all__");
    setSchoolCourse("__all__");
    setTurno("__all__");
    setTrasladoEnabled(false);
    setTrasladoValue(true);
    setRequisitoEnabled(false);
    setRequisitoValue(true);
    setColumnFilters([]); // limpia los inputs de las columnas
    setSelectedGroupId("__all__");
  };

  // ======================= LÓGICA FILTRO GRUPOS =====================================
  // Selección de alumnos
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set());

  // Filtro por grupo
  const [selectedGroupId, setSelectedGroupId] = React.useState<string>("__all__");

  // ID numérico estable del grupo seleccionado (o null si "Todos")
  const groupIdNum = React.useMemo(() => {
    if (selectedGroupId === "__all__") return null;
    const n = Number(selectedGroupId);
    return Number.isFinite(n) ? n : null;
  }, [selectedGroupId]);

  // Diálogo "Guardar como grupo"
  const [isGroupDialogOpen, setIsGroupDialogOpen] = React.useState(false);
  const [newGroupName, setNewGroupName] = React.useState("");

  const queryClient = useQueryClient();

  // Lista de grupos (con contador)
  const {
    data: groups = [],
    isLoading: groupsLoading,
  } = useQuery({
    queryKey: ["groups", "withCounts"],
    queryFn: listGroupsWithCounts,
    staleTime: 60_000,
  });

  // ✅ LOADER CONTROLADO DE MIEMBROS DEL GRUPO
  const [groupMembers, setGroupMembers] = React.useState<number[] | null>(null);
  const [groupMembersLoading, setGroupMembersLoading] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    if (groupIdNum === null) {
      setGroupMembers(null);
      return;
    }

    setGroupMembersLoading(true);
    getGroupMemberIdsApi(groupIdNum)
      .then((ids) => {
        if (cancelled) return;
        const norm = (ids ?? []).map(Number).filter(Number.isFinite);
        setGroupMembers(norm);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("load group members failed", err);
        setGroupMembers([]); // evita bloqueo de la UI
        toast("No se pudieron cargar los miembros del grupo.");
      })
      .finally(() => {
        if (!cancelled) setGroupMembersLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [groupIdNum]);

  const selectedGroupMemberSet = React.useMemo(
    () => new Set(groupMembers ?? []),
    [groupMembers]
  );

  // Crear grupo
  const createGroupMutation = useMutation({
    mutationFn: (payload: { nombre: string; descripcion: string }) => createGroupApi(payload),
    onSuccess: async (grupo) => {
      const ids = Array.from(selectedIds);
      if (ids.length > 0) {
        try {
          await addGroupMembersApi(grupo.id_grupo, ids);
        } catch {
          toast("El grupo se creó, pero no se pudieron añadir los miembros.");
        }
      }
      await queryClient.invalidateQueries({ queryKey: ["groups", "withCounts"] });
      await queryClient.invalidateQueries({ queryKey: ["groups", grupo.id_grupo, "members"] });
      setSelectedGroupId(String(grupo.id_grupo));
      setIsGroupDialogOpen(false);
      setNewGroupName("");
      setSelectedIds(new Set());
      toast("Grupo creado", { description: `${grupo.nombre} – ${ids.length} alumnos` });
    },
    onError: (e: any) => {
      if (e?.message === "GROUP_NAME_EXISTS") {
        toast("Ya existe un grupo con ese nombre.");
      } else {
        toast("No se pudo crear el grupo.");
      }
    },
  });

  // Eliminar grupo
  const deleteGroupMutation = useMutation({
    mutationFn: (id_grupo: number) => deleteGroupApi(id_grupo),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["groups", "withCounts"] });
      setSelectedGroupId("__all__");
      toast("Grupo eliminado");
    },
    onError: () => toast("No se pudo eliminar el grupo."),
  });

  const onCreateGroupClick = () => {
    const ids = Array.from(selectedIds);
    if (!newGroupName.trim()) {
      toast("Ponle un nombre al grupo");
      return;
    }
    if (ids.length === 0) {
      toast("No hay alumnos seleccionados");
      return;
    }
    createGroupMutation.mutate({ nombre: newGroupName.trim(), descripcion: "" }); // puedes pedir descripcion si quieres
  };


  const toggleId = (id: number) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };
  const isSelected = (id: number) => selectedIds.has(id);

  const clearSelection = () => setSelectedIds(new Set());

  const selectedGroupName = React.useMemo(() => {
    if (groupIdNum == null) return "";
    const g = groups.find(x => x.id_grupo === groupIdNum);
    return g?.nombre ?? `Grupo ${groupIdNum}`;
  }, [groups, groupIdNum]);

  // ==================================================================================

  const extraerCursoDeNombre = (nombre: string): number | null => {
    const m = nombre.match(/\((\d+)º\)/);
    return m ? Number(m[1]) : null;
  };

  // columnas definidas y adicionalmente memorizadas para evitar re-renders innecesarios (React.useMemo)
  const columns = React.useMemo<ColumnDef<Student>[]>(
    () => [
      {
        id: "select",
        header: "",
        enableColumnFilter: false,
        size: 36,
        cell: ({ row }) => (
          <Checkbox
            checked={isSelected(row.original.id_estudiante)}
            onCheckedChange={() => toggleId(row.original.id_estudiante)}
            aria-label={`Seleccionar estudiante ${row.original.id_estudiante}`}
          />
        ),
      },
      { accessorKey: 'apellido_1', header: 'Apellido 1' },
      { accessorKey: 'apellido_2', header: 'Apellido 2' },
      { accessorKey: 'nombre', header: 'Nombre' },
      {
        accessorKey: 'fecha_nac',
        header: 'Fecha de Nacimiento',
        cell: info => new Date(info.getValue<string>()).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        filterFn: (row, columnId, filterValue) => {
          const rowValue = row.getValue<string>(columnId);
          if (!rowValue) return false;
          const formattedRowValue = new Date(rowValue).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
          return formattedRowValue.includes(filterValue);
        }
      },
      { accessorKey: 'id_legal', header: 'ID Legal' },
      {
        header: 'Acciones',
        enableColumnFilter: false,
        size: 120, // ajusta si quieres
        cell: ({ row }) => (
          <div className="w-full flex flex-wrap items-center justify-center gap-2">
            <StudentPanelButton id={row.original.id_estudiante} />
            <NewEnrollmentButton id={row.original.id_estudiante} />
            <StudentDeleteButton id={row.original.id_estudiante} />
          </div>
        ),
      }

    ],
    [isSelected] // depende de isSelected para reflejar estado actual
  );

  // 1) Fetch allFullInfo
  const {
    data: allFullInfo,
    isLoading: isFullInfoLoading,
    isFetching: isFullInfoFetching,
    error: fullInfoError,
  } = useQuery({
    queryKey: ["students-allFullInfo"],
    queryFn: getAllStudentsFullInfo,
    staleTime: 60_000,
  });

  // Acceso O(1) al fullInfo del estudiante (evita .find O(n))
  const fullInfoById = React.useMemo(() => {
    const map = new Map<number, FullStudentData>();
    (allFullInfo ?? []).forEach((fi) => {
      map.set(fi.student.id_estudiante, fi);
    });
    return map;
  }, [allFullInfo]);

  // ¿Está listo allFullInfo para usar filtros por expediente?
  const allFullInfoReady = React.useMemo(
    () => Array.isArray(allFullInfo) && allFullInfo.length > 0,
    [allFullInfo]
  );

  // 2) Map id_estudiante -> Set("YYYY-YYYY")
  const periodosPorEstudiante = React.useMemo(() => {
    const map = new Map<number, Set<string>>();
    (allFullInfo ?? []).forEach(({ student, records }) => {
      const set = map.get(student.id_estudiante) ?? new Set<string>();
      records.forEach(r => set.add(`${r.ano_inicio}-${r.ano_fin}`));
      map.set(student.id_estudiante, set);
    });
    return map;
  }, [allFullInfo]);

  // 3) All available periods for the dropdown, sorted desc by start year
  const todosLosPeriodos = React.useMemo(() => {
    const s = new Set<string>();
    periodosPorEstudiante.forEach(set => set.forEach(p => s.add(p)));
    return Array.from(s).sort((a, b) => {
      const [aStart] = a.split("-").map(Number);
      const [bStart] = b.split("-").map(Number);
      return bStart - aStart;
    });
  }, [periodosPorEstudiante]);

  // Lista de ciclos disponibles (únicos), ordenados por nombre
  const todosLosCiclos = React.useMemo(() => {
    const unique = new Map<number, { id: number; nombre: string; codigo: string }>();
    (allFullInfo ?? []).forEach(({ records }) => {
      records.forEach(r => {
        unique.set(r.id_ciclo, { id: r.id_ciclo, nombre: r.ciclo_nombre, codigo: r.ciclo_codigo });
      });
    });
    return Array.from(unique.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [allFullInfo]);

  const turnosDisponibles = React.useMemo(() => {
    const s = new Set<string>();
    (allFullInfo ?? []).forEach(({ records }) => {
      records.forEach(r => {
        const period = `${r.ano_inicio}-${r.ano_fin}`;
        const okYear = (schoolYear === "__all__") || (period === schoolYear);
        const okCycle = (schoolCycle === "__all__") || (r.id_ciclo === Number(schoolCycle));
        const okTransf = !trasladoEnabled || (r.vino_traslado === trasladoValue);
        if (okYear && okCycle && okTransf && r.turno) s.add(r.turno);
      });
    });
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [allFullInfo, schoolYear, schoolCycle, trasladoEnabled, trasladoValue]);


  // Opciones de curso disponibles para el ciclo seleccionado
  const cursosDelCicloSeleccionado = React.useMemo(() => {
    if (schoolCycle === "__all__") return [] as number[];
    const id = Number(schoolCycle);
    const set = new Set<number>();

    (allFullInfo ?? []).forEach(({ records }) => {
      records.forEach(r => {
        const period = `${r.ano_inicio}-${r.ano_fin}`;
        const okYear = (schoolYear === "__all__") || (period === schoolYear);
        const okCycle = r.id_ciclo === id;
        const okTransf = !trasladoEnabled || (r.vino_traslado === trasladoValue);
        const okShift = (turno === "__all__") || (r.turno === turno);

        if (okYear && okCycle && okTransf && okShift) {
          r.enrollments?.forEach(enr => {
            const c = extraerCursoDeNombre(enr.nombre_modulo);
            if (c) set.add(c);
          });
        }
      });
    });

    return Array.from(set).sort((a, b) => a - b);
  }, [allFullInfo, schoolCycle, schoolYear, trasladoEnabled, trasladoValue, turno]);

  React.useEffect(() => {
    if (schoolCourse !== "__all__" && !cursosDelCicloSeleccionado.includes(Number(schoolCourse))) {
      setSchoolCourse("__all__");
    }
  }, [cursosDelCicloSeleccionado, schoolCourse]);

  // Si cambias de ciclo, resetea el curso
  React.useEffect(() => {
    setSchoolCourse("__all__");
  }, [schoolCycle, schoolYear]);

  // 5) Pre-filter students by selected period (keeps your column filters working)
  const dataFiltrada = React.useMemo(() => {
    // ¿Algún filtro que obligue a mirar Expedientes?
    const needsExpedientes =
      schoolYear !== "__all__" ||
      schoolCycle !== "__all__" ||
      schoolCourse !== "__all__" ||
      turno !== "__all__" ||
      trasladoEnabled; // 👈 solo cuenta si está activo

    // Si hay grupo seleccionado pero aún se cargan sus miembros → espera
    if (groupIdNum !== null && groupMembersLoading) return [];

    // 0) Pre-filtrado por requisito académico (campo en Estudiantes)
    let base = students;
    if (requisitoEnabled) {
      base = base.filter((s) => {
        const val = (s as any).requisito_academico; // o s.requisito_academico si lo tienes tipado
        return Boolean(val) === requisitoValue;
      });
    }

    // 1) Filtrado por grupo (si lo hay)
    if (groupIdNum !== null) {
      base = base.filter((s) => selectedGroupMemberSet.has(s.id_estudiante));
    }

    // 2) Si no hay filtros de expedientes, terminamos
    if (!needsExpedientes) return base;

    // 3) Con filtros de expedientes activos
    const cycleId = schoolCycle !== "__all__" ? Number(schoolCycle) : null;
    const courseN = schoolCourse !== "__all__" ? Number(schoolCourse) : null;

    return base.filter((s) => {
      const info = fullInfoById.get(s.id_estudiante);
      if (!info) return false;

      return info.records.some((r) => {
        if (schoolYear !== "__all__" && `${r.ano_inicio}-${r.ano_fin}` !== schoolYear) return false;
        if (cycleId !== null && r.id_ciclo !== cycleId) return false;
        if (trasladoEnabled && r.vino_traslado !== trasladoValue) return false; // 👈 tri-state aplicado
        if (turno !== "__all__" && r.turno !== turno) return false;

        if (courseN !== null) {
          return r.enrollments?.some(
            (enr) => extraerCursoDeNombre(enr.nombre_modulo) === courseN
          ) ?? false;
        }
        return true;
      });
    });
  }, [
    // base
    students,
    fullInfoById,
    // grupo
    groupIdNum,
    groupMembersLoading,
    selectedGroupMemberSet,
    // requisito académico
    requisitoEnabled,
    requisitoValue,
    // expedientes
    schoolYear,
    schoolCycle,
    schoolCourse,
    turno,
    trasladoEnabled,
    trasladoValue,
  ]);

  // inicialización de la tabla
  const table = useReactTable({
    data: dataFiltrada,
    columns,
    filterFns: {},
    state: { columnFilters },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });


  const { rows } = table.getRowModel()

  const parentRef = React.useRef(null);

  const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35,
    overscan: 5,
  });

  console.log("dataFiltrada.len", dataFiltrada.length);

  // DEBUG: borra luego
  console.log({
    selectedGroupId,
    groupIdNum,
    allFullInfoReady: Array.isArray(allFullInfo) && allFullInfo.length > 0,
    allFullInfoLen: allFullInfo?.length ?? 0,
    studentsLen: students.length
  });

  return (
    <div className="border rounded-lg mb-4 overflow-hidden">
      {/* Encabezado de la tabla con posicionamiento sticky */}
      <div className="px-3 py-2 bg-gray-50">
        {/* overflow-x-auto como “airbag” en pantallas estrechas */}
        <div className="flex w-full items-start gap-4 overflow-x-auto flex-wrap md:flex-nowrap">

          {/* Periodo escolar */}
          <div className="flex items-center gap-2 flex-1 basis-0 min-w-0 pt-1">
            <Label className="text-sm">Periodo escolar</Label>
            <div className="bg-white flex-1 min-w-0">
              <Select value={schoolYear} onValueChange={setSchoolYear} disabled={isFullInfoLoading}>
                <SelectTrigger className="w-full min-w-0">
                  <SelectValue placeholder="Selecciona periodo" className="truncate" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">...</SelectItem>
                  {todosLosPeriodos.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Ciclo + Curso */}
          <div className="flex items-center gap-2 flex-1 basis-0 min-w-0 pt-1">
            <Label className="text-sm whitespace-nowrap">Ciclo</Label>

            {/* Ciclo: ancho fijo y estable */}
            <div className="bg-white flex-none w-[150px] min-w-0">
              <Select
                value={schoolCycle}
                onValueChange={setSchoolCycle}
                disabled={isFullInfoLoading}
              >
                <SelectTrigger className="w-full min-w-0 h-9">
                  <SelectValue placeholder="Todos los ciclos" className="truncate" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">...</SelectItem>
                  {todosLosCiclos.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.nombre} ({c.codigo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Curso: un poco más estrecho */}
            <div className="bg-white flex-none w-16 sm:w-20">
              <Select
                value={schoolCourse}
                onValueChange={setSchoolCourse}
                disabled={
                  isFullInfoLoading ||
                  schoolCycle === "__all__" ||
                  cursosDelCicloSeleccionado.length === 0
                }
              >
                <SelectTrigger className="w-full h-9">
                  <SelectValue
                    placeholder={schoolCycle === "__all__" ? "—" : "Todos"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">...</SelectItem>
                  {cursosDelCicloSeleccionado.map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}º</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1 flex-1 basis-0 ml-10">
            {/* Trasladado */}
            <div className="flex items-center gap-2 flex-wrap">
              <Switch
                id="traslado-enabled"
                checked={trasladoEnabled}
                onCheckedChange={(v) => setTrasladoEnabled(Boolean(v))}
                aria-label="Usar filtro de traslado"
              />
              <Checkbox
                id="traslado-value"
                checked={trasladoValue}
                onCheckedChange={(v) => setTrasladoValue(Boolean(v))}
                disabled={!trasladoEnabled || isFullInfoLoading}
              />
              <Label className="text-sm whitespace-nowrap">Trasladado</Label>
            </div>

            {/* Requisito académico */}
            <div className="flex items-center gap-2 flex-wrap">
              <Switch
                id="requisito-enabled"
                checked={requisitoEnabled}
                onCheckedChange={(v) => setRequisitoEnabled(Boolean(v))}
                aria-label="Usar filtro de requisito académico"
              />
              <Checkbox
                id="requisito-value"
                checked={requisitoValue}
                onCheckedChange={(v) => setRequisitoValue(Boolean(v))}
                disabled={!requisitoEnabled}
              />
              <Label className="text-sm whitespace-nowrap">Requisito académico</Label>
            </div>
          </div>

          {/* Turno */}
          <div className="flex items-center gap-2 flex-1 basis-0 min-w-0 pt-1">
            <Label className="text-sm">Turno</Label>
            <div className="bg-white flex-1 min-w-0">
              <Select value={turno} onValueChange={setTurno} disabled={isFullInfoLoading || turnosDisponibles.length === 0}>
                <SelectTrigger className="w-full min-w-0">
                  <SelectValue placeholder="Todos los turnos" className="truncate" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">...</SelectItem>
                  {turnosDisponibles.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Limpiar filtros */}
          <div className="flex items-center gap-2 flex-none w-40 pt-1">
            <Button
              variant="default"
              onClick={resetFilters}
              disabled={isFullInfoLoading}
              className="w-full gap-1"
              aria-label="Limpiar filtros"
              title="Limpiar filtros"
            >
              <RotateCcw className="h-4 w-4" />
              Limpiar filtros
            </Button>
          </div>

        </div>
      </div>
      {/* ===== Fila 2: UI de grupos (backend) ===== */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b">
        {/* Selección de grupo + acciones */}
        <div className="flex items-center gap-2 px-2 py-1 rounded">
          <Label className="text-sm">Grupo</Label>
          <div className='bg-white'>
            <Select
              value={selectedGroupId}
              onValueChange={setSelectedGroupId}
              disabled={groupsLoading || groups.length === 0}
            >
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Todos los grupos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos</SelectItem>
                {groups.map(g => (
                  <SelectItem key={g.id_grupo} value={String(g.id_grupo)}>
                    {g.nombre}{typeof g.num_miembros === "number" ? ` (${g.num_miembros})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Eliminar grupo seleccionado con doble confirmación */}
          <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={selectedGroupId === "__all__" || deleteGroupMutation.isPending}
                className="gap-1"
              >
                <Trash2 className="h-4 w-4" />
                {deleteGroupMutation.isPending ? "Eliminando..." : "Eliminar"}
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Seguro que quieres eliminar el grupo?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se eliminará <b>{selectedGroupName}</b> y se perderán sus miembros asociados.
                  Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleteGroupMutation.isPending}>
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deleteGroupMutation.isPending || selectedGroupId === "__all__"}
                  onClick={async (e) => {
                    e.preventDefault();
                    await deleteGroupMutation.mutateAsync(Number(selectedGroupId));
                    setConfirmDeleteOpen(false);
                  }}
                >
                  {"Sí, eliminar"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Guardar selección como grupo (diálogo) */}
          <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="default"
                size="sm"
                className="gap-1"
                disabled={selectedIds.size === 0 || createGroupMutation.isPending}
              >
                <Plus className="h-4 w-4" />
                {`Guardar como grupo (${selectedIds.size})`}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Guardar selección como grupo</DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="group-name">Nombre del grupo</Label>
                <Input
                  id="group-name"
                  placeholder="p. ej., 1º AFD — Diurno"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {selectedIds.size} alumnos seleccionados
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsGroupDialogOpen(false)}>Cancelar</Button>
                <Button onClick={onCreateGroupClick}>Guardar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Acciones rápidas de selección sobre los alumnos visibles */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={clearSelection}>
            Limpiar selección ({selectedIds.size})
          </Button>
        </div>
      </div>

      <Table className="w-full">
        <TableHeader className="sticky top-0 z-10 bg-gray-50">
          {table.getHeaderGroups().map(headerGroup => (
            <React.Fragment key={headerGroup.id}>
              <TableRow>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id} style={{ width: header.column.getSize() }}>
                    {!header.isPlaceholder && flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
              <TableRow>
                {/* Renderizar campos de entrada para los filtros de columna */}
                {headerGroup.headers.map(header => (
                  <TableHead className="bg-gray-50" key={`${header.id}-filter`} style={{ width: header.column.getSize() }}>
                    {header.column.getCanFilter() && (
                      <Input
                        value={(header.column.getFilterValue() as string) ?? ''}
                        onChange={e => header.column.setFilterValue(e.target.value)}
                        placeholder=". . ."
                        className="h-7 w-[calc(100%-0.5rem)] text-xs px-2 py-1 bg-white"
                      />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </React.Fragment>
          ))}
        </TableHeader>
      </Table>

      {/* Cuerpo de la tabla con scroll vertical */}
      <div ref={parentRef} className="max-h-[48vh] min-h-[48vh] overflow-auto">
        <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative', width: '100%' }}>
          <Table className="w-full">
            <TableBody>
              {rowVirtualizer.getVirtualItems().map((virtualRow, index) => {
                const row = rows[virtualRow.index]
                return (
                  <TableRow
                    key={row.id}
                    className='border-none hover:bg-slate-100'
                    style={{
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start - index * virtualRow.size}px)`,
                    }}
                  >
                    {row.getVisibleCells().map((cell) => {
                      return (
                        <TableCell key={cell.id} style={{
                          width: cell.column.getSize(),
                        }}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

export default StudentTable;

export function StudentDeleteButton({ id }: { id: number }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);

  const mutation = useMutation({
    mutationFn: deleteStudent,
    onError: () => {
      toast("No se pudo eliminar el estudiante con éxito.", {
        description: `ID del estudiante: ${id}`,
      });
    },
    onSuccess: () => {
      toast("Estudiante eliminado con éxito.", {
        description: `ID del estudiante: ${id}`,
      });
      queryClient.invalidateQueries({ queryKey: ["get-total-students"] });
      setOpen(false); // cerrar al terminar
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          disabled={mutation.isPending}
          aria-label={`Eliminar estudiante ${id}`}
          className="h-9 w-9 rounded-xl"
        >
          {mutation.isPending ? "..." : <Trash className="h-5 w-5 text-red-500" />}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Seguro que quieres eliminarlo?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Se eliminarán los datos del
            estudiante con ID <b>{id}</b>.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            // Evita que el diálogo se cierre automáticamente;
            // lo cerraremos en onSuccess.
            onClick={(e) => {
              e.preventDefault();
              mutation.mutate({ id });
            }}
            disabled={mutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {mutation.isPending ? "Eliminando..." : "Sí, eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function StudentPanelButton({ id }: { id: number }) {
  const [panelIsOpen, setPanelIsOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl"
        onClick={() => setPanelIsOpen(true)}>
        <ContactRound className="h-5 w-5" />
      </Button>
      <StudentProfilePanel id={id} isOpen={panelIsOpen} onClose={() => setPanelIsOpen(false)} />
    </>
  );
}

function NewEnrollmentButton({ id }: { id: number }) {
  const [dialogIsOpen, setDialogIsOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl"
        onClick={() => setDialogIsOpen(true)}>
        <FolderPlus className="h-5 w-5" />
      </Button>
      <NewEnrollmentDialog student_id={id} isOpen={dialogIsOpen} onClose={() => setDialogIsOpen(false)} />
    </>
  );
}