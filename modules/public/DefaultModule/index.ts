import { ModuleAPI } from "../../../src/Managers/ModuleAPI";
import { ModuleManager } from "../../../src/Managers/ModuleManager";
import { Event } from "../../../src/Types/Events/Event";
import { Module } from "../../../src/Types/Module";
import { HelpCommand } from "./commands/HelpCommand";

export class DefaultModule extends Module {
    public constructor(public name: string, public moduleAPI: ModuleAPI) {
        super(name, moduleAPI)
    }

    public onEnable(): void {
        this.moduleAPI.registerCommand(this, new HelpCommand(this.moduleAPI))
    }

    public onDisable(): void {
        
    }

    public onEvent(event: Event): void {

    }
    
}