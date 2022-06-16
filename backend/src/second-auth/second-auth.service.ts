import { Injectable } from "@nestjs/common";
import { UserRepository } from "src/userinfo/user.repository";
import { User } from "src/userinfo/user.entity";
import { SecondAuthRepository } from "./second-auth.repository";
import { SecondAuthCode } from "./second-auth-code.entity";
import { MailerService } from "@nestjs-modules/mailer";

@Injectable()
export class SecondAuthService {
  constructor(
    private userRepository: UserRepository,
    private secondAuthRepository: SecondAuthRepository,
    private mailerService: MailerService,
  ) {}

  async requestAuth(apiId: string): Promise<void> {
    const user: User = await this.userRepository.findOne({
      where: { apiId },
    });

    this.secondAuthRepository.deleteCode(user);

    const authCode: string = Math.random().toString(36).substr(2, 11);
    const secondAuthCode: SecondAuthCode = this.secondAuthRepository.create({
      user,
      authCode,
    });
    await secondAuthCode.save();
    const a = this.mailerService
      .sendMail({
        to: user.email,
        from: "a01083167716@gmail.com",
        subject: "maserati pong auth code",
        text: authCode,
      })
      .then(() => {})
      .catch(() => {});
  }

  async checkAuth(
    apiId: string,
    code: string,
  ): Promise<{ matchCode: boolean }> {
    const user: User = await this.userRepository.findOne({
      where: { apiId },
    });

    const secondAuthCode: SecondAuthCode =
      await this.secondAuthRepository.findOne({
        where: { user, authCode: code },
      });

    if (secondAuthCode) {
      await secondAuthCode.remove();
      return { matchCode: true };
    }
    return { matchCode: false };
  }
}
