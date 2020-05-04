import Discord from "discord.js";
import { Command } from "its-not-commando";
import Brawl from "../../../game/events/Brawl";
import GameManager from "../../../game/GameManager";
import Program from "../../../Program";
import BrawlAcceptCommand from "./BrawlAcceptCommand";
import BrawlChallengeCommand from "./BrawlChallengeCommand";
import BrawlDeclineCommand from "./BrawlDeclineCommand";
import BrawlStartCommand from "./BrawlStartCommand";

export default class BrawlCommand extends Command {
    static getBrawlMessage(
        brawl: Brawl,
        client: Discord.Client,
        cancelled: boolean
    ) {
        let creatorPetName = GameManager.instance.users.getUser(brawl.creator)
            .pet?.name;
        let oppositionPetName = GameManager.instance.users.getUser(
            brawl.opposition
        ).pet?.name;
        let creatorUsername = client.users.get(brawl.creator)?.username;
        let oppositionUsername = client.users.get(brawl.opposition)?.username;
        let messageText =
            ":boxing_glove::boxing_glove::boxing_glove: **" +
            creatorPetName +
            " vs " +
            oppositionPetName +
            "** :boxing_glove::boxing_glove::boxing_glove:\n";
        messageText +=
            creatorUsername + "'s pet vs " + oppositionUsername + "'s pet\n";
        if (cancelled) {
            messageText += "**The brawl has been declined**\n";
        }
        if (!cancelled) {
            messageText += "**Bets:**\n```\n";
            messageText += brawl.bets.bets
                .map((b) => {
                    let otherUsername = client.users.get(b.result)?.username;
                    let username = client.users.get(b.userID)?.username;
                    return (
                        username +
                        " - ₩" +
                        b.amount +
                        " on " +
                        otherUsername +
                        "'s pet"
                    );
                })
                .join("\n");
            if (brawl.bets.bets.length === 0) {
                messageText += "No bets placed";
            }
            messageText += "\n```";
        }
        if (!cancelled) {
            messageText += "Use `p.bet brawl` to place bets";
        }
        if (!brawl.accepted && !cancelled) {
            messageText +=
                "\n\n" +
                oppositionUsername +
                " can either use `p.brawl accept` or `p.brawl decline`";
        }
        if (brawl.accepted && !cancelled) {
            messageText +=
                "\n\n" +
                creatorUsername +
                " can use `p.brawl start` to start the brawl!";
        }

        return messageText;
    }

    static async updateBrawlMessage(
        brawl: Brawl,
        client: Discord.Client,
        cancelled = false
    ) {
        let eventChannel = client.channels.get(
            Program.config.channels.events
        ) as Discord.TextChannel;
        let eventMsgID =
            Program.eventMsgCache.brawl[brawl.dateCreated.getTime()];
        if (eventMsgID === undefined) {
            eventMsgID = (await eventChannel.send(".")).id;
            Program.eventMsgCache.brawl[
                brawl.dateCreated.getTime()
            ] = eventMsgID;
        }
        let eventMsg = eventChannel.messages.get(eventMsgID)!;
        let content = BrawlCommand.getBrawlMessage(brawl, client, cancelled);
        eventMsg.edit(content);
    }

    constructor() {
        super({
            name: "brawl",
            group: "events",
            // aliases: [],
            usage: [],
            description: "Commands related to brawls",
            details:
                "Commands related to creating and participating in races.\n" +
                "Use `p.brawl challenge` to challenge someone to a brawl. They can either use " +
                "`p.brawl accept` or `p.brawl decline`. Once accepted, the creator of the brawl " +
                "can use `p.brawl start` to start the brawl.\n" +
                "Brawls are competitions between two pets. Only the strongest pet will win!",
            examples: [
                ["brawl challenge @Kevin", "Challenge Kevin to a brawl"],
                ["brawl accept @Bobby", "Accept Bobby's challenge request"],
                ["brawl decline @Bobby", "Decline Bobby's challenge request"],
                ["brawl start", "Start a brawl once accepted"],
            ],
            subcommands: [
                BrawlChallengeCommand,
                BrawlAcceptCommand,
                BrawlDeclineCommand,
                BrawlStartCommand,
            ],
        });
    }
}
