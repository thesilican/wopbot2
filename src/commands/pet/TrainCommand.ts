import { Client, CommandMessage, Validator } from "its-not-commando";
import Pet, { TrainingType } from "../../game/user/pet/Pet";
import PetBaseCommand from "./PetBaseCommand";

export default class TrainCommand extends PetBaseCommand {
    constructor() {
        super({
            name: "train",
            group: "pet",
            aliases: ["t"],
            usage: [
                {
                    name: "hurdles/fight/jog/swim/walk",
                    optional: true,
                    validator: Validator.OneOf([
                        "hurdles",
                        "fight",
                        "jog",
                        "swim",
                        "walk",
                    ]),
                },
                {
                    name: "user",
                    optional: true,
                    validator: Validator.User,
                },
            ],
            description: "Train your pet to increase its stats",
            details:
                "Train your pet to increase it's strength, speed, and stamina, " +
                "different activities will boost your pet in different ways.\n" +
                "You can train one of the following ways:\n" +
                "`p.train hurdles` - Jump over some hurdles with your pet\n" +
                "`p.train fight @User` - Start a playful play fight with another pet, " +
                "the other person must also do `p.fight @You`\n" +
                "`p.train jog` - Go for a jog with your pet\n" +
                "`p.train swim` - Take a dip with your pet at the pool\n" +
                "`p.train walk` - Go for a short walk with your pet",
            examples: [
                ["train hurdles", 'Train your pet with the "hurdles" exercise'],
                [
                    "train fight @Kevin",
                    "Train your pet by mock fighting with Kevin's pet. Kevin must first respond",
                ],
            ],
        });
    }

    async run(
        msg: CommandMessage,
        args: string[],
        client: Client
    ): Promise<void> {
        let userID = msg.author.id;
        let pet = this.checkPet(msg);
        if (pet === null) return;

        let activity = args[0];
        let fightUser = args[1];
        if (activity === undefined) {
            let messageText =
                "You can train one of the following ways:\n" +
                "`p.train hurdles` - Jump over some hurdles with your pet\n" +
                "`p.train fight @User` - Start a playful play fight with another pet, " +
                "the other person must also do `p.fight @You`\n" +
                "`p.train jog` - Go for a jog with your pet\n" +
                "`p.train swim` - Take a dip with your pet at the pool\n" +
                "`p.train walk` - Go for a short walk with your pet";
            msg.say(messageText);
            return;
        }
        if (activity === "fight") {
            if (fightUser === undefined) {
                msg.say(
                    "You must use `p.train fight @user` " +
                        "with whoever's pet you'd like to train with"
                );
                return;
            }
            if (fightUser === msg.author.id) {
                msg.say("Your pet cannot fight with itself!");
                return;
            }
        }

        let deltas = Pet.emptyDelta();
        let res = pet.train(activity as TrainingType, deltas, {
            userID,
            fightUser,
        });
        if (res === "pet is dead") {
            msg.say("Your pet is dead");
            return;
        }
        if (res === "not enough energy") {
            msg.say(
                msg.author.username + ", your pet is too tired (needs 5 energy)"
            );
            return;
        }
        if (res === "fight cannot find user") {
            let username = client.users.get(fightUser)?.username;
            msg.say(username + " does not have a pet");
            return;
        }

        if (activity === "fight") {
            let username = client.users.get(fightUser)?.username;
            if (pet.cooldowns.training.waitingForFight) {
                msg.channel.send(
                    "You want to play-fight with " +
                        username +
                        "'s pet!" +
                        "\nThey must use `p.train fight @" +
                        msg.author.username +
                        "` for both pets complete the training"
                );
            } else {
                msg.channel.send(
                    "You successfully trained your pet with " +
                        username +
                        "'s pet :muscle::muscle::muscle:\n" +
                        PetBaseCommand.getDeltaMessage(deltas)
                );
            }
        } else {
            let icon = {
                hurdles: ":muscle::muscle::muscle:",
                fight: "",
                jog: ":dash::dash::dash:",
                swim: ":ocean::ocean::ocean:",
                walk: ":dash::dash::dash:",
            }[activity as TrainingType];
            msg.channel.send(
                "You successfully trained your pet " +
                    icon +
                    "\n" +
                    PetBaseCommand.getDeltaMessage(deltas)
            );
        }
    }
}
