import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface FormFieldProps {
    label: string;
    name: string;
    type?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({
    label,
    name,
    type = "text",
    value,
    onChange,
    placeholder,
    required = false
}) => {
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
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                required={required}
                className="col-span-3"
            />
        </div>
    );
};

export default FormField;