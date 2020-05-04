import _ from "lodash";
import Logger from "./Logger";

const fuzzyMatchDict: { [str1: string]: { [str2: string]: number } } = {};

const seed = undefined;

export default class Util {
    static generator: MersenneTwister;

    /**
     * Generate a random number between [0,1)
     */
    static random(): number {
        if (this.generator === undefined) {
            this.generator = new MersenneTwister(seed);
        }
        let amount = this.generator.random();
        if (amount < 0 || amount > 1) {
            throw "Mersenne Twister has problems";
        }
        return this.generator.random();
    }

    /**
     * Returns a random number between the specified range
     * @param min Inclusive min, or exclusive max if parameter max is not specified
     * @param max Exclusive max
     */
    static randInt(min: number, max?: number) {
        if (max === undefined) {
            max = min;
            min = 0;
        }
        if (min > max) {
            throw "Max must be greater than min";
        }

        return Math.floor(Util.random() * (max - min)) + min;
    }

    /**
     * Chooses a random item from an array
     * @param arr The array of items to choose from
     */
    static randChoose<T>(arr: T[]): T {
        let index = this.randInt(arr.length);
        return arr[index];
    }

    static randChooseWeighted<T>(pool: [T, number][]): T {
        let sum = pool.reduce((a, v) => a + v[1], 0);
        let index = this.randInt(sum);
        for (let i = 0; i < pool.length; i++) {
            if (index < pool[i][1]) {
                return pool[i][0];
            }
            index -= pool[i][1];
        }
        throw Error("Quantum mechanics forbids this");
    }

    /**
     * Choose a random number between a specific range
     * (Literally just randInt but inclusive)
     * @param min The inclusive minimum to use
     * @param max The inclusive maximum to use
     */
    static randBetween(min: number, max: number) {
        return Util.randInt(min, max + 1);
    }

    /**
     * Randomly get a chance value
     * @param chance The number of chances
     */
    static oneIn(chance: number): boolean {
        return Util.randInt(0, chance) === 0;
    }

    /**
     * Randomly shuffles an array
     * @param arr The array to shuffle
     */
    static shuffle<T>(arr: T[]): void {
        let len = arr.length;
        for (let i = 0; i < len; i++) {
            let j = Util.randInt(0, len);
            let tmp = arr[i];
            arr[i] = arr[j];
            arr[j] = tmp;
        }
    }

    static capitalize(str: string): string {
        return str.slice(0, 1).toUpperCase().concat(str.slice(1));
    }

    static plural(num: number, str: string, plural: string = "s") {
        return num + " " + (num === 1 ? str : str + plural);
    }

    static numberize(num: number): string {
        function getSuffix(num: number): string {
            // Ensure that the number is whole
            num = Math.round(num);
            if (num < 0) {
                return getSuffix(-num);
            } else if (num === 0) {
                return "th";
            } else if (num === 1) {
                return "st";
            } else if (num === 2) {
                return "nd";
            } else if (num === 3) {
                return "rd";
            } else if (num >= 4 && num <= 20) {
                return "th";
            } else if (num >= 21 && num <= 99) {
                return getSuffix(num % 10);
            } else {
                return getSuffix(num % 100);
            }
        }
        return num + getSuffix(num);
    }

    /**
     * Format time in a human friendly readable form
     * @param sec The amount of seconds to format
     */
    static formatTime(
        sec: number,
        level?: number,
        noSeconds: boolean = false
    ): string {
        const plural = Util.plural;
        const MINUTE = 60;
        const HOUR = MINUTE * 60;
        const DAY = HOUR * 24;

        if (sec < MINUTE && (level === undefined || level === 0)) {
            if (!noSeconds) return "";
            return plural(sec, "second");
        } else if (sec < HOUR && (level === undefined || level === 1)) {
            return (
                plural(Math.floor(sec / MINUTE), "minute") +
                " " +
                this.formatTime(sec % MINUTE, 0)
            );
        } else if (sec < DAY && (level === undefined || level === 2)) {
            return (
                plural(Math.floor(sec / HOUR), "hour") +
                " " +
                this.formatTime(sec % HOUR, 1)
            );
        } else {
            return (
                plural(Math.floor(sec / DAY), "day") +
                " " +
                this.formatTime(sec % DAY, 2)
            );
        }
    }

    /**
     * Format time in a SHORT human friendly readable form
     * @param sec The amount of seconds to format
     */
    static formatTimeShort(sec: number): string {
        const MINUTE = 60;
        const HOUR = MINUTE * 60;
        const DAY = HOUR * 24;

        if (sec < MINUTE) {
            return sec + "s";
        } else if (sec < HOUR) {
            return Math.floor(sec / MINUTE) + " min";
        } else {
            return Math.floor(sec / HOUR) + " hr";
        }
    }
    /**
     * Sleep for a varied amount of time (promise version of set timeout)
     * @param ms How many milliseconds to sleep for
     */
    static sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    private static fuzzyMatchScore(str1: string, str2: string): number {
        if (fuzzyMatchDict[str1] === undefined) {
            fuzzyMatchDict[str1] = {};
        }
        if (typeof fuzzyMatchDict[str1][str2] === "number") {
            return fuzzyMatchDict[str1][str2];
        }
        if (str1.length === 0) {
            fuzzyMatchDict[str1][str2] = str2.length;
        } else if (str2.length === 0) {
            fuzzyMatchDict[str1][str2] = str1.length;
        } else if (str1[0] === str2[0]) {
            fuzzyMatchDict[str1][str2] = this.fuzzyMatchScore(
                str1.slice(1),
                str2.slice(1)
            );
        } else {
            fuzzyMatchDict[str1][str2] =
                Math.min(
                    this.fuzzyMatchScore(str1.slice(0), str2.slice(1)),
                    this.fuzzyMatchScore(str1.slice(1), str2.slice(0)),
                    this.fuzzyMatchScore(str1.slice(1), str2.slice(1))
                ) + 1;
        }
        return fuzzyMatchDict[str1][str2];
    }
    /**
     * Fuzzy match two strings
     */
    static fuzzyMatch(str1: string, str2: string, ratio: number = 0.2) {
        let str1F = str1.toLowerCase().replace(/\s/g, "");
        let str2F = str2.toLowerCase().replace(/\s/g, "");
        let fuzzScore = this.fuzzyMatchScore(str1F, str2F);
        let avgLen = (str1F.length + str2.length) / 2;
        return fuzzScore / avgLen <= ratio;
    }

    static clone<T>(obj: T): T {
        return _.cloneDeep(obj);
    }

    static extend<T1, T2>(obj1: T1, obj2: T2): T1 & T2 {
        return _.extend(obj1, obj2);
    }

    static compareDeep(obj1: any, obj2: any): boolean {
        return _.isEqual(obj1, obj2);
    }
}

// Great thanks to https://github.com/thiloplanz/glulx-typescript/blob/master/mersenne-twister.ts
class MersenneTwister {
    /* Period parameters */
    private N = 624;
    private M = 397;
    private MATRIX_A = 0x9908b0df; /* constant vector a */
    private UPPER_MASK = 0x80000000; /* most significant w-r bits */
    private LOWER_MASK = 0x7fffffff; /* least significant r bits */

    private mt = new Array(this.N); /* the array for the state vector */
    private mti = this.N + 1; /* mti==N+1 means mt[N] is not initialized */

    constructor(seed?: number) {
        if (seed == undefined) {
            seed = new Date().getTime();
        }
        this.init_genrand(seed);
    }

    /* initializes mt[N] with a seed */
    private init_genrand(s: number) {
        this.mt[0] = s >>> 0;
        for (this.mti = 1; this.mti < this.N; this.mti++) {
            s = this.mt[this.mti - 1] ^ (this.mt[this.mti - 1] >>> 30);
            this.mt[this.mti] =
                ((((s & 0xffff0000) >>> 16) * 1812433253) << 16) +
                (s & 0x0000ffff) * 1812433253 +
                this.mti;
            /* See Knuth TAOCP Vol2. 3rd Ed. P.106 for multiplier. */
            /* In the previous versions, MSBs of the seed affect   */
            /* only MSBs of the array mt[].                        */
            /* 2002/01/09 modified by Makoto Matsumoto             */
            this.mt[this.mti] >>>= 0;
            /* for >32 bit machines */
        }
    }

    /* initialize by an array with array-length */
    /* init_key is the array for initializing keys */
    /* key_length is its length */
    /* slight change for C++, 2004/2/26 */
    init_by_array(init_key: any, key_length: any) {
        var i, j, k;
        this.init_genrand(19650218);
        i = 1;
        j = 0;
        k = this.N > key_length ? this.N : key_length;
        for (; k; k--) {
            var s = this.mt[i - 1] ^ (this.mt[i - 1] >>> 30);
            this.mt[i] =
                (this.mt[i] ^
                    (((((s & 0xffff0000) >>> 16) * 1664525) << 16) +
                        (s & 0x0000ffff) * 1664525)) +
                init_key[j] +
                j; /* non linear */
            this.mt[i] >>>= 0; /* for WORDSIZE > 32 machines */
            i++;
            j++;
            if (i >= this.N) {
                this.mt[0] = this.mt[this.N - 1];
                i = 1;
            }
            if (j >= key_length) j = 0;
        }
        for (k = this.N - 1; k; k--) {
            var s = this.mt[i - 1] ^ (this.mt[i - 1] >>> 30);
            this.mt[i] =
                (this.mt[i] ^
                    (((((s & 0xffff0000) >>> 16) * 1566083941) << 16) +
                        (s & 0x0000ffff) * 1566083941)) -
                i; /* non linear */
            this.mt[i] >>>= 0; /* for WORDSIZE > 32 machines */
            i++;
            if (i >= this.N) {
                this.mt[0] = this.mt[this.N - 1];
                i = 1;
            }
        }

        this.mt[0] = 0x80000000; /* MSB is 1; assuring non-zero initial array */
    }

    /* generates a random number on [0,0xffffffff]-interval */
    genrand_int32() {
        var y;
        var mag01 = new Array(0x0, this.MATRIX_A);
        /* mag01[x] = x * MATRIX_A  for x=0,1 */

        if (this.mti >= this.N) {
            /* generate N words at one time */
            var kk;

            if (this.mti == this.N + 1)
                /* if init_genrand() has not been called, */
                this.init_genrand(5489); /* a default initial seed is used */

            for (kk = 0; kk < this.N - this.M; kk++) {
                y =
                    (this.mt[kk] & this.UPPER_MASK) |
                    (this.mt[kk + 1] & this.LOWER_MASK);
                this.mt[kk] = this.mt[kk + this.M] ^ (y >>> 1) ^ mag01[y & 0x1];
            }
            for (; kk < this.N - 1; kk++) {
                y =
                    (this.mt[kk] & this.UPPER_MASK) |
                    (this.mt[kk + 1] & this.LOWER_MASK);
                this.mt[kk] =
                    this.mt[kk + (this.M - this.N)] ^
                    (y >>> 1) ^
                    mag01[y & 0x1];
            }
            y =
                (this.mt[this.N - 1] & this.UPPER_MASK) |
                (this.mt[0] & this.LOWER_MASK);
            this.mt[this.N - 1] =
                this.mt[this.M - 1] ^ (y >>> 1) ^ mag01[y & 0x1];

            this.mti = 0;
        }

        y = this.mt[this.mti++];

        /* Tempering */
        y ^= y >>> 11;
        y ^= (y << 7) & 0x9d2c5680;
        y ^= (y << 15) & 0xefc60000;
        y ^= y >>> 18;

        return y >>> 0;
    }

    /* generates a random number on [0,0x7fffffff]-interval */
    genrand_int31() {
        return this.genrand_int32() >>> 1;
    }

    /* generates a random number on [0,1]-real-interval */
    genrand_real1() {
        return this.genrand_int32() * (1.0 / 4294967295.0);
        /* divided by 2^32-1 */
    }

    /* generates a random number on [0,1)-real-interval */
    random(): number {
        return this.genrand_int32() * (1.0 / 4294967296.0);
        /* divided by 2^32 */
    }

    /* generates a random number on (0,1)-real-interval */
    genrand_real3() {
        return (this.genrand_int32() + 0.5) * (1.0 / 4294967296.0);
        /* divided by 2^32 */
    }

    /* generates a random number on [0,1) with 53-bit resolution*/
    genrand_res53() {
        var a = this.genrand_int32() >>> 5,
            b = this.genrand_int32() >>> 6;
        return (a * 67108864.0 + b) * (1.0 / 9007199254740992.0);
    }

    /* These real versions are due to Isaku Wada, 2002/01/09 added */
}
