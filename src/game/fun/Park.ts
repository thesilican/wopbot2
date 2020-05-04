import Util from "../../Util";
import GameManager from "../GameManager";
import Serializable from "../Serializable";
import Tickable from "../Tickable";
import { PetVarsDelta } from "../user/pet/Pet";

export type ParkSerialized = {
    visitors: Visitor[];
};

type Visitor = {
    userID: string;
    ticksLeft: number;
};

type ParkRes = "has no pet" | "on cooldown";

export default class Park
    implements Tickable, Serializable<Park, ParkSerialized> {
    static readonly VISIT_COOLDOWN = 48;
    static readonly VISIT_LENGTH = 4;
    static readonly XP_PER_VISITOR: [number, number] = [10, 15];
    visitors: Visitor[];

    constructor() {
        this.visitors = [];
    }

    addPet(userID: string, deltas?: PetVarsDelta): boolean | ParkRes {
        let user = GameManager.instance.users.getUser(userID);
        let pet = user.pet;
        if (pet === null) {
            return "has no pet";
        }
        if (pet.cooldowns.park.cooldown > 0) {
            return "on cooldown";
        }

        pet.cooldowns.park.cooldown = Park.VISIT_COOLDOWN;
        this.visitors.push({
            userID,
            ticksLeft: Park.VISIT_LENGTH,
        });
        // Set pet XP
        let xpAmount = Util.randBetween(...Park.XP_PER_VISITOR);
        pet.changeVar("xp", xpAmount * this.visitors.length, deltas);

        // Other pets
        for (let i = 0; i < this.visitors.length - 1; i++) {
            let user = GameManager.instance.users.getUser(
                this.visitors[i].userID
            );
            user.pet?.changeVar("xp", xpAmount);
        }

        return true;
    }

    tick() {
        let numVisitors = this.visitors.length;
        for (let i = 0; i < numVisitors; i++) {
            let visitor = this.visitors[i];
            visitor.ticksLeft--;
            if (visitor.ticksLeft <= 0) {
                this.visitors.splice(i, 1);
                i--;
            }
        }
    }

    //#region Serialization
    serialize(): ParkSerialized {
        return {
            visitors: this.visitors,
        };
    }
    deserialize(obj: ParkSerialized): Park {
        this.visitors = obj.visitors;
        return this;
    }
    //#endregion
}
