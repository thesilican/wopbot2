import GameManager from "../GameManager";
import Serializable, { create } from "../Serializable";
import Race, { RaceJoinError, RaceSerialized } from "./Race";

type RaceCreateError = "has no pet" | "pet on cooldown" | RaceJoinError;

export type RaceManagerSerialized = {
    races: RaceSerialized[];
    pastRaces: RaceSerialized[];
};

export default class RaceManager
    implements Serializable<RaceManager, RaceManagerSerialized> {
    races: Race[];
    pastRaces: Race[];

    constructor() {
        this.races = [];
        this.pastRaces = [];
    }

    createRace(userID: string): Race | RaceCreateError {
        let user = GameManager.instance.users.getUser(userID);
        let pet = user.pet;
        if (pet === null) {
            return "has no pet";
        }
        if (pet.cooldowns.races.cooldown > 0) {
            return "pet on cooldown";
        }

        let race = new Race(userID);
        let wallet = user.wallet;
        let res = race.join(userID, wallet);
        if (typeof res === "string") {
            return res;
        }
        this.races.push(race);
        return race;
    }

    getRace(userID: string): Race | null {
        return this.races.find((r) => r.creator === userID) ?? null;
    }

    removeRace(userID: string): Race | null {
        let index = this.races.findIndex((r) => r.creator === userID);
        if (index === -1) {
            return null;
        }
        let race = this.races.splice(index, 1)[0];
        if (race.started) {
            this.pastRaces.push(race);
        }
        return race;
    }

    //#region Serialization
    serialize(): RaceManagerSerialized {
        return {
            races: this.races.map((r) => r.serialize()),
            pastRaces: this.pastRaces.map((r) => r.serialize()),
        };
    }
    deserialize(obj: RaceManagerSerialized): RaceManager {
        this.races = obj.races.map((r) => create(Race).deserialize(r));
        this.pastRaces = obj.pastRaces.map((r) => create(Race).deserialize(r));
        return this;
    }
    //#endregion
}
