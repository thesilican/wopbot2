import Util from "../../Util";
import GameManager from "../GameManager";
import Serializable, { create } from "../Serializable";
import Pet from "../user/pet/Pet";
import BetManager, { BetManagerSerialized, BetPayout } from "./Bets";

export type IndividualSnapshot = {
    health: number;
    energy: number;
};

export type BrawlSnapshot = {
    attacker: "creator" | "opposition";
    action:
        | "nothing"
        | "attack"
        | "cripple"
        | "attack-cripple"
        | "no energy"
        | "finish-energy"
        | "finish-turns"
        | "finish-att-dead"
        | "finish-def-dead";
    damage: number;
    cripple: boolean;
    creator: IndividualSnapshot;
    opposition: IndividualSnapshot;
};

export type BrawlStandings = {
    victor: "creator" | "opposition";
};

export type PrizePayout = {
    userID: string;
    money: number;
    xp: number;
};

export type BrawlPayouts = {
    bets: BetPayout[];
    prizes: PrizePayout[];
};

export type BrawlSerialized = {
    dateCreated: string;
    creator: string;
    opposition: string;
    accepted: boolean;
    started: boolean;
    history: BrawlSnapshot[];
    standings: BrawlStandings | null;
    payouts: BrawlPayouts;
    bets: BetManagerSerialized;
};

type BrawlAcceptError = "not opposition";
type BrawlRejectError = "not opposition";
type BrawlStartError = "not creator" | "not yet accepted" | "already started";

export default class Brawl implements Serializable<Brawl, BrawlSerialized> {
    static readonly MAX_TURNS = 24;
    static readonly PARTICIPATE_COOLDOWN = 96;
    static readonly BRAWL_PRIZE = {
        money: 400,
        xp: 200,
    };

    dateCreated: Date;
    creator: string;
    opposition: string;
    accepted: boolean;
    started: boolean;
    history: BrawlSnapshot[];
    standings: BrawlStandings | null;
    payouts: BrawlPayouts;

    bets: BetManager;

    constructor(creatorID: string, oppositionID: string) {
        this.dateCreated = new Date();
        this.creator = creatorID;
        this.opposition = oppositionID;
        this.accepted = false;
        this.started = false;
        this.history = [];
        this.standings = null;
        this.bets = new BetManager();
        this.payouts = {
            bets: [],
            prizes: [],
        };
    }

    accept(userID: string): boolean | BrawlAcceptError {
        if (userID !== this.opposition) {
            return "not opposition";
        }
        this.accepted = true;
        return true;
    }

    reject(userID: string): boolean | BrawlRejectError {
        if (userID !== this.opposition) {
            return "not opposition";
        }

        GameManager.instance.brawls.removeBrawl(this.creator);
        return true;
    }

    start(userID: string): boolean | BrawlStartError {
        if (userID !== this.creator) {
            return "not creator";
        }
        if (!this.accepted) {
            return "not yet accepted";
        }
        if (this.started) {
            return "already started";
        }

        let creatorPet = GameManager.instance.users.getUser(this.creator).pet;
        let oppositionPet = GameManager.instance.users.getUser(this.opposition)
            .pet;

        this.started = true;
        this.history = [
            {
                attacker: "creator",
                action: "nothing",
                damage: 0,
                cripple: false,
                creator: {
                    health: creatorPet?.var.health ?? 0,
                    energy: creatorPet?.var.energy ?? 0,
                },
                opposition: {
                    health: oppositionPet?.var.health ?? 0,
                    energy: creatorPet?.var.energy ?? 0,
                },
            },
        ];
        this.standings = null;

        while (this.step());
        return true;
    }

    step(): boolean {
        let prevSnapshot = this.history[this.history.length - 1];
        let snapshot = Util.clone(prevSnapshot);
        if (prevSnapshot.cripple) {
            snapshot.attacker = prevSnapshot.attacker;
        } else {
            snapshot.attacker =
                prevSnapshot.attacker === "creator" ? "opposition" : "creator";
        }
        snapshot.action = "nothing";
        snapshot.damage = 0;
        snapshot.cripple = false;

        let attacker: Pet | null, defender: Pet | null;
        if (snapshot.attacker === "creator") {
            attacker = GameManager.instance.users.getUser(this.creator).pet;
            defender = GameManager.instance.users.getUser(this.opposition).pet;
        } else {
            attacker = GameManager.instance.users.getUser(this.opposition).pet;
            defender = GameManager.instance.users.getUser(this.creator).pet;
        }

        if (attacker === null) {
            snapshot.action = "finish-att-dead";
            this.standings = {
                victor:
                    snapshot.attacker === "creator" ? "opposition" : "creator",
            };
            this.history.push(snapshot);
            return false;
        }
        if (defender === null) {
            snapshot.action = "finish-def-dead";
            this.standings = {
                victor: snapshot.attacker,
            };
            this.history.push(snapshot);
            return false;
        }

        // Turn check
        if (this.history.length >= Brawl.MAX_TURNS) {
            snapshot.action = "finish-turns";
            let victor: "creator" | "opposition";
            if (attacker.var.health > defender.var.health) {
                if (snapshot.attacker === "creator") {
                    victor = "creator";
                } else {
                    victor = "opposition";
                }
            } else {
                if (snapshot.attacker === "creator") {
                    victor = "opposition";
                } else {
                    victor = "creator";
                }
            }
            this.standings = {
                victor,
            };
            this.history.push(snapshot);
            return false;
        }

        // Energy check
        if (attacker.var.energy < 1) {
            snapshot.action = "no energy";
            if (defender.var.energy < 1) {
                snapshot.action = "finish-energy";
                // Calculate victor
                let victor: "creator" | "opposition";
                if (attacker.var.health > defender.var.health) {
                    if (snapshot.attacker === "creator") {
                        victor = "creator";
                    } else {
                        victor = "opposition";
                    }
                } else {
                    if (snapshot.attacker === "creator") {
                        victor = "opposition";
                    } else {
                        victor = "creator";
                    }
                }
                this.standings = {
                    victor,
                };
                this.history.push(snapshot);
                return false;
            }
        } else {
            // Attacks & stuff
            let attVal = attacker.var.strength + 200;
            let defVal = Math.round(defender.var.stamina / 2) + 100;
            let successful = attVal > Util.randInt((attVal + defVal) * 1.5);
            if (successful) {
                attacker.changeVar("energy", -1);

                // Hit the opponent
                let attStrength = 5;
                attStrength += Util.randBetween(
                    0,
                    Math.round(attacker.var.strength / 5)
                );
                defender.changeVar("health", -attStrength);
                snapshot.action = "attack";
                snapshot.damage = attStrength;
            }

            // Cripple
            attVal = attacker.var.strength + 100;
            defVal = defender.var.speed + 200;
            successful = attVal > Util.randInt((attVal + defVal) * 2);
            if (successful) {
                if (snapshot.action === "attack") {
                    snapshot.action = "attack-cripple";
                } else {
                    snapshot.action = "cripple";
                }
                snapshot.cripple = true;
            }
        }

        // Update variables
        snapshot.creator = {
            health:
                snapshot.attacker === "creator"
                    ? attacker.var.health
                    : defender.var.health,
            energy:
                snapshot.attacker === "creator"
                    ? attacker.var.energy
                    : defender.var.energy,
        };
        snapshot.opposition = {
            health:
                snapshot.attacker === "opposition"
                    ? attacker.var.health
                    : defender.var.health,
            energy:
                snapshot.attacker === "opposition"
                    ? attacker.var.energy
                    : defender.var.energy,
        };
        this.history.push(snapshot);

        // Check for death
        if (snapshot.creator.health === 0) {
            this.standings = {
                victor: "opposition",
            };
            return false;
        } else if (snapshot.opposition.health === 0) {
            this.standings = {
                victor: "creator",
            };
            return false;
        } else {
            return true;
        }
    }

    payout() {
        this.payoutBets();
        this.payoutPrizes();
        let pet = GameManager.instance.users.getUser(this.creator).pet;
        if (pet) {
            pet.cooldowns.races.cooldown = Brawl.PARTICIPATE_COOLDOWN;
        }
        pet = GameManager.instance.users.getUser(this.opposition).pet;
        if (pet) {
            pet.cooldowns.races.cooldown = Brawl.PARTICIPATE_COOLDOWN;
        }
    }

    payoutBets() {
        let winner = this.standings!.victor;
        let bets = this.bets.payout(
            winner === "creator" ? this.creator : this.opposition
        );
        this.payouts.bets = bets;
    }

    payoutPrizes() {
        let winner =
            this.standings!.victor === "creator"
                ? this.creator
                : this.opposition;
        let user = GameManager.instance.users.getUser(winner);
        user.wallet.deposit(Brawl.BRAWL_PRIZE.money);
        let pet = user.pet;
        if (pet !== null) {
            pet.changeVar("xp", Brawl.BRAWL_PRIZE.xp);
            pet.trophies.push({
                type: "brawl",
            });
        }
        this.payouts.prizes = [
            Util.extend({ userID: winner }, Brawl.BRAWL_PRIZE),
        ];
    }

    //#region Serialization
    serialize(): BrawlSerialized {
        return {
            dateCreated: this.dateCreated.toISOString(),
            creator: this.creator,
            opposition: this.opposition,
            accepted: this.accepted,
            started: this.started,
            history: this.history,
            standings: this.standings,
            payouts: this.payouts,
            bets: this.bets.serialize(),
        };
    }
    deserialize(obj: BrawlSerialized): Brawl {
        this.dateCreated = new Date(obj.dateCreated);
        this.creator = obj.creator;
        this.opposition = obj.opposition;
        this.accepted = obj.accepted;
        this.started = obj.started;
        this.history = obj.history;
        this.standings = obj.standings;
        this.payouts = obj.payouts;
        this.bets = create(BetManager).deserialize(obj.bets);

        return this;
    }
    //#endregion
}
