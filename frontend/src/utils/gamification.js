
export const getKintsugiStage = (gold) => {
    if (gold <= 500) {
        return 1; // State: Shattered/Broken
    } else if (gold <= 2500) {
        return 2; // State: Joined (Basic repair, no gold yet)
    } else if (gold <= 7500) {
        return 3; // State: Golden Cracks (Gold lacquer applied)
    } else {
        return 4; // State: Sealed Masterpiece (Glowing gold)
    }
};

export const KINTSUGI_MESSAGES = {
    1: "The journey of self-repair begins here.",
    2: "The pieces are coming together.",
    3: "Your resilience begins to shine like gold.",
    4: "Your reflection has become a masterpiece.",
};

export const calculateZenGold = (seconds) => {
    const goldEarned = Math.floor(seconds / 60) * 10;
    return goldEarned > 0 ? goldEarned : 10;
};