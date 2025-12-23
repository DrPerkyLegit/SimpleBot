import { ConfigManager } from "../../../src/Managers/ConfigManager";
import { ModuleAPI } from "../../../src/Managers/ModuleAPI";
import { ModuleManager } from "../../../src/Managers/ModuleManager";
import { Event } from "../../../src/Types/Events/Event";
import { Module } from "../../../src/Types/Module";

import axios from 'axios';

export class PlayerDetecterModule extends Module {
    private config: ConfigManager | undefined;

    private seenPlayers: Map<string, string> = new Map<string, string>();
    private expectedPlayers: Set<string> = new Set<string>();

    private discordWebhookURL: string | undefined;
    private discordWebhookUsername: string | undefined;
    private discordWebhookAvatar: string | undefined;

    public constructor(public name: string, public moduleAPI: ModuleAPI) {
        super(name, moduleAPI);
    }
    
    public onEnable(): void {
        this.config = this.moduleAPI.getModuleConfig(this);

        this.seenPlayers = new Map<string, string>(this.config?.getValue("seenPlayers", []) as Map<string, string>);

        this.expectedPlayers = new Set<string>(this.config?.getValue("expectedPlayers", []) as string[]);

        //code is inside this block so return doesnt cancel code under this block
        (() => {
            const discordWebhookData = this.config?.getValue("discord_webhook", null);
            if (!discordWebhookData) {
                this.Logger.Error("Discord Webhook Data is not set in the config, unable to send message");
                return;
            }

            if (!String(discordWebhookData.url).startsWith("https://discord.com/api/webhooks/")) {
                this.Logger.Error("Discord Webhook URL is not set in the config, unable to send message");
                return;
            }

            this.discordWebhookURL = discordWebhookData.url;
            this.discordWebhookUsername = discordWebhookData.username;
            this.discordWebhookAvatar = discordWebhookData.avatar_url;

        })();
        

        //this.moduleAPI.registerCommand(this, new ExpectedPlayerCommand(this));
    }

    public onDisable(): void {
        
    }

    public onEvent(event: Event): void {
        if (event.getName() == "newBotInstance") {
            const botInstance = event.getRawData().account.client;
            
            botInstance.on("physicsTick", () => {
                for (const username in botInstance.players) {
                    if (username === botInstance.username) continue;

                    const player = botInstance.players[username];
                    if (!player || !player.entity) continue; //player not inside render distance

                    if (this.seenPlayers.has(username)) continue;

                    this.seenPlayers.set(username, new Date().toUTCString());
                    this.config?.setValue("seenPlayers", Array.from(this.seenPlayers));

                    if (this.expectedPlayers.has(username)) {
                        this.expectedPlayers.delete(username);
                        this.config?.setValue("expectedPlayers", Array.from(this.expectedPlayers));
                        this.sendWebhookMessage("Expected Player **" + username + "** Has Been Seen For The First Time <t:" + Math.floor(new Date().getTime() / 1000) + ":R>");
                    } else {
                        this.sendWebhookMessage("@everyone Unexpected Player **" + username + "** Has Been Seen For The First Time <t:" + Math.floor(new Date().getTime() / 1000) + ":R>");
                    }

                }
            })
        }
    }

    private sendWebhookMessage(message: string): void {
        if (!this.discordWebhookURL) {
            this.Logger.Error("Tried To send a webhook message but the webhook URL is not set: ", message);
            return;
        }

        try {
            axios.post(this.discordWebhookURL, {
                content: message,
                username: this.discordWebhookUsername,
                avatar_url: this.discordWebhookAvatar
            })
        } catch (error) {
            //added this to prevent crash on bad webhook call
            this.Logger.Error("Failed To Send Webhook Message: ", error);
        }
        
    }
    
}