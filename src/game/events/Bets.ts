import Util from "../../Util";
import GameManager from "../GameManager";
import Serializable from "../Serializable";
import Wallet, { WithdrawError } from "../user/banking/Wallet";

export type BetManagerSerialized = Bet[];

export type Bet = {
    userID: string;
    result: string;
    amount: number;
};

type BetRes = WithdrawError;

export type BetPayout = {
    userID: string;
    amount: number;
};

export default class BetManager
    implements Serializable<BetManager, BetManagerSerialized> {
    bets: Bet[];

    constructor() {
        this.bets = [];
    }

    placeBet(bet: Bet, wallet: Wallet): Bet | BetRes {
        let amount = wallet.withdraw(bet.amount);
        if (amount === "insufficient funds") {
            return "insufficient funds";
        }
        this.bets.push(bet);
        return bet;
    }

    clearBets(userID: string, result?: string): Bet[] {
        let bets = this.bets.filter(
            (i) =>
                i.userID === userID &&
                (i.result === undefined || i.result === result)
        );
        bets.forEach((bet) => {
            GameManager.instance.users
                .getUser(bet.userID)
                .wallet.deposit(bet.amount);
            // Remove bet
            let index = this.bets.findIndex((i) => Util.compareDeep(i, bet));
            this.bets.splice(index, 1);
        });
        return bets;
    }

    clearAllBets() {
        for (let i = 0; i < this.bets.length; i++) {
            let bet = this.bets[i];
            let user = GameManager.instance.users.getUser(bet.userID);
            user.wallet.deposit(bet.amount);
        }
        this.bets = [];
    }

    payout(result: string): BetPayout[] {
        let results: { [userID: string]: number } = {};
        let pool = this.bets.reduce((a, v) => a + v.amount, 0);
        let winnerAmount = this.bets.reduce(
            (a, v) => (v.result === result ? a + v.amount : a),
            0
        );

        for (let i = 0; i < this.bets.length; i++) {
            let bet = this.bets[i];
            if (results[bet.userID] === undefined) {
                results[bet.userID] = 0;
            }
            if (bet.result === result) {
                results[bet.userID] += Math.round(
                    bet.amount * (pool / winnerAmount)
                );
            }
        }

        // Transform results
        let payoutResult: BetPayout[] = [];
        for (const userID in results) {
            const amount = results[userID];
            payoutResult.push({
                amount,
                userID,
            });
        }

        // Actually payout lol
        for (const res of payoutResult) {
            GameManager.instance.users.getUser(res.userID).wallet.deposit(res.amount);
        }
        payoutResult.sort((a, b) => b.amount - a.amount);
        return payoutResult;
    }

    serialize(): BetManagerSerialized {
        return this.bets;
    }
    deserialize(obj: BetManagerSerialized): BetManager {
        this.bets = obj;
        return this;
    }
}
