import { Client, Command, CommandMessage, Validator } from "its-not-commando";
import GameManager from "../../game/GameManager";
import Pet, { PetVar } from "../../game/user/pet/Pet";
import PetBaseCommand from "../pet/PetBaseCommand";

export default class AdminSetCommand extends Command {
    constructor() {
        super({
            name: "admin-set",
            group: "admin",
            aliases: ["set-var"],
            usage: [
                {
                    name: "user",
                    validator: Validator.User,
                },
                {
                    name: "var",
                    validator: Validator.OneOf([
                        "health",
                        "hunger",
                        "happiness",
                        "speed",
                        "strength",
                        "stamina",
                        "energy",
                        "xp",
                        "xpLevel",
                    ]),
                },
                {
                    name: "amount",
                    validator: Validator.Integer,
                },
            ],
            description: "",
            details: "",
            examples: [],
            ownerOnly: true,
            dmAllowed: true,
        });
    }

    async run(
        msg: CommandMessage,
        args: string[],
        client: Client
    ): Promise<void> {
        let username = client.users.get(args[0])?.username;
        let user = GameManager.instance.users.getUser(args[0]);
        let pet = user.pet;
        if (pet === null) {
            msg.say(username + " does not have a pet");
            return;
        }
        let petVar = args[1] as PetVar;
        let amount = parseInt(args[2], 10);
        let deltas = Pet.emptyDelta();
        pet.setVar(petVar, amount, deltas);
        msg.say(
            "Changed " +
                pet.name +
                " " +
                petVar +
                " to " +
                amount +
                "\n" +
                PetBaseCommand.getDeltaMessage(deltas)
        );
    }
}
