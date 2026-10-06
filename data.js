window.GAME_DATA = {
  classes: {
    Warrior: { name: "Warrior", hpDice: 10, spDice: 0, baseAc: 10, canCast: false },
    Paladin: { name: "Paladin", hpDice: 8, spDice: 0, baseAc: 10, canCast: false },
    Bard: { name: "Bard", hpDice: 7, spDice: 4, baseAc: 10, canCast: false, canSing: true },
    Rogue: { name: "Rogue", hpDice: 6, spDice: 0, baseAc: 10, canCast: false, canDisarm: true },
    Magician: { name: "Magician", hpDice: 4, spDice: 8, baseAc: 10, canCast: true },
    Sorcerer: { name: "Sorcerer", hpDice: 5, spDice: 10, baseAc: 10, canCast: true }
  },
  spells: [
    { code: "MAFL", name: "Mage Flame", discipline: "Magician", level: 1, spCost: 2, targetType: "UTILITY", effect: "LIGHT", value: 4, desc: "Illuminates corridors." },
    { code: "ARFI", name: "Arc Fire", discipline: "Magician", level: 1, spCost: 3, targetType: "ENEMY", effect: "DAMAGE", valueDice: "1d4+2", desc: "Fire blast on single target." },
    { code: "REST", name: "Flesh Restore", discipline: "Sorcerer", level: 1, spCost: 6, targetType: "PARTY_MEMBER", effect: "HEAL", valueDice: "2d8+4", desc: "Heals single ally." },
    { code: "VORP", name: "Vorpal Plating", discipline: "Magician", level: 1, spCost: 3, targetType: "PARTY_ALL", effect: "BUFF_AC", value: -2, desc: "+2 Party AC in combat." }
  ],
  monsters: [
    { id: "mon_kobold", name: "Street Kobold", hpDice: "1d6+2", ac: 11, xpReward: 15 },
    { id: "mon_skeleton", name: "Skeletal Guard", hpDice: "2d6+4", ac: 12, xpReward: 30 },
    { id: "mon_orc_warrior", name: "Orc Mercenary", hpDice: "3d6+6", ac: 14, xpReward: 65 }
  ],
  shopItems: [
    { id: "item_sword", name: "Broadsword", type: "WEAPON", slot: "MAIN_HAND", cost: 50, acBonus: 0, damageDice: "1d8", desc: "+1d8 Melee Attack" },
    { id: "item_shield", name: "Iron Shield", type: "ARMOR", slot: "OFF_HAND", cost: 40, acBonus: -2, damageDice: null, desc: "-2 AC (Defense)" },
    { id: "item_plate", name: "Plate Armor", type: "ARMOR", slot: "BODY", cost: 150, acBonus: -4, damageDice: null, desc: "-4 AC (Defense)" },
    { id: "item_pipes", name: "Finns Bardpipe", type: "INSTRUMENT", slot: "INSTRUMENT", cost: 120, acBonus: -1, damageDice: "1d2", desc: "Reduces Bard Song SP cost" },
    { id: "item_helm", name: "Iron Helm", type: "ARMOR", slot: "HEAD", cost: 35, acBonus: -1, damageDice: null, desc: "-1 AC (Defense)" },
    { id: "item_tonic", name: "Mage Tonic", type: "CONSUMABLE", slot: "NONE", cost: 30, effect: "RESTORE_SP", value: 15, desc: "Restores 15 SP" }
  ]
};
