import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from "@nestjs/common";
import { UserRepository } from "./user.repository";
import { TargetUserInfoDto } from "./dto/target-user-info.dto";
import { User } from "./user.entity";
import { FriendRepository } from "../friend/friend.repository";
import { BlockRepository } from "../block/block.repository";
import { MyUserInfoDto } from "./dto/my-user-info.dto";
import { UpdateUserInfoDto } from "./dto/update-user-info.dto";
import { UserListDto } from "././dto/user-list.dto";
import { join } from "path";
import { UserGateway } from "./user.gateway";
import { ChatGateway } from "src/chat/chat.gateway";
import { ChatParticipantRepository } from "src/chat/repository/chat-participant.repository";
import { ChatParticipant } from "src/chat/entity/chat-participant.entity";

@Injectable()
export class UserService {
  constructor(
    private userRepository: UserRepository,
    private friendsRepository: FriendRepository,
    private blockRepository: BlockRepository,
    private userGateway: UserGateway,
    private chatGateWay: ChatGateway,
    private chatParticipantRepository: ChatParticipantRepository,
  ) {}

  async getAllUser(): Promise<UserListDto[]> {
    const getAllUserDto: UserListDto[] = [];
    const user: User[] = await this.userRepository.find();

    if (!user) {
      throw new NotFoundException(`Noboby user exist`);
    }

    for (let i = 0; i < user.length; i++) {
      if (user[i].state !== 0) {
        getAllUserDto.push(new UserListDto(user[i]));
      }
    }

    return getAllUserDto;
  }

  async getMyInfo(id: number): Promise<MyUserInfoDto> {
    const user: User = await this.userRepository.findOne(id);

    const myUserInfoDto: MyUserInfoDto = {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      secondAuth: user.secondAuth,
      personalWin: user.personalWin,
      personalLose: user.personalLose,
      profileImg: user.profileImg,
      ladderWin: user.ladderWin,
      ladderLose: user.ladderLose,
      level: user.level,
    };
    return myUserInfoDto;
  }

  async targetInfo(
    userId: number,
    targetId: number,
  ): Promise<TargetUserInfoDto> {
    const user = await this.userRepository.findOne(userId);
    const target = await this.userRepository.findOne(targetId);

    const isFriend = await this.isFriend(user, target);
    const isBlocked = await this.isBlocked(user, target);
    const targetUserInfoDto: TargetUserInfoDto = {
      nickname: target.nickname,
      personalWin: target.personalWin,
      personalLose: target.personalLose,
      ladderWin: target.ladderWin,
      ladderLose: target.ladderLose,
      profileImg: target.profileImg,
      state: target.state,
      level: target.level,
      isFriend,
      isBlocked,
    };
    return targetUserInfoDto;
  }

  async updateUser(
    userId: number,
    updateUserInfoDto: UpdateUserInfoDto,
  ): Promise<{ isSuccess: boolean }> {
    const user: User = await this.userRepository.findOne(userId);

    if (updateUserInfoDto.nickname) {
      user.nickname = updateUserInfoDto.nickname;
    }
    if (updateUserInfoDto.profileImg) {
      const fs = require("fs");

      const path = join(__dirname, "..", "..", "img", user.profileImg);
      if (user.profileImg !== "maserat.png") {
        fs.unlink(path, (err) => {});
      }
      user.profileImg = updateUserInfoDto.profileImg;
    }

    if (updateUserInfoDto.secondAuth === "true") user.secondAuth = true;
    else user.secondAuth = false;

    try {
      await user.save();
      if (updateUserInfoDto.nickname) this.userGateway.nicknameChange(user);
    } catch (error) {
      if (error.code === "23505") return { isSuccess: false };
      else {
        throw new InternalServerErrorException();
      }
    }

    if (updateUserInfoDto.nickname) {
      const chatParticipants: ChatParticipant[] =
        await this.chatParticipantRepository.find({
          where: { user: userId },
          relations: ["chatRoom"],
        });

      chatParticipants.forEach((chatParticipant) => {
        this.chatGateWay.chatParticipantAll(chatParticipant.chatRoom.id);
      });
      this.userGateway.userAll();
    }
    return { isSuccess: true };
  }

  private async isFriend(user: User, target: User): Promise<boolean> {
    if (
      await this.friendsRepository.findOne({
        where: {
          ownId: user,
          friendId: target,
        },
      })
    ) {
      return true;
    } else {
      return false;
    }
  }

  private async isBlocked(user: User, target: User): Promise<boolean> {
    if (
      await this.blockRepository.findOne({
        where: {
          ownId: user,
          blockId: target,
        },
      })
    ) {
      return true;
    } else {
      return false;
    }
  }

  async initUserInfo(
    id: number,
    updateUserInfoDto: UpdateUserInfoDto,
  ): Promise<{ isSuccess: boolean }> {
    const user = await this.userRepository.findOne(id);

    if (updateUserInfoDto.nickname) {
      user.nickname = updateUserInfoDto.nickname;
    }
    if (updateUserInfoDto.profileImg) {
      user.profileImg = updateUserInfoDto.profileImg;
    }

    try {
      await user.save();
    } catch (error) {
      if (error.code === "23505")
        throw new ConflictException("Existing username");
      else {
        throw new InternalServerErrorException();
      }
    }
    return { isSuccess: true };
  }
}
