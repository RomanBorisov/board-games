import { IUser } from "./user";

export interface IPlayer extends IUser {
    isHisTurn: boolean;
}