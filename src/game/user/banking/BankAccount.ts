import Serializable from "../../Serializable";
import Tickable from "../../Tickable";

type WithdrawError = "insufficient funds";

type TransferError = WithdrawError;

export type BankAccountSerialized = {
    balance: number;
    compoundCooldown: number;
};

export default class BankAccount
    implements Tickable, Serializable<BankAccount, BankAccountSerialized> {
    static readonly COMPOUND_COOLDOWN = 24;
    static readonly COMPOUND_PERCENT = 5;
    static readonly TRANSACTION_FEE_PERCENT = 10;

    balance: number;
    compoundCooldown: number;

    constructor() {
        this.balance = 0;
        this.compoundCooldown = 0;
    }

    deposit(amount: number): number {
        let transferFee = amount * (BankAccount.TRANSACTION_FEE_PERCENT / 100);
        let deductedAmount = Math.floor(amount - transferFee);
        this.balance += deductedAmount;
        return Math.round(amount);
    }

    withdraw(amount: number): number | WithdrawError {
        if (this.balance < Math.round(amount)) {
            return "insufficient funds";
        }
        this.balance -= Math.round(amount);
        return Math.round(amount);
    }

    transfer(account: BankAccount, amount: number): number | TransferError {
        amount = Math.round(amount);
        if (this.balance < amount) {
            return "insufficient funds";
        }
        this.balance -= amount;
        account.balance += amount;
        return amount;
    }

    tick(): void {
        if (this.compoundCooldown === 0) {
            this.compound();
            this.compoundCooldown = BankAccount.COMPOUND_COOLDOWN;
        } else {
            this.compoundCooldown--;
        }
    }

    compound(): void {
        let percent = BankAccount.COMPOUND_PERCENT / 100;
        let compound = Math.round(this.balance * percent);
        this.balance += compound;
    }

    //#region Serialization
    serialize(): BankAccountSerialized {
        return {
            balance: this.balance,
            compoundCooldown: this.compoundCooldown,
        };
    }

    deserialize(obj: BankAccountSerialized) {
        this.balance = obj.balance;
        this.compoundCooldown = obj.compoundCooldown;
        return this;
    }
    //#endregion
}
