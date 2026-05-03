import { Module } from '@nestjs/common';
import { DurakEngine } from './engine/durak.engine';
import { GameRegistryService } from './registry/registry.service';

@Module({
  imports: [],
  controllers: [],
  providers: [DurakEngine, GameRegistryService],
})
export class GameModule {}
