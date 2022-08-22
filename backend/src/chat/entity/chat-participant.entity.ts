import {
  Entity,
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from "typeorm";
import { User } from "src/user/user.entity";
import { ChatRoom } from "./chat-room.entity";
import { Authority } from "../enum/authority.enum";

@Entity()
export class ChatParticipant extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: Authority.PARTICIPANT })
  authority: Authority;

  @ManyToOne((type) => User, (user) => user.chatParticipant, {
    onDelete: "CASCADE",
  })
  user: User;

  @ManyToOne(
    (type) => ChatRoom,
    (chatRoom) => {
      chatRoom.chatParticipant;
    },
    { onDelete: "CASCADE" },
  )
  chatRoom: ChatRoom;

  @Column({ default: String(new Date().getTime() - 30000) })
  chatBlock: String;
}
