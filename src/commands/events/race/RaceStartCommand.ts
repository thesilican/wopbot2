import Discord, { RichEmbed, TextChannel } from "discord.js";
import { Client, CommandMessage, SubCommand } from "its-not-commando";
import Race from "../../../game/events/Race";
import GameManager from "../../../game/GameManager";
import Program from "../../../Program";
import resources from "../../../resources.json";
import Util from "../../../Util";

const header =
    ":checkered_flag::checkered_flag::checkered_flag: " +
    "**{0}'s Race**" +
    " :checkered_flag::checkered_flag::checkered_flag:";
const bar = "`=====================================`";
const pets = [
    ":grinning:",
    ":smiley:",
    ":smile:",
    ":slight_smile:",
    ":smiley_cat:",
    ":smiley_cat:",
    ":smirk_cat:",
    ":smile_cat:",
    ":jack_o_lantern:",
];
const placeDict: { [place: number]: string } = {
    0: ":first_place:",
    1: ":second_place:",
    2: ":third_place:",
    3: ":four:",
    4: ":five:",
    5: ":six:",
    6: ":seven:",
    7: ":eight:",
    8: ":nine:",
    9: ":keycap_ten:",
};
const RACE_STEP_TIME = 5;

export default class RaceStartCommand extends SubCommand {
    constructor() {
        super({
            name: "start",
            // aliases: [],
            // usage: [],
            description: "Start a race",
            details: "Start the race that you host",
            // examples:[]
        });
    }

    async run(
        msg: CommandMessage,
        args: string[],
        client: Client
    ): Promise<void> {
        let user = GameManager.instance.users.getUser(msg.author.id);
        let race = GameManager.instance.races.getRace(msg.author.id);

        if (race === null) {
            msg.say(
                "You are not the host of any races. Only the host can start a race"
            );
            return;
        }

        let res = race.start(msg.author.id);
        if (res === "already started") {
            msg.say("The race has already started");
            return;
        }
        if (res === "invalid num participants") {
            msg.say(
                "A race must have between " +
                    Race.MIN_PARTICIPANTS +
                    "-" +
                    Race.MAX_PARTICIPANTS +
                    " participants (Currently " +
                    race.participants.length +
                    ")"
            );
            return;
        }
        if (res === "not creator") {
            msg.say(
                "You are not the host of any races. Only the host can start a race"
            );
            return;
        }

        // Payouts and finish
        race.payout();
        GameManager.instance.races.removeRace(race.creator);

        msg.say(
            "The race has started! Watch it live at <#" +
                Program.config.channels.events +
                ">"
        );

        let eventMsgID = Program.eventMsgCache.race[race.dateCreated.getTime()];
        let eventChannel = client.channels.get(
            Program.config.channels.events
        ) as TextChannel;
        // Delete original message
        eventChannel.messages.get(eventMsgID)?.delete();
        let eventMsg = CommandMessage.create(await eventChannel.send("\u2800"));
        let resMsg = await eventChannel.send("\u2800");
        let betMsg = await eventChannel.send("\u2800");

        // Rewatch loop
        await this.replayRace(race, eventMsg, resMsg, betMsg);
        eventMsg.createMenu(
            ["🔄"],
            async (reaction, msg) => {
                await reaction.removeAll();
                await this.replayRace(race!, eventMsg, resMsg, betMsg);
                await msg.react("🔄");
                return true;
            },
            { seconds: 3 * 24 * 60 * 60 }
        );
    }

    async replayRace(
        race: Race,
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

        // Main race loop
        for (let i = 0; i < race.history.length; i++) {
            messageText = this.getRaceMessage(race, i, msg.client, false);
            msg.edit(messageText);
            await Util.sleep(RACE_STEP_TIME * 1000);
        }

        messageText = this.getRaceMessage(
            race,
            race.history.length - 1,
            msg.client,
            true
        );
        msg.edit(messageText);
        await resMsg.suppressEmbeds(false);
        resMsg.edit(this.getResultEmbed(race, msg.client));
        await betMsg.suppressEmbeds(false);
        betMsg.edit(this.getBetEmbed(race, msg.client));
    }

    getRaceMessage(
        race: Race,
        step: number,
        client: Discord.Client,
        finished: boolean
    ): string {
        let snapshot = race.history[step];
        let content = "";
        content =
            header.replace(
                "{0}",
                client.users.get(race.creator)?.username + ""
            ) + "\n";
        content += "Time: " + (step * RACE_STEP_TIME + "") + "s\n";

        content += bar + "\n";
        for (let i = 0; i < snapshot.length; i++) {
            let ind = snapshot[i];

            // Distance
            content += "`" + (ind.distance + "").padStart(3, " ") + "m [`";
            let dist = Math.floor(ind.distance / 10);
            for (let j = 0; j < dist; j++) {
                content += ":black_large_square:";
            }
            content +=
                pets[
                    (parseInt(ind.userID, 10) + parseInt(race.creator, 10)) %
                        pets.length
                ];
            for (let j = dist; j < 10; j++) {
                content += ":black_large_square:";
            }
            content += "`]` ";

            // Medals
            if (ind.finished) {
                if (race.standings.dnf.includes(ind.userID)) {
                    content += ":x: ";
                } else {
                    let index = race.standings.finished.indexOf(ind.userID);
                    content += placeDict[index] + " ";
                }
            } else {
                content += ":zap: " + ind.energy + " ";
            }

            // Username
            let user = GameManager.instance.users.getUser(ind.userID);
            let username = client.users.get(ind.userID)?.username;
            content += "**" + user.pet?.name + "** (" + username + "'s pet)\n";
            // Pet stats
            // messageText += pet?.var.speed + ":dash: " + pet?.var.stamina + ":bone:\n";
        }
        content += bar;
        // Race Logs
        if (!finished) {
            content += "\n\u2800\n";
            let len = 0;
            for (const ind of snapshot) {
                let petname = GameManager.instance.users.getUser(ind.userID).pet
                    ?.name;
                switch (ind.action) {
                    case "idle":
                        break;
                    case "advance":
                        content +=
                            "**" +
                            petname +
                            "** advanced `" +
                            ind.advance +
                            "m`\n";
                        len++;
                        if (ind.bonusAdvance > 0) {
                            content +=
                                "**" +
                                petname +
                                "** advanced a bonus `" +
                                ind.bonusAdvance +
                                "m`\n";
                            len++;
                        }
                        break;
                    case "dnf-dead":
                        content +=
                            "**" +
                            petname +
                            "** did not finished because it is dead\n";
                        len++;
                        break;
                    case "dnf-energy":
                        content +=
                            "**" +
                            petname +
                            "** did not finish because it ran out of energy\n";
                        len++;
                        break;
                    case "dnf-time":
                        content +=
                            "**" +
                            petname +
                            "** did not finish because it ran out of time\n";
                        len++;
                        break;
                    case "finished":
                        content += "**" + petname + "** finished the race!\n";
                        len++;
                        break;
                }
            }
            for (let i = len; i < 12; i++) {
                content += "\u2800\n";
            }
        } else {
            content += "\nThe race has finished! Press 🔄 to rewatch the race";
        }

        return content;
    }

    getResultEmbed(race: Race, client: Discord.Client) {
        let winner = GameManager.instance.users.getUser(
            race.standings.finished[0]
        );
        let winnerPet = winner.pet;
        let winnerImg =
            resources.img.url_base +
            resources.img.pet[winner.pet?.rarity ?? "common"][
                winner.pet?.type ?? 0
            ].alive;

        let content = "**__Standings:__**\n";
        content += race.standings.finished
            .map((id, i) => {
                let user = GameManager.instance.users.getUser(id);
                let text = "**" + Util.numberize(i + 1) + ") ";
                text += user.pet?.name;
                if (i + 1 <= 3) {
                    text +=
                        " " +
                        [":first_place:", ":second_place:", ":third_place:"][i];
                }
                text += "**\n*" + client.users.get(id)?.username + "*";
                let prize = race.payouts.prizes.find((p) => p.userID === id);
                if (prize) {
                    text +=
                        "\nPrizes: ₩" + prize.money + ", " + prize.xp + "XP";
                }
                return text;
            })
            .join("\n");
        if (race.standings.finished.length > 0) {
            content += "\n";
        }
        content += race.standings.dnf
            .map((id) => {
                let user = GameManager.instance.users.getUser(id);
                let text = "**DNF) ";
                text += user.pet?.name;
                text += "**\n*" + client.users.get(id)?.username + "*";
                return text;
            })
            .join("\n");

        let resultEmbed = new RichEmbed()
            .setColor("GOLD")
            .setAuthor(
                "Race Results",
                resources.img.url_base + resources.img.races.trophy
            )
            .setTitle(
                winnerPet === null
                    ? "Noone has won"
                    : winnerPet.name + " has won!"
            )
            .setThumbnail(winnerPet === null ? "" : winnerImg)
            .setDescription(content);
        return resultEmbed;
    }

    getBetEmbed(race: Race, client: Discord.Client) {
        let bets = race.payouts.bets;
        let betText = "";
        for (const bet of bets) {
            let username = client.users.get(bet.userID);
            let amount = bet.amount;
            betText += "**" + username + "** - ₩" + amount + " \n\n";
        }
        if (betText === "") {
            betText = "(No bets made)";
        }

        let betEmbed = new RichEmbed()
            .setColor("BLUE")
            .setTitle("Bets:")
            .setDescription(betText);

        return betEmbed;
    }
}
