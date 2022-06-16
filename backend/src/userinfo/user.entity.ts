import {
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  Entity,
  OneToMany,
} from "typeorm";
import { Record } from "src/record/record.entity";
import { SecondAuthCode } from "src/second-auth/second-auth-code.entity";

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  apiId: string;

  @Column()
  nickname: string;

  @Column()
  secondAuth: boolean;

  @Column()
  email: string;

  @Column()
  pWin: number;

  @Column()
  pLose: number;

  @Column()
  rWin: number;

  @Column()
  rLose: number;

  @Column()
  profileImg: string;

  @Column()
  state: number;

  @Column()
  level: number;

  @OneToMany((type) => Record, (record) => record.user, { eager: true })
  record: Record;

  @OneToMany(
    (type) => SecondAuthCode,
    (secondAuthCode) => secondAuthCode.user,
    {
      eager: false,
    },
  )
  secondAuthCode: SecondAuthCode;
}
