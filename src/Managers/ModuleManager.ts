import fs from "fs";
import path from "path";
import { Logger } from "../Utils/Logger";
import EventEmitter from "events";
import { Module } from "../Types/Module";
import { pathToFileURL } from "url";
import { Command } from "../Types/Command";
import { ModuleAPI } from "./ModuleAPI";
import { Event } from "../Types/Events/Event";


export class ModuleManager extends EventEmitter {

    private AvailableModules: Map<string, any>;
    private EnabledModules: Array<Module>;

    private ModuleAPIInstance: ModuleAPI;

    constructor() {
        super();

        this.AvailableModules = new Map<string, any>();
        this.EnabledModules = new Array<Module>();

        this.ModuleAPIInstance = new ModuleAPI();

        const modulesPath = path.join(__dirname, "../../", "modules");

        const publicModulesPath = path.join(modulesPath, "public")
        const privateModulesPath = path.join(modulesPath, "private")

        const addModule = (module: any) => {
            this.AvailableModules.set(module.name, {
                path: module.path,
                config: module.config
            })
        }
        
        this.findAllModules(publicModulesPath).forEach(addModule)
        this.findAllModules(privateModulesPath).forEach(addModule)

        this.once("ready", (modules: Set<string>) => {
            this.AvailableModules.forEach(async (value, key) => {
                if (modules.has(key)) {
                    //this whole try catch area was made by copilots raptor mini model (i gave up)
                    try {
                        // Prefer the compiled .js file at runtime; fall back to .ts when running under ts-node
                        const indexJs = path.join(value.path, "index.js");
                        const indexTs = path.join(value.path, "index.ts");
                        const target = fs.existsSync(indexJs) ? indexJs : indexTs;

                        const moduleImport = await import(pathToFileURL(target).href);

                        // Try default export first, then a named export matching the module folder name,
                        // then fall back to the first exported constructor function we find
                        let LoadedModuleClass: { new(name: string, moduleAPI: ModuleAPI): Module } | null = null;

                        if (typeof moduleImport.default === "function") {
                            LoadedModuleClass = moduleImport.default as any;
                        } else if (typeof moduleImport[key] === "function") {
                            LoadedModuleClass = moduleImport[key] as any;
                        } else {
                            for (const v of Object.values(moduleImport)) {
                                if (typeof v === "function") {
                                    LoadedModuleClass = v as any;
                                    break;
                                }
                            }
                        }

                        if (!LoadedModuleClass) throw new TypeError("Module did not export a constructor");

                        const LoadedModuleInstance = new LoadedModuleClass(key, this.getModuleAPI());

                        this.ModuleAPIInstance.emit("module_registered", LoadedModuleInstance, value.config) //this line was made by me

                        this.EnabledModules.push(LoadedModuleInstance)

                    } catch (err) {
                        Logger.Error("Unable To Load Module \"", key, "\" Cause Of Error: ", err)
                    }
                }
            })
        })

        this.on("custom_event", (event: Event) => {
            this.EnabledModules.forEach((module) => {
                module.onEvent(event);
            })
        })

        this.on("shutdown", () => {
            this.EnabledModules.forEach((module: Module) => {
                this.ModuleAPIInstance.emit("module_removed", module)
            })

            this.ModuleAPIInstance.emit("shutdown")
        })

    }

    public getModuleAPI(): ModuleAPI {
        return this.ModuleAPIInstance;
    }

    public IsValidModule(name: string): boolean {
        return this.AvailableModules.has(name)
    }

    private findAllModules(modulesPath: string): any[] {
        if (fs.existsSync(modulesPath) === false) return []; //fix for missing folder

        return fs.readdirSync(modulesPath, { withFileTypes: true })
        .filter(e => e.isDirectory())
        .map(e => {
            const moduleFile = path.join(modulesPath, e.name, "module.json");
            if (!fs.existsSync(moduleFile)) return null;

            const text = fs.readFileSync(moduleFile, "utf8");
            const config = JSON.parse(text);

            return {
                name: e.name,
                path: path.join(modulesPath, e.name),
                config
            };
        })
        .filter(Boolean);
    }
}