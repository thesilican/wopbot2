import Util from "../../Util";
import Wallet, { WithdrawError } from "../user/banking/Wallet";
import Item, { ItemFilter } from "./Item";
import ShopItem from "./ShopItem";
import shopResources from "./shopresources.json";

type ShopError = "not found" | WithdrawError;

export default class Shop {
    static readonly Items = shopResources.items.map((x) => new ShopItem(x));
    static readonly Categories = shopResources.categories;

    findItem(filter: ItemFilter): ShopItem | null {
        let items = Shop.Items.find((i) => i.item.matches(filter));
        return items ?? null;
    }

    buy(filter: ItemFilter, wallet: Wallet): Item[] | ShopError {
        let shopItem = this.findItem(filter);
        if (shopItem === null) {
            return "not found";
        }
        let amount = wallet.withdraw(shopItem.price);
        if (amount === "insufficient funds") {
            return amount;
        }
        let items = Array(shopItem.quantity)
            .fill(null)
            .map((_) => Util.clone(shopItem!.item));
        return items;
    }
}
