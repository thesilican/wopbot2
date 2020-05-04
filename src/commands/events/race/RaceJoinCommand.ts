import {
    Client,
    CommandMessage,
    SubCommand,
    Validator,
} from "its-not-commando";
import Race from "../../../game/events/Race";
import GameManager from "../../../game/GameManager";
import RaceCommand from "./RaceCommand";

export default class RaceJoinCommand extends SubCommand {
    constructor() {
        super({
            name: "join",
            // aliases: [],
            usage: [
                {
                    name: "host",
                    validator: Validator.User,
                },
            ],
            description: "Join an existing race",
            details: "Join an existing race",
            // examples:[]
        });
    }

    async run(
        msg: CommandMessage,
        args: string[],
        client: Client
    ): Promise<void> {
        let creatorID = args[0];
        let creator = client.users.get(creatorID);
        let userID = msg.author.id;
        let user = GameManager.instance.users.getUser(userID);
        let pet = user.pet!;

        let race = GameManager.instance.races.getRace(creatorID);
        if (race === null) {
            msg.say(creator?.username + " is not hosting a race");
            return;
        }

        let res = race.join(userID, user.wallet);
        if (res === "has no pet") {
            msg.say(
                msg.author.username +
                    ", you don't yet own a pet!\nBuy a pet capsule from the shop to get started"
            );
            return;
        }
        if (res === "already in race") {
            msg.say(msg.author.username + ", you are already in a race");
            return;
        }
        if (res === "at max participants") {
            msg.say("The race is at max participants");
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

        msg.say("You have joined " + creator?.username + "'s race");
        RaceCommand.updateRaceMessage(race, client);
    }
}
