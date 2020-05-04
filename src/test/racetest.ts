import GameManager from "../game/GameManager";
import Item from "../game/shop/Item";
import Pet from "../game/user/pet/Pet";
import Wallet from "../game/user/banking/Wallet";
import Race from "../game/events/Race";
import fs from "fs";

let capsule = GameManager.instance.shop.buy(
    { id: "basic-pet-capsule" },
    new Wallet()
)[0] as Item;

let kevin = GameManager.instance.users.getUser("kevin");
kevin.setPet(
    new Pet({
        capsule,
        name: "kev pet",
    })
);
let charlie = GameManager.instance.users.getUser("charlie");
charlie.setPet(
    new Pet({
        capsule,
        name: "char pet",
    })
);

let race = GameManager.instance.races.createRace("kevin") as Race;
race.join("charlie", charlie.wallet);

let save = GameManager.instance.serialize();

function test(kev: number, char: number): number {
    GameManager.instance.deserialize(save);

    let kevPet = GameManager.instance.users.getUser("kevin").pet!;
    kevPet.setVar("speed", kev);
    kevPet.setVar("stamina", kev);
    let charPet = GameManager.instance.users.getUser("charlie").pet!;
    charPet.setVar("speed", char);
    charPet.setVar("stamina", char);

    let race = GameManager.instance.races.getRace("kevin") as Race;
    race.start("kevin");

    // race.history.forEach((h, i) => {
    //     console.log("----- Turn ", i, "-----");
    //     h.forEach(i => {
    //         if (i.action === "advance") {
    //             console.log(i.userID, "advanced:", i.advance, "bonus:", i.bonusAdvance);
    //         }
    //         if (i.action === "dnf-dead" || i.action === "dnf-energy" || i.action === "dnf-time") {
    //             console.log(i.userID, i.action);
    //         }
    //     });
    //     console.log();
    //     h.forEach(i => {
    //         if (i.finished) {
    //             console.log(i.userID, "finished!", "energy:", i.energy);
    //         } else {
    //             console.log(i.userID, "distance:", i.distance, "energy:", i.energy);
    //         }
    //     });
    // });
    if (race.standings.finished[0] === "kevin") {
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
