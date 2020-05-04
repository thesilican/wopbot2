import GameManager from "../game/GameManager";
import Pet from "../game/user/pet/Pet";
import Logger from "../Logger";
import Brawl from "../game/events/Brawl";
import fs from "fs";

let kevin = GameManager.instance.users.getUser("kevin");
let kevinCapsule = GameManager.instance.shop.buy(
    { name: "basic  pet capsule" },
    kevin.wallet
)[0];
if (typeof kevinCapsule === "string") {
    throw "Error";
}
let kevPet = new Pet({
    capsule: kevinCapsule,
    name: "kevin's pet",
});
kevin.setPet(kevPet);

let charlie = GameManager.instance.users.getUser("charlie");
let charlieCapsule = GameManager.instance.shop.buy(
    { name: "basic pet capsule" },
    charlie.wallet
)[0];
if (typeof charlieCapsule === "string") {
    throw "Error";
}
let charPet = new Pet({
    capsule: charlieCapsule,
    name: "charlie's pet",
});
charlie.setPet(charPet);

let brawl = GameManager.instance.brawls.createBrawl(kevin.id, charlie.id);
if (typeof brawl === "string") {
    throw "Error";
}
brawl.accept(charlie.id);

const saveState = GameManager.instance.serialize();
// Logger.log(saveState);
function test(kev: number, char: number): number {
    GameManager.load(saveState);
    // Modify the states
    let kevPet = GameManager.instance.users.getUser("kevin").pet!;
    let charPet = GameManager.instance.users.getUser("charlie").pet!;
    kevPet.setVar("speed", kev);
    kevPet.setVar("strength", kev);
    kevPet.setVar("stamina", kev);
    charPet.setVar("speed", char);
    charPet.setVar("strength", char);
    charPet.setVar("stamina", char);

    let brawl = GameManager.instance.brawls.getBrawl(kevin.id);
    if (brawl === null) {
        throw "error";
    }
    brawl.start(kevin.id);
    if (kev === 70 && char === 70) {
        console.log("Kevin's pet stats:\n", kevPet.var);
        console.log("Charlies's pet stats:\n", charPet.var);
        brawl.history.forEach((h, i) => {
            console.log("---------- Turn", i, "----------");
            let attIsCr = h.attacker === "creator";
            let attacker = attIsCr ? brawl?.creator : brawl?.opposition;
            let defender = attIsCr ? brawl?.opposition : brawl?.creator;
            console.log(attacker + "'s turn\n");
            if (h.action.includes("attack") || h.action.includes("cripple")) {
                if (h.action.includes("attack")) {
                    console.log(attacker + " has attacked for", h.damage);
                }
                if (h.action.includes("cripple")) {
                    console.log(attacker + " has crippled their opponent!");
                }
            } else if (h.action === "no energy") {
                console.log(attacker + " is out of energy");
            } else {
                console.log(h.action);
            }
            if (attIsCr) {
                console.log(attacker + " state:", h.creator);
                console.log(defender + " state:", h.opposition);
            } else {
                console.log(defender + " state:", h.creator);
                console.log(attacker + " state:", h.opposition);
            }
            console.log();
        });
        console.log("");
    }

    // console.log("Kev", kev, "Char", char);
    // console.log("Winner: " + (brawl.standings!.victor === "creator" ? kevin.id : charlie.id));
    let last = brawl.history[brawl.history.length - 1];
    // return (last.creator.health + last.opposition.health) / 2;
    // return last.creator.health;
    if (last.creator.health === 0) {
        // if (brawl.standings?.victor === "creator") {
        return 1;
    } else {
        return 0;
    }
}

let stats = [];
for (let i = 1; i <= 10; i++) {
    let arr = [];
    for (let j = 1; j <= 10; j++) {
        let sum = 0;
        for (let k = 0; k < 1000; k++) {
            sum += test(i * 10, j * 10);
        }
        arr.push(sum / 1000);
    }
    console.log(i);
    stats.push(arr);
}

// Write to file
let fStr = stats.map((s) => s.join(",")).join("\n");
fs.writeFile("data.csv", fStr, { encoding: "utf8" }, () => {});
