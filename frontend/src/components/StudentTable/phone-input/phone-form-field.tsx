import type React from "react"
import { useState } from "react"
import { Label } from "@/components/ui/label"
import { PhoneInput } from "./phone-input"

interface PhoneFormFieldProps {
  label: string
  name: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  defaultCountry?: string
  error?: string
}

const PhoneFormField: React.FC<PhoneFormFieldProps> = ({
  label,
  name,
  value,
  onChange,
  placeholder = "Enter phone number",
  required = false,
  defaultCountry = "US",
  error,
}) => {
  const [prefix, setPrefix] = useState("+1")

  const handlePhoneChange = (phoneNumber: string, phonePrefix: string) => {
    setPrefix(phonePrefix)
    onChange(phoneNumber)
  }

  return (
    <div className="relative">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor={name} className="text-right font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <div className="col-span-3">
          <PhoneInput
            id={name}
            label=""
            value={value}
            onChange={handlePhoneChange}
            placeholder={placeholder}
            className="m-0"
            defaultCountryCode={defaultCountry}
            required={required}
          />
        </div>
      </div>

      {error && (
        <p className="absolute text-xs text-red-500 top-9 ml-20">
          {error}
        </p>
      )}
    </div>
  )
}

export default PhoneFormField