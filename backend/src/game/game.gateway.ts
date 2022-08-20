import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Socket } from "socket.io";
import { GameRoomRepository } from "./repository/game-room.repository";
import { GameParticipantRepository } from "./repository/game-participant.repository";
import { GameRoom } from "./entity/game-room.entity";
import { BallData } from "./data/ball-data";
import { UserData } from "./data/user-data";
import { StartGameDto } from "./dto/start-game.dto";
import { GamePosition } from "./game-position.enum";
import { GameParticipant } from "./entity/game-participant.entity";
import { RecordRepository } from "src/record/record.repository";
import { GameDataDto } from "./dto/game-data.dto";
import { UserRepository } from "src/user/user.repository";
import { GameJoinDto } from "./dto/game-room-join.dto";
import { GameLeaveDto } from "./dto/game-room-leave.dto";
import { User } from "src/user/user.entity";
import { GameParticipantProfile } from "./dto/game-participant-profile.dto";
import { UserState } from "src/user/user-state.enum";
import { ChatParticipant } from "src/chat/entity/chat-participant.entity";
import { NotFoundException } from "@nestjs/common";

const cvs = {
  width: 600,
  height: 400,
};
@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class GameGateway {
  constructor(
    private gameRoomRepository: GameRoomRepository,
    private gameParticipantRepository: GameParticipantRepository,
    private recordRepository: RecordRepository,
    private userRepository: UserRepository,
  ) {}

  gameData: Object = {};
  match = [];

  @WebSocketServer()
  server;

  @SubscribeMessage("game-room-join")
  async handleJoinGameRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() gameJoinDto: GameJoinDto,
  ): Promise<void> {
    const { userId, isLadder, isSpeedMode } = gameJoinDto;
    let gameRoomId = gameJoinDto.gameRoomId;
    const user: User = await this.userRepository.findOne(userId);

    let isCreate: Boolean = false;
    const joinGameTitle = "game-" + gameRoomId;

    if (!gameRoomId) {
      gameRoomId = await this.gameRoomRepository.createRoom(
        gameJoinDto,
        this.gameData,
      );
      isCreate = true;
    }

    const gameRoom: GameRoom = await this.gameRoomRepository.findOne(
      gameRoomId,
    );
    const joinUser: GameParticipant =
      await this.gameParticipantRepository.findOne({
        where: { gameRoom: gameJoinDto.gameRoomId, user: user.id },
      });
    if (joinUser) {
      socket.join(joinGameTitle);
      return;
    }
    const gameUser: GameParticipantProfile = await this.joinGameRoom(
      gameJoinDto,
      user,
    );

    if (isCreate && gameJoinDto.isLadder == false) {
      this.server.emit("game-room-create", gameRoom);
    }

    socket.join(joinGameTitle);
    this.server
      .in(joinGameTitle)
      .emit("game-room-join", { gameRoomId, gameUser });
  }

  private async joinGameRoom(
    gameJoinDto: GameJoinDto,
    user: User,
    position?: GamePosition,
  ): Promise<GameParticipantProfile> {
    const gameRoom: GameRoom = await this.gameRoomRepository.findOne(
      gameJoinDto.gameRoomId,
    );
    let gameParticipant: GameParticipant;

    const existLeftUser = await this.gameParticipantRepository.findOne({
      where: {
        gameRoom: gameJoinDto.gameRoomId,
        position: GamePosition.leftUser,
      },
    });

    const existRightUser = await this.gameParticipantRepository.findOne({
      where: {
        gameRoom: gameJoinDto.gameRoomId,
        position: GamePosition.rightUser,
      },
    });

    gameParticipant = this.gameParticipantRepository.create({
      user,
      gameRoom,
    });
    if (!existLeftUser) {
      gameParticipant.position = GamePosition.leftUser;
    } else if (!existRightUser) {
      gameParticipant.position = GamePosition.rightUser;
    } else {
      gameParticipant.position = GamePosition.spectator;
    }
    if (position) gameParticipant.position = position;
    await gameParticipant.save();

    const gameParticipantProfile: GameParticipantProfile =
      new GameParticipantProfile(user, gameParticipant.position);

    return gameParticipantProfile;
  }

  @SubscribeMessage("game-room-leave")
  async handleGameRoomLeave(
    @ConnectedSocket() socket: Socket,
    @MessageBody() gameLeaveDto: GameLeaveDto,
  ): Promise<void> {
    const user: User = await this.userRepository.findOne(gameLeaveDto.userId);

    const gameRoom: GameRoom = await this.gameRoomRepository.findOne(
      gameLeaveDto.gameRoomId,
    );

    if (gameRoom.isStart) {
      const gameParticipant: GameParticipant =
        await this.gameParticipantRepository.findOne({ where: { user } });
      if (gameParticipant.position === GamePosition.leftUser) {
        this.gameData[gameRoom.id].rightUser.score = 3;
      } else if (gameParticipant.position === GamePosition.rightUser) {
        this.gameData[gameRoom.id].leftUser.score = 3;
      }
      await this.endGameCheck(gameRoom.id);
    }

    const delUser: GameParticipant =
      await this.gameParticipantRepository.findOne({
        where: {
          gameRoom: gameLeaveDto.gameRoomId,
          user: user.id,
        },
      });
    if (delUser) await this.gameParticipantRepository.delete(delUser);
    else return;

    const leaveGameTitle = "game-" + gameLeaveDto.gameRoomId;

    this.server.in(leaveGameTitle).emit("game-room-leave", gameLeaveDto);
    socket.leave(leaveGameTitle);

    const participant: GameParticipant =
      await this.gameParticipantRepository.findOne({
        where: { gameRoom: gameLeaveDto.gameRoomId },
      });
    if (!participant) {
      await this.gameParticipantRepository.deleteAllParticipants(
        gameLeaveDto.gameRoomId,
      );
      await this.gameRoomRepository.deleteRoom(gameLeaveDto.gameRoomId);
      this.server.emit("game-room-destroy", {
        gameRoomId: gameLeaveDto.gameRoomId,
      });
    }
  }

  @SubscribeMessage("start-game")
  async handleGameStart(@MessageBody() startGameDto: StartGameDto) {
    const { gameRoomId, isLadder } = startGameDto;

    const gameUsers: GameParticipant[] =
      await this.gameParticipantRepository.find({
        where: { gameRoom: gameRoomId },
        relations: ["user"],
      });

    const gameRoom: GameRoom = await this.gameRoomRepository.findOne(
      gameRoomId,
    );

    gameUsers.forEach(async (gameUser) => {
      gameUser.user.state = UserState.IN_GAME;
      await gameUser.user.save();
      this.server.emit("change-state", {
        userId: gameUser.user.id,
        state: gameUser.user.state,
        nickname: gameUser.user.nickname,
      });
    });

    gameRoom.isStart = true;
    await gameRoom.save();
    this.server.emit("change-state-game", {
      gameRoomId,
      isStart: gameRoom.isStart,
    });

    this.gameData[gameRoomId].interval = setInterval(() => {
      this.update(gameRoomId);
      this.server
        .in("game-" + gameRoomId)
        .emit("game", this.gameData[gameRoomId]);
    }, 30);
  }

  @SubscribeMessage("user-paddle")
  handleGame(
    // @ConnectedSocket() socket: Socket,
    @MessageBody() gameDataDto: GameDataDto,
  ) {
    if (gameDataDto.position === GamePosition.leftUser) {
      this.gameData[gameDataDto.gameRoomId].leftUser.y = gameDataDto.y;
    } else if (gameDataDto.position === GamePosition.rightUser) {
      this.gameData[gameDataDto.gameRoomId].rightUser.y = gameDataDto.y;
    }
  }
  @SubscribeMessage("cancel-match")
  async handleCancelMatch(
    @ConnectedSocket() socket: Socket,
    @MessageBody() { userId },
  ) {
    const gameUser: GameParticipant =
      await this.gameParticipantRepository.findOne({
        where: { user: userId },
        relations: ["gameRoom"],
      });
    if (!gameUser) throw new NotFoundException();
    const gameLeaveDto: GameLeaveDto = {
      gameRoomId: gameUser.gameRoom.id,
      userId,
    };
    this.handleGameRoomLeave(socket, gameLeaveDto);
  }

  @SubscribeMessage("match")
  async handleMatch(
    @ConnectedSocket() socket: Socket,
    @MessageBody() { userId },
  ) {
    const readyUser: User = await this.userRepository.findOne(userId);
    const ladderGameRoom: GameRoom = await this.gameRoomRepository.findOne({
      where: { isLadder: true, isStart: false },
    });

    const existUser: GameParticipant =
      await this.gameParticipantRepository.findOne({
        where: { user: readyUser },
      });
    if (existUser) return;

    let isCreate: Boolean = false;

    const ladderGameJoinDto: GameJoinDto = {
      gameRoomId: null,
      title: "",
      userId: readyUser.id,
      isSpeedMode: true,
      isLadder: true,
    };

    if (!ladderGameRoom) {
      ladderGameJoinDto.gameRoomId = await this.gameRoomRepository.createRoom(
        ladderGameJoinDto,
        this.gameData,
      );
      isCreate = true;
    } else {
      ladderGameJoinDto.gameRoomId = ladderGameRoom.id;
    }

    const gameRoom: GameRoom = await this.gameRoomRepository.findOne(
      ladderGameJoinDto.gameRoomId,
    );

    await this.joinGameRoom(ladderGameJoinDto, readyUser);
    const joinGameTitle = "game-" + ladderGameJoinDto.gameRoomId;
    socket.join(joinGameTitle);

    if (!isCreate) {
      this.server
        .in(joinGameTitle)
        .emit("game-room-join", { gameRoomId: gameRoom.id });
    }
  }

  private update(gameRoomId: number) {
    const { ball, leftUser, rightUser } = this.gameData[gameRoomId];
    ball.x += ball.velocityX;
    ball.y += ball.velocityY;

    if (ball.y + ball.radius > cvs.height || ball.y - ball.radius < 0) {
      ball.velocityY = -ball.velocityY;
    }

    const player = ball.x < cvs.width / 2 ? leftUser : rightUser;

    if (this.collision(ball, player)) {
      let collidePoint: number = ball.y - (player.y + player.height / 2);

      collidePoint = collidePoint / (player.height / 2);

      const angleRad: number = collidePoint * (Math.PI / 4);

      const direction: number = ball.x < cvs.width / 2 ? 1 : -1;

      ball.velocityX = ball.speed * Math.cos(angleRad) * direction;
      ball.velocityY = ball.speed * Math.sin(angleRad);

      if (this.gameData[gameRoomId].isSpeedMode && ball.speed < 25) {
        ball.speed += 2;
      }
    }

    if (ball.x - ball.radius < -10) {
      rightUser.score++;
      this.resetBall(ball);
      this.endGameCheck(gameRoomId);
    } else if (ball.x + ball.radius > cvs.width + 10) {
      leftUser.score++;
      this.resetBall(ball);
      this.endGameCheck(gameRoomId);
    }
  }

  private collision(ball: BallData, player: UserData) {
    ball.top = ball.y - ball.radius;
    ball.bottom = ball.y + ball.radius;
    ball.left = ball.x - ball.radius;
    ball.right = ball.x + ball.radius;

    player.top = player.y;
    player.bottom = player.y + player.height;
    player.left = player.x;
    player.right = player.x + player.width;

    return (
      ball.right >= player.left &&
      ball.bottom >= player.top &&
      ball.left <= player.right &&
      ball.top <= player.bottom
    );
  }

  private resetBall(ball: BallData) {
    const direction: number = ball.x < 0 ? 1 : -1;
    ball.x = cvs.width / 2;
    ball.y = cvs.height / 2;

    ball.speed = 5;
    ball.velocityX = ball.speed * Math.cos(Math.PI / 4) * direction;
    ball.velocityY = ball.speed * Math.sin(Math.PI / 4);
  }

  private async endGameCheck(gameRoomId: number) {
    if (
      this.gameData[gameRoomId].leftUser.score >= 3 ||
      this.gameData[gameRoomId].rightUser.score >= 3
    ) {
      clearInterval(this.gameData[gameRoomId].interval);
      let gameWin: boolean;

      if (this.gameData[gameRoomId].leftUser.score >= 3) {
        gameWin = true;
      } else if (this.gameData[gameRoomId].rightUser.score >= 3) {
        gameWin = false;
      }
      const leftUser = await this.gameParticipantRepository.findOne({
        where: { gameRoom: gameRoomId, position: GamePosition.leftUser },
        relations: ["user"],
      });
      const rightUser = await this.gameParticipantRepository.findOne({
        where: { gameRoom: gameRoomId, position: GamePosition.rightUser },
        relations: ["user"],
      });

      this.recordRepository.gameEnd(
        this.gameData[gameRoomId].isLadder,
        gameWin,
        leftUser.user,
        rightUser.user,
      );

      const gameRoom: GameRoom = await this.gameRoomRepository.findOne(
        gameRoomId,
      );
      gameRoom.isStart = false;
      await gameRoom.save();
      this.server.emit("change-state-game", {
        gameRoomId,
        isStart: gameRoom.isStart,
      });

      this.gameData[gameRoomId].leftUser.score = 0;
      this.gameData[gameRoomId].rightUser.score = 0;

      const endGameInfo: GameParticipantProfile[] = [];
      endGameInfo.push(
        new GameParticipantProfile(leftUser.user, GamePosition.leftUser),
      );
      endGameInfo.push(
        new GameParticipantProfile(rightUser.user, GamePosition.rightUser),
      );

      rightUser.user.state = UserState.CONNECT;
      leftUser.user.state = UserState.CONNECT;
      await rightUser.user.save();
      await leftUser.user.save();
      this.server.emit("change-state", {
        userId: rightUser.user.id,
        state: rightUser.user.state,
        nickname: rightUser.user.nickname,
      });
      this.server.emit("change-state", {
        userId: leftUser.user.id,
        state: leftUser.user.state,
        nickname: leftUser.user.nickname,
      });
      this.resetBall(this.gameData[gameRoomId].ball);
      this.server.to("game-" + gameRoomId).emit("end-game", endGameInfo);
      this.server
        .in("game-" + gameRoomId)
        .emit("game", this.gameData[gameRoomId]);
    }
  }

  @SubscribeMessage("request-game")
  async handleRequestGame(@MessageBody() { userId, targetId, isSpeedMode }) {
    const user: User = await this.userRepository.findOne(userId);
    const target: User = await this.userRepository.findOne(targetId);

    this.server.in(target.socketId).emit("request-game", {
      nickname: user.nickname,
      isSpeedMode,
      targetId: userId,
    });
  }

  @SubscribeMessage("response-game")
  async handleResponseGame(
    @ConnectedSocket() socket: Socket,
    @MessageBody() { userId, targetId, isSpeedMode, isAccept },
  ) {
    if (!isAccept) {
      this.server.in(socket.id).emit("response-game", isAccept);
      return;
    }
    const user: User = await this.userRepository.findOne(userId);
    const target: User = await this.userRepository.findOne(targetId);

    const gameRoomJoin: GameJoinDto = {
      gameRoomId: null,
      title: "",
      userId: user.id,
      isSpeedMode,
      isLadder: false,
    };

    gameRoomJoin.gameRoomId = await this.gameRoomRepository.createRoom(
      gameRoomJoin,
      this.gameData,
    );
    const gameRoom: GameRoom = await this.gameRoomRepository.findOne(
      gameRoomJoin.gameRoomId,
    );
    this.server.emit("game-room-create", gameRoom);

    const gameUser: GameParticipantProfile = await this.joinGameRoom(
      gameRoomJoin,
      user,
      GamePosition.rightUser,
    );
    const gameTarget: GameParticipantProfile = await this.joinGameRoom(
      gameRoomJoin,
      target,
      GamePosition.leftUser,
    );

    const gameTitle: string = "game-" + gameRoom.id;
    socket.join(gameTitle);
    this.server.in(target.socketId).socketsJoin(gameTitle);

    this.server
      .in(gameTitle)
      .emit("game-room-join", { gameRoomId: gameRoom.id, gameUser });
    this.server
      .in(gameTitle)
      .emit("game-room-join", { gameRoomId: gameRoom.id, gameTarget });
  }
}
