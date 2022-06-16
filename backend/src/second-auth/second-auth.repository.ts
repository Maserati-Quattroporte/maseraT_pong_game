import { EntityRepository, Repository } from "typeorm";
import { SecondAuthCode } from "./second-auth-code.entity";
import { User } from "src/userinfo/user.entity";

@EntityRepository(SecondAuthCode)
export class SecondAuthRepository extends Repository<SecondAuthCode> {
  async deleteCode(user: User): Promise<void> {
    const secondAuthFound: SecondAuthCode[] = await this.find({
      where: { user: user.id },
    });

    this.remove(secondAuthFound);
  }
}
