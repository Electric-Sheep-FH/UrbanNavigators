import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { CHANNELS, type Channel } from '../subscription.model';

export class CreateSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  lineId!: string;

  @IsIn(CHANNELS)
  channel!: Channel;
}
