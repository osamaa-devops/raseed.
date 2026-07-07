import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { Observable, tap } from "rxjs";
import { AppLogger } from "../logger/app.logger";

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startedAt;
          const statusCode = response.statusCode;
          const route = request.originalUrl || request.url;
          if (statusCode >= 500) {
            this.logger.error(`${request.method} ${route} ${statusCode} ${duration}ms`, undefined, "Http");
            return;
          }
          if (statusCode >= 400) {
            this.logger.warn(`${request.method} ${route} ${statusCode} ${duration}ms`, "Http");
            return;
          }
          this.logger.log(`${request.method} ${route} ${statusCode} ${duration}ms`, "Http");
        },
      }),
    );
  }
}
