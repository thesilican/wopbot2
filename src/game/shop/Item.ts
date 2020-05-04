import Util from "../../Util";
import Serializable from "../Serializable";
import shopResources from "./shopresources.json";

export type ItemOptions = {
    id: string;
    name: string;
    aliases?: string[];
    category: string;
    subcategory: string;
    icon: string;
};

export type ItemFilter = {
    name?: string;
    id?: string;
    category?: string;
    subcategory?: string;
    fuzzMatch?: number;
    custom?: (item: Item) => boolean;
};

export type ItemSerialized = {
    id: string;
};

export default class Item implements Serializable<Item, ItemSerialized> {
    id: string;
    name: string;
    aliases?: string[];
    category: string;
    subcategory: string;
    icon: string;

    constructor(options: ItemOptions) {
        this.id = options.id;
        this.name = options.name;
        this.category = options.category;
        this.subcategory = options.subcategory;
        this.icon = options.icon;
        this.aliases = options.aliases;
    }

    matches(filter: ItemFilter): boolean {
        if (filter.id && filter.id !== this.id) {
            return false;
        }
        if (filter.name) {
            let match = false;
            if (Util.fuzzyMatch(filter.name, this.name, filter.fuzzMatch)) {
                match = true;
            }
            if (this.aliases) {
                for (const alias of this.aliases) {
                    if (Util.fuzzyMatch(filter.name, alias, filter.fuzzMatch)) {
                        match = true;
                        break;
                    }
                }
            }
            if (!match) {
                return false;
            }
        }
        if (filter.category && filter.category !== this.category) {
            return false;
        }
        if (filter.subcategory && filter.subcategory !== this.subcategory) {
            return false;
        }
        if (filter.custom && !filter.custom(this)) {
            return false;
        }
        return true;
    }

    //#region Serializable
    serialize(): ItemSerialized {
        return {
            id: this.id,
        };
    }
    deserialize(obj: ItemSerialized): Item {
        let itemOptions = shopResources.items.find((i) => i.id === obj.id)!;
        return new Item(itemOptions);
    }
    //#endregion
}
