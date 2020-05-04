import { Client, Command, CommandMessage, Validator } from "its-not-commando";
import BetManager from "../../../game/events/Bets";
import GameManager from "../../../game/GameManager";
import BrawlCommand from "../brawl/BrawlCommand";
import RaceCommand from "../race/RaceCommand";

export default class BetCommand extends Command {
    constructor() {
        super({
            name: "bet",
            group: "events",
            // aliases: [],
            usage: [
                {
                    name: "race/brawl",
                    validator: Validator.OneOf([
                        "race",
                        "brawl",
                        "races",
                        "brawls",
                    ]),
                },
                {
                    name: "user",
                    validator: Validator.User,
                },
                {
                    name: "amount",
                    validator: Validator.IntegerRange(1, Infinity),
                },
            ],
            description: "Bet on someone's pet",
            details:
                "Bet on someone's pet for a race or brawl. Payouts are distributed proportionally based on the winner",
            examples: [
                ["bet race @MopWop 100", "Bet ₩100 on MopWop's pet in a race"],
                [
                    "bet brawl @Zebastian1 50",
                    "Bet ₩50 on Zebastian1's pet for a brawl",
                ],
            ],
        });
    }

    async run(
        msg: CommandMessage,
        args: string[],
        client: Client
    ): Promise<void> {
        let bets: BetManager;
        let resultUsername = client.users.get(args[1])?.username;
        if (args[0] === "race" || args[0] === "races") {
            let race = GameManager.instance.races.races.find((r) =>
                r.participants.includes(args[1])
            );
            if (race === undefined) {
                msg.say("Could not find any races with " + resultUsername);
                return;
            }
            bets = race.bets;
        } else {
            let brawl = GameManager.instance.brawls.brawls.find(
                (b) => b.creator == args[1] || b.opposition == args[1]
            );
            if (brawl === undefined) {
                msg.say("Could not find any brawls with " + resultUsername);
                return;
            }
            bets = brawl.bets;
        }
        let user = GameManager.instance.users.getUser(msg.author.id);
        let amount = parseInt(args[2]);
        let bet = {
            userID: user.id,
            result: args[1],
            amount,
        };
        let res = bets.placeBet(bet, user.wallet);
        if (res === "insufficient funds") {
            msg.say(
                "You do not have enough money to place a bet of ₩" + amount
            );
            return;
        }
        msg.say(
            "You placed a bet of ₩" +
                amount +
                " on " +
                resultUsername +
                "'s pet"
        );
        if (args[0] === "race") {
            let race = GameManager.instance.races.races.find((r) =>
                r.participants.includes(user.id)
            )!;
            RaceCommand.updateRaceMessage(race, client);
        } else {
            let brawl = GameManager.instance.brawls.brawls.find(
                (b) => b.creator == user.id || b.opposition == user.id
            )!;
            BrawlCommand.updateBrawlMessage(brawl, client);
        }
    }
}
