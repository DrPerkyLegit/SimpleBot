import { GameAccount } from "../../../../src/Managers/AccountManager";
import { ModuleAPI } from "../../../../src/Managers/ModuleAPI";
import { Command } from "../../../../src/Types/Command";

export class HelpCommand extends Command {
    public constructor(public moduleAPI: ModuleAPI) {
        super();
    }

    public getName(): string { return "help" }
    public getWhitelistedPlayers(): string[] | undefined { return undefined; }

    public onCommandExecute(botAccount: GameAccount, username: string, args: string, isPrivate: boolean): void {
        if (!botAccount.client) return;

        botAccount.client.whisper(username, `Available commands: ${this.moduleAPI.getAllCommands().map(c => c.getName()).join(", ")}`);
    }

}