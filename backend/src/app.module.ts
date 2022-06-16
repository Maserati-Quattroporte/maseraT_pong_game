import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { SecondAuthModule } from "./second-auth/second-auth.module";
import { UserinfoModule } from "./userinfo/userinfo.module";
import { RecordModule } from "./record/record.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { typeORMConfig } from "./configs/typeorm.configs";
import { NicknameModule } from './nickname/nickname.module';
import { LoginModule } from './login/login.module';

@Module({
  imports: [
    SecondAuthModule,
    UserinfoModule,
    RecordModule,
    TypeOrmModule.forRoot(typeORMConfig),
    NicknameModule,
    LoginModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
