import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { WorklogService } from './worklog.service';
import { Delete } from '@nestjs/common';
import { CreateWorkLogDto } from './dto/create-worklog.dto';
import { UpdateWorkLogDto } from './dto/update-worklog.dto';
import { Roles } from 'src/auth/roles/roles.decorator';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles/roles.guard';
@ApiTags('Worklogs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('worklogs')
export class WorklogController {
  constructor(private readonly worklogService: WorklogService) {}

  @Get('student')
  @Roles('student')
  @ApiQuery({ name: 'internship_id', required: true, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  getStudentWorkLogs(
    @Req() req: any,
    @Query('internship_id') internshipId: string,
    @Query('page') page?: any,
    @Query('limit') limit?: any,
  ) {
    return this.worklogService.getStudentWorkLogs(
      req.user.userId,
      internshipId,
      page,
      limit,
    );
  }

  @Post('student')
  @Roles('student')
  createStudentWorkLog(@Req() req: any, @Body() dto: CreateWorkLogDto) {
    return this.worklogService.createStudentWorkLog(req.user.userId, dto);
  }

  @Patch('student/:id')
  @Roles('student')
  updateStudentWorkLog(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateWorkLogDto,
  ) {
    return this.worklogService.updateStudentWorkLog(req.user.userId, id, dto);
  }

  @Delete('student/:id')
  @Roles('student')
  deleteStudentWorkLog(@Req() req: any, @Param('id') id: string) {
    return this.worklogService.deleteStudentWorkLog(req.user.userId, id);
  }
}
