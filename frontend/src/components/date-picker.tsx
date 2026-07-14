import { Calendar as CalendarIcon } from 'lucide-react'
import { formatDate } from '@/lib/date'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

type DatePickerProps = {
  selected: Date | undefined
  onSelect: (date: Date | undefined) => void
  placeholder?: string
  /** Override default (dipakai untuk field tanggal lahir: tak boleh di masa depan). */
  disabled?: (date: Date) => boolean
  className?: string
}

const defaultDisabled = (date: Date) =>
  date > new Date() || date < new Date('1900-01-01')

export function DatePicker({
  selected,
  onSelect,
  placeholder = 'Pick a date',
  disabled = defaultDisabled,
  className,
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          data-empty={!selected}
          className={
            className ??
            'w-60 justify-start text-start font-normal data-[empty=true]:text-muted-foreground'
          }
        >
          {selected ? formatDate(selected) : <span>{placeholder}</span>}
          <CalendarIcon className='ms-auto h-4 w-4 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0'>
        <Calendar
          mode='single'
          captionLayout='dropdown'
          selected={selected}
          onSelect={onSelect}
          disabled={disabled}
        />
      </PopoverContent>
    </Popover>
  )
}
