import { Client, CommandMessage } from "its-not-commando";
import GameManager from "../../game/GameManager";
import Pet from "../../game/user/pet/Pet";
import Util from "../../Util";
import PetBaseCommand from "./PetBaseCommand";

export default class FeedCommand extends PetBaseCommand {
    constructor() {
        super({
            name: "feed",
            group: "pet",
            aliases: ["f"],
            usage: [
                {
                    name: "food",
                    optional: true,
                    multi: true,
                },
            ],
            description: "Feed your pet",
            details:
                "Feed your pet some food, you must have food in your inventory first. Requires 2 energy",
            examples: [
                ["food", "Feed your pet some food"],
                [
                    "food grapes",
                    "Feed your pet some grapes from your inventory",
                ],
            ],
        });
    }

    async run(
        msg: CommandMessage,
        args: string[],
        client: Client
    ): Promise<void> {
        let user = GameManager.instance.users.getUser(msg.author.id);
        let pet = this.checkPet(msg);
        if (pet === null) return;

        let filter = args[0] ? { name: args[0] } : { category: "food" };
        let food = user.inventory.remove(filter);
        if (food === "cannot find item") {
            if (args[0]) {
                msg.say(
                    "You don't have any `" + args[0] + "` in your inventory"
                );
            } else {
                msg.say(
                    "You do not have any food in your inventory.\n(You can buy food from the shop)"
                );
            }
            return;
        }

        let deltas = Pet.emptyDelta();
        let res = pet.feed(food, deltas);
        if (res === "item not food") {
            user.inventory.add(food);
            msg.say("You cannot feed your pet " + food.name);
            return;
        } else if (res === "not enough energy") {
            user.inventory.add(food);
            msg.say(
                msg.author.username + ", your pet is too tired (needs 2 energy)"
            );
            return;
        } else if (res === "pet is dead") {
            user.inventory.add(food);
            msg.say("Your pet is dead");
            return;
        } else if (res === "already on kale") {
            user.inventory.add(food);
            msg.say(
                msg.author.username +
                    ", your pet has already eaten kale. Try again later"
            );
            return;
        } else if (res === "too much kale") {
            user.inventory.add(food);
            let timespan = pet.cooldowns.food.super_kale_sickness / 2;
            msg.say(
                msg.author.username +
                    ", your pet is sick of eating kale. It will agree to eat kale again in " +
                    Util.plural(timespan, "hr")
            );
            return;
        }

        let content =
            msg.author.username +
            ", you fed your pet some " +
            food.icon +
            " " +
            food.name +
            "\n";
        content += PetBaseCommand.getDeltaMessage(deltas);
        msg.say(content);
    }
}
