import Serializable, { create } from "../Serializable";
import Tickable from "../Tickable";
import User, { UserSerialized } from "../user/User";

export type UserManagerSerialized = UserSerialized[];

export default class UserManager
    implements Tickable, Serializable<UserManager, UserManagerSerialized> {
    users: User[];

    constructor() {
        this.users = [];
    }

    getUser(id: string) {
        let user = this.users.find((u) => u.id === id);
        if (user === undefined) {
            user = new User({ id });
            this.users.push(user);
        }
        return user;
    }

    tick() {
        this.users.forEach((u) => u.tick());
    }

    //#region Serialization
    serialize(): UserManagerSerialized {
        return this.users.map((u) => u.serialize());
    }
    deserialize(obj: UserManagerSerialized): UserManager {
        this.users = obj.map((u) => create(User).deserialize(u));
        return this;
    }
    //#endregion
}
