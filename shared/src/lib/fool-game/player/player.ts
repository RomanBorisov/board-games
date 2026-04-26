import { IPlayer } from "../../core/player";
import { IFoolGameCard } from "../card";

export interface IFoolGamePlayer extends IPlayer {
  isAttacker: boolean;
  isDefender: boolean;
  role: FoolGamePlayerRole;
  hand: IFoolGameCard[];
}

export interface IFoolGameClientPlayer extends Omit<IFoolGamePlayer, 'hand'> {
  cardCount: number;
}

export enum FoolGamePlayerRole {
  Attacker = 'attacker',
  Defender = 'defender',
}