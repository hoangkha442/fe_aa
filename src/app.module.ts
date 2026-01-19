import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { AdvisorModule } from './advisor/advisor.module';
import { SemestersModule } from './semesters/semesters.module';
import { StudentModule } from './student/student.module';

@Module({
  imports: [ConfigModule.forRoot() ,AuthModule, AdvisorModule, SemestersModule, StudentModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
