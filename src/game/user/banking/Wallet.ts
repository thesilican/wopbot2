import Serializable from "../../Serializable";

export type WithdrawError = "insufficient funds";

export type WalletSerialized = {
    balance: number;
};

export default class Wallet implements Serializable<Wallet, WalletSerialized> {
    balance: number;

    constructor(balance?: number) {
        this.balance = balance ?? 0;
    }

    deposit(amount: number): number {
        this.balance += Math.round(amount);
        return Math.round(amount);
    }

    withdraw(amount: number): number | WithdrawError {
        if (this.balance < Math.round(amount)) {
            return "insufficient funds";
        }

        this.balance -= Math.round(amount);
        return Math.round(amount);
    }

    //#region Serialization
    serialize(): WalletSerialized {
        return {
            balance: this.balance,
        };
    }
    deserialize(obj: WalletSerialized): Wallet {
        this.balance = obj.balance;
        return this;
    }
    //#endregion
}
