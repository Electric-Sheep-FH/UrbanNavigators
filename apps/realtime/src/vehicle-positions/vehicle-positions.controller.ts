import { Controller, Get, Query } from '@nestjs/common';
import { ListVehiclePositionsQuery } from './dto/list-vehicle-positions.query';
import type { VehiclePositionsResponse } from './vehicle-position.model';
import { VehiclePositionsService } from './vehicle-positions.service';

@Controller('vehicle-positions')
export class VehiclePositionsController {
  constructor(private readonly vehiclePositionsService: VehiclePositionsService) {}

  @Get()
  list(@Query() query: ListVehiclePositionsQuery): Promise<VehiclePositionsResponse> {
    return this.vehiclePositionsService.list(query.routeId);
  }
}
