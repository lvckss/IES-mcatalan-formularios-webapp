import type React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Option = { value: string; label: string; disabled?: boolean }

interface SelectFieldProps {
  label: string
  name: string
  value: string
  onValueChange: (value: string) => void
  placeholder: string
  options: Option[]
  width?: number
}

const SelectField: React.FC<SelectFieldProps> = ({
  label, name, value, onValueChange, placeholder, options, width = 310
}) => {
  const maxWidth = typeof width === "number" ? `${width}px` : width;
  return (
    <div style={{ maxWidth }} className="w-fit">
      <Select value={value} onValueChange={onValueChange} name={name}>
        <SelectTrigger id={name}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-[300px] overflow-y-auto">
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              className={`cursor-pointer ${option.disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"}`}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export default SelectField
