import { Body, Controller, Post } from "@nestjs/common";
import { DemoRequestsService } from "./demo-requests.service";
import { CreateDemoRequestDto } from "./dto/create-demo-request.dto";

@Controller("demo-requests")
export class PublicDemoRequestsController {
  constructor(private readonly demoRequestsService: DemoRequestsService) {}

  @Post()
  create(@Body() dto: CreateDemoRequestDto) {
    return this.demoRequestsService.create(dto);
  }
}
