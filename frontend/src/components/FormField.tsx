import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface FormFieldProps {
    label: string;
    name: string;
    type?: string;
}

const FormField: React.FC<FormFieldProps> = ({ label, name, type = "text" }) => {
    return (
        <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor={name} className="text-right font-medium">{label}</Label>
            <Input id={name} name={name} type={type} className="col-span-3" />
        </div>
    );
};

export default FormField;