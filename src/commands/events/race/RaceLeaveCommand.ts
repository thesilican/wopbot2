import { Client, CommandMessage, SubCommand } from "its-not-commando";
import GameManager from "../../../game/GameManager";
import RaceCommand from "./RaceCommand";

export default class RaceLeaveCommand extends SubCommand {
    constructor() {
        super({
            name: "leave",
            aliases: [],
            usage: [],
            description: "Leave the race you are currently in",
            // details: "",
            // examples:[]
        });
    }

    async run(
        msg: CommandMessage,
        args: string[],
        client: Client
    ): Promise<void> {
        let race = GameManager.instance.races.races.find((r) =>
            r.participants.includes(msg.author.id)
        );
        if (race === undefined) {
            msg.say("You are not currently in any races");
            return;
        }
        let res = race.leave(msg.author.id);
        if (res === "already started") {
            msg.say("The race has already started");
            return;
        }
        if (res === "not in race") {
            msg.say("You are not currently in any races");
            return;
        }
        let creator = client.users.get(race.creator)?.username;
        msg.say("You have left " + creator + "'s race");
        RaceCommand.updateRaceMessage(race, client);
    }
}
