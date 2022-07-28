import { Injectable } from "@nestjs/common";
import { GameRoomRepository } from "./repository/game-room.repository";
import { GameParticipantRepository } from "./repository/game-participant.repository";
import { GameParticipant } from "./entity/game-participant.entity";
import { GameParticipantDto } from "./dto/game-participant.dto";
import { GameRoomDetailDto } from "./dto/game-room-detail.dto";
import { GameRoom } from "./entity/game-room.entity";
import { GameParticipantProfile } from "./dto/game-participant-profile.dto";

@Injectable()
export class GameService {
  constructor(
    private gameRoomRepository: GameRoomRepository,
    private gameParticipantRepository: GameParticipantRepository,
  ) {}

  async gameRoomList(): Promise<GameRoom[]> {
    return await this.gameRoomRepository.find();
  }

  async gameRoomDetail(gameRoomId: number): Promise<GameRoomDetailDto> {
    // const gameParticipants: GameParticipant[] =
    //   await this.gameParticipantRepository.find({
    //     where: { gameRoom: gameRoomId },
    //     relations: ["user"],
    //   });

    const leftgameParticipant: GameParticipant =
      await this.gameParticipantRepository.findOne({
        where: { gameRoom: gameRoomId, position: 0 },
        relations: ["user"],
      });

    const rightgameParticipant: GameParticipant =
      await this.gameParticipantRepository.findOne({
        where: { gameRoom: gameRoomId, position: 1 },
        relations: ["user"],
      });

    const gameRoom: GameRoom = await this.gameRoomRepository.findOne(
      gameRoomId,
    );
    // const gameParticipantDto: GameParticipantDto[] = [];

    // gameParticipants.forEach((gameParticipant) => {
    //   gameParticipantDto.push(new GameParticipantDto(gameParticipant));
    // });
    // const gameParticipantProfile :
    const gameRoomDetailDto: GameRoomDetailDto = {
      gameRoomId: gameRoomId,
      title: gameRoom.title,
      gameUser: [],
    };

    if (!leftgameParticipant)
      gameRoomDetailDto.gameUser.push(new GameParticipantProfile(null, 0));
    else {
      gameRoomDetailDto.gameUser.push(
        new GameParticipantProfile(leftgameParticipant.user, 0),
      );
    }
    if (!rightgameParticipant)
      gameRoomDetailDto.gameUser.push(new GameParticipantProfile(null, 0));
    else {
      gameRoomDetailDto.gameUser.push(
        new GameParticipantProfile(rightgameParticipant.user, 1),
      );
    }

    return gameRoomDetailDto;
  }
}
