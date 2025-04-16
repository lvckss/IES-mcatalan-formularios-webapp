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
}

const PhoneFormField: React.FC<PhoneFormFieldProps> = ({
  label,
  name,
  value,
  onChange,
  placeholder = "Enter phone number",
  required = false,
  defaultCountry = "US",
}) => {
  // For keeping track of just the prefix part
  const [prefix, setPrefix] = useState("+1")

  // Handle phone number and prefix changes
  const handlePhoneChange = (phoneNumber: string, phonePrefix: string) => {
    // Store current prefix for later use
    setPrefix(phonePrefix)

    // Call the parent onChange with just the phone number part
    onChange(phoneNumber)
  }

  return (
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
  )
}

export default PhoneFormField