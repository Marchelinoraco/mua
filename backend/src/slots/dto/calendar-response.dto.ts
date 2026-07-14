import { BookingStatus } from '@prisma/client';
import { AvailabilityResponseDto } from '../../availability/dto/availability-response.dto';

/** Ringkasan booking per hari untuk kalender dashboard (F05, FR-F05-8). */
export class CalendarBookingDto {
  id: string;
  kodeBooking: string;
  tanggalAcara: Date;
  statusBooking: BookingStatus;
  clientNama: string;
  totalDurasiMenit: number;
}

export class CalendarDayDto {
  date: string; // YYYY-MM-DD
  blocked: boolean;
  blockedReason: string | null;
  bookings: CalendarBookingDto[];
}

export class CalendarResponseDto {
  from: string;
  to: string;
  availability: AvailabilityResponseDto[];
  days: CalendarDayDto[];
}
