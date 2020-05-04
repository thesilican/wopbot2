import {
    Client,
    CommandMessage,
    SubCommand,
    Validator,
} from "its-not-commando";
import GameManager from "../../../game/GameManager";
import Util from "../../../Util";
import BrawlCommand from "./BrawlCommand";

export default class BrawlChallengeCommand extends SubCommand {
    constructor() {
        super({
            name: "challenge",
            aliases: ["create"],
            usage: [
                {
                    name: "user",
                    validator: Validator.User,
                },
            ],
            description: "Challenge a user to a brawl",
            // examples: []
        });
    }

    async run(
        msg: CommandMessage,
        args: string[],
        client: Client
    ): Promise<void> {
        let res = GameManager.instance.brawls.createBrawl(
            msg.author.id,
            args[0]
        );
        if (res === "has no pet") {
            msg.say(
                msg.author.username +
                    ", you don't have a pet! Buy a pet capsule from the shop to get started"
            );
            return;
        }
        if (res === "pet on cooldown") {
            let pet = GameManager.instance.users.getUser(msg.author.id).pet!;
            let timespan = Math.round(
                (pet.cooldowns.brawl.cooldown * GameManager.TICK_SPAN) / 1000
            );
            msg.say(
                msg.author.username +
                    ", you can make another brawl in " +
                    Util.formatTime(timespan)
            );
            return;
        }
        if (res === "already in brawl") {
            msg.say(
                msg.author.username +
                    ", you are already hosting a brawl, or are being challenged to a brawl by someone else"
            );
            return;
        }
        if (res === "cannot challenge self") {
            msg.say("You cannot fight yourself in a brawl!");
            return;
        }

        let otherUser = client.users.get(args[0])?.username;
        msg.channel.send(
            msg.author.username +
                " has challenged " +
                otherUser +
                " to a brawl " +
                ":boxing_glove::boxing_glove::boxing_glove:\n" +
                "They must use `p.brawl accept` or `p.brawl decline`\nMay the strongest pet triumph"
        );
        BrawlCommand.updateBrawlMessage(res, client);
    }
}
