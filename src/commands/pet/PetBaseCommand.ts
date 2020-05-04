import Discord, { RichEmbed, TextChannel } from "discord.js";
import { Command, CommandMessage } from "its-not-commando";
import GameManger from "../../game/GameManager";
import Pet, { PetVarsDelta } from "../../game/user/pet/Pet";
import Program from "../../Program";
import resources from "../../resources.json";
import Util from "../../Util";

export default abstract class PetBaseCommand extends Command {
    static getPetEmbed(
        userID: string,
        username: string,
        client: Discord.Client,
        mini = false
    ): RichEmbed {
        // Let the chaos ensue
        const pad = (num: string | number, pad: number) => {
            // Sketchy
            return num.toString().padEnd(pad, " ");
        };
        const bar = (num: number) => {
            let len = Math.round((num / 100) * 10);
            return (
                "`" + "█".repeat(len) + "\u200e \u200e".repeat(10 - len) + "`"
            );
        };

        let embed = new RichEmbed();
        let pet = GameManger.instance.users.getUser(userID).pet;
        if (pet === null) {
            // Error case
            return embed;
        }

        let title = pet.name;
        let lbPos = GameManger.instance.leaderboard.getPlace(userID);
        let guild = client.guilds.get(Program.config.guild);
        let thumbnail =
            resources.img.url_base +
            resources.img.pet[pet.rarity][pet.type][
                pet.isAlive() ? "alive" : "dead"
            ];
        let color = { common: "GREEN", uncommon: "BLUE", rare: "GOLD" }[
            pet.rarity
        ];
        let statusSymbols = [];
        if (pet.cooldowns.food.coffee > 0) {
            statusSymbols.push(
                "(:coffee: " + pet.cooldowns.food.coffee / 2 + " hrs)"
            );
        }
        if (pet.cooldowns.food.honey > 0) {
            statusSymbols.push(
                "(:honey_pot: " + pet.cooldowns.food.honey / 2 + " hrs)"
            );
        }
        if (pet.cooldowns.food.noodles > 0) {
            statusSymbols.push(
                "(:ramen: " + pet.cooldowns.food.noodles / 2 + " hrs)"
            );
        }
        if (pet.cooldowns.food.super_kale > 0) {
            statusSymbols.push(
                "(:leafy_green: " + pet.cooldowns.food.super_kale / 2 + " hrs)"
            );
        }
        let parkVisit = GameManger.instance.park.visitors.find(
            (p) => p.userID === userID
        );
        if (parkVisit) {
            statusSymbols.push("(:park: " + parkVisit.ticksLeft / 2 + " hrs)");
        }
        let placeMedal = "";
        if (lbPos !== -1) {
            let lbEmoijs = Program.config.emojis.leaderboard;
            if (lbPos === 1) {
                let emoji = guild?.emojis.find(
                    (e) => e.name === lbEmoijs.first
                );
                placeMedal = emoji?.toString() + " ";
            } else if (lbPos === 2) {
                let emoji = guild?.emojis.find(
                    (e) => e.name === lbEmoijs.second
                );
                placeMedal = emoji?.toString() + " ";
            } else if (lbPos === 3) {
                let emoji = guild?.emojis.find(
                    (e) => e.name === lbEmoijs.third
                );
                placeMedal = emoji?.toString() + " ";
            }
        }
        let level =
            " **Level " +
            pet.var.xpLevel +
            " [" +
            pet.var.xp +
            "/" +
            pet.xpThreshold() +
            "]**\n";
        let header = "";
        let status = "";
        let stats = "";
        let trophies = "";
        let footer = "";

        if (mini) {
            // Minified
            header += placeMedal + " ";
            header += level;
            if (statusSymbols.length > 0) {
                header += " " + statusSymbols.join(" ");
            }
            header += "\n";
            stats =
                "" +
                ":hearts: `" +
                pad(pet.var.health + "%", 4) +
                "` " +
                ":poultry_leg: `" +
                pad(pet.var.hunger + "%", 4) +
                "` " +
                ":smiley: `" +
                pad(pet.var.happiness + "%", 4) +
                "` \n" +
                ":dash: `" +
                pad(pet.var.speed, 4) +
                "` " +
                ":muscle: `" +
                pad(pet.var.strength, 4) +
                "` " +
                ":bone: `" +
                pad(pet.var.stamina, 4) +
                "` " +
                ":zap: `" +
                pet.var.energy +
                "`\n";
            footer = username + "'s pet • Use p.pet to view your pet again";
        } else {
            // Normal
            // Header
            header += placeMedal + " ";
            header += level;
            header += Util.capitalize(pet.rarity) + " pet\n";
            // Trophies
            if (pet.trophies.length > 0) {
                trophies = "";
                let raceTrophies = pet.trophies.filter(
                    (t) => t.type === "race"
                );
                let brawlTrophies = pet.trophies.filter(
                    (b) => b.type === "brawl"
                );
                if (raceTrophies.length > 0) {
                    trophies += ":checkered_flag: (";
                    trophies += raceTrophies
                        .map((t) => {
                            if (t.place === 1) {
                                return ":first_place:";
                            } else if (t.place === 2) {
                                return ":second_place:";
                            } else if (t.place === 3) {
                                return ":third_place:";
                            }
                        })
                        .join(" ");
                    trophies += ") ";
                }
                if (brawlTrophies.length > 0) {
                    trophies += ":boxing_glove: (";
                    trophies += brawlTrophies.map(() => ":medal:").join(" ");
                    trophies += ")";
                }
                trophies += "\n";
            }
            // Status
            if (statusSymbols.length > 0) {
                status = "\n**Effects**\n";
                status += statusSymbols.join(" ") + "\n";
            }
            // Stats
            stats =
                "\n**Status**\n" +
                ":hearts: " +
                bar(pet.var.health) +
                " **" +
                pet.var.health +
                "%** health\n" +
                ":poultry_leg: " +
                bar(pet.var.hunger) +
                " **" +
                pet.var.hunger +
                "%** hunger\n" +
                ":smiley: " +
                bar(pet.var.happiness) +
                " **" +
                pet.var.happiness +
                "%** happiness\n" +
                ":dash: " +
                bar(pet.var.speed) +
                " **" +
                pet.var.speed +
                "** speed\n" +
                ":muscle: " +
                bar(pet.var.strength) +
                " **" +
                pet.var.strength +
                "** strength\n" +
                ":bone: " +
                bar(pet.var.stamina) +
                " **" +
                pet.var.stamina +
                "** stamina\n\n" +
                ":zap: ".repeat(pet.var.energy) +
                pet.var.energy +
                " energy\n";
            let mills = new Date().getTime() - pet.dateBorn.getTime();
            let days = Math.round(mills / 1000 / 60 / 60 / 24);
            footer = username + "'s pet • " + days + " days old";
        }
        embed
            .setTitle(title)
            .setColor(color)
            .setDescription(header + trophies + status + stats)
            .setThumbnail(thumbnail)
            .setFooter(footer);
        return embed;
    }

    static getLevelUpEmbed(userID: string | Pet): RichEmbed {
        let embed = new RichEmbed();

        let pet =
            typeof userID === "string"
                ? GameManger.instance.users.getUser(userID).pet
                : userID;
        if (pet === null) {
            return embed;
        }
        let thumbnail =
            resources.img.url_base +
            resources.img.pet[pet.rarity][pet.type][
                pet.isAlive() ? "alive" : "dead"
            ];

        embed
            .setTitle("⬆️ Level UP! ⬆️")
            .setDescription(pet.name + " has reached level " + pet.var.xpLevel)
            .setColor("GOLD")
            .setThumbnail(thumbnail);
        return embed;
    }

    static sendPetGraveyard(client: Discord.Client, userID: string) {
        let user = GameManger.instance.users.getUser(userID);
        let username = client.users.get(userID)?.username;
        let pet = user.pet;
        if (pet === null) {
            return;
        }
        let graveyardMessage = this.getPetEmbed(userID, username + "", client);
        let graveyard = client.channels.get(Program.config.channels.graveyard);
        if (graveyard instanceof TextChannel) {
            graveyard.send(graveyardMessage);
        }
        user.setPet(null);
    }

    checkPet(msg: CommandMessage, userID?: string): Pet | null {
        if (!userID) {
            userID = msg.author.id;
        }
        let pet = GameManger.instance.users.getUser(userID).pet;
        if (pet === null) {
            if (userID === msg.author.id) {
                msg.say(
                    msg.author.username +
                        ", you don't yet own a pet!\nBuy a pet capsule from the shop to get started"
                );
            } else {
                let username = msg.client.users.get(userID)?.username;
                msg.say(username + " doesn't have a pet yet");
            }
            return null;
        }
        if (!pet.isAlive()) {
            let index = Util.randInt(resources.img.death.length);
            let thumbnail = resources.img.url_base + resources.img.death[index];
            msg.say(pet.name + " has passed away :broken_heart:", {
                file: thumbnail,
            });
            PetBaseCommand.sendPetGraveyard(msg.client, userID);
            return null;
        }
        this.checkLevelUp(msg, userID);
        return pet;
    }

    checkLevelUp(msg: CommandMessage, userID?: string): boolean {
        if (!userID) {
            userID = msg.author.id;
        }
        let user = GameManger.instance.users.getUser(userID);
        let pet = user.pet;
        if (pet === null) {
            return false;
        }
        if (!pet.canLevelUp()) {
            return false;
        }
        pet.levelUp();
        let embed = PetBaseCommand.getLevelUpEmbed(pet);
        msg.say("", embed);
        return true;
    }

    static getDeltaMessage(deltas: PetVarsDelta): string {
        let msg = "";
        if (deltas.health !== 0) {
            let sign = deltas.health >= 0 ? "+" : "-";
            msg += "\n(" + sign + Math.abs(deltas.health) + ") health";
        }
        if (deltas.happiness !== 0) {
            let sign = deltas.happiness >= 0 ? "+" : "-";
            msg += "\n(" + sign + Math.abs(deltas.happiness) + ") happiness";
        }
        if (deltas.hunger !== 0) {
            let sign = deltas.hunger >= 0 ? "+" : "-";
            msg += "\n(" + sign + Math.abs(deltas.hunger) + ") hunger";
        }
        if (deltas.speed !== 0) {
            let sign = deltas.speed >= 0 ? "+" : "-";
            msg += "\n(" + sign + Math.abs(deltas.speed) + ") speed";
        }
        if (deltas.strength !== 0) {
            let sign = deltas.strength >= 0 ? "+" : "-";
            msg += "\n(" + sign + Math.abs(deltas.strength) + ") strength";
        }
        if (deltas.stamina !== 0) {
            let sign = deltas.stamina >= 0 ? "+" : "-";
            msg += "\n(" + sign + Math.abs(deltas.stamina) + ") stamina";
        }
        if (deltas.energy !== 0) {
            let sign = deltas.energy >= 0 ? "+" : "-";
            msg += "\n(" + sign + Math.abs(deltas.energy) + ") energy";
        }
        if (deltas.xp !== 0) {
            let sign = deltas.xp >= 0 ? "+" : "-";
            msg += "\n" + sign + Math.abs(deltas.xp) + " XP";
        }
        return msg.trimLeft();
    }
}
