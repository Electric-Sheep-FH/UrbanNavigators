import { Module } from '@nestjs/common';
import { JourneysController } from './journeys.controller';
import { JourneysService } from './journeys.service';
import { OtpClient } from './otp.client';

@Module({
  controllers: [JourneysController],
  providers: [JourneysService, OtpClient],
})
export class JourneysModule {}
