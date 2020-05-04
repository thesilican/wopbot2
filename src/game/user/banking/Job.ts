import Serializable from "../../Serializable";
import Tickable from "../../Tickable";
import Wallet from "./Wallet";

type WorkError = "work not reset";

export type JobSerialized = {
    workCooldown: number;
};

export default class Job implements Tickable, Serializable<Job, JobSerialized> {
    static readonly WAGE = 100;
    static readonly WORK_COOLDOWN = 44;

    workCooldown: number;

    constructor() {
        this.workCooldown = 0;
    }

    work(wallet: Wallet): number | WorkError {
        if (this.workCooldown > 0) {
            return "work not reset";
        } else {
            this.workCooldown = Job.WORK_COOLDOWN;
            return wallet.deposit(Job.WAGE);
        }
    }

    tick() {
        if (this.workCooldown > 0) {
            this.workCooldown--;
        }
    }

    //#region Serialization
    serialize(): JobSerialized {
        return {
            workCooldown: this.workCooldown,
        };
    }
    deserialize(obj: JobSerialized): Job {
        this.workCooldown = obj.workCooldown;
        return this;
    }
    //#endregion
}
