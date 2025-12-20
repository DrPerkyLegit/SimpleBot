import { Logger } from "./Logger";

export class ModuleLogger {
    public constructor(public moduleName: string) { }

    Error(...args: unknown[]): void {
        Logger.Error(`[${this.moduleName}] `, Logger.FormatArgs(...args))
    }

    Warning(...args: unknown[]): void {
        Logger.Warning(`[${this.moduleName}] `, Logger.FormatArgs(...args))
    }

    Info(...args: unknown[]): void {
        Logger.Info(`[${this.moduleName}] `, Logger.FormatArgs(...args))
    }
}