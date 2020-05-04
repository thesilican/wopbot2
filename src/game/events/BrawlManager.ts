import GameManager from "../GameManager";
import Serializable, { create } from "../Serializable";
import Brawl, { BrawlSerialized } from "./Brawl";

export type BrawlManagerSerialized = {
    brawls: BrawlSerialized[];
    pastBrawls: BrawlSerialized[];
};

type BrawlCreateError =
    | "has no pet"
    | "pet on cooldown"
    | "already in brawl"
    | "cannot challenge self";

export default class BrawlManager
    implements Serializable<BrawlManager, BrawlManagerSerialized> {
    brawls: Brawl[];
    pastBrawls: Brawl[];

    constructor() {
        this.brawls = [];
        this.pastBrawls = [];
    }

    createBrawl(
        userID: string,
        oppositionID: string
    ): Brawl | BrawlCreateError {
        let user = GameManager.instance.users.getUser(userID);
        let pet = user.pet;
        if (pet === null) {
            return "has no pet";
        }
        if (pet.cooldowns.brawl.cooldown > 0) {
            return "pet on cooldown";
        }
        if (
            this.brawls.find(
                (b) => b.creator === userID || b.opposition === userID
            )
        ) {
            return "already in brawl";
        }
        if (userID === oppositionID) {
            return "cannot challenge self";
        }

        let brawl = new Brawl(userID, oppositionID);
        this.brawls.push(brawl);
        return brawl;
    }

    getBrawl(userID: string): Brawl | null {
        return this.brawls.find((b) => b.creator === userID) ?? null;
    }

    removeBrawl(userID: string) {
        let index = this.brawls.findIndex((b) => b.creator === userID);
        if (index === -1) {
            return null;
        }
        let brawl = this.brawls.splice(index, 1)[0];
        if (brawl.started) {
            this.pastBrawls.push(brawl);
        }
        return brawl;
    }

    //#region Serialization
    serialize(): BrawlManagerSerialized {
        return {
            brawls: this.brawls.map((b) => b.serialize()),
            pastBrawls: this.brawls.map((b) => b.serialize()),
        };
    }
    deserialize(obj: BrawlManagerSerialized): BrawlManager {
        this.brawls = obj.brawls.map((b) => create(Brawl).deserialize(b));
        this.pastBrawls = obj.pastBrawls.map((b) =>
            create(Brawl).deserialize(b)
        );
        return this;
    }
    //#endregion
}
