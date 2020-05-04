export default class Logger {
    static log(...message: any[]) {
        console.log(Logger.timeStr(), ...message);
    }

    static error(...message: any[]) {
        console.error(Logger.timeStr(), ...message);
    }

    static debug(...message: any[]) {
        console.debug("[DEBUG]", Logger.timeStr(), ...message);
    }

    private static timeStr(): string {
        let date = new Date();
        let year = date.getFullYear();
        let month = date.getMonth().toString().padStart(2, "0");
        let day = date.getDate().toString().padStart(2, "0");
        let hour = date.getHours().toString().padStart(2, "0");
        let minute = date.getMinutes().toString().padStart(2, "0");
        let timeStr = `[${year}-${month}-${day} ${hour}:${minute}]`;
        return timeStr;
    }
}
