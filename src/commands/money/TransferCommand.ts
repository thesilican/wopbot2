import { Client, Command, CommandMessage, Validator } from "its-not-commando";
import GameManager from "../../game/GameManager";

export default class TransferCommand extends Command {
    constructor() {
        super({
            name: "transfer",
            group: "money",
            usage: [
                {
                    name: "user",
                    validator: Validator.User,
                },
                {
                    name: "amount",
                    validator: Validator.IntegerRange(1, Infinity),
                },
            ],
            description: "Transfer money to someone",
            details:
                "Give someone else a certain amount of money, through the bank, free of charge!",
            examples: [
                [
                    "transfer @Kevin 100",
                    "Give Kevin ₩100 from your bank account",
                ],
            ],
        });
    }

    async run(
        msg: CommandMessage,
        args: string[],
        client: Client
    ): Promise<void> {
        let from = GameManager.instance.users.getUser(msg.author.id);
        let to = GameManager.instance.users.getUser(args[0]);
        let username = client.users.get(args[0])!.username;
        let amount = parseInt(args[1], 10);

        let res = from.bankaccount.transfer(to.bankaccount, amount);
        if (res === "insufficient funds") {
            msg.say("You do not have ₩" + amount + " in your bank account");
            return;
        }
        msg.say(
            "₩" + amount + " was transferred to " + username + "'s account"
        );
    }
}
