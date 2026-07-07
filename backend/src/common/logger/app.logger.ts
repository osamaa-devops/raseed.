import { ConsoleLogger, Injectable, LogLevel } from "@nestjs/common";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { getLogsDir } from "../runtime/runtime-paths";

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
    void this.appendToFile("error", message, stack, context);
  }

  override warn(message: unknown, context?: string) {
    super.warn(this.redact(message), context);
    void this.appendToFile("warn", message, undefined, context);
  }

  override log(message: unknown, context?: string) {
    super.log(this.redact(message), context);
    void this.appendToFile("log", message, undefined, context);
  }

  override debug(message: unknown, context?: string) {
    super.debug(this.redact(message), context);
    void this.appendToFile("debug", message, undefined, context);
  }

  override verbose(message: unknown, context?: string) {
    super.verbose(this.redact(message), context);
    void this.appendToFile("verbose", message, undefined, context);
  }

  private redact(input: unknown) {
    if (input === undefined || input === null) return input;
    let value = typeof input === "string" ? input : JSON.stringify(input);
    for (const pattern of secretPatterns) {
      value = value.replace(pattern, (_match, prefix) => `${prefix}[REDACTED]`);
    }
    return value;
  }

  private async appendToFile(level: string, message: unknown, stack?: string, context?: string) {
    try {
      const logsDir = getLogsDir();
      await mkdir(logsDir, { recursive: true });
      const line = JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        context: context ?? null,
        message: this.redact(message),
        stack: this.redact(stack) ?? null,
      });
      await appendFile(path.join(logsDir, "app.log"), `${line}\n`, "utf8");
    } catch {
      // swallow file logging errors
    }
  }
}

function parseLogLevels(input = "log,warn,error") {
  return input
    .split(",")
    .map((level) => level.trim())
    .filter(Boolean) as LogLevel[];
}
