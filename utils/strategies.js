const AllStrategies = {
    YetToSelect: 0,
    MaxHealthToLowest: 1,
    LowestHealthToMax: 2,
    MaxStrengthToLowest: 3,
    LowestStrengthToMax: 4,
};

const decodeStrategy = (strategyId) => {
    return Object.keys(AllStrategies).find(key => AllStrategies[key] === strategyId) || null;
};

const decideVictim = (strategy, opponents) => {
    switch (strategy) {
        case 'MaxHealthToLowest':
            return opponents.reduce((max, char) => (char.health > max.health ? char : max));
        case 'LowestHealthToMax':
            return opponents.reduce((min, char) => (char.health < min.health ? char : min));
        case 'MaxStrengthToLowest':
            return opponents.reduce((max, char) => (char.strength > max.strength ? char : max));
        case 'LowestStrengthToMax':
            return opponents.reduce((min, char) => (char.strength < min.strength ? char : min));
        default:
            console.error('Invalid strategy');
            return null;
    }
};

module.exports = {
    AllStrategies,
    decodeStrategy,
    decideVictim,
};
