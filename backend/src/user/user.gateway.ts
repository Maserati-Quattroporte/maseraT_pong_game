import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Socket } from "socket.io";
import { User } from "../user/user.entity";
import { UserRepository } from "../user/user.repository";
import { UserListDto } from "././dto/user-list.dto";
import { GameParticipant } from "src/game/entity/game-participant.entity";
import { GameRoomRepository } from "src/game/repository/game-room.repository";
import { GameParticipantRepository } from "src/game/repository/game-participant.repository";
import { UserState } from "./user-state.enum";
import { Friend } from "src/friend/friend.entity";
import { FriendRepository } from "src/friend/friend.repository";
import { GameGateway } from "src/game/game.gateway";

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class UserGateway {
  constructor(
    private userRepository: UserRepository,
    private friendRepository: FriendRepository,
    private gameParticipantRepository: GameParticipantRepository,
    private gameRoomRepository: GameRoomRepository,
    private gameGateway: GameGateway,
  ) {}

  @WebSocketServer()
  server;

  @SubscribeMessage("connect-user")
  async handleConnectUser(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { userId: number },
  ) {
    const user: User = await this.userRepository.findOne(data.userId);
    user.socketId = socket.id;
    user.state = UserState.CONNECT;

    await user.save();
    this.server.emit("change-state", {
      userId: user.id,
      state: user.state,
      nickname: user.nickname,
    });

    const userDto: UserListDto = {
      userId: user.id,
      nickname: user.nickname,
      state: user.state,
    };
    this.server.emit("connect-user", userDto);
  }

  @SubscribeMessage("friend-all")
  async handleFriend(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { userId: number },
  ) {
    this.friendAll(socket.id, data.userId);
  }

  @SubscribeMessage("disconnect")
  async handleDisconnect(@ConnectedSocket() socket: Socket) {
    const user: User = await this.userRepository.findOne({
      where: {
        socketId: socket.id,
      },
    });
    if (!user) return;

    user.state = UserState.DISCONNECT;
    await user.save();

    const readyLadder: GameParticipant =
      await this.gameParticipantRepository.findOne({ where: { user } });
    if (readyLadder) {
      this.gameGateway.handleCancelMatch(socket, { userId: user.id });
    }

    this.server.emit("change-state", {
      userId: user.id,
      state: user.state,
      nickname: user.nickname,
    });
    this.server.emit("disconnect-user", { userId: user.id });
  }

  async userAll() {
    const users: User[] = await this.userRepository.find();

    const userListDto: UserListDto[] = [];

    users.forEach((user) => {
      userListDto.push(new UserListDto(user));
    });

    this.server.emit("user-all", userListDto);
  }

  async friendAll(socketId: string, userId: number): Promise<void> {
    const friends: Friend[] = await this.friendRepository.find({
      where: {
        ownId: userId,
      },
      relations: ["friendId"],
    });
    const userListDto: UserListDto[] = [];

    friends.forEach((friend) => {
      userListDto.push(new UserListDto(friend.friendId));
    });

    this.server.in(socketId).emit("friend-all", userListDto);
  }

  async nicknameChange(user: User) {
    this.server.emit("change-state", {
      userId: user.id,
      state: user.state,
      nickname: user.nickname,
    });
  }
}
