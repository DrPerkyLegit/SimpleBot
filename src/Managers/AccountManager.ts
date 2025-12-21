import fs from "fs";
import path from "path";

import mineflayer from "mineflayer"

import { Logger } from "../Utils/Logger"
import { ConfigManager } from "./ConfigManager";
import { ModuleManager } from "./ModuleManager";
import { Command } from "../Types/Command";
import { Event } from "../Types/Events/Event";

export class GameAccount {
    public client: mineflayer.Bot | undefined;

    private alreadyReconnecting: boolean;

    constructor(private Modules: ModuleManager, private config: any) {
        this.alreadyReconnecting = false;
        this.createBot();
    }

    private createBot() {
        this.client = mineflayer.createBot({
            username: this.config.user.ProfileName,
            host: this.config.host,
            port: this.config.port,
            auth: "microsoft",
            hideErrors: true, //disabled for production to prevent PartialReadError spam
        })

        this.alreadyReconnecting = false;

        this.Modules.emit("custom_event", new Event("newBotInstance", { account: this }, false));

        this.client.on("login", () => {
            Logger.Info("[", this.config.user.ProfileName, "] ", "Connected To Server");
        })

        this.client.on("end", (reason: string) => {
            if (this.alreadyReconnecting) return;

            Logger.Error("[", this.config.user.ProfileName, "] ", "Disconnected: ", reason)
            this.reconnect();
        })

        this.client.on("kicked", (reason: string) => {
            if (this.alreadyReconnecting) return;

            Logger.Error("[", this.config.user.ProfileName, "] ", "Kicked: ", reason)
            this.reconnect();
        })

        this.client.on("error", (err: Error) => { })

        this.client.on("chat", (username, message) => {
            this.handleMessage(username, message, false);
        })

        this.client.on("whisper", (username, message) => {
            this.handleMessage(username, message, true);
        })
    }

    private handleMessage(username: string, message: string, isPrivate: boolean) {
        if (!this.client) return;
        if (!this.config.user.CommandPrefix) return;
        if (!message.startsWith(this.config.user.CommandPrefix) && !isPrivate) return;

        var messageToParse = message;

        if (!isPrivate) {
            messageToParse = message.slice(this.config.user.CommandPrefix.length);
        }

        const parts = messageToParse.trim().split(" ");
        const commandName = parts.shift()?.toLowerCase();
        const args = parts.join(" ");

        if (!commandName) return;

        const command: Command | undefined = this.Modules.getModuleAPI().getCommand(commandName);

        if (!command) {
            if (isPrivate) {
                this.client.whisper(username, `Unknown command: ${commandName}`);
            }

            console.log(`Unknown command: ${commandName}`);
            return;
        }

        if (command.getWhitelistedPlayers() != undefined && !command.getWhitelistedPlayers()?.includes(username)) {
            this.client.whisper(username, `No Permission On Whitelisted Command`);
        } else {
            command.onCommandExecute(this, username, args, isPrivate);
        }
    }

    private reconnect() {
        Logger.Info("[", this.config.user.ProfileName, "] ", "Auto-Reconnecting In 10 Seconds")
        this.alreadyReconnecting = true;

        setTimeout(() => {
            this.createBot();
        }, 10 * 1000)

    }
}

export class AccountManager {
    private JavaAccounts: GameAccount[] = [];

    private ServerHost: string;
    private ServerPort: number;
    
    constructor(private Config: ConfigManager, private Modules: ModuleManager) {
        const accountConfig: any[] = Config.getValue("accounts", [])

        const connectionDelay = Number(Config.getValue("connectionDelay", 5));

        this.ServerHost = Config.getValue("address", "localhost")
        this.ServerPort = Number(Config.getValue("port", 25565))

        if (accountConfig.length <= 0) {
            Logger.Warning("0 Accounts Loaded From Config")
        }

        Logger.Info("Loading ", accountConfig.length, " Accounts From Config")

        //sanity checks

        const usedCommandPrefix = new Set<string>();
        const usedModuleNames = new Set<string>();

        const accountsToConnect = accountConfig.filter(account => {
            if (!account.CommandPrefix) return true;

            if (usedCommandPrefix.has(account.CommandPrefix)) {
                Logger.Error("Duplicate CommandPrefix Detected \"", account.CommandPrefix, "\" From Profile \"", account.ProfileName ,"\"");
                return false;
            }

            for (var ModuleName of account.Modules) {
                if (!Modules.IsValidModule(ModuleName)) {
                    Logger.Warning("Unknown Module Name: \"", ModuleName, "\" From Profile \"", account.ProfileName ,"\", Skipping...");
                }

                if (!usedModuleNames.has(ModuleName)) {
                    usedModuleNames.add(ModuleName)
                }
            }

            usedCommandPrefix.add(account.CommandPrefix);            
            return true;
        });

        Logger.Info("Finished Loading Config For ", accountsToConnect.length, " Accounts")

        Modules.emit("ready", usedModuleNames)

        Logger.Info("Connecting To ", this.ServerHost, ":", this.ServerPort, " With Delay ", connectionDelay, "s")

        const setupInterval = setInterval(() => {
            const profileConfig = accountsToConnect.pop();
            this.JavaAccounts.push(new GameAccount(Modules, {
                user: profileConfig,
                host: this.ServerHost,
                port: this.ServerPort,
            }));

            if (accountsToConnect.length <= 0) {
                clearInterval(setupInterval);
            }
        }, connectionDelay * 1000);
    }


}