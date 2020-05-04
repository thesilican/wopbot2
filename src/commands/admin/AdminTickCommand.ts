import { Client, Command, CommandMessage, Validator } from "its-not-commando";
import GameManager from "../../game/GameManager";
import Util from "../../Util";

export default class AdminTickCommand extends Command {
    constructor() {
        super({
            name: "admin-tick",
            group: "admin",
            aliases: ["tick"],
            usage: [
                {
                    name: "amount",
                    optional: true,
                    defaultValue: "1",
                    validator: Validator.Integer,
                },
            ],
            description: "Manually tick the game",
            // details: "",
            // examples:[]
            ownerOnly: true,
        });
    }

    async run(
        msg: CommandMessage,
        args: string[],
        client: Client
    ): Promise<void> {
        let amount = parseInt(args[0], 10);
        for (let i = 0; i < amount; i++) {
            GameManager.instance.tick();
        }
        msg.say("Successfully ticked the game " + Util.plural(amount, "time"));
    }
}
