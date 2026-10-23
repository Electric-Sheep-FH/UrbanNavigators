import { IsString, MaxLength, MinLength } from 'class-validator';

export class SearchStopsQuery {
  @IsString()
  @MinLength(2)
  @MaxLength(64)
  q!: string;
}
