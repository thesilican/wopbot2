import resources from "../../../resources.json";
import Util from "../../../Util";
import GameManager from "../../GameManager";
import Serializable from "../../Serializable";
import Item from "../../shop/Item";
import Tickable from "../../Tickable";

// Shortcut:
const randInt = Util.randInt;
const randBetween = Util.randBetween;
const oneIn = Util.oneIn;

export const PetVarArr = [
    "health",
    "hunger",
    "happiness",
    "speed",
    "strength",
    "stamina",
    "energy",
    "xp",
    "xpLevel",
] as const;
export type PetVar = typeof PetVarArr[number];
export type PetVars = {
    [id in PetVar]: number;
};
export type PetVarsDelta = PetVars;

export type PetRarity = "common" | "uncommon" | "rare";
export type TrainingType = "hurdles" | "fight" | "jog" | "swim" | "walk";
export type PetCooldowns = {
    food: {
        noodles: number;
        coffee: number;
        coffeeAmount: {
            speed: number;
            strength: number;
            stamina: number;
        };
        honey: number;
        super_kale: number;
        super_kale_sickness: number;
    };
    training: {
        cooldown: number;
        waitingForFight: string | null;
    };
    brawl: {
        cooldown: number;
    };
    races: {
        cooldown: number;
    };
    park: {
        cooldown: number;
    };
};

export type PetOptions = {
    name: string;
    capsule: Item;
};

export type PetSerialized = {
    dateBorn: string;
    name: string;
    var: PetVars;
    cooldowns: PetCooldowns;
    trophies: PetTrophy[];
    rarity: PetRarity;
    type: number;
    ticks: number;
};

export type PetTrophy = {
    type: "race" | "brawl";
    // For races only
    place?: 1 | 2 | 3;
};

const emptyDelta: PetVarsDelta = {
    health: 0,
    hunger: 0,
    happiness: 0,
    speed: 0,
    strength: 0,
    stamina: 0,
    energy: 0,
    xp: 0,
    xpLevel: 0,
};
const defaultCooldowns: PetCooldowns = {
    food: {
        noodles: 0,
        coffee: 0,
        coffeeAmount: {
            speed: 0,
            strength: 0,
            stamina: 0,
        },
        honey: 0,
        super_kale: 0,
        super_kale_sickness: 0,
    },
    training: {
        cooldown: 144,
        waitingForFight: null,
    },
    brawl: {
        cooldown: 0,
    },
    races: {
        cooldown: 0,
    },
    park: {
        cooldown: 0,
    },
};

type PetError = "pet is dead";
type PetActionError = PetError | "not enough energy";
type PetFeedRes =
    | PetActionError
    | "item not food"
    | "too much kale"
    | "already on kale";
type PetTrainingRes = PetActionError | "fight cannot find user";

export default class Pet implements Tickable, Serializable<Pet, PetSerialized> {
    dateBorn: Date;
    name: string;
    var: PetVars;
    cooldowns: PetCooldowns;
    trophies: PetTrophy[];
    rarity: PetRarity;
    type: number;
    ticks: number;

    //#region Constructor options
    constructor(options: PetOptions) {
        this.dateBorn = new Date();
        this.name = options.name;
        this.rarity = this.genRarity(options.capsule);
        this.var = this.genVars(this.rarity);
        this.type = this.genType(this.rarity);
        this.cooldowns = Util.clone(defaultCooldowns);
        this.trophies = [];
        this.ticks = 0;
    }

    private genRarity(capsule: Item): PetRarity {
        let pool: [PetRarity, number][] = [];
        if (capsule.id === "basic-pet-capsule") {
            pool = [
                ["common", 80],
                ["uncommon", 15],
                ["rare", 5],
            ];
        } else if (capsule.id === "advanced-pet-capsule") {
            pool = [
                ["common", 60],
                ["uncommon", 30],
                ["rare", 10],
            ];
        } else {
            pool = [
                ["uncommon", 60],
                ["rare", 40],
            ];
        }
        return Util.randChooseWeighted(pool);
    }

    private genVars(rarity: PetRarity): PetVars {
        const DEFAULT_VARS = {
            health: 100,
            hunger: 0,
            happiness: 80,
            energy: 10,
            xp: 0,
            xpLevel: 0,
        };
        let min: number, max: number;

        switch (rarity) {
            case "common":
                min = 5;
                max = 15;
                break;
            case "uncommon":
                min = 10;
                max = 20;
                break;
            case "rare":
                min = 20;
                max = 30;
                break;
        }

        let stats = {
            speed: randBetween(min, max),
            strength: randBetween(min, max),
            stamina: randBetween(min, max),
        };
        return Util.extend(stats, DEFAULT_VARS);
    }

    private genType(rarity: PetRarity): number {
        return randInt(0, resources.img.pet[rarity].length);
    }
    //#endregion

    //#region Helper functions
    setVar(petVar: PetVar, amount: number, delta?: PetVarsDelta) {
        const min = {
            health: 0,
            hunger: 0,
            happiness: 0,
            speed: 0,
            strength: 0,
            stamina: 0,
            energy: 0,
            xp: 0,
            xpLevel: 0,
        };
        const max = {
            health: 100,
            hunger: 100,
            happiness: 100,
            speed: 100,
            strength: 100,
            stamina: 100,
            energy: 10,
            xp: Infinity,
            xpLevel: Infinity,
        };
        let before = this.var[petVar];
        let after = Math.min(Math.max(amount, min[petVar]), max[petVar]);
        this.var[petVar] = after;
        if (delta !== undefined) {
            delta[petVar] += after - before;
        }
    }
    changeVar(petVar: PetVar, amount: number, delta?: PetVarsDelta) {
        this.setVar(petVar, this.var[petVar] + amount, delta);
    }
    isAlive(): boolean {
        return this.var.health > 0;
    }
    //#endregion

    //#region Pet Actions
    feed(food: Item, delta: PetVarsDelta): PetVarsDelta | PetFeedRes {
        if (!this.isAlive()) {
            return "pet is dead";
        }
        if (food.category !== "food" && food.category !== "special-food") {
            return "item not food";
        }

        // Normal foods
        if (food.category === "food") {
            if (this.var.energy < 2) {
                return "not enough energy";
            }

            this.setVar("hunger", 0, delta);
            this.changeVar("energy", -2, delta);
            this.changeVar("xp", randBetween(5, 10), delta);
            if (food.subcategory === "healthy-food") {
                if (oneIn(3)) {
                    this.changeVar("health", 10, delta);
                }
            } else {
                if (oneIn(2)) {
                    this.changeVar("happiness", -10, delta);
                }
                if (oneIn(5)) {
                    this.changeVar("health", -10, delta);
                }
            }
            return delta;
        }

        // Special foods
        if (food.id === "beer") {
            this.setVar("energy", 10, delta);
        } else if (food.id === "noodles") {
            this.cooldowns.food.noodles = 48;
        } else if (food.id === "fortune-cookie") {
            let petVars = ["health", "hunger", "happiness", "speed", "strength", "stamina"]  as PetVar[];
            petVars = petVars.filter(v => this.var[v] !== 100 && this.var[v] !== 0);
            if (petVars.length === 0) {
                petVars = ["hunger"];
            }
            let petVar = Util.randChoose(petVars);
            if (oneIn(2)) {
                this.changeVar(petVar, 10, delta);
            } else {
                this.changeVar(petVar, -10, delta);
            }
        } else if (food.id === "honey") {
            this.cooldowns.food.honey = 48;
        } else if (food.id === "coffee") {
            this.cooldowns.food.coffee = 48;
            let amount = randBetween(20, 30);
            this.cooldowns.food.coffeeAmount["speed"] += amount;
            this.changeVar("speed", amount, delta);
            this.cooldowns.food.coffeeAmount["strength"] += amount;
            this.changeVar("strength", amount, delta);
            this.cooldowns.food.coffeeAmount["stamina"] += amount;
            this.changeVar("stamina", amount, delta);
        } else if (food.id === "super-kale") {
            if (this.cooldowns.food.super_kale > 0) {
                return "already on kale";
            }
            if (this.cooldowns.food.super_kale_sickness > 0) {
                return "too much kale";
            }
            this.setVar("health", 100, delta);
            this.setVar("hunger", 0, delta);
            this.setVar("happiness", 100, delta);
            this.cooldowns.food.super_kale = 144;
            this.cooldowns.food.super_kale_sickness = 288;
        }
        return delta;
    }
    play(delta: PetVarsDelta): PetVarsDelta | PetActionError {
        if (!this.isAlive()) {
            return "pet is dead";
        }
        if (this.var.energy < 3) {
            return "not enough energy";
        }
        this.setVar("happiness", 100, delta);
        this.changeVar("energy", -3, delta);
        this.changeVar("xp", randBetween(5, 10), delta);
        return delta;
    }
    train(
        type: TrainingType,
        delta: PetVarsDelta,
        fightOptions?: { userID: string; fightUser: string }
    ): PetVarsDelta | PetTrainingRes {
        if (!this.isAlive()) {
            return "pet is dead";
        }
        if (this.var.energy < 5) {
            return "not enough energy";
        }

        let speed = 0,
            strength = 0,
            stamina = 0;
        if (type === "fight") {
            if (fightOptions === undefined) {
                throw Error("This was not supposed to happen");
            }
            let otherPet = GameManager.instance.users.getUser(
                fightOptions.fightUser
            ).pet;
            if (otherPet === null) {
                return "fight cannot find user";
            }

            if (
                otherPet.cooldowns.training.waitingForFight ===
                fightOptions.userID
            ) {
                let strengthAmount = randBetween(3, 5);
                let staminaAmount = randBetween(0, 1);

                otherPet.changeVar("strength", strengthAmount);
                otherPet.changeVar("stamina", staminaAmount);
                otherPet.changeVar("energy", -5);
                this.changeVar("strength", strengthAmount, delta);
                this.changeVar("stamina", staminaAmount, delta);
                this.changeVar("energy", -5, delta);

                otherPet.cooldowns.training.waitingForFight = null;
            } else {
                this.cooldowns.training.waitingForFight =
                    fightOptions.fightUser;
            }
            return delta;
        } else if (type === "walk") {
            stamina = 2;
        } else if (type === "hurdles") {
            strength = 2;
            stamina = randBetween(0, 1);
        } else if (type === "swim" || type === "jog") {
            speed = 2;
            stamina = randBetween(0, 1);
        }

        if (this.cooldowns.food.honey > 0) {
            if (speed > 0) speed += 5;
            if (strength > 0) strength += 5;
            if (stamina > 0) stamina += 5;
        }

        if (speed !== 0) {
            this.changeVar("speed", randBetween(1, speed), delta);
        }
        if (strength !== 0) {
            this.changeVar("strength", randBetween(1, strength), delta);
        }
        if (stamina !== 0) {
            this.changeVar("stamina", randBetween(1, stamina), delta);
        }
        this.changeVar("energy", -5, delta);
        this.cooldowns.training.cooldown = 144;
        return delta;
    }
    //#endregion

    //#region XP Actions
    levelUp(): boolean {
        if (this.canLevelUp()) {
            while (this.canLevelUp()) {
                this.var.xp -= this.xpThreshold();
                this.var.xpLevel++;
            }
            return true;
        } else {
            return false;
        }
    }

    canLevelUp(): boolean {
        return this.var.xp >= this.xpThreshold();
    }

    xpThreshold(): number {
        return 100 + this.var.xpLevel * 20;
    }
    //#endregion

    //#region Ticking
    tick(): void {
        if (!this.isAlive()) {
            return;
        }

        // Check death
        if (!this.isAlive()) {
            return;
        }

        // Hunger
        if (this.cooldowns.food.super_kale > 0) {
            if (oneIn(2)) {
                this.changeVar("hunger", -1);
            }
        } else {
            if (oneIn(2)) {
                this.changeVar("hunger", 3);
            }
        }

        // Happiness
        if (this.cooldowns.food.super_kale > 0) {
            this.changeVar("happiness", 1);
        } else {
            if (oneIn(4)) {
                this.changeVar("happiness", -1);
            }
            if (this.var.hunger > 70 && randInt(4) < 3) {
                this.changeVar("happiness", -1);
            }
        }

        // Health
        if (this.var.happiness > 30 && this.var.hunger < 70 && oneIn(4)) {
            this.changeVar("health", 1);
        }
        if (this.var.happiness <= 30) {
            this.changeVar("health", -1);
        }
        if (this.var.hunger >= 100) {
            this.changeVar("health", -1);
        }
        if (this.cooldowns.food.noodles > 0) {
            this.changeVar("health", 4);
        }

        // Training
        if (this.cooldowns.training.cooldown > 0) {
            this.cooldowns.training.cooldown--;
        } else {
            if (oneIn(7)) {
                this.changeVar("speed", -1);
            }
            if (oneIn(7)) {
                this.changeVar("strength", -1);
            }
            if (oneIn(7)) {
                this.changeVar("stamina", -1);
            }
        }

        // Energy
        this.changeVar("energy", 2);

        // Effects
        if (this.cooldowns.food.coffee > 0) {
            this.cooldowns.food.coffee--;
        } else {
            // Remove the coffee effect
            for (let prop in this.cooldowns.food.coffeeAmount) {
                let propVar = prop as "speed" | "strength" | "stamina";
                if (this.cooldowns.food.coffeeAmount[propVar] > 0) {
                    this.changeVar(
                        propVar,
                        -this.cooldowns.food.coffeeAmount[propVar]
                    );
                    this.cooldowns.food.coffeeAmount[propVar] = 0;
                }
            }
        }
        if (this.cooldowns.food.honey > 0) {
            this.cooldowns.food.honey--;
        }
        if (this.cooldowns.food.noodles > 0) {
            this.cooldowns.food.noodles--;
        }
        if (this.cooldowns.races.cooldown > 0) {
            this.cooldowns.races.cooldown--;
        }
        if (this.cooldowns.brawl.cooldown > 0) {
            this.cooldowns.brawl.cooldown--;
        }
        if (this.cooldowns.food.super_kale > 0) {
            this.cooldowns.food.super_kale--;
        }
        if (this.cooldowns.food.super_kale_sickness > 0) {
            this.cooldowns.food.super_kale_sickness--;
        }
        if (this.cooldowns.park.cooldown > 0) {
            this.cooldowns.park.cooldown--;
        }

        this.ticks++;
    }
    //#endregion

    //#region Serialization
    serialize(): PetSerialized {
        return {
            dateBorn: this.dateBorn.toISOString(),
            name: this.name,
            var: this.var,
            cooldowns: this.cooldowns,
            trophies: this.trophies,
            rarity: this.rarity,
            type: this.type,
            ticks: this.ticks,
        };
    }
    deserialize(obj: PetSerialized): Pet {
        this.dateBorn = new Date(obj.dateBorn);
        this.name = obj.name;
        this.var = obj.var;
        this.cooldowns = obj.cooldowns;
        this.trophies = obj.trophies;
        this.rarity = obj.rarity;
        this.type = obj.type;
        this.ticks = obj.ticks;
        return this;
    }
    //#endregion

    static emptyDelta() {
        return Util.clone(emptyDelta);
    }
}
