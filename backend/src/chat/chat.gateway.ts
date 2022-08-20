import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Socket } from "socket.io";
import { ChatParticipantRepository } from "./repository/chat-participant.repository";
import { ChatRoomRepository } from "./repository/chat-room.repository";
import { ChatJoinDto } from "./dto/chat-join.dto";
import { ChatRoom } from "./entity/chat-room.entity";
import { ChatParticipant } from "./entity/chat-participant.entity";
import { User } from "src/user/user.entity";
import { UserRepository } from "src/user/user.repository";
import { Authority } from "./enum/authority.enum";
import { ChatParticipantDto } from "./dto/chat-participant.dto";
import { SetAdminDto } from "./dto/set-admin.dto";
import * as bcrypt from "bcryptjs";
import { ChatLeaveDto } from "./dto/chat-leave.dto";
import { ChatMessageDto } from "./dto/chat-message.dto";
import { ChatKickDto } from "./dto/chat-kick.dto";
import { ChatRoomDto } from "./dto/chat-room.dto";
import { ChatSettingDto } from "./dto/chat-setting.dto";
import { ChatAuthorityDto } from "./dto/chat-authority.dto";
import { Block } from "src/block/block.entity";
import { BlockRepository } from "src/block/block.repository";
import { DMRepository } from "./repository/dm.repository";

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class ChatGateway {
  constructor(
    private chatRoomRepository: ChatRoomRepository,
    private chatParticipantsRepository: ChatParticipantRepository,
    private userRepository: UserRepository,
    private blockRepository: BlockRepository,
    private dmRepository: DMRepository,
  ) {}

  @WebSocketServer()
  server;

  @SubscribeMessage("chat-room-join")
  async handleJoinChatRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() chatJoinDto: ChatJoinDto,
  ): Promise<void> {
    const user: User = await this.userRepository.findOne(chatJoinDto.userId);
    chatJoinDto.nickname = user.nickname;
    let isCreate: Boolean = false;

    if (!chatJoinDto.chatRoomId) {
      chatJoinDto.chatRoomId = await this.chatRoomRepository.createRoom(
        chatJoinDto,
        false,
      );
      isCreate = true;
    }

    const chatRoom: ChatRoom = await this.chatRoomRepository.findOne(
      chatJoinDto.chatRoomId,
    );
    if (!chatRoom) return;

    const joinUser: ChatParticipant =
      await this.chatParticipantsRepository.findOne({
        where: {
          chatRoom: chatJoinDto.chatRoomId,
          user: user.id,
        },
      });
    if (joinUser) {
      socket.join("chat-" + chatJoinDto.chatRoomId);
      return;
    }

    if (!(await this.joinChatRoom(chatJoinDto, user, isCreate))) return;

    const chatRoomDto: ChatRoomDto = {
      chatRoomId: chatJoinDto.chatRoomId,
      title: chatJoinDto.title,
      isPassword: chatJoinDto.password ? true : false,
    };

    if (isCreate) {
      this.server.emit("chat-room-create", chatRoomDto);
    }

    socket.join("chat-" + chatJoinDto.chatRoomId);
    this.server
      .in("chat-" + chatJoinDto.chatRoomId)
      .emit("chat-room-join", chatJoinDto);
  }

  @SubscribeMessage("chat-room-setting")
  async handleRoomSetting(
    @ConnectedSocket() socket: Socket,
    @MessageBody() chatSettingDto: ChatSettingDto,
  ) {
    const chatRoom: ChatRoom = await this.chatRoomRepository.findOne(
      chatSettingDto.chatRoomId,
    );

    if (chatSettingDto.title) {
      chatRoom.title = chatSettingDto.title;
    }

    if (chatSettingDto.password) {
      const salt = await bcrypt.genSalt();
      chatRoom.password = await bcrypt.hash(chatSettingDto.password, salt);
    } else chatRoom.password = "";

    await chatRoom.save();

    this.server.emit("chat-room-setting", {
      chatRoomId: chatSettingDto.chatRoomId,
      title: chatSettingDto.title,
      isPassword: chatRoom.password ? true : false,
    });
  }

  @SubscribeMessage("chat-room-message")
  async handleChatRoomMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() chatMessageDto: ChatMessageDto,
  ): Promise<void> {
    const user: User = await this.userRepository.findOne(chatMessageDto.userId);
    chatMessageDto.nickname = user.nickname;

    const chatParticipant: ChatParticipant =
      await this.chatParticipantsRepository.findOne({ where: { user } });
    const now = new Date().getTime();
    const time = +now - +chatParticipant.chatBlock;
    if (time < 30000) {
      socket.emit("chat-room-message", {
        message:
          "채팅 금지 " + Math.floor((30000 - time) / 1000) + "초 남았습니다.",
      });
      return;
    }

    const chatRoom: ChatRoom = await this.chatRoomRepository.findOne(
      chatMessageDto.chatRoomId,
    );

    const blocks: Block[] = await this.blockRepository.find({
      where: { blockId: user.id },
      relations: ["ownId"],
    });

    let temp = this.server.in("chat-" + chatMessageDto.chatRoomId);

    if (chatRoom.isDM)
      await this.dmRepository.createDM(chatRoom, user, chatMessageDto);
    blocks.forEach((block) => {
      temp = temp.except(block.ownId.socketId);
    });
    temp.emit("chat-room-message", chatMessageDto);
  }

  @SubscribeMessage("chat-room-set-admin")
  async handleChatRoomSetAdmin(
    @ConnectedSocket() socket: Socket,
    @MessageBody() setAdminDto: SetAdminDto,
  ): Promise<void> {
    const chatParticipant: ChatParticipant =
      await this.chatParticipantsRepository.findOne({
        where: {
          user: setAdminDto.userId,
          chatRoom: setAdminDto.chatRoomId,
        },
        relations: ["user"],
      });

    if (setAdminDto.isAdmin) {
      chatParticipant.authority = Authority.ADMIN;
    } else {
      chatParticipant.authority = Authority.PARTICIPANT;
    }

    await chatParticipant.save();
    const chatAuthorityDto: ChatAuthorityDto = {
      userId: chatParticipant.user.id,
      authority: chatParticipant.authority,
    };
    this.server
      .in("chat-" + setAdminDto.chatRoomId)
      .emit("chat-room-set-admin", chatAuthorityDto);
  }

  @SubscribeMessage("chat-room-kick")
  async handleChatRoomKick(
    @ConnectedSocket() socket: Socket,
    @MessageBody() chatKickDto: ChatKickDto,
  ) {
    const { chatRoomId, targetId } = chatKickDto;
    const target: User = await this.userRepository.findOne(targetId);

    this.server.in("chat-" + chatRoomId).emit("chat-room-kick", { targetId });
    this.server.in(target.socketId).socketsLeave("chat-" + chatRoomId);
  }

  @SubscribeMessage("chat-room-leave")
  async handleChatRoomLeave(
    @ConnectedSocket() socket: Socket,
    @MessageBody() chatLeaveDto: ChatLeaveDto,
  ): Promise<void> {
    const user: User = await this.userRepository.findOne(chatLeaveDto.userId);
    chatLeaveDto.nickname = user.nickname;

    const chatTitle = "chat-" + chatLeaveDto.chatRoomId;

    const delUser: ChatParticipant =
      await this.chatParticipantsRepository.findOne({
        where: {
          chatRoom: chatLeaveDto.chatRoomId,
          user: user.id,
        },
      });
    if (delUser) await this.chatParticipantsRepository.delete(delUser);
    else return;

    this.server.in(chatTitle).emit("chat-room-leave", chatLeaveDto);
    socket.leave(chatTitle);

    const participant: ChatParticipant =
      await this.chatParticipantsRepository.findOne({
        where: { chatRoom: chatLeaveDto.chatRoomId },
      });

    if (!participant) {
      await this.chatParticipantsRepository.deleteAllParticipants(
        chatLeaveDto.chatRoomId,
      );
      await this.chatRoomRepository.deleteRoom(chatLeaveDto.chatRoomId);
      this.server.emit("chat-room-destroy", {
        chatRoomId: chatLeaveDto.chatRoomId,
      });
    }
  }

  private async joinChatRoom(
    chatJoinDto: ChatJoinDto,
    user: User,
    isCreate: Boolean,
  ): Promise<boolean> {
    const chatRoom: ChatRoom = await this.chatRoomRepository.findOne(
      chatJoinDto.chatRoomId,
    );

    const chatParticipants: ChatParticipant =
      this.chatParticipantsRepository.create({
        user,
        chatRoom,
      });

    if (isCreate) chatParticipants.authority = Authority.OWNER;

    if (
      chatJoinDto.password &&
      !(await bcrypt.compare(chatJoinDto.password, chatRoom.password))
    ) {
      return false;
    }

    await chatParticipants.save();
    chatJoinDto.authority = chatParticipants.authority;

    return true;
  }

  async chatParticipantAll(roomId: number) {
    const participants: ChatParticipant[] =
      await this.chatParticipantsRepository.find({
        where: {
          chatRoom: roomId,
        },
        order: {
          authority: -1,
        },
        relations: ["user"],
      });

    const chatParticipantDto: ChatParticipantDto[] = [];

    participants.forEach((participant) => {
      chatParticipantDto.push(new ChatParticipantDto(participant));
    });
    this.server
      .in("chat-" + roomId)
      .emit("chat-particip-all", chatParticipantDto);
  }

  @SubscribeMessage("chat-block")
  async handleChatBlock(
    @ConnectedSocket() socket: Socket,
    @MessageBody() { targetId },
  ) {
    const target: ChatParticipant =
      await this.chatParticipantsRepository.findOne({
        where: { user: targetId },
      });
    target.chatBlock = String(new Date().getTime());
    target.save();
  }

  @SubscribeMessage("DM")
  async handleDM(
    @ConnectedSocket() socket: Socket,
    @MessageBody() { senderId, targetId },
  ) {
    const sender: User = await this.userRepository.findOne(senderId);
    const target: User = await this.userRepository.findOne(targetId);
    const dmTitle: string =
      "dm- " +
      Math.min(targetId, senderId) +
      " + " +
      Math.max(targetId, senderId);

    let chatRoom: ChatRoom = await this.chatRoomRepository.findOne({
      where: { title: dmTitle },
    });

    let isCreate: Boolean = false;

    const chatJoinDto: ChatJoinDto = {
      chatRoomId: 0,
      title: dmTitle,
      password: "",
      userId: sender.id,
      nickname: sender.nickname,
      authority: Authority.PARTICIPANT,
    };
    if (!chatRoom) {
      chatJoinDto.chatRoomId = await this.chatRoomRepository.createRoom(
        chatJoinDto,
        true,
      );
      isCreate = true;
      await this.joinChatRoom(chatJoinDto, sender, isCreate);
      await this.joinChatRoom(chatJoinDto, target, isCreate);
      chatRoom = await this.chatRoomRepository.findOne(chatJoinDto.chatRoomId);
    }
    socket.join("chat-" + chatRoom.id);
    this.server.in(target.socketId).socketsJoin("chat-" + chatRoom.id);
    socket.emit("DM", { chatRoomId: chatRoom.id, targetId });
  }
}
