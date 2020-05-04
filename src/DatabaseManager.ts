import fs from "fs";
import path from "path";
import GameManager from "./game/GameManager";
import Logger from "./Logger";

type DatabaseLoadError =
    | "invalid syntax"
    | "file not found"
    | "error reading file";

export default class DatabaseManager {
    // 30 min
    static readonly AUTOSAVE_INTERVAL = 30 * 60 * 1000;
    static readonly DATABASE_PATH = "./";
    static readonly DATABASE_FILENAME = "database.json";
    private static autoSaveTimer: NodeJS.Timeout | null = null;

    static async load() {
        return new Promise<boolean | DatabaseLoadError>((res) => {
            let file = path.join(
                DatabaseManager.DATABASE_PATH,
                DatabaseManager.DATABASE_FILENAME
            );
            if (!fs.existsSync(file)) {
                res("file not found");
            }
            fs.readFile(file, (err, text) => {
                if (err !== null) {
                    return res("error reading file");
                }
                try {
                    let data = JSON.parse(text.toString("utf8"));
                    GameManager.load(data);
                    res(true);
                } catch {
                    return res("invalid syntax");
                }
            });
        });
    }

    static async save() {
        let obj = GameManager.instance.serialize();
        let text = JSON.stringify(obj, undefined, 2);
        let file = path.join(
            DatabaseManager.DATABASE_PATH,
            DatabaseManager.DATABASE_FILENAME
        );
        if (!fs.existsSync(DatabaseManager.DATABASE_PATH)) {
            fs.mkdirSync(DatabaseManager.DATABASE_PATH);
        }
        fs.writeFile(file, text, () => {
            Logger.debug(
                "Saved " + DatabaseManager.DATABASE_FILENAME + " to file"
            );
        });
    }

    static autoSave(on = true) {
        if (on) {
            Logger.log("Database autosave is now on");
            DatabaseManager.autoSaveTimer = setInterval(
                DatabaseManager.save,
                DatabaseManager.AUTOSAVE_INTERVAL
            );
        } else {
            Logger.log("Database autosave is now off");
            if (DatabaseManager.autoSaveTimer !== null) {
                clearInterval(DatabaseManager.autoSaveTimer);
            }
            DatabaseManager.autoSaveTimer = null;
        }
    }
}
