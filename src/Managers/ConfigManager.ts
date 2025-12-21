import fs from "fs";
import path from "path";

import { Logger } from "../Utils/Logger"
import Module from "module";

export class ConfigManager {
    private LoadedConfig: any;

    constructor(public moduleName: string, public modulePath: string) {
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
            let resourcesPath = path.join(__dirname, "../../", "resources", this.moduleName);
            if (!fs.existsSync(resourcesPath)) {
                fs.mkdirSync(resourcesPath);
            }

            fs.writeFileSync(path.join(resourcesPath, "config.json"), JSON.stringify(this.LoadedConfig, null, 2), "utf8")
        } catch (exception) {
            Logger.Warning("Unable To Save Config To File: ", exception)
        }
    }

    loadFromFile() {
        const configPath = path.join(__dirname, "../../", "resources", this.moduleName, "config.json");

        if (!fs.existsSync(configPath)) {
            Logger.Warning(`Config File Not Found For Module: ${this.moduleName}, Attempting To Create New One`);

            let defaultConfigPath = path.join(__dirname, "../../", "resources", "default_config.json");

            if (this.moduleName.length > 0) {
                defaultConfigPath = path.join(this.modulePath, "resources", "default_config.json");
            }

            if (!fs.existsSync(defaultConfigPath)) {
                Logger.Error(`Default Config File Not Found For Module: ${this.moduleName}, Unable To Create New One`);
                this.LoadedConfig = {}
                return;
            }
            this.LoadedConfig = JSON.parse(fs.readFileSync(defaultConfigPath, "utf8"))
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