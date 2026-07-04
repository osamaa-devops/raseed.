import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const configuredOrigins = config.get<string>("FRONTEND_URL", config.get<string>("FRONTEND_ORIGIN", "http://localhost:5173"));
  const allowedOrigins = Array.from(
    new Set([
      ...configuredOrigins.split(",").map((origin) => origin.trim()).filter(Boolean),
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ]),
  );

  app.setGlobalPrefix("api");
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = config.get<number>("PORT", 4000);
  await app.listen(port);
}

void bootstrap();
