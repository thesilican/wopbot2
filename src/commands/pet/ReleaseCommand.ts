import { Client, CommandMessage } from "its-not-commando";
import GameManager from "./../../game/GameManager";
import PetBaseCommand from "./PetBaseCommand";

export default class ReleaseCommand extends PetBaseCommand {
    constructor() {
        super({
            name: "release",
            group: "pet",
            description: "Release your pet to the wild :'(",
            details:
                "Release your pet to the wild. Hopefully he lives a good life without you",
        });
    }

    async run(
        msg: CommandMessage,
        args: string[],
        client: Client
    ): Promise<void> {
        let user = GameManager.instance.users.getUser(msg.author.id);
        let pet = user.pet;
        if (pet === null) {
            msg.channel.send(msg.author.username + ", you don't have a pet!");
            return;
        }

        let promptMsg = await msg.say(
            "Are you sure you want to release **" +
                pet.name +
                "** into the wild?" +
                "\nYou will never be able to see your pet again!"
        );
        promptMsg.createMenu(["✅", "❌"], async (reaction) => {
            if (reaction.users.find("id", msg.author.id) === undefined) {
                return true;
            }
            if (reaction.emoji.name === "✅") {
                msg.channel.send(
                    "**" +
                        pet?.name +
                        "** has been released to the wild 😢\n" +
                        "Farewell, little one..."
                );
                PetBaseCommand.sendPetGraveyard(client, msg.author.id);
            }
            promptMsg.delete();
            return false;
        });
    }
}
