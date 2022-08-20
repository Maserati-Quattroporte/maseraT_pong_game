import { Module } from "@nestjs/common";
import { GameGateway } from "./game.gateway";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GameRoomRepository } from "./repository/game-room.repository";
import { GameParticipantRepository } from "./repository/game-participant.repository";
import { GameController } from "./game.controller";
import { GameService } from "./game.service";
import { RecordRepository } from "src/record/record.repository";
import { UserRepository } from "src/user/user.repository";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GameRoomRepository,
      GameParticipantRepository,
      RecordRepository,
      UserRepository,
    ]),
  ],
  providers: [GameGateway, GameService],
  controllers: [GameController],
  exports: [GameGateway],
})
export class GameModule {}
