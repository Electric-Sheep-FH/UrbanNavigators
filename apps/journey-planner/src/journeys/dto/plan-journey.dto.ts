import { Type } from 'class-transformer';
import { IsISO8601, IsLatitude, IsLongitude, IsOptional, ValidateNested } from 'class-validator';

export class CoordinatesDto {
  @IsLatitude()
  lat!: number;

  @IsLongitude()
  lon!: number;
}

export class PlanJourneyDto {
  @ValidateNested()
  @Type(() => CoordinatesDto)
  from!: CoordinatesDto;

  @ValidateNested()
  @Type(() => CoordinatesDto)
  to!: CoordinatesDto;

  /** Départ souhaité ; maintenant par défaut. */
  @IsOptional()
  @IsISO8601()
  departAt?: string;
}
