import GameManager from "./GameManager";
import Pet, { PetTrophy } from "./user/pet/Pet";

export type LeaderboardInfo = {
    userID: string;
    petName: string;
    xpLevel: number;
    xp: number;
    xpThreshold: number;
    dateBorn: Date;
    trophies: PetTrophy[];
};

export default class Leaderboard {
    getLeaderboard(): LeaderboardInfo[] {
        // Epic functional programming right here
        return GameManager.instance.users.users
            .map((u) => ({ id: u.id, pet: u.pet }))
            .filter((p) => p.pet !== null)
            .map((u) => ({ id: u.id, pet: u.pet as Pet }))
            .sort(({ pet: p1 }, { pet: p2 }) => {
                if (p1.var.xpLevel !== p2.var.xpLevel) {
                    return p2.var.xpLevel - p1.var.xpLevel;
                }
                if (p1.var.xp !== p2.var.xp) {
                    return p2.var.xp - p1.var.xp;
                }
                return p2.dateBorn.getTime() - p1.dateBorn.getTime();
            })
            .map((u) => ({
                userID: u.id,
                petName: u.pet.name,
                xpLevel: u.pet.var.xpLevel,
                xp: u.pet.var.xp,
                xpThreshold: u.pet.xpThreshold(),
                dateBorn: u.pet.dateBorn,
                trophies: u.pet.trophies,
            }));
    }

    getInfo(userID: string): LeaderboardInfo | null {
        return this.getLeaderboard().find((u) => u.userID === userID) ?? null;
    }

    getPlace(userID: string): number {
        return this.getLeaderboard().findIndex((u) => u.userID === userID) + 1;
    }
}
