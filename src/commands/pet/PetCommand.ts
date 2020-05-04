import { Client, CommandMessage, Validator } from "its-not-commando";
import PetBaseCommand from "./PetBaseCommand";

export default class PetCommand extends PetBaseCommand {
    constructor() {
        super({
            name: "pet",
            group: "pet",
            aliases: ["p"],
            usage: [
                {
                    name: "user",
                    validator: Validator.User,
                    optional: true,
                },
            ],
            description: "View your pet",
            details: "View your pet, or someone else's pet",
            examples: [
                ["pet", "View your own pet"],
                ["pet @Charlie", "View charlie's pet"],
            ],
        });
    }

    async run(
        msg: CommandMessage,
        args: string[],
        client: Client
    ): Promise<void> {
        let userID = args[0] ?? msg.author.id;
        let pet = this.checkPet(msg, userID);
        let username = args[0]
            ? client.users.get(args[0])?.username
            : msg.author.username;
        if (pet === null) {
            return;
        }
        let embed = PetCommand.getPetEmbed(userID, username + "", client);
        let petMsg = msg.say("", embed);
        setTimeout(async () => {
            embed = PetCommand.getPetEmbed(userID, username + "", client, true);
            (await petMsg).edit(embed);
        }, 20 * 60 * 1000);
    }
}
