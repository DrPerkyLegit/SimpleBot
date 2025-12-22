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

            const foundHopper = botAccount.client.findBlock({
                matching(block: any) {
                    return block.name.includes("hopper");
                },
                maxDistance: 2,
            });

            if (!foundHopper) {
                botAccount.client.whisper(username, "No Hopper found");
                return;
            }


            const stasisItem = StasisCommand.findStasisItem(botAccount.client.inventory, username);

            if (!stasisItem) {
                botAccount.client.whisper(username, "No stasis item found");
                return;
            }
            
            const throwPosition = new Vec3(foundHopper.position.x + 0.5, foundHopper.position.y + 1, foundHopper.position.z + 0.5);

            await botAccount.client.lookAt(throwPosition);


            await botAccount.client.transfer({
                window: botAccount.client.inventory,
                itemType: stasisItem.type,
                metadata: stasisItem.metadata,
                count: 1,
                sourceStart: stasisItem.slot-1,
                sourceEnd: stasisItem.slot+1,
                destStart: -999,
                destEnd: 0
            })

            botAccount.client.whisper(username, "Stasis item thrown at hopper");
        })();
    }

    static findStasisItem(currentWindow: any, username: string) {

        const inventoryItems = currentWindow.items();

        for (let i = 0; i < inventoryItems.length; i++) {
            const item = inventoryItems[i];

            //ignore the error about components not being a property of item, it is
            for (let component of item.components) {
                if (!component || !component.type)
                    continue;

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