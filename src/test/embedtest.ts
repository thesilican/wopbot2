import { RichEmbed } from "discord.js";
import { Client, Command, CommandMessage } from "its-not-commando";
import config from "./config.json";
import { MessageOptions } from "child_process";

class TestCommand extends Command {
    constructor() {
        super({
            name: "test",
            description: "cmd",
        });
    }
    async run(msg: CommandMessage) {
        msg.say("", this.getEmbed());
        msg.say("", this.getEmbedMini());
    }

    getEmbed() {
        let header = "**Level 6 [10/100]**\n" + "Common Pet\n";
        let trophies = //"**Trophies**\n" +
            ":checkered_flag: (:first_place: :first_place: :third_place:) :boxing_glove: (:medal:)\n";
        let status = "\n**Effects**\n:leafy_green: :coffee:\n";
        let stats =
            "\n**Status**\n" +
            ":hearts: `██████████░░░░░` **79%** health\n" +
            ":poultry_leg: `██████░░░░░░░░░` **79%** hunger\n" +
            ":smiley: `███████████░░░░` **99%** happiness\n" +
            ":dash: `██████████░░░░░` **50** speed\n" +
            ":muscle: `██████████░░░░░` **60** strength\n" +
            ":bone: `████████████░░░` **100** stamina\n\n" +
            ":zap: :zap: :zap: :zap: :zap: :zap: :zap: :zap: :zap: 9 energy\n";

        let embed = new RichEmbed()
            // .setAuthor("\u2800", "https://mrsiliconguy.github.io/HTML-Code/WopBot2.1/assets/trophy.png")
            .setTitle("Kevin")
            .setColor("BLUE")
            .setDescription(header + trophies + status + stats)
            .setThumbnail(
                "https://mrsiliconguy.github.io/HTML-Code/WopBot2.1/assets/pet-uncommon-0-alive.gif"
            )
            .setFooter("Bobs's pet • 25 days old");
        // .setTimestamp()
        return embed;
    }

    getEmbedMini() {
        let header = "**Level 6 [10/100]**";
        let status = " :leafy_green: :coffee:\n";
        let stats =
            "" +
            ":hearts: `79% ` " +
            ":poultry_leg: `79% ` " +
            ":smiley: `100%` \n" +
            ":dash: `50  ` " +
            ":muscle: `60  ` " +
            ":bone: `100 ` " +
            ":zap: `9`\n";

        let embed = new RichEmbed()
            // .setAuthor("\u2800", "https://mrsiliconguy.github.io/HTML-Code/WopBot2.1/assets/trophy.png")
            .setTitle("Kevin")
            .setColor("BLUE")
            .setDescription(header + status + stats)
            .setThumbnail(
                "https://mrsiliconguy.github.io/HTML-Code/WopBot2.1/assets/pet-uncommon-0-alive.gif"
            )
            .setFooter("Bobs's pet • Use p.pet to view your pet again");
        // .setTimestamp()
        return embed;
    }
}

let client = new Client({
    owner: config.owner,
    prefix: config.prefix,
    token: config.token,
});

client.registry.registerCommand(TestCommand);

client.start();
