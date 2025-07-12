import type React from "react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CountrySelect, countries } from "./country-select"

interface PhoneInputProps {
  id?: string
  label?: string
  placeholder?: string
  value?: string
  onChange?: (value: string, prefix: string) => void
  className?: string
  error?: string
  defaultCountryCode?: string
  required?: boolean
}

export function PhoneInput({
  id = "phone",
  label = "Phone Number",
  placeholder = "Enter phone number",
  value = "",
  onChange,
  className,
  error,
  defaultCountryCode = "US",
  required = false,
}: PhoneInputProps) {
  const [selectedCountryCode, setSelectedCountryCode] = useState(defaultCountryCode)
  const [phoneNumber, setPhoneNumber] = useState(value)
  const [formattedPhoneNumber, setFormattedPhoneNumber] = useState("")

  // Get the selected country object
  const selectedCountry = countries.find((c) => c.code === selectedCountryCode) || countries[0]

  // Format the phone number with spaces
  const formatPhoneNumber = (value: string) => {
    // If value is empty, return empty string
    if (!value) return ""

    // Remove all non-digit characters
    const digits = value.replace(/\D/g, "")

    // If no digits, return empty string
    if (!digits) return ""

    // Add spaces every 2-3 digits (common pattern for many countries)
    let formatted = ""
    for (let i = 0; i < digits.length; i++) {
      // Add space after positions 3, 5, and 7 (resulting in groups of 3,2,2,2...)
      if (i === 3 || i === 5 || i === 7) {
        formatted += " "
      }
      formatted += digits[i]
    }

    return formatted
  }

  const handleCountryChange = (code: string) => {
    setSelectedCountryCode(code)
    const country = countries.find((c) => c.code === code) || countries[0]
    if (onChange) {
      onChange(phoneNumber, country.prefix)
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Get the current value from the input
    const inputValue = e.target.value

    // If the input is being cleared, handle it specially
    if (!inputValue) {
      setPhoneNumber("")
      setFormattedPhoneNumber("")
      if (onChange) {
        onChange("", selectedCountry.prefix)
      }
      return
    }

    // Get the cursor position before updating
    const cursorPosition = e.target.selectionStart || 0

    // Remove all spaces to get the raw value
    const rawValue = inputValue.replace(/\s/g, "")

    // Format the phone number for display
    const formatted = formatPhoneNumber(rawValue)

    // Update state
    setPhoneNumber(rawValue)
    setFormattedPhoneNumber(formatted)

    // Call onChange with the raw value
    if (onChange) {
      onChange(rawValue, selectedCountry.prefix)
    }

    // Set timeout to restore cursor position after React updates the DOM
    setTimeout(() => {
      // Calculate new cursor position (accounting for added spaces)
      const spacesBeforeCursor = (formatted.substring(0, cursorPosition).match(/\s/g) || []).length
      const spacesInOriginalBeforeCursor = (inputValue.substring(0, cursorPosition).match(/\s/g) || []).length
      const newCursorPosition = cursorPosition + (spacesBeforeCursor - spacesInOriginalBeforeCursor)

      // Set the cursor position
      if (e.target.selectionStart !== null) {
        e.target.setSelectionRange(newCursorPosition, newCursorPosition)
      }
    }, 0)
  }

  // Initialize formatted value when component mounts or value changes
  useEffect(() => {
    setPhoneNumber(value)
    setFormattedPhoneNumber(formatPhoneNumber(value))
  }, [value])

  // Initialize selected country when defaultCountryCode changes
  useEffect(() => {
    if (defaultCountryCode) {
      setSelectedCountryCode(defaultCountryCode)
    }
  }, [defaultCountryCode])

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor={id}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <div className="flex">
        <Input
          id={id}
          type="tel"
          placeholder={placeholder}
          value={formattedPhoneNumber}
          onChange={handlePhoneChange}
          className="flex-1"
          required={required}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}