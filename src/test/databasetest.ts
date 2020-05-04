import DatabaseManager from "../DatabaseManager";
(async () => {
    await DatabaseManager.save();
    console.log(await DatabaseManager.load());
})();
