import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { HealthService } from "./health.service";

@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @SkipThrottle()
  async check() {
    const result = await this.healthService.check();
    if (result.status !== "ok") {
      throw new ServiceUnavailableException(result);
    }
    return result;
  }
}
