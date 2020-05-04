import { RichEmbed } from "discord.js";
import { Client, Command, CommandMessage, Validator } from "its-not-commando";
import GameManager from "../../game/GameManager";

export default class BalanceCommand extends Command {
    static getBalanceEmbed(userID: string, username: string): RichEmbed {
        let user = GameManager.instance.users.getUser(userID);
        return new RichEmbed()
            .setTitle(username + "'s Balance")
            .setDescription(
                "Balance: `₩" +
                    user.wallet.balance +
                    "`\n" +
                    "Bank: `₩" +
                    user.bankaccount.balance +
                    "`"
            );
    }

    constructor() {
        super({
            name: "balance",
            group: "money",
            description: "Check your current balance",
            details:
                "Check your current balance, including your wallet and bank account",
            aliases: ["bal"],
            usage: [
                {
                    name: "user",
                    optional: true,
                    validator: Validator.User,
                },
            ],
        });
    }

    async run(
        msg: CommandMessage,
        args: string[],
        client: Client
    ): Promise<void> {
        let userID = args[0] ? args[0] : msg.author.id;
        let username = client.users.get(userID)?.username;
        msg.say("", BalanceCommand.getBalanceEmbed(userID, username + ""));
    }
}
