import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import clsx from "clsx";          // optional helper for class names

interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  /**
   * If true, force the text to upper‑case (UI + state).
   * Default = false → behaves exactly as before.
   */
  uppercase?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  uppercase = false,        // ← default is OFF
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    onChange(uppercase ? value.toUpperCase() : value);
  };

  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor={name} className="text-right font-medium">
        {label}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        autoComplete="off"
        required={required}
        className={clsx("col-span-3", uppercase && "uppercase")}
      />
    </div>
  );
};

export default FormField;