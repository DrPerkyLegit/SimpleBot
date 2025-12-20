import { ModuleAPI } from "../Managers/ModuleAPI";
import { ModuleManager } from "../Managers/ModuleManager";
import { ModuleLogger } from "../Utils/ModuleLogger";
import { Event } from "./Events/Event";

export abstract class Module {
    public Logger: ModuleLogger;

    public constructor(public name: string, public moduleAPI: ModuleAPI) {
        this.Logger = new ModuleLogger(name);
    }

    public abstract onEnable(): void;
    public abstract onDisable(): void;
    public abstract onEvent(event: Event): void;
}