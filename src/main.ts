import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); //TODO 추후 제약을 추가해야함
  await app.listen(8080);
}
bootstrap();
