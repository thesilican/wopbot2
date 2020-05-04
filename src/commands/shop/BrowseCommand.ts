import { RichEmbed } from "discord.js";
import { Client, Command, CommandMessage } from "its-not-commando";
import GameManager from "../../game/GameManager";
import Shop from "../../game/shop/Shop";
import ShopItem from "../../game/shop/ShopItem";

type Page = (ShopItem | string)[];

export default class BrowseCommand extends Command {
    static ITEMS_PER_PAGE = 9;

    constructor() {
        super({
            name: "browse",
            group: "shop",
            aliases: ["shop"],
            // usage: [],
            description: "View items in the shop",
            details:
                "View items in the shop. You can then buy items with the `p.buy` command",
            // examples: []
        });
    }

    generatePages(hasPet: boolean): Page[] {
        let items = Shop.Items;
        if (hasPet) {
            // Don't show capsules if they already have a pet
            items = items.filter((i) => i.item.category !== "capsules");
        }
        let curCategory = "";
        let num = 0;
        let pages: Page[] = [];
        let page: Page = [];
        for (const item of items) {
            if (
                num === BrowseCommand.ITEMS_PER_PAGE ||
                item.item.category !== curCategory
            ) {
                num = 0;
                if (page.length > 0) {
                    pages.push(page);
                }
                page = [];
                curCategory = item.item.category;
                let category = Shop.Categories.find(
                    (c) => c.id === curCategory
                )!;
                page.push(category.name);
            }
            page.push(item);
            num++;
        }
        if (page.length > 0) {
            pages.push(page);
        }
        return pages;
    }

    getPage(
        pages: Page[],
        pageNum: number,
        balance: number
    ): [string, RichEmbed] {
        let page = pages[pageNum];
        let header = ":convenience_store: | **Wop Shop**";
        if (pageNum !== -1) {
            header += "\n\nYou have: `₩" + balance + "`\n";
        }

        let embed = new RichEmbed();
        if (pageNum === -1) {
            embed
                .setDescription("Use `p.browse` to view the shop again")
                .setColor("PURPLE");
        } else {
            let text = page
                .map((p, i) => {
                    if (typeof p === "string") {
                        if (i === 0) {
                            return "**" + p + "**";
                        } else {
                            return "\n**" + p + "**";
                        }
                    }
                    return (
                        p.item.icon +
                        " `" +
                        p.item.name +
                        " - ₩" +
                        p.price +
                        "`\n" +
                        "\u2800\u2800*" +
                        p.description +
                        "*"
                    );
                })
                .join("\n");
            embed
                .setDescription(text)
                .setFooter(
                    "Page " +
                        (pageNum + 1) +
                        " of " +
                        pages.length +
                        " · Use p.buy <item> to purchase an item"
                )
                .setColor("PURPLE");
        }

        return [header, embed];
    }

    async run(
        msg: CommandMessage,
        args: string[],
        client: Client
    ): Promise<void> {
        let user = GameManager.instance.users.getUser(msg.author.id);
        let pages = this.generatePages(user.pet !== null);
        let pageNum = 0;
        let lastPage = pages.length - 1;
        let balance = user.wallet.balance;
        (await msg.say(...this.getPage(pages, pageNum, balance))).createMenu(
            ["👈", "👉"],
            async (reaction, msg) => {
                if (reaction.emoji.name === "👈") {
                    pageNum = Math.max(0, pageNum - 1);
                } else {
                    pageNum = Math.min(lastPage, pageNum + 1);
                }
                msg.edit(...this.getPage(pages, pageNum, balance));
                return true;
            },
            {
                seconds: 60 * 60,
                onTimeout: async (msg: CommandMessage) => {
                    msg.edit(...this.getPage(pages, -1, balance));
                },
            }
        );
    }
}
