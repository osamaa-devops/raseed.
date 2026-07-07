import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { RequestLoggingInterceptor } from "./common/interceptors/request-logging.interceptor";
import { AppLogger } from "./common/logger/app.logger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);
  const logger = app.get(AppLogger);
  app.useLogger(logger);

  const configuredOrigins = config.getOrThrow<string>("FRONTEND_URL");
  const baseOrigins = configuredOrigins.split(",").map((origin) => origin.trim()).filter(Boolean);
  const allowedOrigins = process.env.NODE_ENV === "production"
    ? baseOrigins
    : Array.from(new Set([...baseOrigins, "http://localhost:5173", "http://127.0.0.1:5173"]));

  app.setGlobalPrefix("api");
  app.getHttpAdapter().getInstance().set("trust proxy", 1);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: false,
    }),
  );
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("CORS origin is not allowed."));
    },
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(app.get(RequestLoggingInterceptor));
  app.useGlobalFilters(app.get(AllExceptionsFilter));

  const port = config.get<number>("PORT", 4000);
  await app.listen(port);
  logger.log(`API listening on port ${port} in ${config.get<string>("NODE_ENV", "development")} mode`, "Bootstrap");
}

void bootstrap();
