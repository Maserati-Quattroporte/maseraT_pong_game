import { EntityRepository, Repository } from "typeorm";
import { Ban } from "../entity/ban.entity";

@EntityRepository(Ban)
export class BanRepository extends Repository<Ban> {}
