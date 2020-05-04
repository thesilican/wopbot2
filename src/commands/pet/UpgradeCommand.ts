import { Command, CommandMessage, Client, SubCommand } from "its-not-commando";
import GameManager from "../../game/GameManager";
import PetBaseCommand from "./PetBaseCommand";
import { PetRarity } from "../../game/user/pet/Pet";
import Util from "../../Util";
import resources from "../../resources.json";

export default class UpgradeCommand extends PetBaseCommand {
    constructor() {
        super({
            name: "upgrade",
            group: "pet",
            aliases: [],
            usage: [],
            description: "Upgrade your pet for ₩2000",
            details: "Upgrade your pet for ₩2000, at the request of Mr. Bhatia",
            examples: [],
        });
    }

    async run(
        msg: CommandMessage,
        args: string[],
        client: Client
    ): Promise<void> {
        let user = GameManager.instance.users.getUser(msg.author.id);
        let pet = this.checkPet(msg);
        if (pet === null) {
            return;
        }
        if (pet.rarity == "rare") {
            msg.say("Your pet is already a rare pet");
            return;
        }
        let nextRarity: PetRarity =
            pet.rarity === "common" ? "uncommon" : "rare";

        let response = await msg.promptText(
            "Are you sure you want to upgrade your pet to `" +
                nextRarity +
                "`?\n" +
                "It will cost ₩2000 [y/n]"
        );
        if (["yes", "y"].includes(response?.toLowerCase() ?? "")) {
            let wallet = user.wallet;
            let res = wallet.withdraw(2000);
            if (res === "insufficient funds") {
                msg.say("You do not have ₩2000 in your wallet");
                return;
            }

            pet.rarity = nextRarity;
            pet.type = Util.randInt(resources.img.pet[nextRarity].length);
            msg.say("Your pet has been upgraded to " + nextRarity);
        } else {
            msg.say("Upgrade cancelled");
        }
    }
}
