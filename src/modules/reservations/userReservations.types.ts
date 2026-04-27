export interface UserReservationDto {
  reservationId: number;
  amenityId: number;
  amenityName: string;
  startTime: string;
  duration: number;
}

export interface UserDayReservations {
  date: number;
  reservations: UserReservationDto[];
}
