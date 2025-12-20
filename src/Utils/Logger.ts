export class Logger {
    static FormatArgs(...args: unknown[]): string {
        return args.map(String).join("");
    }

    static FormatTime(): string {
        const d = new Date();

        const hh = String(d.getHours()).padStart(2, "0");
        const mm = String(d.getMinutes()).padStart(2, "0");
        const ss = String(d.getSeconds()).padStart(2, "0");

        return `[${hh}:${mm}:${ss}]`;
    }

    static Error(...args: unknown[]): void {
        console.log(Logger.FormatArgs(Logger.FormatTime(), " [Error] ", Logger.FormatArgs(...args)))
    }

    static Warning(...args: unknown[]): void {
        console.log(Logger.FormatArgs(Logger.FormatTime(), " [Warning] ", Logger.FormatArgs(...args)))
    }

    static Info(...args: unknown[]): void {
        console.log(Logger.FormatArgs(Logger.FormatTime(), " [Info] ", Logger.FormatArgs(...args)))
    }
}