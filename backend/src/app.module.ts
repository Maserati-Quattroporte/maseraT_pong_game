import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { SecondAuthModule } from "./second-auth/second-auth.module";
import { UserinfoModule } from "./userinfo/userinfo.module";
import { RecordModule } from "./record/record.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { typeORMConfig } from "./configs/typeorm.configs";
import { NicknameModule } from "./nickname/nickname.module";
import { LoginModule } from "./login/login.module";
import { MailerModule } from "@nestjs-modules/mailer";

@Module({
  imports: [
    SecondAuthModule,
    UserinfoModule,
    RecordModule,
    TypeOrmModule.forRoot(typeORMConfig),
    NicknameModule,
    LoginModule,
    MailerModule.forRoot({
      transport:
        "smtps://a01083167716@gmail.com:rqzulibmccndnalz@smtp.gmail.com",
      defaults: {
        from: "'neest-modules' <modules@nestjs.com>",
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
