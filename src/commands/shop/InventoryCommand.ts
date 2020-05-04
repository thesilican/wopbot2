import { RichEmbed } from "discord.js";
import { Client, Command, CommandMessage } from "its-not-commando";
import GameManager from "../../game/GameManager";
import Item from "../../game/shop/Item";

export default class InventoryCommand extends Command {
    constructor() {
        super({
            name: "inventory",
            group: "shop",
            aliases: ["inv", "i"],
            description: "View your inventory",
            details: "View your inventory",
            // examples:[]
        });
    }

    async run(
        msg: CommandMessage,
        args: string[],
        client: Client
    ): Promise<void> {
        let embed = InventoryCommand.getInventoryEmbed(
            msg.author.id,
            msg.author.username
        );
        msg.say("", embed);
    }

    static getInventoryEmbed(userID: string, username: string): RichEmbed {
        let user = GameManager.instance.users.getUser(userID);
        let embed = new RichEmbed();
        let text = user.inventory.items
            // Count
            .reduce((d: [Item, number][], i) => {
                let key = d.find((f) => f[0].id === i.id);
                if (key === undefined) {
                    d.push([i, 1]);
                } else {
                    key[1]++;
                }
                return d;
            }, [])
            // To text
            .map((i) => {
                return i[0].icon + " " + i[0].name + " (x" + i[1] + ")";
            })
            .join("\n");

        embed.setTitle(username + "'s inventory").setDescription(text);

        return embed;
    }
}
