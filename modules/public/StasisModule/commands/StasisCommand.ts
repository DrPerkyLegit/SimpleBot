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

            const foundSigns = botAccount.client.findBlocks({
                matching(block: any) {
                    return block.name.includes("sign");
                },
                count: 200,
                maxDistance: 10,
            });

            if (foundSigns.length === 0) {
                botAccount.client.whisper(username, "You do not have a stasis sign nearby.");
                return;
            }

            let matchedAny = false;

            for (const signPosition of foundSigns) {
                let signBlock = botAccount.client.blockAt(signPosition, true);
                if (!signBlock) continue;

                const signTextSplit = signBlock.getSignText()[0]?.split("\n");

                const line1 = signTextSplit[0] ?? "";
                const line2 = signTextSplit[1] ?? "";

                if (line1 == "STASIS" && line2 == username) {
                    matchedAny = true;

                    const trapPos = new Vec3(signBlock.position.x, signBlock.position.y - 1, signBlock.position.z);
                    let trapdoor = botAccount.client.blockAt(trapPos);

                    if (!trapdoor || !trapdoor.name.includes("trapdoor") || trapdoor.name.includes("iron")) {
                        botAccount.client.whisper(username, "Your stasis trapdoor is missing or invalid.");
                        continue;
                    }

                    const emptySlot = botAccount.client.inventory.slots.findIndex(s => s == null);
                    if (emptySlot !== -1) {
                        botAccount.client.setQuickBarSlot(emptySlot);
                    }

                    try {
                        const getRandomTicks = () => { return Math.floor(Math.random() * (10 - 5 + 1)) + 5 }; //i think this is 5-10 ticks

                        await botAccount.client.lookAt(trapPos); //try to face the trapdoor
                        await botAccount.client.waitForTicks(getRandomTicks());

                        const cancelToken = { cancelled: false };

                        await StasisCommand.withTimeout(
                            (async () => {
                                const toggleTrapdoorState = async () => {
                                    if (botAccount.client == undefined) return;
                                    await botAccount.client.activateBlock(trapdoor!);
                                    await botAccount.client.waitForTicks(getRandomTicks());
                                    trapdoor = botAccount.client.blockAt(trapPos);
                                };

                                while (!cancelToken.cancelled && trapdoor!.getProperties().open) { // close
                                    await toggleTrapdoorState();
                                }

                                while (!cancelToken.cancelled && !trapdoor!.getProperties().open) { // open
                                    await toggleTrapdoorState();
                                }
                            })(), 3000, "Trapdoor never closed (timeout)", cancelToken);

                        botAccount.client.whisper(username, "Attempted To Pull Stasis");
                    } catch (err) {
                        botAccount.client.whisper(username, `Stasis pull failed: ${(err as Error).message}`);
                    }
                }
            }

            if (!matchedAny) {
                botAccount.client.whisper(username, "No stasis sign with your name was found.");
            }

        })();
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