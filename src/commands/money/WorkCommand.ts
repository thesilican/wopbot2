import { Client, Command, CommandMessage } from "its-not-commando";
import GameManager from "../../game/GameManager";
import Util from "../../Util";

export default class WorkCommand extends Command {
    constructor() {
        super({
            name: "work",
            group: "money",
            aliases: ["w"],
            // usage: [],
            description: "Earn some cash by working",
            details:
                "Earn some cash by working. You can work once every 24 hours",
        });
    }

    async run(
        msg: CommandMessage,
        args: string[],
        client: Client
    ): Promise<void> {
        let user = GameManager.instance.users.getUser(msg.author.id);

        let result = user.job.work(user.wallet);

        if (result === "work not reset") {
            let timespan = Math.round(
                (user.job.workCooldown * GameManager.TICK_SPAN) / 1000
            );
            msg.say("You can work in " + Util.formatTime(timespan));
            return;
        }

        msg.say("You have earned ₩" + result);
    }
}
