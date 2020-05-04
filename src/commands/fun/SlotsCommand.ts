import { Client, Command, CommandMessage, Validator } from "its-not-commando";
import { SlotMachine, SlotRoll } from "../../game/fun/SlotMachine";
import GameManager from "../../game/GameManager";
import Util from "../../Util";

export default class SlotsCommand extends Command {
    users: string[];

    constructor() {
        super({
            name: "slots",
            group: "fun",
            // aliases: [],
            usage: [
                {
                    name: "amount",
                    defaultValue: "10",
                    optional: true,
                    validator: Validator.IntegerRange(1, Infinity),
                },
            ],
            description: "Play the slot machine",
            details: "Play the slot machine! Payouts are as follows:",
            examples: [["slots 100", "Bet 100 wopbucks on the slot machine"]],
        });

        this.users = [];
    }

    async run(
        msg: CommandMessage,
        args: string[],
        client: Client
    ): Promise<void> {
        if (this.users.includes(msg.author.id)) {
            msg.say("Please wait for the current slot machine to finish.");
            return;
        }

        let user = GameManager.instance.users.getUser(msg.author.id);
        let amount = parseInt(args[0], 10);
        let res = GameManager.instance.slotMachine.play(amount, user.wallet);
        if (res === "insufficient funds") {
            msg.say("You don't have enough money to bet ₩" + amount);
            return;
        }
        let slotMsg = await msg.say(".");
        this.users.push(msg.author.id);

        let rows = Array(8)
            .fill(null)
            .map((_) => GameManager.instance.slotMachine.roll()) as SlotRoll[];
        let roll: SlotRoll = [rows[2][0], rows[5][1], rows[2][2]];
        let payouts =
            GameManager.instance.slotMachine.calculatePayout(roll) * amount;
        const s = SlotMachine.symbolEmojis;
        let index = [3, 0, 3];
        for (let i = 0; i < 4; i++) {
            let content =
                "⠀⠀**[ :slot_machine: | SLOTS ]**\n" +
                ":red_square::red_square::red_square::red_square::red_square::red_square::red_square:\n";
            for (let j = 0; j < 5; j++) {
                let bor =
                    j === 2
                        ? ":white_large_square:"
                        : ":white_medium_small_square:";
                let sep = ":black_large_square:";
                content +=
                    bor +
                    s[rows[j + index[0]][0]] +
                    sep +
                    s[rows[j + index[1]][1]] +
                    sep +
                    s[rows[j + index[2]][2]] +
                    bor +
                    "\n";
            }
            content +=
                ":red_square::red_square::red_square::red_square::red_square::red_square::red_square:";
            if (i === 3) {
                content +=
                    "\n\n" +
                    msg.author.username +
                    " used **₩" +
                    amount +
                    "** and ";
                if (payouts === 0) {
                    content += "lost everything";
                } else {
                    content += "won **₩" + payouts + "**!";
                }
                user.wallet.deposit(payouts);
            }

            slotMsg.edit(content);
            // console.log(index);
            if (i !== 3) {
                await Util.sleep(2000);
                index[0]--;
                index[1]++;
                index[2]--;
            }
        }

        this.users.splice(this.users.indexOf(msg.author.id));
    }
}
