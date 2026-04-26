import { IGame } from "./game";
import { IPlayer } from "./player";

export interface IGameState<PlayerType = IPlayer> {
    game: IGame;
    players: PlayerType[];

    isGameOver: boolean;
    winner: PlayerType | null;
    loser: PlayerType | null;
}
