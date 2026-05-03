import { Injectable } from '@nestjs/common';
import {
  IFoolGameAction,
  IFoolGameClientState,
  IFoolGameServerState,
} from '@board-games/shared';
import { DurakEngine } from '../engine/durak.engine';
import { AvailableGameEngines, IGameEngine } from '../engine/game-engine.interface';

type SupportedGameEngine = IGameEngine<
  IFoolGameServerState,
  IFoolGameClientState,
  IFoolGameAction
>;

@Injectable()
export class GameRegistryService {
  private readonly engines = new Map<AvailableGameEngines, SupportedGameEngine>();

  constructor(private readonly durakEngine: DurakEngine) {
    this.registerEngine(durakEngine);
  }

  private registerEngine(engine: SupportedGameEngine): void {
    this.engines.set(engine.name, engine);
  }

  getEngine(name: AvailableGameEngines): SupportedGameEngine | null {
    return this.engines.get(name) ?? null;
  }
}
