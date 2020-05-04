import Item, { ItemOptions } from "./Item";

export type ShopItemOptions = ItemOptions & {
    price: number;
    quantity: number;
    description: string;
    postPurchaseMessage?: string;
};

export type ShopCategory = {
    id: string;
    name: string;
    subcategories: string[];
};

export default class ShopItem {
    item: Item;
    price: number;
    quantity: number;
    description: string;
    postPurchaseMessage?: string;

    constructor(options: ShopItemOptions) {
        this.item = new Item(options);
        this.price = options.price;
        this.quantity = options.quantity;
        this.description = options.description;
        this.postPurchaseMessage = options.postPurchaseMessage;
    }
}
