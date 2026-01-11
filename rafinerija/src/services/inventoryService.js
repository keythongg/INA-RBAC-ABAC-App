import { fetchData } from "./api";

export const getInventory = async () => {
    return await fetchData("inventory");
};
