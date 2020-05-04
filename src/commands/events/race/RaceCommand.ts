import Discord from "discord.js";
import { Command } from "its-not-commando";
import Race from "../../../game/events/Race";
import GameManager from "../../../game/GameManager";
import Program from "../../../Program";
import RaceCancelCommand from "./RaceCancelCommand";
import RaceCreateCommand from "./RaceCreateCommand";
import RaceJoinCommand from "./RaceJoinCommand";
import RaceLeaveCommand from "./RaceLeaveCommand";
import RaceStartCommand from "./RaceStartCommand";

export default class RaceCommand extends Command {
    static getRaceMessage(
        race: Race,
        client: Discord.Client,
        cancelled: boolean
    ) {
        let creatorUsername = client.users.get(race.creator)?.username;
        let messageText =
            ":checkered_flag::checkered_flag::checkered_flag: **" +
            creatorUsername +
            "'s Race**" +
            ":checkered_flag::checkered_flag::checkered_flag:\n";
        if (cancelled) {
            messageText += "**The race has been cancelled!**\n";
        }
        messageText += "Participants:\n```\n";
        messageText += race.participants
            .map((p) => {
                let petname = GameManager.instance.users.getUser(p).pet?.name;
                let username = client.users.get(p)?.username;
                return petname + " (" + username + "'s pet)";
            })
            .join("\n");
        messageText += "\n```";
        if (!cancelled) {
            messageText += "\n**Bets:**\n```\n";
            messageText += race.bets.bets
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
            if (race.bets.bets.length === 0) {
                messageText += "No bets placed";
            }
            messageText += "\n```";
        }
        if (!cancelled) {
            messageText += "\nUse `p.bet race` to place bets";
            messageText +=
                "\n\nUse `p.race join @" +
                creatorUsername +
                "` to join this race";
            messageText += "\n(Entrance fee: ₩" + Race.RACE_FEE + ")";
        }
        return messageText;
    }

    static async updateRaceMessage(
        race: Race,
        client: Discord.Client,
        cancelled = false
    ) {
        let eventChannel = client.channels.get(
            Program.config.channels.events
        ) as Discord.TextChannel;
        let eventMsgID = Program.eventMsgCache.race[race.dateCreated.getTime()];
        if (eventMsgID === undefined) {
            eventMsgID = (await eventChannel.send(".")).id;
            Program.eventMsgCache.race[race.dateCreated.getTime()] = eventMsgID;
        }
        let eventMsg = eventChannel.messages.get(eventMsgID)!;
        let content = RaceCommand.getRaceMessage(race, client, cancelled);
        eventMsg.edit(content);
    }

    constructor() {
        super({
            name: "race",
            group: "events",
            // aliases: [],
            // usage: [],
            description: "Commands related to races",
            details:
                "Commands related to creating and participating in races.\n" +
                "Use `p.race start` to start a races, and use" +
                "`p.race join @Kevin` to join a race created by Kevin\n" +
                "Once enough people have joined, the creator can use `p.race start` " +
                "to start the races. Races can have between 3-8 people",
            examples: [
                ["race create", "Create a new race"],
                ["race join @josh", "Join the race that Josh made"],
                ["race start", "Start a race that was created"],
            ],
            subcommands: [
                RaceCancelCommand,
                RaceCreateCommand,
                RaceJoinCommand,
                RaceLeaveCommand,
                RaceStartCommand,
            ],
        });
    }
}
