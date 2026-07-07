import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check() {
    const dbOk = await this.prisma.isHealthy().then(() => true).catch(() => false);

    return {
      status: dbOk ? "ok" : "degraded",
      service: "raseed-backend",
      timestamp: new Date().toISOString(),
      checks: {
        database: dbOk ? "up" : "down",
      },
    };
  }
}
