import { IGameState } from "./game-state";
import { IPlayer } from "./player";

export interface ISession {
    id: string;
    
    gameState: IGameState;
    players: IPlayer[];
    status: SessionStatus;
    createdBy: IPlayer;


    createdAt: Date | null;
    updatedAt: Date | null;
    startedAt: Date | null;
    endedAt: Date | null;
}

export enum SessionStatus {
    Waiting = 'waiting',
    InProgress = 'in_progress',
    Finished = 'finished',
    Abandoned = 'abandoned',
}