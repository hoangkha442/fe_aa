import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { AdvisorModule } from './advisor/advisor.module';
import { SemestersModule } from './semesters/semesters.module';
import { StudentModule } from './student/student.module';
import { GradesModule } from './grades/grades.module';
import { RecalculateModule } from './recalculate/recalculate.module';
import { CurriculumModule } from './curriculum/curriculum.module';

@Module({
  imports: [ConfigModule.forRoot() ,AuthModule, AdvisorModule, SemestersModule, StudentModule, GradesModule, RecalculateModule, CurriculumModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
