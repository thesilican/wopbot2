import Serializable, { create } from "../Serializable";
import Item, { ItemFilter, ItemSerialized } from "../shop/Item";

type InventoryError = "cannot find item";

export type InventorySerialized = {
    items: ItemSerialized[];
};

export default class Inventory
    implements Serializable<Inventory, InventorySerialized> {
    items: Item[];

    constructor() {
        this.items = [];
    }

    add(item: Item | Item[]) {
        if (Array.isArray(item)) {
            this.items = this.items.concat(item);
        } else {
            this.items.push(item);
        }
    }

    remove(filter: ItemFilter): Item | InventoryError {
        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i].matches(filter)) {
                return this.items.splice(i, 1)[0];
            }
        }
        return "cannot find item";
    }

    find(filter: ItemFilter): Item | InventoryError {
        return this.items.find((i) => i.matches(filter)) ?? "cannot find item";
    }

    //#region  Serializable
    serialize(): InventorySerialized {
        return {
            items: this.items.map((i) => i.serialize()),
        };
    }
    deserialize(obj: InventorySerialized): Inventory {
        this.items = obj.items.map((i) => create(Item).deserialize(i));
        return this;
    }
    //#endregion
}
