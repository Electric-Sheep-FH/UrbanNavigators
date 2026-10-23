import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { FAVORITE_KINDS, type FavoriteKind } from '../favorite.model';

export class CreateFavoriteDto {
  @IsIn(FAVORITE_KINDS)
  kind!: FavoriteKind;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  targetId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  label!: string;
}
