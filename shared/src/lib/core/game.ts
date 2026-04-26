export interface IGame {
    id: string;
    name: string;
    description: string;
}

export interface IGameAction<T> {
    type: T;
}

export interface IGameActionWithPayload<T, P> extends IGameAction<T> {
    payload: P;
}
