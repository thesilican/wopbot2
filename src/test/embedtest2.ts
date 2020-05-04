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
    }

    getEmbed() {
        let content =
            "Prize: ₩200, 100XP\n\n" +
            "**Kevin**\n" +
            "*Bob's pet*\n" +
            ":heart: Health: 50% :zap: Energy: 9\n" +
            "\n" +
            "**Charlie** :trophy:\n" +
            "*Jane's pet*\n" +
            ":heart: Health: 60% :zap: Energy: 9";

        let embed = new RichEmbed()
            .setAuthor(
                "Brawl Results",
                "https://mrsiliconguy.github.io/HTML-Code/WopBot2.1/assets/trophy.png"
            )
            .setTitle("Kevin has won!")
            .setColor("RED")
            .setDescription(content)
            .setThumbnail(
                "https://mrsiliconguy.github.io/HTML-Code/WopBot2.1/assets/pet-uncommon-0-alive.gif"
            );
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
