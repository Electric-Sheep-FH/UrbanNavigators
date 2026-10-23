import { Controller, Get, Param, Query } from '@nestjs/common';
import { SearchStopsQuery } from './dto/search-stops.query';
import type { Stop } from './stop.model';
import { StopsService } from './stops.service';

@Controller('stops')
export class StopsController {
  constructor(private readonly stopsService: StopsService) {}

  @Get()
  search(@Query() query: SearchStopsQuery): Promise<Stop[]> {
    return this.stopsService.search(query.q);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Stop> {
    return this.stopsService.findOne(id);
  }
}
