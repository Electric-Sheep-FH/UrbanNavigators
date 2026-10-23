import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { StatusController } from './status/status.controller';
import { StatusService } from './status/status.service';

@Module({
  controllers: [HealthController, StatusController],
  providers: [StatusService],
})
export class AppModule {}
