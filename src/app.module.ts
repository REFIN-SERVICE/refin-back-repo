import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DartModule } from './dart/dart.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DartModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
