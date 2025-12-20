import fs from "fs";
import path from "path";

import { ConfigManager } from "./Managers/ConfigManager";
import { AccountManager } from "./Managers/AccountManager";
import { ModuleManager } from "./Managers/ModuleManager";
import { Logger } from "./Utils/Logger";

const ConfigManagerInstance = new ConfigManager(""); //no name for no module folder config
const ModuleManagerInstance = new ModuleManager();

let shuttingDown = false;

function shutdown(err?: unknown) {
    if (shuttingDown) return;
    shuttingDown = true;

    if (err) {
        Logger.Error("[Fatal] ", err);
    }

    ConfigManagerInstance.saveToFile();
    ModuleManagerInstance.emit("shutdown");
    process.exit(0);
}

process.on("SIGINT", () => shutdown());
process.on("SIGTERM", () => shutdown());
process.on("uncaughtException", err => shutdown(err));
process.on("unhandledRejection", err => shutdown(err));

const AccountManagerInstance = new AccountManager(ConfigManagerInstance, ModuleManagerInstance);
