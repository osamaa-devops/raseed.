import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { spawnSync } from "node:child_process";
import { URL } from "node:url";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.connectWithLocalBootstrap();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async isHealthy() {
    await this.$queryRaw`SELECT 1`;
    return true;
  }

  private async connectWithLocalBootstrap() {
    try {
      await this.$connect();
    } catch (error) {
      if (this.isMissingDatabase(error)) {
        const created = this.tryCreateDatabase();
        if (created) {
          await this.$connect();
          return;
        }
      }
      throw error;
    }
  }

  private isMissingDatabase(error: unknown) {
    const text = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    return text.includes("database does not exist") || text.includes("P1003");
  }

  private tryCreateDatabase() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) return false;

    let url: URL;
    try {
      url = new URL(databaseUrl);
    } catch {
      return false;
    }

    const dbName = url.pathname.replace(/^\//, "");
    if (!dbName) return false;

    const result = spawnSync("createdb", [dbName], {
      env: {
        ...process.env,
        PGHOST: url.hostname,
        PGPORT: url.port || "5432",
        PGUSER: decodeURIComponent(url.username || ""),
        PGPASSWORD: decodeURIComponent(url.password || ""),
      },
      stdio: "pipe",
      encoding: "utf8",
    });

    if (result.status === 0) {
      return true;
    }

    if ((result.stderr || result.stdout || "").includes("already exists")) {
      return true;
    }

    return false;
  }
}
