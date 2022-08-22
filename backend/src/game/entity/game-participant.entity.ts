import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from "typeorm";
import { User } from "src/user/user.entity";
import { GameRoom } from "./game-room.entity";
import { GamePosition } from "../game-position.enum";

@Entity()
export class GameParticipant extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: GamePosition.spectator })
  position: GamePosition;

  @ManyToOne((type) => User, (user) => user.gameParticipant, {
    onDelete: "CASCADE",
  })
  user: User;

  @ManyToOne((type) => GameRoom, (gameRoom) => gameRoom.gameParticipant, {
    onDelete: "CASCADE",
  })
  gameRoom: GameRoom;
}
