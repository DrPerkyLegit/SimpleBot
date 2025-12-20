import fs from "fs";
import path from "path";

import { Logger } from "../Utils/Logger"

export class ConfigManager {
    private LoadedConfig: any;

    constructor(public moduleName: string) {
        this.loadFromFile();
    }

    getValue(key: string, defaultValue: any): any {
        const foundValue = this.LoadedConfig[key];

        if (foundValue != undefined && foundValue != null) {
            return foundValue
        }

        return defaultValue;
    }

    setValue(key: string, value: any): void {
        this.LoadedConfig[key] = value;
        this.saveToFile()
    }

    saveToFile() {
        try {
            fs.writeFileSync(path.join(__dirname, "../../", "resources", this.moduleName, "config.json"), JSON.stringify(this.LoadedConfig, null, 2), "utf8")
        } catch (exception) {
            Logger.Warning("Unable To Save Config To File: ", exception)
        }
    }

    loadFromFile() {
        try {
            var fileContents = fs.readFileSync(path.join(__dirname, "../../", "resources", this.moduleName, "config.json"), "utf8")
            this.LoadedConfig = JSON.parse(fileContents);
        } catch (exception) {
            Logger.Error("Unable To Load Config From File: ", exception)
        }
    }
}