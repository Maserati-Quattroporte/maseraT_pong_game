import { Entity, BaseEntity, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { User } from "../user/user.entity";

@Entity()
export class Friend extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne((type) => User, (user) => user.friend, { onDelete: "CASCADE" })
  ownId: User;

  @ManyToOne((type) => User, (user) => user.friend, { onDelete: "CASCADE" })
  friendId: User;
}
