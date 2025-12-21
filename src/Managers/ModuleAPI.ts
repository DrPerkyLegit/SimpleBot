//idk where to place this file

import EventEmitter from "events";
import { Module } from "../Types/Module";
import { Command } from "../Types/Command";
import { Logger } from "../Utils/Logger";
import { ConfigManager } from "./ConfigManager";

export class ModuleAPI extends EventEmitter {
    private RegisteredCommands: Map<string, Array<Command>>;
    private ConfigManagers: Map<string, ConfigManager>;

    public constructor() {
        super()

        this.RegisteredCommands = new Map<string, Array<Command>>();
        this.ConfigManagers = new Map<string, ConfigManager>();

        //all of these events are designed for internal use, please dont use them
        this.on("module_registered", (moduleInstance: Module, entry: any) => {
            if (typeof moduleInstance.onEnable === "function") {
                this.RegisteredCommands.set(moduleInstance.name, new Array<Command>());
                if (entry.config.useConfig) {
                    this.ConfigManagers.set(moduleInstance.name, new ConfigManager(moduleInstance.name, entry.path));
                }

                Logger.Info(`Enabled Module [${moduleInstance.name}] v${entry.config.version}`)
                moduleInstance.onEnable();
            }
        })

        this.on("module_removed", (moduleInstance: Module) => {
            if (typeof moduleInstance.onDisable === "function") {
                Logger.Info(`Disabled Module [${moduleInstance.name}]`)
                moduleInstance.onDisable();

                if (this.RegisteredCommands.has(moduleInstance.name)) {
                    this.RegisteredCommands.delete(moduleInstance.name);
                }
                if (this.ConfigManagers.has(moduleInstance.name)) {
                    this.ConfigManagers.delete(moduleInstance.name);
                }
            }
        })
    }

    public registerCommand(moduleInstance: Module, command: Command) {
        const registeredCommands: Array<Command> | undefined = this.RegisteredCommands.get(moduleInstance.name);

        if (registeredCommands != undefined) {

            registeredCommands.push(command);
            this.RegisteredCommands.set(moduleInstance.name, registeredCommands);
        }
    }

    public getCommand(name: string): Command | undefined {
        for (const commands of this.RegisteredCommands.values()) {
            for (const command of commands) {
                if (command.getName() === name) {
                    return command;
                }
            }
        }
        return undefined;
    }

    public getAllCommands(): Command[] {
        const result: Command[] = [];

        for (const commandList of this.RegisteredCommands.values()) {
            for (const command of commandList) {
                result.push(command);
            }
        }

        return result;
    }


    public getCommandsModuleName(command: Command): string {
        const commandName = command.getName();

        for (const [moduleName, commands] of this.RegisteredCommands) {
            for (const cmd of commands) {
                if (cmd.getName() === commandName) {
                    return moduleName;
                }
            }
        }

        return "";
    }


    public getModuleConfig(moduleInstance: Module): ConfigManager | undefined {
        const configManager: ConfigManager | undefined = this.ConfigManagers.get(moduleInstance.name);

        if (configManager == undefined) {
            Logger.Error(`Module [${moduleInstance.name}] does not have a valid config manager, likely because it was not registered with \"useConfig: true\"`);
        }

        return configManager;
    }
}