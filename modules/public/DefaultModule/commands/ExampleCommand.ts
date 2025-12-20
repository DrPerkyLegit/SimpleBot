import { GameAccount } from "../../../../src/Managers/AccountManager";
import { Command } from "../../../../src/Types/Command";

export class ExampleCommand extends Command {
    public getName(): string {
        return "example"
    }
    public getWhitelistedPlayers(): string[] | undefined { return undefined; }

    public onCommandExecute(botAccount: GameAccount, username: string, args: string, isPrivate: boolean): void {
        if (!botAccount.client) return;

        botAccount.client.chat("working")
    }

}