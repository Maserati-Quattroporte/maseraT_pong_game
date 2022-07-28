import { GameParticipantProfile } from "../dto/game-participant-profile.dto";

export class GameRoomDetailDto {
  gameRoomId: number;
  title: string;
  gameUser: GameParticipantProfile[] = [];
}
