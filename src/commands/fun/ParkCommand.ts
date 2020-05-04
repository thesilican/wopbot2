import { Client, CommandMessage } from "its-not-commando";
import GameManager from "../../game/GameManager";
import Pet from "../../game/user/pet/Pet";
import Util from "../../Util";
import PetBaseCommand from "../pet/PetBaseCommand";

export default class ParkCommand extends PetBaseCommand {
    constructor() {
        super({
            name: "park",
            group: "fun",
            // aliases: [],
            // usage: [],
            description: "Bring your pet to the park",
            details:
                "Bring your pet to the park for 2 hours. Every pet at the park will gain between 20-30xp for every other pet simultaneously at the park",
            // examples:[]
        });
    }

    async run(
        msg: CommandMessage,
        args: string[],
        client: Client
    ): Promise<void> {
        let pet = this.checkPet(msg);
        if (pet === null) return;
        let park = GameManager.instance.park;
        let deltas = Pet.emptyDelta();
        let res = park.addPet(msg.author.id, deltas);
        if (res === "has no pet") {
            msg.say(msg.author.username + ", you don't have a pet!");
            return;
        }
        if (res === "on cooldown") {
            let timespan = Math.round(
                (pet.cooldowns.park.cooldown * GameManager.TICK_SPAN) / 1000
            );
            msg.say(
                msg.author.username +
                    ", your pet can visit the park in " +
                    Util.formatTime(timespan)
            );
            return;
        }
        let p = park.visitors.length > 1;
        msg.say(
            "You brought your pet to the park 🏞️\nYour pet will gain XP for every pet that is at or will visit the park\n" +
                "There " +
                (p ? "are" : "is") +
                " currently **" +
                park.visitors.length +
                "** pet" +
                (p ? "s" : "") +
                " at the park (" +
                PetBaseCommand.getDeltaMessage(deltas) +
                ")"
        );
        this.checkLevelUp(msg);
    }
}
