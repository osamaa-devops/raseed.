import { ConsoleLogger, Injectable, LogLevel } from "@nestjs/common";

const secretPatterns = [
  /(authorization["']?\s*[:=]\s*["']?bearer\s+)([^"'\s,}]+)/gi,
  /(jwt|token|password|secret|cookie)["']?\s*[:=]\s*["']([^"']+)["']/gi,
];

@Injectable()
export class AppLogger extends ConsoleLogger {
  constructor() {
    super("RaseedApi", { logLevels: parseLogLevels(process.env.LOG_LEVEL) });
  }

  override error(message: unknown, stack?: string, context?: string) {
    super.error(this.redact(message), this.redact(stack), context);
  }

  override warn(message: unknown, context?: string) {
    super.warn(this.redact(message), context);
  }

  override log(message: unknown, context?: string) {
    super.log(this.redact(message), context);
  }

  override debug(message: unknown, context?: string) {
    super.debug(this.redact(message), context);
  }

  override verbose(message: unknown, context?: string) {
    super.verbose(this.redact(message), context);
  }

  private redact(input: unknown) {
    if (input === undefined || input === null) return input;
    let value = typeof input === "string" ? input : JSON.stringify(input);
    for (const pattern of secretPatterns) {
      value = value.replace(pattern, (_match, prefix) => `${prefix}[REDACTED]`);
    }
    return value;
  }
}

function parseLogLevels(input = "log,warn,error") {
  return input
    .split(",")
    .map((level) => level.trim())
    .filter(Boolean) as LogLevel[];
}
