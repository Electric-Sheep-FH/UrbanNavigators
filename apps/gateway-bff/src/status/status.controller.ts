import { Controller, Get } from '@nestjs/common';
import type { PlatformStatus } from '@un/contracts';
import { StatusService } from './status.service';

@Controller('api/status')
export class StatusController {
  constructor(private readonly statusService: StatusService) {}

  @Get()
  getStatus(): Promise<PlatformStatus> {
    return this.statusService.getStatus();
  }
}
