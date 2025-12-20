//idk where to place this file

import EventEmitter from "events";
import { Module } from "../Types/Module";
import { Command } from "../Types/Command";
import { Logger } from "../Utils/Logger";

export class ModuleAPI extends EventEmitter {
    private RegisteredCommands: Map<string, Array<Command>>;

    public constructor() {
        super()

        this.RegisteredCommands = new Map<string, Array<Command>>();

        //all of these events are designed for internal use, please dont use them
        this.on("module_registered", (moduleInstance: Module, config: any) => {
            if (typeof moduleInstance.onEnable === "function") {
                this.RegisteredCommands.set(moduleInstance.name, new Array<Command>());
                

                Logger.Info(`Enabled Module [${moduleInstance.name}] v${config.version}`)
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



}