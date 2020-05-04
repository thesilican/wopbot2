import Util from "../../Util";
import Wallet, { WithdrawError } from "../user/banking/Wallet";

export type SlotSymbol =
    | "grapes"
    | "watermelon"
    | "orange"
    | "cherry"
    | "peach"
    | "coconut"
    | "burrito"
    | "diamond";
export type SlotRoll = [SlotSymbol, SlotSymbol, SlotSymbol];
export type SlotResult = {
    roll: SlotRoll;
    payout: number;
};

type SlotMachinePlayError = WithdrawError;

export class SlotMachine {
    static pools: [SlotSymbol, number][] = [
        ["grapes", 3],
        ["watermelon", 3],
        ["orange", 3],
        ["peach", 3],
        ["cherry", 3],
        ["coconut", 3],
        ["burrito", 1],
        ["diamond", 1],
    ];

    static symbolEmojis: { [id in SlotSymbol]: string } = {
        grapes: "🍇",
        watermelon: "🍉",
        orange: "🍊",
        cherry: "🍒",
        peach: "🍑",
        coconut: "🥥",
        burrito: "🌯",
        diamond: "💎",
    };

    constructor() {
        // Nothing here hehe
    }

    play(wager: number, wallet: Wallet): SlotResult | SlotMachinePlayError {
        let amount = wallet.withdraw(wager);
        if (amount === "insufficient funds") {
            return "insufficient funds";
        }
        let roll = this.roll();
        let payout = amount * this.calculatePayout(roll);
        return {
            roll,
            payout,
        };
    }

    roll(): SlotRoll {
        return [
            Util.randChooseWeighted(SlotMachine.pools),
            Util.randChooseWeighted(SlotMachine.pools),
            Util.randChooseWeighted(SlotMachine.pools),
        ];
    }

    calculatePayout(roll: SlotRoll): number {
        if (roll[0] === roll[1] || roll[0] === roll[2] || roll[1] === roll[2]) {
            if (roll[0] === roll[1] && roll[1] === roll[2]) {
                if (roll[0] === "diamond") {
                    // Triple diamond (Jackpot!)
                    return 10;
                } else {
                    // Triple
                    return 4;
                }
            } else {
                if (
                    (roll[0] === roll[1] && roll[0] === "diamond") ||
                    (roll[0] === roll[2] && roll[0] === "diamond") ||
                    (roll[1] === roll[2] && roll[1] === "diamond")
                ) {
                    // Double diamond
                    return 5;
                } else {
                    // Double
                    return 2;
                }
            }
        } else {
            // Rip
            return 0;
        }
    }
}
