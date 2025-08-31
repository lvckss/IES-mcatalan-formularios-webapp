import * as React from "react"
import { format, startOfYear, endOfYear } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DatePickerProps {
  label: string;
  name: string;
  value?: Date | null;
  onChange?: (date: Date | undefined) => void;
}

const DatePicker: React.FC<DatePickerProps> = ({ label, name, value, onChange }) => {
  const initial = value ?? undefined;
  const [date, setDate] = React.useState<Date>()
  const [month, setMonth] = React.useState<number>(new Date().getMonth())
  const [year, setYear] = React.useState<number>(new Date().getFullYear())
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false)

  React.useEffect(() => {
    const d = value ?? undefined;
    setDate(d);
    if (d) {
      setMonth(d.getMonth());
      setYear(d.getFullYear());
    }
  }, [value]);

  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i)
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ]

  const handleYearChange = (value: string) => {
    const newYear = parseInt(value)
    setYear(newYear)
    updateDate(new Date(newYear, month, 1))
  }

  const handleMonthChange = (value: string) => {
    const newMonth = parseInt(value)
    setMonth(newMonth)
    updateDate(new Date(year, newMonth, 1))
  }

  const updateDate = (newDate: Date) => {
    setDate(newDate)
    onChange?.(newDate)
  }

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      updateDate(newDate)
      setIsPopoverOpen(false) // Close the popover when a date is selected
    }
  }

  return (
    <div className="grid grid-cols-4 items-center gap-4 w-auto p-0 z-50">
      <Label htmlFor={name} className="text-right font-medium">
        {label}
      </Label>
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            id={name}
            variant={"outline"}
            className={cn(
              "col-span-3 justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
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
                <SelectContent className="!overflow-y-auto !max-h-[200px]" >
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
  )
}

export default DatePicker