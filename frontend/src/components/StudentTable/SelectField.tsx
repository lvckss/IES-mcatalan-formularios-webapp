import type React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SelectFieldProps {
  label: string
  name: string
  value: string
  onValueChange: (value: string) => void
  placeholder: string
  options: { value: string; label: string }[]
}

const SelectField: React.FC<SelectFieldProps> = ({ label, name, value, onValueChange, placeholder, options }) => (
  <div className="w-fit max-w-[300px]">
    <Select value={value} onValueChange={onValueChange} name={name}>
      <SelectTrigger id={name}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-[200px] overflow-y-auto">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} className="hover:bg-gray-100 cursor-pointer">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
)

export default SelectField
