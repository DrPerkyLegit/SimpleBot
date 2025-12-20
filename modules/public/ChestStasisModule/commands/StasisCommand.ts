import { Vec3 } from "vec3";
import { GameAccount } from "../../../../src/Managers/AccountManager";
import { Command } from "../../../../src/Types/Command";

/*KNOWN BUGS:

- Bot has a hard time getting trap doors that arent already infront of them
*/

export class StasisCommand extends Command {
    public getName(): string {
        return "stasis"
    }
    public getWhitelistedPlayers(): string[] | undefined { return undefined; }

    public onCommandExecute(botAccount: GameAccount, username: string, args: string, isPrivate: boolean): void {
        (async () => {
            if (botAccount.client == undefined) return;

            const foundChest = botAccount.client.findBlock({
                matching(block: any) {
                    return block.name.includes("chest");
                },
                maxDistance: 1,
            });

            if (!foundChest) {
                botAccount.client.whisper(username, "No chest found");
                return;
            }

            const stasisItem = StasisCommand.findStasisItem(botAccount, username);

            if (!stasisItem) {
                botAccount.client.whisper(username, "No stasis item found");
                return;
            }

            const openedChest = await botAccount.client.openChest(foundChest)

            await openedChest.deposit(stasisItem.type, stasisItem.metadata, 1);
        
            openedChest.close();

            botAccount.client.whisper(username, "Stasis item deposited into chest");
        
        })();
    }

    static findStasisItem(botAccount: GameAccount, username: string) {
        if (botAccount.client == undefined) return null;

        const inventoryItems = botAccount.client.inventory.items();

        for (let i = 0; i < inventoryItems.length; i++) {
            const item = inventoryItems[i];

            if (item.name != "paper")
                continue;

            //ignore the error about components not being a property of item, it is
            for (let component of item.components) {
                if (component.type == "custom_name") {
                    if (component.data.value == username) {
                        return item;
                    }
                }
            }
        }

        return null
    }

    static withTimeout<T>(promise: Promise<T>, ms: number, msg = "Timed out", cancelToken?: { cancelled: boolean }): Promise<T> {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                if (cancelToken) cancelToken.cancelled = true;
                reject(new Error(msg));
            }, ms);

            promise.then(
                (value) => { clearTimeout(timer); resolve(value); },
                (err) => { clearTimeout(timer); reject(err); }
            );
        });
    }

}