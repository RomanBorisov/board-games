import { IFoolGameCard } from "../card";
import { IGameAction, IGameActionWithPayload } from "../../core/game";

export enum FoolGameActionType {
  Attack = 'attack',
  Defend = 'defend',
  TakeCard = 'takeCard',
  Pass = 'pass',
}

export interface IFoolGameAttackActionPayload {
    card: IFoolGameCard;
}

export interface IFoolGameDefendActionPayload {
    card: IFoolGameCard;
    cardToBeat: IFoolGameCard;
}

export type IFoolGameAttackAction = IGameActionWithPayload<
    FoolGameActionType.Attack,
    IFoolGameAttackActionPayload
>;

export type IFoolGameDefendAction = IGameActionWithPayload<
    FoolGameActionType.Defend,
    IFoolGameDefendActionPayload
>;

export type IFoolGameTakeCardAction = IGameAction<FoolGameActionType.TakeCard>;

export type IFoolGamePassAction = IGameAction<FoolGameActionType.Pass>;

export type IFoolGameAction =
    | IFoolGameAttackAction
    | IFoolGameDefendAction
    | IFoolGameTakeCardAction
    | IFoolGamePassAction;
