import {
  Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards,
  UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles/roles.guard';
import { Roles } from 'src/auth/roles/roles.decorator';

import { GradesService } from './grades.service';
import { ListGradesDto } from './dto/list-grades.dto';
import { UpsertGradeDto } from './dto/upsert-grade.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/grades')
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Get()
  async list(@Query() dto: ListGradesDto) {
    return this.gradesService.listGrades(dto);
  }

  @Post()
  async create(@Req() req: any, @Body() dto: UpsertGradeDto) {
    return this.gradesService.upsertGrade(req.user.userId, dto, true);
  }

  @Patch(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: Partial<UpsertGradeDto>) {
    return this.gradesService.updateGrade(req.user.userId, id, dto);
  }

  // ===== Import (Excel/CSV) =====
  @Post('import')
  @ApiConsumes('multipart/form-data')
  @ApiQuery({ name: 'overwrite', required: false, type: String })
  @UseInterceptors(FileInterceptor('file'))
  async importGrades(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Query('overwrite') overwrite?: string,
  ) {
    return this.gradesService.importGrades(req.user.userId, file, overwrite === 'true');
  }
}
