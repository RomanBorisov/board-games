import { Injectable } from '@nestjs/common';
import {
  IFoolGameAction,
  IFoolGameClientState,
  IFoolGameServerState,
} from '@board-games/shared';
import { AvailableGameEngines, IGameEngine } from './game-engine.interface';

@Injectable()
export class DurakEngine
  implements
    IGameEngine<IFoolGameServerState, IFoolGameClientState, IFoolGameAction>
{
  public readonly name: AvailableGameEngines = AvailableGameEngines.DURAK;

  public initGame(playerIds: string[]): IFoolGameServerState {
    void playerIds;
    throw new Error('Not implemented');
  }

  public processAction(
    state: IFoolGameServerState,
    action: IFoolGameAction,
    playerId: string
  ): IFoolGameServerState {
    void state;
    void action;
    void playerId;
    throw new Error('Not implemented');
  }

  public getStateForPlayer(
    state: IFoolGameServerState,
    playerId: string
  ): IFoolGameClientState {
    void state;
    void playerId;
    throw new Error('Not implemented');
  }

  public isGameOver(state: IFoolGameServerState): boolean {
    void state;
    throw new Error('Not implemented');
  }
}
