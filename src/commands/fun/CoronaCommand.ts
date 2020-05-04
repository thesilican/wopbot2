import { Client, Command, CommandMessage } from "its-not-commando";

export default class CoronaCommand extends Command {
    constructor() {
        super({
            name: "coronavirus",
            group: "fun",
            aliases: ["corona", "covid", "covid-19", "COVID", "COVID-19"],
            description: "Don't get the coronavirus",
            hidden: true,
        });
    }

    async run(
        msg: CommandMessage,
        args: string[],
        client: Client
    ): Promise<void> {
        let funny = msg.say("Your pet got the coronavirus and passed away :(");
        (await funny).react("🇫");
        setTimeout(
            async () =>
                (await funny).edit(
                    "~~Your pet got the coronavirus and passed away :(~~ jk"
                ),
            10000
        );
    }
}
