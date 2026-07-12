import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { RequestLoggingInterceptor } from "./common/interceptors/request-logging.interceptor";
import { AppLogger } from "./common/logger/app.logger";

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule, { bufferLogs: true });
    const config = app.get(ConfigService);
    const logger = app.get(AppLogger);
    app.useLogger(logger);

  const configuredOrigins = config.getOrThrow<string>("FRONTEND_URL");
  const baseOrigins = configuredOrigins.split(",").map((origin) => origin.trim()).filter(Boolean);
  if (process.env.RASEED_DESKTOP === "true") baseOrigins.push("null");
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
    origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
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
    const host = process.env.RASEED_BIND_HOST || undefined;
    if (host) {
      await app.listen(port, host);
    } else {
      await app.listen(port);
    }
    logger.log(`API listening on ${host ?? "all interfaces"}:${port} in ${config.get<string>("NODE_ENV", "development")} mode`, "Bootstrap");
  } catch (error) {
    const message = formatBootstrapError(error);
    // eslint-disable-next-line no-console
    console.error(message);
    process.exit(1);
  }
}

void bootstrap();

function formatBootstrapError(error: unknown) {
  const text = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  if (text.includes("P1001") || text.includes("Can't reach database server") || text.includes("Authentication failed against database server")) {
    return [
      "Local PostgreSQL is not ready.",
      "Make sure PostgreSQL is installed and running on localhost:5432.",
      "Create a database named raseed_dev and a user named raseed with password raseed_password.",
      text,
    ].join("\n");
  }
  return text;
}
