type Class<T> = { new (...args: any[]): T };

export function create<T>(obj: Class<T>): T {
    return Object.create(obj.prototype);
}

export default interface Serializable<T, S> {
    serialize(): S;

    deserialize(obj: S): T;
}
