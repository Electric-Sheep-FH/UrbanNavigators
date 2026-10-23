import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ListVehiclePositionsQuery {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  routeId?: string;
}
