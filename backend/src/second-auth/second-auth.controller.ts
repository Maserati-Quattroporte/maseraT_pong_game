import { Controller, Get, Param } from "@nestjs/common";
import { SecondAuthService } from "./second-auth.service";

@Controller("second-auth")
export class SecondAuthController {
  constructor(private secondAuthServie: SecondAuthService) {}

  @Get()
  requestAuth(): void {
    this.secondAuthServie.requestAuth("sehan123");
  }

  @Get("/:code")
  checkAuth(@Param("code") code: string): Promise<{ matchCode: boolean }> {
    return this.secondAuthServie.checkAuth("sehan123", code);
  }
}
