import { Client, CommandMessage, SubCommand } from "its-not-commando";
import Race from "../../../game/events/Race";
import GameManager from "../../../game/GameManager";
import Util from "../../../Util";
import RaceCommand from "./RaceCommand";

export default class RaceCreateCommand extends SubCommand {
    constructor() {
        super({
            name: "create",
            // aliases: [],
            // usage: [],
            description: "Create a new race that other people can join",
            details:
                "Create a new race that other people can join. They can join the race with `p.race join`",
            // examples:[]
        });
    }

    async run(
        msg: CommandMessage,
        args: string[],
        client: Client
    ): Promise<void> {
        let userID = msg.author.id;
        let user = GameManager.instance.users.getUser(userID);
        let pet = user.pet!;

        let res = GameManager.instance.races.createRace(userID);
        if (res === "has no pet") {
            msg.say(
                msg.author.username +
                    ", you don't yet own a pet!\nBuy a pet capsule from the shop to get started"
            );
            return;
        }
        if (res === "pet on cooldown") {
            let timespan = Math.round(
                (pet.cooldowns.races.cooldown * GameManager.TICK_SPAN) / 1000
            );
            msg.say(
                msg.author.username +
                    ", you can join another race in " +
                    Util.formatTime(timespan)
            );
            return;
        }
        if (res === "already in race") {
            msg.say(msg.author.username + ", you are already in a race!");
            return;
        }
        if (res === "at max participants") {
            msg.say("This race is already at max participants");
            return;
        }
        if (res === "already started") {
            msg.say("The race has already started");
            return;
        }
        if (res === "insufficient funds") {
            msg.say(
                "You do not have enough money to join the race (Need ₩" +
                    Race.RACE_FEE +
                    ")"
            );
            return;
        }

        msg.channel.send(
            "Successfully created a race! :checkered_flag::checkered_flag::checkered_flag:"
        );
        RaceCommand.updateRaceMessage(res, client);
    }
}
