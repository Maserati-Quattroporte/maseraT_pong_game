import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserRepository } from "./user.repository";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { BlockRepository } from "../block/block.repository";
import { FriendRepository } from "src/friend/friend.repository";
import { ChatParticipantRepository } from "src/chat/repository/chat-participant.repository";
import { GameParticipantRepository } from "src/game/repository/game-participant.repository";
import { GameRoomRepository } from "src/game/repository/game-room.repository";
import { RecordRepository } from "src/record/record.repository";
import { ChatModule } from "src/chat/chat.module";
import { UserGateway } from "./user.gateway";
import { ChatRoomRepository } from "src/chat/repository/chat-room.repository";
import { GameModule } from "src/game/game.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserRepository,
      BlockRepository,
      FriendRepository,
      ChatParticipantRepository,
      ChatRoomRepository,
      GameParticipantRepository,
      GameRoomRepository,
      RecordRepository,
    ]),
    ChatModule,
    GameModule,
  ],
  controllers: [UserController],
  providers: [UserService, UserGateway],
  exports: [UserGateway],
})
export class UserModule {}
