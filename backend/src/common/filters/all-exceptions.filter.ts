import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
} from "@nestjs/common";
import { Request, Response } from "express";
import { AppLogger } from "../logger/app.logger";

@Catch()
@Injectable()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLogger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const errorResponse = isHttpException ? exception.getResponse() : null;
    const isProduction = process.env.NODE_ENV === "production";
    const route = request.originalUrl || request.url;

    if (status >= 500) {
      this.logger.error(
        {
          status,
          method: request.method,
          path: route,
          message: isHttpException ? errorResponse : "Internal server error",
        },
        exception instanceof Error ? exception.stack : undefined,
        "Exceptions",
      );
    }

    response.status(status).json({
      statusCode: status,
      path: route,
      method: request.method,
      timestamp: new Date().toISOString(),
      error:
        typeof errorResponse === "object" && errorResponse !== null
          ? sanitizeErrorObject(errorResponse, isProduction, status)
          : { message: isProduction && status >= 500 ? "Internal server error" : isHttpException ? errorResponse : "Internal server error" },
    });
  }
}

function sanitizeErrorObject(error: object, isProduction: boolean, status: number) {
  if (!isProduction || status < 500) return error;
  return { message: "Internal server error" };
}
