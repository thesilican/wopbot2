import { Client, Command, CommandMessage, Validator } from "its-not-commando";
import GameManager from "../../game/GameManager";
import BalanceCommand from "./BalanceCommand";

export default class WithdrawCommand extends Command {
    constructor() {
        super({
            name: "withdraw",
            group: "money",
            aliases: ["with"],
            usage: [
                {
                    name: "amount",
                    validator: Validator.IntegerRange(1, Infinity),
                },
            ],
            description: "Withdraw some money from the bank",
            details:
                "Withdraw some money from the bank. This takes a 10% transaction fee",
            examples: [
                [
                    "bank withdrawo 100",
                    "Withdraw ₩100 into your bank account (-₩10 transaction fee)",
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
        let amount = parseInt(args[0], 10);

        let withAmount = user.bankaccount.withdraw(amount);
        if (withAmount === "insufficient funds") {
            msg.say(
                "Could not withdraw ₩" +
                    amount +
                    ". Does your bank account have enough money?"
            );
        }

        user.wallet.deposit(amount);
        let messageText = "Successfully withdrew ₩" + withAmount;
        let embed = BalanceCommand.getBalanceEmbed(
            user.id,
            msg.author.username
        );
        msg.say(messageText, embed);
    }
}
