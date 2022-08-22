import {
  Entity,
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from "typeorm";
import { ChatParticipant } from "./chat-participant.entity";
import { DM } from "./dm.entity";
import { Ban } from "src/chat/entity/ban.entity";

@Entity()
export class ChatRoom extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ default: "" })
  password: string;

  @Column()
  isDM: boolean;

  @OneToMany(
    (type) => ChatParticipant,
    (chatParticipant) => chatParticipant.chatRoom,
  )
  chatParticipant: ChatParticipant[];

  @OneToMany((type) => DM, (dm) => dm.chatRoom)
  dm: DM[];

  @OneToMany((type) => Ban, (ban) => ban.chatRoom)
  ban: Ban[];
}
