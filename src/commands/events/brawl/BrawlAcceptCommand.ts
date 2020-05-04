import {
    Client,
    CommandMessage,
    SubCommand,
    Validator,
} from "its-not-commando";
import Brawl from "../../../game/events/Brawl";
import GameManager from "../../../game/GameManager";
import BrawlCommand from "./BrawlCommand";

export default class BrawlAcceptCommand extends SubCommand {
    constructor() {
        super({
            name: "accept",
            // aliases: [],
            usage: [
                {
                    name: "user",
                    optional: true,
                    validator: Validator.User,
                },
            ],
            description: "Accept someone's brawl challenge",
            // details: "",
            // examples: []
        });
    }

    async run(
        msg: CommandMessage,
        args: string[],
        client: Client
    ): Promise<void> {
        let brawl: Brawl;
        if (args[0]) {
            let res = GameManager.instance.brawls.getBrawl(args[0]);
            if (res === null) {
                let username = client.users.get(args[0])?.username;
                msg.say(
                    "You do not have any brawl challenges from " + username
                );
                return;
            }
            brawl = res;
        } else {
            let res = GameManager.instance.brawls.brawls.find(
                (b) => b.opposition === msg.author.id
            );
            if (res === undefined) {
                msg.say("You do not have any brawl challenges from anyone");
                return;
            }
            brawl = res;
        }
        let res = brawl.accept(msg.author.id);
        let creator = client.users.get(brawl.creator)?.username;
        if (res === "not opposition") {
            let creator = client.users.get(brawl.creator)?.username;
            let opposition = client.users.get(brawl.opposition)?.username;
            msg.say(
                "Only " +
                    opposition +
                    " can respond to " +
                    creator +
                    "'s brawl challenge"
            );
        }

        msg.say(
            "You have accepted " +
                creator +
                "'s brawl request :boxing_glove::boxing_glove::boxing_glove:"
        );
        BrawlCommand.updateBrawlMessage(brawl, client);
    }
}
