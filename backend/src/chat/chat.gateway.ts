import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Socket } from "socket.io";
import { ChatRoomRepository } from "./repository/chat-room.repository";
import { ChatJoinDto } from "./dto/chat-join.dto";
import { ChatParticipantsRepository } from "./repository/chat-participants.repository";
import { ChatRoom } from "./entity/chat-room.entity";
import { ChatParticipants } from "./entity/chat-participants.entity";
import { User } from "src/user/entity/user.entity";
import { UserRepository } from "src/user/repository/user.repository";
import { Authority } from "./enum/authority.enum";
import { ChatParticipantDto } from "./dto/chat-participant.dto";
import { SetAdminDto } from "./dto/set-admin.dto";
import * as bcrypt from "bcryptjs";
import { ChatLeaveDto } from "./dto/chat-leave.dto";
import { ChatMessageDto } from "./dto/chat-message.dto";

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class ChatGateway {
  constructor(
    private chatRoomRepository: ChatRoomRepository,
    private chatParticipantsRepository: ChatParticipantsRepository,
    private userRepository: UserRepository,
  ) {}

  @WebSocketServer()
  server;

  @SubscribeMessage("chat-room-join")
  async handleJoinChatRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() chatJoinDto: ChatJoinDto,
  ): Promise<void> {
    const user: User = await this.userRepository.findOne(chatJoinDto.userId);
    let isCreate: Boolean = false;

    // 방이 생성이면 생성 된 room id, 입장이면 프론트에서 넘어온 room id
    if (!chatJoinDto.chatRoomId) {
      chatJoinDto.chatRoomId = await this.chatRoomRepository.createRoom(
        chatJoinDto,
      );
      isCreate = true;
    }
    // 방 생성이면 user -> onwer, 아니면 user 참여자
    if (!this.joinChatRoom(chatJoinDto, user, isCreate)) return;

    // 방 생성시 생성한 user에겐 join을 안 보내기 때문에 그 다음 유저들부턴 권한 0으로 전송
    const chatParticipantDto: ChatParticipantDto = {
      roomId: chatJoinDto.chatRoomId,
      nickname: user.nickname,
      authority: 0,
      userId: user.id,
    };

    const chatTitle = "chat-" + chatJoinDto.chatRoomId;

    this.server.in(chatTitle).emit("chat-room-join", chatParticipantDto);

    socket.join(chatTitle);
  }

  @SubscribeMessage("chat-room-set-admin")
  async handleChatRoomSetAdmin(
    @ConnectedSocket() socket: Socket,
    @MessageBody() setAdminDto: SetAdminDto,
  ): Promise<void> {
    const chatParticipant: ChatParticipants =
      await this.chatParticipantsRepository.findOne({
        where: { user: setAdminDto.userId },
        relations: ["user"],
      });

    if (setAdminDto.isAdmin) {
      chatParticipant.authority = Authority.admin;
    } else {
      chatParticipant.authority = Authority.partiicipnat;
    }

    await chatParticipant.save();
    this.server
      .in("chat-" + setAdminDto.chatRoomId)
      .emit("chat-room-set-admin", {
        userId: setAdminDto.userId,
        isAdmin: setAdminDto.isAdmin,
      });
  }

  private async joinChatRoom(
    chatJoinDto: ChatJoinDto,
    user: User,
    isCreate: Boolean,
  ): Promise<boolean> {
    const chatRoom: ChatRoom = await this.chatRoomRepository.findOne(
      chatJoinDto.chatRoomId,
    );

    if (await bcrypt.compare(chatJoinDto.password, chatRoom.password)) {
      const chatParticipants: ChatParticipants =
        this.chatParticipantsRepository.create({
          user,
          chatRoom,
        });
      if (isCreate) {
        chatParticipants.authority = Authority.owner;
      }
      await chatParticipants.save();
      return true;
    }
    return false;
  }

  @SubscribeMessage("chat-room-leave")
  async handleChatRoomLeave(
    @ConnectedSocket() socket: Socket,
    @MessageBody() chatLeaveDto: ChatLeaveDto,
  ): Promise<void> {
    const user: User = await this.userRepository.findOne(chatLeaveDto.userId);
    chatLeaveDto.nickname = user.nickname;

    const chatTitle = "chat-" + chatLeaveDto.chatRoomId;

    socket.leave(chatTitle); //방을 떠난다.

    // 참여자 리스트에서 그 룸의 그 참여자 삭제!
    const deluser: ChatParticipants =
      await this.chatParticipantsRepository.findOne({
        where: {
          chatRoom: chatLeaveDto.chatRoomId,
          user: user.id,
        },
      });
    await this.chatParticipantsRepository.delete(deluser);

    this.server.in(chatTitle).emit("chat-room-leave", chatLeaveDto);

    //방에 참여자 없으면 방 삭제!
    const participant: ChatParticipants =
      await this.chatParticipantsRepository.findOne(chatLeaveDto.chatRoomId);
    if (!participant)
      await this.chatRoomRepository.deleteRoom(chatLeaveDto.chatRoomId);
  }

  @SubscribeMessage("chat-room-message")
  async handleChatRoomMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() chatMessageDto: ChatMessageDto,
  ): Promise<void> {
    const user: User = await this.userRepository.findOne(chatMessageDto.userId);
    chatMessageDto.nickname = user.nickname;

    const chatTitle = "chat-" + chatMessageDto.chatRoomId;
    socket.in(chatTitle).emit("chat-room-message", chatMessageDto);
  }
}