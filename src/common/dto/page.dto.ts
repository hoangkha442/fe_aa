// src/common/dto/page.dto.ts
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class PageDto {
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : parseInt(value, 10)))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : parseInt(value, 10)))
  @IsInt()
  @Min(1)
  limit?: number = 10;
}

export const paginate = (page = 1, limit = 10) => ({
  skip: (page - 1) * limit,
  take: limit,
});
