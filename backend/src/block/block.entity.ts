import { Entity, BaseEntity, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { User } from "../user/user.entity";

@Entity()
export class Block extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne((type) => User, (user) => user.block, { onDelete: "CASCADE" })
  ownId: User;

  @ManyToOne((type) => User, (user) => user.block, { onDelete: "CASCADE" })
  blockId: User;
}
