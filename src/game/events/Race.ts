import Util from "../../Util";
import GameManager from "../GameManager";
import Serializable, { create } from "../Serializable";
import Wallet, { WithdrawError } from "../user/banking/Wallet";
import BetManager, { BetManagerSerialized, BetPayout } from "./Bets";

export type RaceStanding = "dnf-dead" | "dnf-energy" | "dnf-time" | "finished";

export type RaceAction = "idle" | "advance" | RaceStanding;

export type RaceSnapshot = IndividualSnapshot[];

export type IndividualSnapshot = {
    userID: string;
    energy: number;
    distance: number;
    advance: number;
    bonusAdvance: number;
    finished: boolean;
    action: RaceAction;
};

export type RaceStandings = {
    finished: string[];
    dnf: string[];
};

export type PrizePayout = {
    userID: string;
    money: number;
    xp: number;
};

export type Payouts = {
    bets: BetPayout[];
    prizes: PrizePayout[];
};

export type RaceSerialized = {
    dateCreated: string;
    creator: string;
    participants: string[];
    started: boolean;
    history: RaceSnapshot[];
    standings: RaceStandings;
    bets: BetManagerSerialized;
    payouts: Payouts;
};

export type RaceJoinError =
    | "has no pet"
    | "already in race"
    | "already started"
    | "at max participants"
    | WithdrawError;
export type RaceLeaveError = "not in race" | "already started";
export type RaceStartError =
    | "already started"
    | "not creator"
    | "invalid num participants";

export default class Race implements Serializable<Race, RaceSerialized> {
    static readonly MIN_PARTICIPANTS = 2;
    static readonly MAX_PARTICIPANTS = 8;
    static readonly PARTICIPATE_COOLDOWN = 144;
    static readonly RACE_FEE = 50;
    static readonly RACE_MAX_STEPS = 24;
    static readonly RACE_DISTANCE = 100;
    static readonly RACE_PRIZES = [
        {
            money: 600,
            xp: 400,
        },
        {
            money: 300,
            xp: 200,
        },
        {
            money: 100,
            xp: 100,
        },
    ];
    static readonly RACE_PRIZES_MIN_NOPRIZE = 2;

    dateCreated: Date;
    creator: string;
    participants: string[];
    started: boolean;
    history: RaceSnapshot[];
    standings: RaceStandings;
    bets: BetManager;
    payouts: Payouts;

    constructor(creatorID: string) {
        this.dateCreated = new Date();
        this.creator = creatorID;
        this.participants = [];
        this.started = false;
        this.history = [];
        this.standings = {
            dnf: [],
            finished: [],
        };
        this.bets = new BetManager();
        this.payouts = {
            bets: [],
            prizes: [],
        };
    }

    join(userID: string, wallet: Wallet): boolean | RaceJoinError {
        let races = GameManager.instance.races.races;
        let user = GameManager.instance.users.getUser(userID);
        if (this.started) {
            return "already started";
        }

        if (user.pet === null) {
            return "has no pet";
        }

        for (const race of races) {
            if (race.participants.includes(userID)) {
                return "already in race";
            }
        }

        if (this.participants.length >= Race.MAX_PARTICIPANTS) {
            return "at max participants";
        }

        let amount = wallet.withdraw(Race.RACE_FEE);
        if (amount === "insufficient funds") {
            return "insufficient funds";
        }

        this.participants.push(userID);
        return true;
    }

    leave(userID: string): boolean | RaceLeaveError {
        if (this.started) {
            return "already started";
        }

        if (!this.participants.includes(userID)) {
            return "not in race";
        }

        // The user has left the race :(
        let index = this.participants.indexOf(userID);
        this.participants.splice(index, 1);
        return true;
    }

    start(userID: string): boolean | RaceStartError {
        if (this.started) {
            return "already started";
        }

        // Only the user can start the race
        if (userID !== this.creator) {
            return "not creator";
        }

        // Ensure there are enough participants
        if (
            this.participants.length < Race.MIN_PARTICIPANTS ||
            this.participants.length > Race.MAX_PARTICIPANTS
        ) {
            return "invalid num participants";
        }

        // Run the race
        this.started = true;
        this.history = [
            this.participants.map((p) => ({
                userID: p,
                energy:
                    GameManager.instance.users.getUser(p).pet?.var.energy ?? 0,
                distance: 0,
                advance: 0,
                bonusAdvance: 0,
                finished: false,
                action: "idle",
            })),
        ];
        this.standings = {
            finished: [],
            dnf: [],
        };
        while (this.step());
        return true;
    }

    private step(): boolean {
        let stepNum = this.history.length;
        let currentSnapshot = Util.clone(this.history[stepNum - 1]);
        const finishUser = (
            snapshot: IndividualSnapshot,
            standing: RaceStanding
        ) => {
            snapshot.finished = true;
            snapshot.action = standing;
            if (standing === "finished") {
                this.standings.finished.push(snapshot.userID);
            } else {
                this.standings.dnf.push(snapshot.userID);
            }
        };

        for (let i = 0; i < currentSnapshot.length; i++) {
            let snapshot = currentSnapshot[i];
            snapshot.action = "idle";
            snapshot.advance = 0;
            snapshot.bonusAdvance = 0;
            // User already finished
            if (snapshot.finished) {
                continue;
            }
            // DNF out of steps
            if (stepNum === Race.RACE_MAX_STEPS) {
                finishUser(snapshot, "dnf-time");
                continue;
            }
            // DNF pet is dead
            let pet = GameManager.instance.users.getUser(snapshot.userID).pet;
            if (pet === null) {
                finishUser(snapshot, "dnf-dead");
                continue;
            }
            // DNF pet out of energy
            if (pet.var.energy === 0) {
                finishUser(snapshot, "dnf-energy");
                continue;
            }

            // Try advancing the pet
            let advanceMin = Util.randInt(200);
            let petAdvance = pet.var.speed + 90;
            if (petAdvance >= advanceMin) {
                pet.changeVar("energy", -1);
                snapshot.energy = pet.var.energy;
                snapshot.advance = Util.randBetween(5, 15);
                snapshot.advance += Util.randBetween(
                    0,
                    Math.round(pet.var.speed / 20)
                );
                snapshot.distance += snapshot.advance;
                snapshot.action = "advance";

                let bonusMin = Util.randInt(300);
                let bonusAdvance = pet.var.stamina + 150;
                if (bonusAdvance >= bonusMin) {
                    snapshot.bonusAdvance = Util.randBetween(1, 10);
                    snapshot.distance += snapshot.bonusAdvance;
                }
            }

            // Check if finished
            if (snapshot.distance >= Race.RACE_DISTANCE) {
                snapshot.distance = Race.RACE_DISTANCE;
                finishUser(snapshot, "finished");
            }
        }
        this.history.push(currentSnapshot);

        // Finish if everyone's finished
        if (currentSnapshot.find((i) => !i.finished) === undefined) {
            return false;
        } else {
            return true;
        }
    }

    payout() {
        this.payoutPrizes();
        this.payoutBets();
        this.participants.forEach((p) => {
            let pet = GameManager.instance.users.getUser(p).pet;
            if (pet) {
                pet.cooldowns.races.cooldown = Race.PARTICIPATE_COOLDOWN;
            }
        });
    }

    payoutBets() {
        let payouts = this.bets.payout(this.standings.finished[0]);
        this.payouts.bets = payouts;
    }

    payoutPrizes() {
        let prizes: PrizePayout[] = [];
        let numPrizes = this.participants.length - Race.RACE_PRIZES_MIN_NOPRIZE;
        let index = Math.max(Race.RACE_PRIZES.length - numPrizes, 0);
        let prizePool = Race.RACE_PRIZES.slice(index);

        for (
            let i = 0;
            i < Math.min(this.standings.finished.length, prizePool.length);
            i++
        ) {
            let userID = this.standings.finished[i];
            let money = prizePool[i].money;
            let xp = prizePool[i].xp;

            let user = GameManager.instance.users.getUser(userID);
            user.wallet.deposit(money);
            if (user.pet) {
                user.pet.changeVar("xp", xp);
            }

            prizes.push({ userID, money, xp });
        }
        for (let i = 0; i < this.standings.finished.length; i++) {
            if (i === 0 || i === 1 || i == 2) {
                let userID = this.standings.finished[i];
                let user = GameManager.instance.users.getUser(userID);
                user.pet?.trophies.push({
                    type: "race",
                    place: (i + 1) as 1 | 2 | 3,
                });
            }
        }
        this.payouts.prizes = prizes;
        return prizes;
    }

    //#region Serialization
    serialize(): RaceSerialized {
        return {
            bets: this.bets.serialize(),
            creator: this.creator,
            dateCreated: this.dateCreated.toISOString(),
            history: this.history,
            participants: this.participants,
            payouts: this.payouts,
            standings: this.standings,
            started: this.started,
        };
    }
    deserialize(obj: RaceSerialized): Race {
        this.bets = create(BetManager).deserialize(obj.bets);
        this.creator = obj.creator;
        this.dateCreated = new Date(obj.dateCreated);
        this.history = obj.history;
        this.participants = obj.participants;
        this.payouts = obj.payouts;
        this.standings = obj.standings;
        this.started = obj.started;
        return this;
    }
    //#endregion
}
