import { Client, Command, CommandMessage, Validator } from "its-not-commando";
import GameManager from "../../game/GameManager";
import BalanceCommand from "./BalanceCommand";

export default class DepositCommand extends Command {
    constructor() {
        super({
            name: "deposit",
            group: "money",
            aliases: ["dep"],
            usage: [
                {
                    name: "amount",
                    validator: Validator.IntegerRange(1, Infinity),
                },
            ],
            description: "Deposit money into your bank account",
            details:
                "Deposit money into your bank account. This takes a 10% transaction fee.",
            examples: [
                [
                    "bank deposit 100",
                    "Deposit ₩100 into your bank account (-₩10 transaction fee)",
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

        if (amount < 10) {
            msg.channel.send("You must deposit a minimum of ₩10");
            // Hard coded for josh and aadil hehe
            if (
                user.id === "299992291928702977" ||
                user.id === "253284010250207233"
            ) {
                msg.channel.send("(btw tax evasion is illegal)");
            }
            return;
        }

        let withAmount = user.wallet.withdraw(amount);
        if (withAmount === "insufficient funds") {
            msg.say(
                "Could not deposit ₩" +
                    amount +
                    ". Does your wallet have enough money?"
            );
            return;
        }
        user.bankaccount.deposit(withAmount);

        let messageText = "Successfully deposited ₩" + withAmount;
        msg.say(
            messageText,
            BalanceCommand.getBalanceEmbed(user.id, msg.author.username)
        );
    }
}
