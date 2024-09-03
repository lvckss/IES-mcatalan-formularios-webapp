import React from 'react';
import { Input } from "@/components/ui/input";

interface FiltersProps {
  filters: {
    apellido1: string;
    apellido2: string;
    nombre: string;
    id_legal: string;
    fecha_nacimiento: string;
    code_expediente: string;
  };
  onFilterChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const StudentFilters: React.FC<FiltersProps> = ({ filters, onFilterChange }) => {
  return (
    <div className="flex gap-4 w-4/6 mb-5">
      <Input
        className="w-1/6"
        placeholder="Apellido1"
        name="apellido1"
        value={filters.apellido1}
        onChange={onFilterChange}
      />
      <Input
        className="w-1/6"
        placeholder="Apellido2"
        name="apellido2"
        value={filters.apellido2}
        onChange={onFilterChange}
      />
      <Input
        className="w-1/7"
        placeholder="Nombre"
        name="nombre"
        value={filters.nombre}
        onChange={onFilterChange}
      />
      <Input
        className="w-1/6"
        placeholder="ID Legal"
        name="id_legal"
        value={filters.id_legal}
        onChange={onFilterChange}
      />
      <Input
        className="w-1/6"
        placeholder="Fecha Nacimiento"
        name="fecha_nacimiento"
        value={filters.fecha_nacimiento}
        onChange={onFilterChange}
      />
      <Input
        className="w-1/6"
        placeholder="Código de Expediente"
        name="code_expediente"
        value={filters.code_expediente}
        onChange={onFilterChange}
      />
    </div>
  );
};

export default StudentFilters;