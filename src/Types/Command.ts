import { GameAccount } from "../Managers/AccountManager";

export abstract class Command {
    public abstract getName(): string;

    public abstract getWhitelistedPlayers(): string[] | undefined;

    public abstract onCommandExecute(botInstance: GameAccount, username: string, args: string, isPrivate: boolean): void;
}