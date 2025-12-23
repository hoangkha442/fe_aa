import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsInt, IsOptional, IsString, Min } from 'class-validator'

export class CreateTopicDto {
  @ApiProperty({ example: 'Xây dựng hệ thống quản lý thực tập' })
  @IsString()
  title: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string | null

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  company_name?: string | null

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  company_address?: string | null

  @ApiProperty({ example: '1', description: 'internship_terms.id' })
  @IsString()
  term_id: string

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  max_students?: number
}
