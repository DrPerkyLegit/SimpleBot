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
        const configPath = path.join(__dirname, "../../", "resources", this.moduleName, "config.json");

        if (!fs.existsSync(configPath)) {
            Logger.Warning(`Config File Not Found For Module: ${this.moduleName}, Attempting To Create New One`);

            const defaultCondigPath = path.join(__dirname, "../../", "resources", this.moduleName, "default_config.json");
            if (!fs.existsSync(defaultCondigPath)) {
                Logger.Error(`Default Config File Not Found For Module: ${this.moduleName}, Unable To Create New One`);
                this.LoadedConfig = {}
                return;
            }
            this.LoadedConfig = JSON.parse(fs.readFileSync(defaultCondigPath, "utf8"))
            this.saveToFile()
            return;
        }

        try {
            var fileContents = fs.readFileSync(configPath, "utf8")
            this.LoadedConfig = JSON.parse(fileContents);
        } catch (exception) {
            Logger.Error("Unable To Load Config From File: ", exception)
        }
    }
}