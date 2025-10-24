import * as React from "react"
import { format, startOfYear, endOfYear, parse, isValid } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DatePickerProps {
  label: string
  name: string
  value?: Date | null
  onChange?: (date: Date | undefined) => void
}

const DatePicker: React.FC<DatePickerProps> = ({ label, name, value, onChange }) => {
  const [date, setDate] = React.useState<Date>()
  const [month, setMonth] = React.useState<number>(new Date().getMonth())
  const [year, setYear] = React.useState<number>(new Date().getFullYear())
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false)
  const [manualInput, setManualInput] = React.useState<string>("")
  const [inputError, setInputError] = React.useState<string>("")

  React.useEffect(() => {
    const d = value ?? undefined
    setDate(d)
    if (d) {
      setMonth(d.getMonth())
      setYear(d.getFullYear())
      setManualInput(format(d, "dd/MM/yyyy", { locale: es }))
    } else {
      setManualInput("")
    }
  }, [value])

  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i)
  const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ]

  const handleYearChange = (value: string) => {
    const newYear = Number.parseInt(value)
    setYear(newYear)
    updateDate(new Date(newYear, month, 1))
  }

  const handleMonthChange = (value: string) => {
    const newMonth = Number.parseInt(value)
    setMonth(newMonth)
    updateDate(new Date(year, newMonth, 1))
  }

  const updateDate = (newDate: Date) => {
    setDate(newDate)
    setManualInput(format(newDate, "dd/MM/yyyy", { locale: es }))
    setInputError("")
    onChange?.(newDate)
  }

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      updateDate(newDate)
      setIsPopoverOpen(false)
    }
  }

  const handleManualInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const input = raw.replace(/[^\d/]/g, "").slice(0, 10); // dígitos y '/', máx 10
    setManualInput(input);

    const partialPattern = /^\d{0,2}(\/\d{0,2}(\/\d{0,4})?)?$/;
    if (!partialPattern.test(input)) {
      setInputError("Formato inválido");
      return;
    }

    if (input.length === 0) {
      setInputError("");
      onChange?.(undefined);
      setDate(undefined);
      return;
    }

    const slashCount = (input.match(/\//g) || []).length;
    const [d = "", m = "", y = ""] = input.split("/");

    // 🔹 Solo día (sin /)
    if (slashCount === 0) {
      if (d.length === 1) {
        // 0 no es un día válido; otro dígito -> día incompleto
        setInputError(d === "0" ? "Día inválido" : "Día incompleto");
        return;
      }
      if (d.length === 2) {
        const day = Number(d);
        if (day < 1 || day > 31) {
          setInputError("Día inválido");
        } else {
          setInputError("Fecha incompleta (falta mes y año)");
        }
        return;
      }
    }

    // 🔹 Un slash: validación progresiva de mes
    if (slashCount === 1) {
      if (d.length < 2) {
        setInputError("Día incompleto");
        return;
      }
      const day = Number(d);
      if (day < 1 || day > 31) {
        setInputError("Día inválido");
        return;
      }
      if (m.length === 0) {
        setInputError("Fecha incompleta (falta mes)");
        return;
      }
      if (m.length === 1) {
        setInputError("Mes incompleto");
        return;
      }
      const monthNum = Number(m);
      if (monthNum < 1 || monthNum > 12) {
        setInputError("Mes inválido");
        return;
      }
      setInputError("Fecha incompleta (falta año)");
      return;
    }

    // 🔹 Dos slashes pero sin 10 caracteres -> año incompleto
    if (slashCount === 2 && input.length !== 10) {
      if (d.length !== 2) { setInputError("Día incompleto"); return; }
      if (m.length !== 2) { setInputError("Mes incompleto"); return; }
      const day = Number(d), monthNum = Number(m);
      if (day < 1 || day > 31) { setInputError("Día inválido"); return; }
      if (monthNum < 1 || monthNum > 12) { setInputError("Mes inválido"); return; }
      setInputError("Año incompleto");
      return;
    }

    // 🔹 Completa: dd/mm/aaaa
    if (input.length === 10) {
      const fullDateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
      if (!fullDateRegex.test(input)) {
        setInputError("Formato debe ser dd/mm/aaaa");
        return;
      }
      const parsedDate = parse(input, "dd/MM/yyyy", new Date());
      if (!isValid(parsedDate) || format(parsedDate, "dd/MM/yyyy") !== input) {
        setInputError("Fecha inválida");
        return;
      }
      const minDate = startOfYear(new Date(1900, 0, 1));
      const maxDate = endOfYear(new Date());
      if (parsedDate < minDate || parsedDate > maxDate) {
        setInputError("Fecha fuera de rango");
        return;
      }
      setInputError("");
      setDate(parsedDate);
      setMonth(parsedDate.getMonth());
      setYear(parsedDate.getFullYear());
      onChange?.(parsedDate);
      return;
    }

    // Cualquier otro parcial válido (p.ej. "2/"): ya se captura arriba
    setInputError("");
  };

  return (
    <div className="grid grid-cols-4 items-center gap-4 w-auto p-0 z-50">
      <Label htmlFor={name} className="text-right font-medium">
        {label}
      </Label>
      <div className="col-span-3 flex gap-2">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="dd/mm/aaaa"
            value={manualInput}
            onChange={handleManualInputChange}
            inputMode="numeric"
            aria-invalid={!!inputError}
            aria-describedby={inputError ? `${name}-error` : undefined}
            className={cn("font-normal", inputError && "border-red-500 focus-visible:ring-red-500")}
            maxLength={10}
          />
          {inputError && (
            <p id={`${name}-error`} className="absolute text-xs text-red-500">
              {inputError}
            </p>
          )}
        </div>
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button id={name} variant={"outline"} size="icon" className="shrink-0">
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
            <div className="flex flex-col space-y-2 p-2">
              <div className="flex space-x-2">
                <Select value={year.toString()} onValueChange={handleYearChange}>
                  <SelectTrigger className="w-[120px] ">
                    <SelectValue placeholder="Año" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px] overflow-y-auto">
                    {years.map((y) => (
                      <SelectItem className="hover:bg-gray-100 cursor-pointer" key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={month.toString()} onValueChange={handleMonthChange}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Mes" />
                  </SelectTrigger>
                  <SelectContent className="!overflow-y-auto !max-h-[200px]">
                    {months.map((m, index) => (
                      <SelectItem className="hover:bg-gray-100 cursor-pointer" key={m} value={index.toString()}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                month={new Date(year, month)}
                onMonthChange={(newMonth) => {
                  setMonth(newMonth.getMonth())
                  setYear(newMonth.getFullYear())
                }}
                fromDate={startOfYear(new Date(1900, 0, 1))}
                toDate={endOfYear(new Date())}
                fixedWeeks
                locale={es}
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}

export default DatePicker
