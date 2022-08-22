import {
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  Entity,
  OneToMany,
  OneToOne,
  Unique,
} from "typeorm";
import { Record } from "src/record/record.entity";
import { SecondAuthCode } from "src/second-auth/second-auth-code.entity";
import { Friend } from "../friend/friend.entity";
import { Block } from "../block/block.entity";
import { UserState } from "./user-state.enum";
import { ChatParticipant } from "src/chat/entity/chat-participant.entity";
import { Achievement } from "src/achievement/achievement.entity";
import { GameParticipant } from "src/game/entity/game-participant.entity";
import { DM } from "src/chat/entity/dm.entity";
import { Ban } from "src/chat/entity/ban.entity";

@Entity()
@Unique(["nickname"])
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 0 })
  apiId: number;

  @Column({ default: "" })
  socketId: string;

  @Column({ unique: true })
  nickname: string;

  @Column({ default: false })
  secondAuth: boolean;

  @Column({ default: "" })
  email: string;

  @Column({ default: 0 })
  personalWin: number;

  @Column({ default: 0 })
  personalLose: number;

  @Column({ default: 0 })
  ladderWin: number;

  @Column({ default: 0 })
  ladderLose: number;

  @Column({ default: "maserat.png" })
  profileImg: string;

  @Column({ default: 0 })
  state: UserState;

  @Column({ type: "decimal", default: 1, precision: 5, scale: 2 })
  level: number;

  @OneToMany(
    (type) => Record,
    (record) => {
      record.user, record.enemy;
    },
  )
  record: Record[];

  @OneToOne((type) => SecondAuthCode, (secondAuthCode) => secondAuthCode.user)
  secondAuthCode: SecondAuthCode;

  @OneToMany(
    (type) => Friend,
    (friend) => {
      friend.ownId, friend.friendId;
    },
  )
  friend: Friend[];

  @OneToMany(
    (type) => Block,
    (block) => {
      block.ownId, block.blockId;
    },
  )
  block: Block[];

  @OneToMany(
    (type) => ChatParticipant,
    (chatParticipant) => {
      chatParticipant.user;
    },
  )
  chatParticipant: ChatParticipant[];

  @OneToOne(
    (type) => Achievement,
    (achievement) => {
      achievement.user;
    },
  )
  achievement: Achievement[];

  @OneToMany(
    (type) => GameParticipant,
    (gameParticipant) => gameParticipant.user,
  )
  gameParticipant: GameParticipant[];

  @OneToMany((type) => DM, (dm) => dm.sender)
  dm: DM[];

  @OneToMany((type) => Ban, (ban) => ban.user)
  ban: Ban[];
}
