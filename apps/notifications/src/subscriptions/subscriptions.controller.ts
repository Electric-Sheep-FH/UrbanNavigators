import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import type { Subscription } from './subscription.model';
import { SubscriptionsService } from './subscriptions.service';

// TODO : l'identifiant de l'utilisateur viendra du jeton OIDC, pas de l'URL (section 10.1 du CDC).
@Controller('users/:userId/subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  list(@Param('userId') userId: string): Promise<Subscription[]> {
    return this.subscriptionsService.list(userId);
  }

  @Post()
  subscribe(@Param('userId') userId: string, @Body() dto: CreateSubscriptionDto): Promise<Subscription> {
    return this.subscriptionsService.subscribe(userId, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  unsubscribe(@Param('userId') userId: string, @Param('id') id: string): Promise<void> {
    return this.subscriptionsService.unsubscribe(userId, id);
  }
}
