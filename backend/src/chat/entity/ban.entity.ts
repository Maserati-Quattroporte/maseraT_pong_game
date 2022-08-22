import { Entity, BaseEntity, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { User } from "src/user/user.entity";
import { ChatRoom } from "src/chat/entity/chat-room.entity";

@Entity()
export class Ban extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne((type) => User, (user) => user.ban, { onDelete: "CASCADE" })
  user: User;

  @ManyToOne((type) => ChatRoom, (chatRoom) => chatRoom.ban, {
    onDelete: "CASCADE",
  })
  chatRoom: ChatRoom;
}
