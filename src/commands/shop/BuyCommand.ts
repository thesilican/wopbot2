import { Client, Command, CommandMessage } from "its-not-commando";
import GameManager from "../../game/GameManager";
import Item from "../../game/shop/Item";
import Pet from "../../game/user/pet/Pet";
import PetBaseCommand from "../pet/PetBaseCommand";
import InventoryCommand from "./InventoryCommand";

export default class BuyCommand extends Command {
    constructor() {
        super({
            name: "buy",
            group: "shop",
            aliases: [],
            usage: [
                {
                    name: "item",
                    multi: true,
                },
            ],
            description: "Buy items from the shop",
            details:
                "Buy items from the shop. Use `p.browse` to see what is available in the shop",
            examples: [
                [
                    "buy basic pet capsule",
                    "Buy a pet capsule to get your first pet!",
                ],
                [
                    "buy cherry",
                    "Buy some cherries from the store to feed your pet",
                ],
            ],
        });
    }

    async run(
        msg: CommandMessage,
        args: string[],
        client: Client
    ): Promise<void> {
        let itemName = args[0];
        let user = GameManager.instance.users.getUser(msg.author.id);
        let res = GameManager.instance.shop.buy(
            { name: itemName },
            user.wallet
        );
        let shopItem = GameManager.instance.shop.findItem({ name: itemName })!;
        if (res === "not found") {
            let item = GameManager.instance.shop.findItem({
                name: itemName,
                fuzzMatch: 0.6,
            });
            let content = "`" + itemName + "` is not an item in the shop";
            if (item) {
                content += " (did you mean `" + item.item.name + "`?)";
            }
            msg.say(content);
            return;
        }
        if (res === "insufficient funds") {
            msg.say(
                msg.author.username +
                    ", you don't have enough money to buy " +
                    itemName
            );
            return;
        }

        let item = GameManager.instance.shop.findItem({ name: itemName })!;

        // Special case for pet capsules
        if (item.item.category === "capsules") {
            if (user.pet !== null) {
                let response = await msg.promptText(
                    "Are you sure you want to buy this capsule? It will replace your current pet [Y/N]",
                    (msg) =>
                        ["y", "n", "yes", "no"].includes(
                            msg.content.toLowerCase()
                        )
                );
                if (
                    response === null ||
                    response.toLowerCase() === "n" ||
                    response.toLowerCase() === "no"
                ) {
                    // Refund
                    user.wallet.deposit(shopItem.price);
                    msg.say("Purchase cancelled");
                    return;
                }
            }
            this.handleOpenCapsule(res[0], msg, shopItem.price);
            return;
        }

        user.inventory.add(res);
        let content =
            "You have bought `" +
            item.item.icon +
            " " +
            item.item.name +
            " (x" +
            item.quantity +
            ")` for ₩" +
            item.price;
        let embed = InventoryCommand.getInventoryEmbed(
            msg.author.id,
            msg.author.username
        );
        msg.say(content, embed);
    }

    async handleOpenCapsule(
        capsule: Item,
        msg: CommandMessage,
        refund: number
    ) {
        let user = GameManager.instance.users.getUser(msg.author.id);
        let an = capsule.name.startsWith("A") ? "an" : "a";
        let promptMsg = await msg.say(
            "You've bought " +
                an +
                " " +
                capsule.icon +
                " " +
                capsule.name +
                "\nIt's almost time to open it!\n**What would you like to name your pet?**\n(Type `cancel` to cancel opening)"
        );
        // They have an hour to respond
        let res = await promptMsg.prompt(msg.author.id, undefined, {
            seconds: 60 * 60,
        });
        let name: string;
        if (res === null) {
            name = "Kevin";
        } else if (res.content.toLowerCase() === "cancel") {
            msg.say("Purchase cancelled");
            user.wallet.deposit(refund);
            return;
        } else {
            name = res.content;
        }

        let pet = new Pet({
            capsule,
            name,
        });
        user.setPet(pet);

        let embed = PetBaseCommand.getPetEmbed(
            msg.author.id,
            msg.author.username,
            msg.client
        );
        msg.say(
            "Congratulations " +
                msg.author.username +
                ", you now have your very own pet!",
            embed
        );
    }
}
