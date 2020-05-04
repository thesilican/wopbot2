import { RichEmbed, TextChannel } from "discord.js";
import { Client } from "its-not-commando";
// Command imports
// Admin
import AdminSaveCommand from "./commands/admin/AdminSaveCommand";
import AdminSetCommand from "./commands/admin/AdminSetCommand";
import AdminTickCommand from "./commands/admin/AdminTickCommand";
import AdminTransferCommand from "./commands/admin/AdminTransferCommand";
import BetCommand from "./commands/events/bets/BetCommand";
import BrawlCommand from "./commands/events/brawl/BrawlCommand";
// Events
import RaceCommand from "./commands/events/race/RaceCommand";
import CoronaCommand from "./commands/fun/CoronaCommand";
// Fun
import ParkCommand from "./commands/fun/ParkCommand";
import SlotsCommand from "./commands/fun/SlotsCommand";
// Money
import BalanceCommand from "./commands/money/BalanceCommand";
import DepositCommand from "./commands/money/DepositCommand";
import TransferCommand from "./commands/money/TransferCommand";
import WithdrawCommand from "./commands/money/WithdrawCommand";
import WorkCommand from "./commands/money/WorkCommand";
import FeedCommand from "./commands/pet/FeedCommand";
// Pets
import PetCommand from "./commands/pet/PetCommand";
import PlayCommand from "./commands/pet/PlayCommand";
import ReleaseCommand from "./commands/pet/ReleaseCommand";
import TrainCommand from "./commands/pet/TrainCommand";
import UpgradeCommand from "./commands/pet/UpgradeCommand";
// Shop
import BrowseCommand from "./commands/shop/BrowseCommand";
import BuyCommand from "./commands/shop/BuyCommand";
import InventoryCommand from "./commands/shop/InventoryCommand";
import ConfigManager, { Config } from "./ConfigManager";
// Other
import DatabaseManager from "./DatabaseManager";
import GameManager from "./game/GameManager";
import Logger from "./Logger";
import Util from "./Util";

type EventMsgCache = {
    race: {
        [date: number]: string;
    };
    brawl: {
        [date: number]: string;
    };
};

// Seems familiar hmm
export default class Program {
    static config: Config;
    static client: Client;
    static eventMsgCache: EventMsgCache;

    static async loadConfig(): Promise<boolean> {
        let res = await ConfigManager.load();
        if (typeof res === "string") {
            if (res === "file not found") {
                Logger.error(
                    "Could not find configuration file. Writing empty configuration file"
                );
                ConfigManager.writeDefault();
            } else if (res === "error reading file") {
                Logger.error(
                    "There was a problem reading the configuration file"
                );
            } else if (res === "invalid syntax") {
                Logger.error(
                    "There was a problem parsing the configuration file. Invalid syntax?"
                );
            }
            return false;
        }
        Program.config = res;
        Logger.log("Loaded configuration from file");
        return true;
    }

    static async loadDatabase(): Promise<boolean> {
        let res = await DatabaseManager.load();
        if (typeof res === "string") {
            if (res === "file not found") {
                Logger.error(
                    "Could not find database. Creating new game manager"
                );
                GameManager.instance;
                DatabaseManager.save();
                return true;
            } else if (res === "error reading file") {
                Logger.error("There was a problem reading the database");
            } else if (res === "invalid syntax") {
                Logger.error(
                    "There was a problem parsing the database. Invalid syntax?"
                );
            }
            return false;
        }
        Logger.log("Loaded database from file");
        return true;
    }

    static async tickTimer() {
        // Tick the game
        GameManager.instance.catchUpTicks();
        // Print leaderboard
        let channel = this.client.channels.get(
            this.config.channels.leaderboard
        );
        if (channel === undefined || !(channel instanceof TextChannel)) {
            Logger.error("Leaderboard channel could not be found!");
            return;
        }
        let message = (await (channel as TextChannel).fetchMessages())
            .filter((m) => m.editable)
            .last();
        if (!message) {
            message = await channel.send(".");
        }

        let leaderboard = GameManager.instance.leaderboard
            .getLeaderboard()
            .slice(0, 10);
        let lbEmoijs = Program.config.emojis.leaderboard;
        let guild = this.client.guilds.get(Program.config.guild)!;
        let content = leaderboard.map((l, i) => {
            let badge = "";
            if (i === 0) {
                let emoji = guild.emojis.find((e) => e.name === lbEmoijs.first);
                badge = emoji?.toString() + " ";
            } else if (i === 1) {
                let emoji = guild.emojis.find(
                    (e) => e.name === lbEmoijs.second
                );
                badge = emoji?.toString() + " ";
            } else if (i === 2) {
                let emoji = guild.emojis.find((e) => e.name === lbEmoijs.third);
                badge = emoji?.toString() + " ";
            } else {
                badge = "" + (i + 1) + ") ";
            }
            let username = this.client.users.get(l.userID)?.username;
            let name =
                badge + "**" + l.petName + "** " + "(" + username + "'s pet)";
            let daysOld = Math.round(
                (new Date().getTime() - l.dateBorn.getTime()) /
                    1000 /
                    60 /
                    60 /
                    24
            );
            let levels =
                "Level " +
                l.xpLevel +
                " [" +
                l.xp +
                "/" +
                l.xpThreshold +
                "] | " +
                Util.plural(daysOld, "day") +
                " old";
            return name + "\n" + levels + "\n";
        });

        let embed = new RichEmbed()
            .setTitle("Pet Leaderboard")
            .setDescription(content.join("\n"))
            .setFooter("Last Updated")
            .setTimestamp();

        message.edit("", embed);
    }

    static async main() {
        if (!(await Program.loadConfig())) {
            return;
        }
        if (!(await Program.loadDatabase())) {
            return;
        }
        DatabaseManager.autoSave();

        Program.client = new Client({
            owner: this.config.owner,
            prefix: this.config.prefix,
            token: this.config.token,
            logger: Logger,
            validator: (msg) => {
                // Allow certain commands
                const allowedCommands = [
                    "help",
                    "shutdown",
                    "admin-save",
                    "save",
                    "admin-set",
                    "set-var",
                    "admin-transfer",
                    "admin-tick",
                    "tick",
                ];
                for (const command of allowedCommands) {
                    if (msg.content.includes(this.config.prefix + command)) {
                        return true;
                    }
                }
                // Allow channels
                if (msg.channel.id === this.config.channels.general) {
                    return true;
                }
                msg.channel.send(
                    "Commands may only be used in <#" +
                        this.config.channels.general +
                        ">"
                );
                return false;
            },
        });

        Program.client.registry.registerGroups([
            {
                name: "pet",
                description: "Commands related to taking care of your pet",
            },
            {
                name: "money",
                description: "Commands related to banking and money",
            },
            {
                name: "shop",
                description:
                    "Commands for browsing and buying from the shop, as well as inventory",
            },
            {
                name: "fun",
                description: "Miscellaneous commands, just for fun",
            },
            {
                name: "events",
                description: "Commands for events like races and brawls",
            },
            {
                name: "admin",
                description: "Commands only for the admin hehe",
            },
        ]);

        Program.client.registry.registerCommands([
            // Pets
            PetCommand,
            FeedCommand,
            PlayCommand,
            TrainCommand,
            ReleaseCommand,
            UpgradeCommand,
            // Money
            BalanceCommand,
            DepositCommand,
            WithdrawCommand,
            TransferCommand,
            WorkCommand,
            // Shop
            InventoryCommand,
            BrowseCommand,
            BuyCommand,
            // Fun
            ParkCommand,
            SlotsCommand,
            CoronaCommand,
            // Events
            RaceCommand,
            BrawlCommand,
            BetCommand,
            // BrawlCommand,
            // BetCommand,
            // Admin
            AdminSaveCommand,
            AdminSetCommand,
            AdminTransferCommand,
            AdminTickCommand,
        ]);

        await Program.client.start();

        // Message cache
        Program.eventMsgCache = {
            race: {},
            brawl: {},
        };
        // Start tick/leaderboard timer
        setTimeout(this.tickTimer.bind(this), 1000);
        setInterval(this.tickTimer.bind(this), 10 * 60 * 1000);
    }
}
