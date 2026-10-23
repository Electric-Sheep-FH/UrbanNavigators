import { Module } from '@nestjs/common';
import { VehiclePositionsController } from './vehicle-positions.controller';
import { VehiclePositionsRepository } from './vehicle-positions.repository';
import { VehiclePositionsService } from './vehicle-positions.service';

@Module({
  controllers: [VehiclePositionsController],
  providers: [VehiclePositionsService, VehiclePositionsRepository],
  exports: [VehiclePositionsService],
})
export class VehiclePositionsModule {}
