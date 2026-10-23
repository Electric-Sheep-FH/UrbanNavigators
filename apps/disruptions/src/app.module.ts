import { Module } from '@nestjs/common';
import { DisruptionsModule } from './disruptions.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [DisruptionsModule],
  controllers: [HealthController],
})
export class AppModule {}
