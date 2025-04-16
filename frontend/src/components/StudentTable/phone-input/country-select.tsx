import type React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Country data with codes and phone prefixes
export const countries = [
    { name: "España", code: "ES", iso: "es", prefix: "+34" },
    { name: "Portugal", code: "PT", iso: "pt", prefix: "+351" },
    { name: "Francia", code: "FR", iso: "fr", prefix: "+33" },
    { name: "Andorra", code: "AD", iso: "ad", prefix: "+376" },
    { name: "Mónaco", code: "MC", iso: "mc", prefix: "+377" },
    { name: "Italia", code: "IT", iso: "it", prefix: "+39" },
    { name: "San Marino", code: "SM", iso: "sm", prefix: "+378" },
    { name: "Ciudad del Vaticano", code: "VA", iso: "va", prefix: "+379" },
    { name: "Malta", code: "MT", iso: "mt", prefix: "+356" },
    { name: "Suiza", code: "CH", iso: "ch", prefix: "+41" },
    { name: "Alemania", code: "DE", iso: "de", prefix: "+49" },
    { name: "Bélgica", code: "BE", iso: "be", prefix: "+32" },
    { name: "Países Bajos", code: "NL", iso: "nl", prefix: "+31" },
    { name: "Luxemburgo", code: "LU", iso: "lu", prefix: "+352" },
    { name: "Reino Unido", code: "GB", iso: "gb", prefix: "+44" },
    { name: "Irlanda", code: "IE", iso: "ie", prefix: "+353" },
    { name: "Dinamarca", code: "DK", iso: "dk", prefix: "+45" },
    { name: "Noruega", code: "NO", iso: "no", prefix: "+47" },
    { name: "Suecia", code: "SE", iso: "se", prefix: "+46" },
    { name: "Finlandia", code: "FI", iso: "fi", prefix: "+358" },
    { name: "Islandia", code: "IS", iso: "is", prefix: "+354" },
    { name: "Austria", code: "AT", iso: "at", prefix: "+43" },
    { name: "Eslovenia", code: "SI", iso: "si", prefix: "+386" },
    { name: "Croacia", code: "HR", iso: "hr", prefix: "+385" },
    { name: "Bosnia y Herzegovina", code: "BA", iso: "ba", prefix: "+387" },
    { name: "Serbia", code: "RS", iso: "rs", prefix: "+381" },
    { name: "Montenegro", code: "ME", iso: "me", prefix: "+382" },
    { name: "Albania", code: "AL", iso: "al", prefix: "+355" },
    { name: "Grecia", code: "GR", iso: "gr", prefix: "+30" },
    { name: "Macedonia del Norte", code: "MK", iso: "mk", prefix: "+389" },
    { name: "Bulgaria", code: "BG", iso: "bg", prefix: "+359" },
    { name: "Rumanía", code: "RO", iso: "ro", prefix: "+40" },
    { name: "Hungría", code: "HU", iso: "hu", prefix: "+36" },
    { name: "Polonia", code: "PL", iso: "pl", prefix: "+48" },
    { name: "Chequia", code: "CZ", iso: "cz", prefix: "+420" },
    { name: "Eslovaquia", code: "SK", iso: "sk", prefix: "+421" },
    { name: "Ucrania", code: "UA", iso: "ua", prefix: "+380" },
    { name: "Bielorrusia", code: "BY", iso: "by", prefix: "+375" },
    { name: "Lituania", code: "LT", iso: "lt", prefix: "+370" },
    { name: "Letonia", code: "LV", iso: "lv", prefix: "+371" },
    { name: "Estonia", code: "EE", iso: "ee", prefix: "+372" },
    { name: "Rusia", code: "RU", iso: "ru", prefix: "+7" },
    { name: "Turquía", code: "TR", iso: "tr", prefix: "+90" },
    { name: "Chipre", code: "CY", iso: "cy", prefix: "+357" },
    { name: "Georgia", code: "GE", iso: "ge", prefix: "+995" },
    { name: "Armenia", code: "AM", iso: "am", prefix: "+374" },
    { name: "Azerbaiyán", code: "AZ", iso: "az", prefix: "+994" },
    { name: "Marruecos", code: "MA", iso: "ma", prefix: "+212" },
    { name: "Argelia", code: "DZ", iso: "dz", prefix: "+213" },
    { name: "Túnez", code: "TN", iso: "tn", prefix: "+216" },
    { name: "Libia", code: "LY", iso: "ly", prefix: "+218" },
    { name: "Egipto", code: "EG", iso: "eg", prefix: "+20" },
    { name: "Israel", code: "IL", iso: "il", prefix: "+972" },
    { name: "Palestina", code: "PS", iso: "ps", prefix: "+970" },
    { name: "Líbano", code: "LB", iso: "lb", prefix: "+961" },
    { name: "Siria", code: "SY", iso: "sy", prefix: "+963" },
    { name: "Jordania", code: "JO", iso: "jo", prefix: "+962" },
]

// Flag component to display country flags
export const Flag = ({ iso }: { iso: string }) => {
  return (
    <img
      src={`https://flagcdn.com/w20/${iso.toLowerCase()}.png`}
      srcSet={`https://flagcdn.com/w40/${iso.toLowerCase()}.png 2x`}
      width="20"
      height="15"
      alt=""
      className="inline-block mr-2 rounded-sm"
    />
  )
}

interface CountrySelectProps {
  name: string
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
}

export const CountrySelect: React.FC<CountrySelectProps> = ({
  name,
  value,
  onValueChange,
  placeholder = "Select country",
}) => {
  // Find the selected country object
  const selectedCountry = countries.find((country) => country.code === value)

  return (
    <Select value={value} onValueChange={onValueChange} name={name}>
      <SelectTrigger id={name} className="w-[100px] border-r-0 rounded-r-none">
        {selectedCountry ? (
          <div className="flex items-center">
            <Flag iso={selectedCountry.iso} />
            <span>{selectedCountry.prefix}</span>
          </div>
        ) : (
          <SelectValue placeholder={placeholder} />
        )}
      </SelectTrigger>
      <SelectContent className="max-h-[200px] overflow-y-auto">
        {countries.map((country) => (
          <SelectItem key={country.code} value={country.code} className="hover:bg-gray-100 cursor-pointer">
            <div className="flex items-center gap-2">
              <Flag iso={country.iso} />
              <span>{country.name}</span>
              <span className="ml-auto text-muted-foreground">{country.prefix}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}