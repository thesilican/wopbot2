import Logger from "../Logger";
import Util from "../Util";
import BrawlManager, { BrawlManagerSerialized } from "./events/BrawlManager";
import RaceManager, { RaceManagerSerialized } from "./events/RaceManager";
import Park, { ParkSerialized } from "./fun/Park";
import { SlotMachine } from "./fun/SlotMachine";
import Leaderboard from "./Leaderboard";
import Serializable, { create } from "./Serializable";
import Shop from "./shop/Shop";
import Tickable from "./Tickable";
import UserManager, { UserManagerSerialized } from "./user/UserManager";
import Program from "../Program";

type GameManagerSerialized = {
    ticks: number;
    lastTicked: string;
    users: UserManagerSerialized;
    races: RaceManagerSerialized;
    brawls: BrawlManagerSerialized;
    park: ParkSerialized;
};

export default class GameManager
    implements Tickable, Serializable<GameManager, GameManagerSerialized> {
    static readonly TICK_SPAN = 30 * 60 * 1000;

    users: UserManager;
    races: RaceManager;
    brawls: BrawlManager;
    shop: Shop;
    park: Park;
    slotMachine: SlotMachine;
    leaderboard: Leaderboard;

    lastTicked: Date;
    ticks: number;

    constructor() {
        this.users = new UserManager();
        this.races = new RaceManager();
        this.brawls = new BrawlManager();
        this.shop = new Shop();
        this.park = new Park();
        this.slotMachine = new SlotMachine();
        this.leaderboard = new Leaderboard();

        this.lastTicked = new Date();
        this.ticks = 0;
    }

    tick() {
        this.users.tick();
        this.park.tick();
    }

    catchUpTicks() {
        // Check disabled
        if (Program.config.pauseTicks) {
            Logger.debug("Skipped ticking game - ticks paused");
            return;
        }
        let curTime = new Date().getTime();
        let times = 0;
        while (curTime > this.lastTicked.getTime() + GameManager.TICK_SPAN) {
            times++;
            this.tick();
            this.lastTicked = new Date(
                this.lastTicked.getTime() + GameManager.TICK_SPAN
            );
        }
        if (times !== 0) {
            Logger.debug("Ticking game x" + times);
        }
    }

    //#region Serialization
    serialize(): GameManagerSerialized {
        return {
            ticks: this.ticks,
            lastTicked: this.lastTicked.toISOString(),
            users: this.users.serialize(),
            races: this.races.serialize(),
            brawls: this.brawls.serialize(),
            park: this.park.serialize(),
        };
    }
    deserialize(obj: GameManagerSerialized): GameManager {
        obj = Util.clone(obj);
        this.ticks = obj.ticks;
        this.lastTicked = new Date(obj.lastTicked);
        this.users = create(UserManager).deserialize(obj.users);
        this.races = create(RaceManager).deserialize(obj.races);
        this.brawls = create(BrawlManager).deserialize(obj.brawls);
        this.shop = new Shop();
        this.park = create(Park).deserialize(obj.park);
        this.slotMachine = new SlotMachine();
        this.leaderboard = new Leaderboard();
        return this;
    }
    //#endregion Seralization

    //#region Static methods
    private static _instance?: GameManager;

    static get instance(): GameManager {
        if (this._instance === undefined) {
            this._instance = new GameManager();
        }
        // Catch up first
        this._instance.catchUpTicks();
        return this._instance;
    }

    static load(seralized: GameManagerSerialized) {
        GameManager._instance = create(GameManager).deserialize(seralized);
    }
    //#endregion
}
