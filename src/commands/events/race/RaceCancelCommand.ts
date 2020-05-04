import { Client, CommandMessage, SubCommand } from "its-not-commando";
import GameManager from "../../../game/GameManager";
import RaceCommand from "./RaceCommand";

export default class RaceCancelCommand extends SubCommand {
    constructor() {
        super({
            name: "cancel",
            // aliases: [],
            // usage: [],
            description: "Cancel a race that you are hosting",
            details: "Cancel a race that you are hosting",
            // examples:[]
        });
    }

    async run(
        msg: CommandMessage,
        args: string[],
        client: Client
    ): Promise<void> {
        let race = GameManager.instance.races.removeRace(msg.author.id);
        if (race === null) {
            msg.say("You are not currently hosting any races");
            return;
        }
        race.bets.clearAllBets();

        msg.say("You have cancelled your race race");
        RaceCommand.updateRaceMessage(race, client, true);
    }
}
