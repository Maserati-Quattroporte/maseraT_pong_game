import {
  Entity,
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from "typeorm";
import { User } from "../userinfo/user.entity";

@Entity()
export class SecondAuthCode extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  authCode: string;

  @ManyToOne((type) => User, (user) => user.secondAuth, { eager: false })
  user: User;
}
