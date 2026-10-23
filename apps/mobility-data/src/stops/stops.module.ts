import { Module } from '@nestjs/common';
import { StopsController } from './stops.controller';
import { StopsRepository } from './stops.repository';
import { StopsService } from './stops.service';

@Module({
  controllers: [StopsController],
  providers: [StopsService, StopsRepository],
})
export class StopsModule {}
