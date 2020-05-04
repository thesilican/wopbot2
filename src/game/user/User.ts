import Serializable, { create } from "../Serializable";
import Tickable from "../Tickable";
import BankAccount, { BankAccountSerialized } from "./banking/BankAccount";
import Job, { JobSerialized } from "./banking/Job";
import Wallet, { WalletSerialized } from "./banking/Wallet";
import Inventory, { InventorySerialized } from "./Inventory";
import Pet, { PetSerialized } from "./pet/Pet";

export type UserOptions = {
    id: string;
};

export type UserCooldowns = {};

export type UserSerialized = {
    id: string;
    inventory: InventorySerialized;
    pet: PetSerialized | null;
    bankaccount: BankAccountSerialized;
    wallet: WalletSerialized;
    job: JobSerialized;
    cooldowns: UserCooldowns;
};

export default class User
    implements Tickable, Serializable<User, UserSerialized> {
    static readonly USER_STARTING_WALLET = 500;

    id: string;
    inventory: Inventory;
    pet: Pet | null;
    bankaccount: BankAccount;
    wallet: Wallet;
    job: Job;

    cooldowns: UserCooldowns;

    constructor(options: UserOptions) {
        this.id = options.id;
        this.inventory = new Inventory();
        this.pet = null;
        this.bankaccount = new BankAccount();
        this.wallet = new Wallet(User.USER_STARTING_WALLET);
        this.job = new Job();
        this.cooldowns = {};
    }

    setPet(pet: Pet | null) {
        this.pet = pet;
    }

    tick() {
        this.bankaccount.tick();
        this.job.tick();
        if (this.pet !== null) {
            this.pet.tick();
        }
    }

    serialize(): UserSerialized {
        return {
            id: this.id,
            inventory: this.inventory.serialize(),
            pet: this.pet === null ? this.pet : this.pet.serialize(),
            bankaccount: this.bankaccount.serialize(),
            wallet: this.wallet.serialize(),
            job: this.job.serialize(),
            cooldowns: this.cooldowns,
        };
    }
    deserialize(obj: UserSerialized): User {
        this.id = obj.id;
        this.inventory = create(Inventory).deserialize(obj.inventory);
        this.pet = obj.pet === null ? null : create(Pet).deserialize(obj.pet);
        this.bankaccount = create(BankAccount).deserialize(obj.bankaccount);
        this.wallet = create(Wallet).deserialize(obj.wallet);
        this.job = create(Job).deserialize(obj.job);
        this.cooldowns = obj.cooldowns;
        return this;
    }
}
