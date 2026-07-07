import { Body, Controller, Get, Post } from "@nestjs/common";
import { Public } from "../common/decorators/public.decorator";
import { BootstrapService } from "./bootstrap.service";
import { BootstrapSetupDto } from "./bootstrap.dto";

@Controller("bootstrap")
export class BootstrapController {
  constructor(private readonly bootstrapService: BootstrapService) {}

  @Public()
  @Get("status")
  status() {
    return this.bootstrapService.getStatus();
  }

  @Public()
  @Post("setup")
  setup(@Body() dto: BootstrapSetupDto) {
    return this.bootstrapService.setup(dto);
  }
}
