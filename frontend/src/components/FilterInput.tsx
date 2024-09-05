import React from 'react';
import { Input } from "@/components/ui/input";

interface FilterInputProps {
  value: string;
  placeholder: string;
  name: string;
  onFilterChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const FilterInput: React.FC<FilterInputProps> = ({ value, placeholder, name, onFilterChange }) => {
  return (
    <div>
      <Input
        className="w-full h-7 text-xs bg-background"
        placeholder={placeholder}
        name={name}
        value={value}
        onChange={onFilterChange}
      />
    </div>
  );
};

export default FilterInput;
