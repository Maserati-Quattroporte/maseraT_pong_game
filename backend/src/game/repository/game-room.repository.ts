import { NotFoundException } from "@nestjs/common";
import { Repository, EntityRepository } from "typeorm";
import { GameJoinDto, GameLeaveDto } from "../dto/game-room.dto";
import { GameRoom } from "../entity/game-room.entity";

@EntityRepository(GameRoom)
export class GameRoomRepository extends Repository<GameRoom> {
  async createRoom(gameJoinDto: GameJoinDto): Promise<number> {
    const { title } = gameJoinDto;

    const gameRoom: GameRoom = this.create({
      title,
      isStart: false,
      isLadder: false,
    });

    const saveRoom = await gameRoom.save();

    return saveRoom.id;
  }

  async deleteRoom(gameRoomId: number): Promise<void> {
    const result = await this.delete(gameRoomId);

    if (!result.affected) {
      throw new NotFoundException(`Can't find GameRoom with id ${gameRoomId}`);
    }
  }
}
