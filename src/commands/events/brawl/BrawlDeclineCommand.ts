import {
    Client,
    CommandMessage,
    SubCommand,
    Validator,
} from "its-not-commando";
import GameManager from "../../../game/GameManager";
import BrawlCommand from "./BrawlCommand";

export default class BrawlDeclineCommand extends SubCommand {
    constructor() {
        super({
            name: "decline",
            // aliases: [],
            usage: [
                {
                    name: "user",
                    optional: true,
                    validator: Validator.User,
                },
            ],
            description: "Decline someone's brawl challenge",
            // details: "",
            // examples: []
        });
    }

    async run(
        msg: CommandMessage,
        args: string[],
        client: Client
    ): Promise<void> {
        let creatorID: string;
        if (args[0]) {
            let res = GameManager.instance.brawls.getBrawl(args[0]);
            if (res === null) {
                let username = client.users.get(args[0])?.username;
                msg.say(
                    "You do not have any brawl challenges from " + username
                );
                return;
            }
            if (res.opposition !== msg.author.id) {
                let creator = client.users.get(res.creator)?.username;
                let opposition = client.users.get(res.opposition)?.username;
                msg.say(
                    "Only " +
                        opposition +
                        " can respond to " +
                        creator +
                        "'s brawl challenge"
                );
                return;
            }
            creatorID = args[0];
        } else {
            let res = GameManager.instance.brawls.brawls.find(
                (b) => b.opposition === msg.author.id
            );
            if (res === undefined) {
                msg.say("You do not have any brawl challenges from anyone");
                return;
            }
            creatorID = res.creator;
        }
        if (GameManager.instance.brawls.getBrawl(creatorID)?.accepted) {
            let creator = GameManager.instance.brawls.getBrawl(creatorID)
                ?.creator;
            let creatorName = client.users.get(creator!)?.username;
            msg.say("You have already accepted to " + creatorName + "'s brawl");
            return;
        }
        let brawl = GameManager.instance.brawls.removeBrawl(creatorID);
        if (brawl === null) {
            msg.say("Failed to decline for some unknown reason");
            return;
        }
        let creator = client.users.get(creatorID)?.username;

        msg.say(
            "You have declined " +
                creator +
                "'s brawl request :x::boxing_glove:"
        );
        BrawlCommand.updateBrawlMessage(brawl, client, true);
    }
}
