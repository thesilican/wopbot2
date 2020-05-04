import { Client, Command, CommandMessage } from "its-not-commando";
import DatabaseManager from "../../DatabaseManager";

export default class AdminSaveCommand extends Command {
    constructor() {
        super({
            name: "admin-save",
            group: "admin",
            aliases: ["save"],
            // usage: [],
            description: "Save the game to database",
            // details: "",
            // examples:[]
            ownerOnly: true,
            dmAllowed: true,
        });
    }

    async run(
        msg: CommandMessage,
        args: string[],
        client: Client
    ): Promise<void> {
        await DatabaseManager.save();
        msg.say("Saved game to database");
    }
}
