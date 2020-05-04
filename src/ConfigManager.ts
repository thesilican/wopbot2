import fs from "fs";
import path from "path";

export type Config = {
    token: string;
    owner: string;
    prefix: string;
    guild: string;
    channels: {
        about: string;
        leaderboard: string;
        graveyard: string;
        events: string;
        general: string;
    };
    emojis: {
        leaderboard: {
            first: string;
            second: string;
            third: string;
        };
    };
    pauseTicks?: boolean;
};

export const defaultConfig: Config = {
    token: "TOKEN",
    owner: "OWNER_ID",
    prefix: "p.",
    guild: "GUILD_ID",
    channels: {
        about: "CHANNEL_ID",
        leaderboard: "CHANNEL_ID",
        graveyard: "CHANNEL_ID",
        events: "CHANNEL_ID",
        general: "CHANNEL_ID",
    },
    emojis: {
        leaderboard: {
            first: "wopbot-lb-first",
            second: "wopbot-lb-second",
            third: "wopbot-lb-third",
        },
    }
};

type ConfigLoadError =
    | "invalid syntax"
    | "file not found"
    | "error reading file";

export default class ConfigManager {
    static readonly CONFIG_FOLDER = "./";
    static readonly CONFIG_FILENAME = "config.json";

    static verify(obj: any): obj is Config {
        return (
            typeof obj === "object" &&
            typeof obj.token === "string" &&
            typeof obj.owner === "string" &&
            typeof obj.prefix === "string" &&
            typeof obj.guild === "string" &&
            typeof obj.channels === "object" &&
            typeof obj.channels.about === "string" &&
            typeof obj.channels.leaderboard === "string" &&
            typeof obj.channels.graveyard === "string" &&
            typeof obj.channels.events === "string" &&
            typeof obj.channels.general === "string" &&
            typeof obj.emojis === "object" &&
            typeof obj.emojis.leaderboard === "object" &&
            typeof obj.emojis.leaderboard.first === "string" &&
            typeof obj.emojis.leaderboard.second === "string" &&
            typeof obj.emojis.leaderboard.third === "string"
        );
    }

    static async load(): Promise<Config | ConfigLoadError> {
        return new Promise<Config | ConfigLoadError>((res) => {
            let filename = path.join(
                ConfigManager.CONFIG_FOLDER,
                ConfigManager.CONFIG_FILENAME
            );
            if (!fs.existsSync(filename)) {
                res("file not found");
            }
            fs.readFile(filename, (err, text) => {
                if (err !== null) {
                    return res("error reading file");
                }
                try {
                    let data = JSON.parse(text.toString("utf8"));
                    if (this.verify(data)) {
                        return res(data);
                    } else {
                        return res("invalid syntax");
                    }
                } catch {
                    return res("invalid syntax");
                }
            });
        });
    }

    static async writeDefault(): Promise<void> {
        let data = JSON.stringify(defaultConfig, undefined, 2);
        // Create folder first
        if (!fs.existsSync(ConfigManager.CONFIG_FOLDER)) {
            fs.mkdirSync(ConfigManager.CONFIG_FOLDER);
        }
        let filepath = path.join(
            ConfigManager.CONFIG_FOLDER,
            ConfigManager.CONFIG_FILENAME
        );
        fs.writeFileSync(filepath, data);
    }
}
