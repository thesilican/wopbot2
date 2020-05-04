import Discord from "discord.js";
import { Client, CommandMessage, SubCommand } from "its-not-commando";
import Brawl from "../../../game/events/Brawl";
import GameManager from "../../../game/GameManager";
import Program from "../../../Program";
import resources from "../../../resources.json";
import Util from "../../../Util";

const faces = {
    idle: [":grinning:", ":slight_smile:"],
    attacking: [":smiling_imp:", ":smirk:", ":thinking:"],
    hit: [":disappointed:", ":confounded:", ":weary:"],
    tired: [":sleeping:"],
    victorious: [":yum:"],
    defeated: [":confounded:"],
    dead: [":skull:"],
};
const logPhrases = {
    tired: ["{0} is out of energy"],
    bodyPart: [
        "back",
        "ear",
        "face",
        "head",
        "belly",
        "back",
        "elbow",
        "face",
        "nose",
    ],
    action: [
        "{0} hits {1} in the {b}",
        "{0} punches {1} in the {b}",
        "{0} spits at {1}'s {b}",
        "{0} punches {1} in the {b}",
        "{0} jabs {1}'s {b}",
        "{0} violently smacks {1}'s {b}",
        "{0} whiplashes {1} with their tail",
        "{0} bites {1}'s {b}",
    ],
};
const bar = "=========================";
const space = "\u200e \u200e";
const BRAWL_STEP_TIME = 5;

export default class BrawlStartCommand extends SubCommand {
    constructor() {
        super({
            name: "start",
            // aliases: [],
            // usage: [],
            description: "Start a brawl once the opponent has accepted",
            // details: "",
            // examples:[]
        });
    }

    async run(
        msg: CommandMessage,
        args: string[],
        client: Client
    ): Promise<void> {
        let brawl = GameManager.instance.brawls.getBrawl(msg.author.id);
        if (brawl === null) {
            msg.say("You are not hosting any brawls");
            return;
        }

        let res = brawl.start(msg.author.id);
        if (res === "not yet accepted") {
            let username = client.users.get(brawl.opposition)?.username;
            msg.say(username + " must accept the brawl before you start");
            return;
        }
        if (res === "already started") {
            msg.say("The brawl has already started");
            return;
        }
        if (res === "not creator") {
            msg.say("Only the creator can start the brawl");
            return;
        }
        // Payouts and finish
        brawl.payout();
        GameManager.instance.brawls.removeBrawl(brawl.creator);

        msg.say(
            "The brawl has started! Watch it live at <#" +
                Program.config.channels.events +
                ">"
        );

        let eventMsgID =
            Program.eventMsgCache.brawl[brawl.dateCreated.getTime()];
        let eventChannel = client.channels.get(
            Program.config.channels.events
        ) as Discord.TextChannel;
        // Delete original message
        let oldMsg = eventChannel.messages.get(eventMsgID)!;
        oldMsg.delete();
        let eventMsg = CommandMessage.create(await eventChannel.send("\u2800"));
        let resMsg = await eventChannel.send("\u2800");
        let betMsg = await eventChannel.send("\u2800");

        // Rewatch loop
        await this.replayBrawl(brawl, eventMsg, resMsg, betMsg);
        eventMsg.createMenu(
            ["🔄"],
            async (reaction, msg) => {
                await reaction.removeAll();
                await this.replayBrawl(brawl!, eventMsg, resMsg, betMsg);
                await msg.react("🔄");
                return true;
            },
            { seconds: 3 * 24 * 60 * 60 }
        );
    }

    async replayBrawl(
        brawl: Brawl,
        msg: Discord.Message,
        resMsg: Discord.Message,
        betMsg: Discord.Message
    ) {
        await Promise.all([
            resMsg.suppressEmbeds(true),
            betMsg.suppressEmbeds(true),
            msg.clearReactions(),
        ]);
        let messageText: string;

        // Main brawl loop
        for (let i = 0; i < brawl.history.length; i++) {
            messageText = this.getBrawlMessage(brawl, i, msg.client, false);
            msg.edit(messageText);
            await Util.sleep(BRAWL_STEP_TIME * 1000);
        }

        messageText = this.getBrawlMessage(
            brawl,
            brawl.history.length - 1,
            msg.client,
            true
        );
        msg.edit(messageText);
        await resMsg.suppressEmbeds(false);
        resMsg.edit(this.getResultEmbed(brawl, msg.client));
        await betMsg.suppressEmbeds(false);
        betMsg.edit(this.getBetEmbed(brawl, msg.client));
    }

    getBrawlMessage(
        brawl: Brawl,
        step: number,
        client: Discord.Client,
        finished: boolean
    ) {
        let creatorName = GameManager.instance.users.getUser(brawl.creator).pet!
            .name;
        let oppositionName = GameManager.instance.users.getUser(
            brawl.opposition
        ).pet!.name;
        let snapshot = brawl.history[step];

        let content =
            ":boxing_glove::boxing_glove::boxing_glove: **" +
            creatorName +
            " vs " +
            oppositionName +
            "** :boxing_glove::boxing_glove::boxing_glove:\n";
        content += "Time: " + step * BRAWL_STEP_TIME + "s\n";
        content += bar + "\n";
        if (snapshot.action.includes("attack")) {
            let s =
                snapshot.attacker === "creator"
                    ? Util.randBetween(18, 21)
                    : Util.randBetween(4, 9);
            content += "`" + space.repeat(s);
            content += "-" + snapshot.damage.toString().padEnd(3, space);
            content += space.repeat(25 - s);
            content += "`\n";
        } else {
            content += "`" + space.repeat(28) + "`\n";
        }

        // Creator face
        const getFace = (player: "creator" | "opposition") => {
            const getFinishFace = () => {
                if (
                    brawl.history[brawl.history.length - 1][player].health === 0
                ) {
                    return Util.randChoose(faces.dead);
                } else if (brawl.standings!.victor === player) {
                    return Util.randChoose(faces.victorious);
                } else {
                    return Util.randChoose(faces.defeated);
                }
            };
            if (finished) {
                return getFinishFace();
            } else if (snapshot[player].health === 0) {
                return Util.randChoose(faces.dead);
            } else if (snapshot[player].energy === 0) {
                return Util.randChoose(faces.tired);
            } else if (snapshot.attacker === player) {
                if (
                    snapshot.action.includes("attack") ||
                    snapshot.action.includes("cripple")
                ) {
                    return Util.randChoose(faces.attacking);
                } else if (snapshot.action === "no energy") {
                    return Util.randChoose(faces.tired);
                } else if (snapshot.action === "nothing") {
                    return Util.randChoose(faces.idle);
                } else {
                    // snapshot.action = finish
                    return getFinishFace();
                }
            } else {
                if (
                    snapshot.action.includes("attack") ||
                    snapshot.action.includes("cripple")
                ) {
                    return Util.randChoose(faces.hit);
                } else if (snapshot.action === "nothing") {
                    return Util.randChoose(faces.idle);
                } else if (snapshot.action === "no energy") {
                    return Util.randChoose(faces.idle);
                } else {
                    // snapshot.action = finish
                    return getFinishFace();
                }
            }
        };
        let creatorFace = getFace("creator");
        let oppositionFace = getFace("opposition");
        content += "`" + space.repeat(6) + "`" + creatorFace;
        if (
            snapshot.action === "attack" ||
            snapshot.action === "attack-cripple"
        ) {
            if (snapshot.attacker === "creator") {
                content += "`" + space.repeat(6) + "`:boom:";
            } else {
                content += ":boom:`" + space.repeat(6) + "`";
            }
        } else if (snapshot.action === "cripple") {
            if (snapshot.attacker === "creator") {
                content += "`" + space.repeat(6) + "`:sparkles:";
            } else {
                content += ":sparkles:`" + space.repeat(6) + "`";
            }
        } else {
            content += "`" + space.repeat(9) + "`";
        }
        content += oppositionFace + "`" + space.repeat(6) + "`\n";

        content += "`" + space.repeat(28) + "`\n";

        content += bar + "\n";

        const padEnd = (str: string, num: number) => {
            let len = [...str.replace("\u200e", "")].length;
            return str + space.repeat(num - len);
        };

        content +=
            "`" +
            space.repeat(7) +
            padEnd(creatorName.slice(0, 10), 10) +
            space;
        content += padEnd(oppositionName.slice(0, 10), 10) + "`\n";
        content +=
            "`HP" +
            space.repeat(5) +
            padEnd(snapshot.creator.health.toString(), 10) +
            space;
        content += padEnd(snapshot.opposition.health.toString(), 10) + "`\n";
        content +=
            "`Energy" +
            space +
            padEnd(snapshot.creator.energy.toString(), 10) +
            space;
        content += padEnd(snapshot.opposition.energy.toString(), 10) + "`\n";

        // Brawl logs
        let attackerName =
            GameManager.instance.users.getUser(brawl[snapshot.attacker]).pet
                ?.name ?? "undefined";
        let defenderName =
            GameManager.instance.users.getUser(
                brawl[
                    snapshot.attacker === "creator" ? "opposition" : "creator"
                ]
            ).pet?.name ?? "undefined";
        content += "\n\n";
        if (snapshot.action === "nothing") {
            content += "\u2800\n";
        } else if (
            snapshot.action.includes("attack") ||
            snapshot.action.includes("cripple")
        ) {
            let action = Util.randChoose(logPhrases.action)
                .replace("{b}", Util.randChoose(logPhrases.bodyPart))
                .replace("{0}", attackerName)
                .replace("{1}", defenderName);
            if (snapshot.action === "attack") {
                content +=
                    action + ", dealing " + snapshot.damage + " damage\n";
            } else if (snapshot.action === "cripple") {
                content += action + ", stunning them temporarily\n";
            } else if (snapshot.action === "attack-cripple") {
                content +=
                    action +
                    ", dealing " +
                    snapshot.damage +
                    " damage and stunning them temporarily\n";
            }
        } else if (snapshot.action === "no energy") {
            content +=
                Util.randChoose(logPhrases.tired).replace("{0}", attackerName) +
                "\n";
        } else if (snapshot.action === "finish-turns") {
            content += "The time limit has been reached\n";
        } else if (snapshot.action === "finish-energy") {
            content += "Both pets have run out of energy\n";
        } else if (snapshot.action === "finish-att-dead") {
            content += attackerName + " has died!";
        } else if (snapshot.action === "finish-def-dead") {
            content += defenderName + " has died!";
        }

        if (finished) {
            let victorName =
                brawl.standings!.victor === "creator"
                    ? creatorName
                    : oppositionName;
            content += "\n" + victorName + " wins!\n";
            content += "Press :arrows_counterclockwise: to rewatch the event";
        }
        return content;
    }

    getResultEmbed(brawl: Brawl, client: Discord.Client) {
        let creatorPet = GameManager.instance.users.getUser(brawl.creator).pet!;
        let oppositionPet = GameManager.instance.users.getUser(brawl.opposition)
            .pet!;
        let creatorUsername = client.users.get(brawl.creator)?.username;
        let oppositionUserName = client.users.get(brawl.opposition)?.username;
        let victorPet =
            brawl.standings!.victor === "creator" ? creatorPet : oppositionPet;
        let lastSnapshot = brawl.history[brawl.history.length - 1];

        let content =
            "Prize: ₩" +
            brawl.payouts.prizes[0].money +
            ", " +
            brawl.payouts.prizes[0].xp +
            "XP\n\n";
        content += "**" + creatorPet.name + "**";
        if (brawl.standings!.victor === "creator") {
            content += " :trophy:";
        }
        content += "\n*" + creatorUsername + "'s pet*\n";
        if (lastSnapshot.creator.health > 0) {
            content += ":heart: ";
        } else {
            content += ":skull: ";
        }
        content +=
            " Health: " +
            lastSnapshot.creator.health +
            "% :zap: Energy: " +
            lastSnapshot.creator.energy;

        content += "\n\n";

        content += "**" + oppositionPet.name + "**";
        if (brawl.standings!.victor === "opposition") {
            content += " :trophy:";
        }
        content += "\n*" + oppositionUserName + "'s pet*\n";
        if (lastSnapshot.opposition.health > 0) {
            content += ":heart: ";
        } else {
            content += ":skull: ";
        }
        content +=
            " Health: " +
            lastSnapshot.opposition.health +
            "% :zap: Energy: " +
            lastSnapshot.opposition.energy;

        let embed = new Discord.RichEmbed()
            .setAuthor(
                "Brawl Results",
                "https://mrsiliconguy.github.io/HTML-Code/WopBot2.1/assets/trophy.png"
            )
            .setTitle(victorPet.name + " has won!")
            .setColor("RED")
            .setDescription(content)
            .setThumbnail(
                resources.img.url_base +
                    resources.img.pet[victorPet.rarity][victorPet.type].alive
            );
        // .setTimestamp()
        return embed;
    }

    getBetEmbed(brawl: Brawl, client: Discord.Client) {
        let bets = brawl.payouts.bets;
        let betText = "";
        for (const bet of bets) {
            let username = client.users.get(bet.userID);
            let amount = bet.amount;
            betText += "**" + username + "** - ₩" + amount + " \n\n";
        }
        if (betText === "") {
            betText = "(No bets made)";
        }

        let betEmbed = new Discord.RichEmbed()
            .setColor("BLUE")
            .setTitle("Bets:")
            .setDescription(betText);

        return betEmbed;
    }
}
