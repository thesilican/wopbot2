import { Client, Command, CommandMessage, Validator } from "its-not-commando";
import GameManager from "../../game/GameManager";

export default class AdminTransferCommand extends Command {
    constructor() {
        super({
            name: "admin-transfer",
            group: "admin",
            aliases: [],
            usage: [
                {
                    name: "user",
                    validator: Validator.User,
                },
                {
                    name: "amount",
                    validator: Validator.Integer,
                },
            ],
            description: "Transfer some money to/from the user's wallet",
            // details: "",
            // examples: [],
            ownerOnly: true,
            dmAllowed: true,
        });
    }

    async run(
        msg: CommandMessage,
        args: string[],
        client: Client
    ): Promise<void> {
        let user = GameManager.instance.users.getUser(args[0]);
        let username = client.users.get(args[0])?.username;
        let amount = parseInt(args[1], 10);
        if (amount > 0) {
            user.wallet.deposit(amount);
            msg.say(
                "Successfully deposited ₩" +
                    amount +
                    " to " +
                    username +
                    "'s wallet"
            );
            return;
        } else {
            user.wallet.withdraw(Math.min(user.wallet.balance, -amount));
            msg.say(
                "Successfully withdrew ₩" +
                    Math.min(user.wallet.balance, -amount) +
                    " from " +
                    username +
                    "'s wallet"
            );
        }
    }
}
