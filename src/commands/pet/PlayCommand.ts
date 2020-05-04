import { Client, CommandMessage } from "its-not-commando";
import Pet from "../../game/user/pet/Pet";
import PetBaseCommand from "./PetBaseCommand";

export default class PlayCommand extends PetBaseCommand {
    constructor() {
        super({
            name: "play",
            group: "pet",
            aliases: ["y"],
            // usage: [],
            description: "Play with your pet",
            details:
                "Play with your pet, increasing it's hapiness. Requires 3 energy",
            // examples:[]
        });
    }

    async run(
        msg: CommandMessage,
        args: string[],
        client: Client
    ): Promise<void> {
        let pet = this.checkPet(msg);
        if (pet === null) {
            return;
        }

        let deltas = Pet.emptyDelta();
        let res = pet.play(deltas);
        if (res === "not enough energy") {
            msg.say(
                msg.author.username + ", your pet is too tired (needs 3 energy)"
            );
            return;
        }
        if (res === "pet is dead") {
            msg.say(
                msg.author.username + ", your pet can't play because it is dead"
            );
            return;
        }

        msg.say(
            msg.author.username +
                ", you played with your pet ⚽⚽⚽\n" +
                PetBaseCommand.getDeltaMessage(deltas)
        );
        this.checkLevelUp(msg);
    }
}
