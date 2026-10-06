class GameEngine {
    constructor() {
        this.data = window.GAME_DATA;
        this.currentZone = 'CITY';
        this.currentLevel = 1;

        this.maps = {
            CITY: {
                name: "Skara Brae Streets",
                map: [
                    [1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 0, 0, 6, 1, 7, 0, 1],
                    [1, 0, 1, 0, 1, 0, 1, 1],
                    [1, 0, 1, 0, 0, 0, 8, 1],
                    [1, 0, 0, 0, 1, 1, 0, 1],
                    [1, 1, 1, 0, 0, 0, 9, 1],
                    [1, 0, 0, 0, 1, 0, 0, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1]
                ],
                visited: Array.from({ length: 8 }, () => Array(8).fill(false))
            },
            DUNGEON: {
                name: "Cellar Level 1",
                map: [
                    [1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 0, 2, 0, 1, 3, 0, 1],
                    [1, 0, 1, 0, 1, 0, 1, 1],
                    [1, 3, 1, 0, 0, 0, 0, 1],
                    [1, 0, 0, 0, 1, 1, 0, 1],
                    [1, 1, 1, 0, 0, 0, 9, 1],
                    [1, 2, 0, 3, 1, 0, 2, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1]
                ],
                visited: Array.from({ length: 8 }, () => Array(8).fill(false))
            }
        };

        this.player = { x: 1.5, y: 1.5, angle: 0 };
        this.gameState = { gold: 100, activeSong: false, party: [] };

        this.markVisited();
        this.initDefaultParty();
    }

    get activeMap() { return this.maps[this.currentZone].map; }
    get activeVisited() { return this.maps[this.currentZone].visited; }

    markVisited() {
        const px = Math.floor(this.player.x);
        const py = Math.floor(this.player.y);
        if (px >= 0 && px < 8 && py >= 0 && py < 8) {
            this.activeVisited[py][px] = true;
        }
    }

    initDefaultParty() {
        this.gameState.party = [
            this.createCharacter("Elric", "Warrior"),
            this.createCharacter("Bran", "Bard"),
            this.createCharacter("Morgana", "Magician"),
            this.createCharacter("Thorne", "Sorcerer")
        ];
    }

    createCharacter(name, className) {
        const classDef = this.data.classes[className] || this.data.classes.Warrior;
        const maxHp = classDef.hpDice + 10;
        const maxSp = classDef.spDice * 2;
        return {
            id: 'char_' + Math.random().toString(36).substr(2, 9),
            name: name, className: className, canCast: classDef.canCast,
            level: 1, hpCur: maxHp, hpMax: maxHp, spCur: maxSp, spMax: maxSp,
            baseAc: classDef.baseAc,
            equipment: {
                MAIN_HAND: null,
                OFF_HAND: null,
                BODY: null,
                HEAD: null,
                INSTRUMENT: null
            },
            inventory: []
        };
    }

    equipItem(charId, inventoryIndex) {
        const hero = this.gameState.party.find(p => p.id === charId);
        if (!hero || !hero.inventory[inventoryIndex]) return "Item not found in inventory.";

        const item = hero.inventory[inventoryIndex];
        if (item.type === "CONSUMABLE") return "Consumables cannot be equipped.";

        const slot = item.slot;

        if (hero.equipment[slot]) {
            hero.inventory.push(hero.equipment[slot]);
        }

        hero.equipment[slot] = item;
        hero.inventory.splice(inventoryIndex, 1);

        this.recalculateStats(hero);
        return `${hero.name} equipped ${item.name} to ${slot}.`;
    }

    recalculateStats(hero) {
        const classDef = this.data.classes[hero.className] || this.data.classes.Warrior;
        let effectiveAc = classDef.baseAc;

        Object.values(hero.equipment).forEach(item => {
            if (item && item.acBonus) {
                effectiveAc += item.acBonus;
            }
        });

        hero.baseAc = effectiveAc;
    }

    rollDice(diceStr) {
        if (!diceStr) return 0;
        const match = diceStr.match(/^(\d+)d(\d+)(?:([+-])(\d+))?$/);
        if (!match) return parseInt(diceStr, 10) || 0;
        const count = parseInt(match[1], 10), sides = parseInt(match[2], 10);
        let total = 0;
        for (let i = 0; i < count; i++) total += Math.floor(Math.random() * sides) + 1;
        if (match[3] === '+') total += parseInt(match[4], 10);
        if (match[3] === '-') total -= parseInt(match[4], 10);
        return Math.max(1, total);
    }

    move(forward = true) {
        const dir = forward ? 1 : -1;
        const stepX = Math.round(Math.cos(this.player.angle)) * dir;
        const stepY = Math.round(Math.sin(this.player.angle)) * dir;
        const nx = Math.floor(this.player.x) + stepX;
        const ny = Math.floor(this.player.y) + stepY;

        if (this.activeMap[ny][nx] === 1) return "Ouch! Bumped into a wall.";
        
        this.player.x = nx + 0.5; 
        this.player.y = ny + 0.5;
        this.markVisited();

        const tileResult = this.triggerTileEvent(nx, ny);
        if (tileResult) return tileResult;

        if (Math.random() < 0.15) {
            return this.triggerCombat();
        }

        return `Facing ${this.getFacingDirection()} in ${this.maps[this.currentZone].name}.`;
    }

    turn(right = true) {
        this.player.angle += right ? Math.PI / 2 : -Math.PI / 2;
        if (this.player.angle < 0) this.player.angle += Math.PI * 2;
        if (this.player.angle >= Math.PI * 2) this.player.angle -= Math.PI * 2;
    }

    getFacingDirection() {
        const deg = Math.round((this.player.angle * (180 / Math.PI))) % 360;
        if (deg === 0) return "EAST";
        if (deg === 90) return "SOUTH";
        if (deg === 180) return "WEST";
        return "NORTH";
    }

    triggerTileEvent(x, y) {
        const tileType = this.activeMap[y][x];

        if (tileType === 2) {
            this.activeMap[y][x] = 0;
            const gold = this.rollDice("5d20+50");
            this.gameState.gold += gold;
            if (window.soundEngine) window.soundEngine.playTreasureChime();
            return `[CHEST] Found a treasure chest! +${gold} Gold.`;
        } 
        else if (tileType === 3) {
            this.activeMap[y][x] = 0;
            return this.triggerCombat();
        }
        else if (tileType === 6) { return "[LOCATION] Entering The Scarlet Bard Tavern..."; }
        else if (tileType === 7) { return "[LOCATION] Entering The Adventurers' Guild..."; }
        else if (tileType === 8) { return "[LOCATION] Entering Garth's Equipment Shop..."; }
        else if (tileType === 9) {
            if (this.currentZone === 'CITY') {
                this.currentZone = 'DUNGEON';
                this.player.x = 6.5; this.player.y = 5.5;
                this.markVisited();
                return "[DUNGEON] You descend into the dark Cellar level!";
            } else {
                this.currentZone = 'CITY';
                this.player.x = 6.5; this.player.y = 5.5;
                this.markVisited();
                return "[CITY] You climb out of the cellar back to Skara Brae streets!";
            }
        }

        return null;
    }

    triggerCombat() {
        const monster = this.data.monsters[Math.floor(Math.random() * this.data.monsters.length)];
        if (window.soundEngine) window.soundEngine.playSwordSlash();

        let log = [`[ENCOUNTER!] A wild ${monster.name} attacks!`];
        let totalDmg = 0;

        this.gameState.party.forEach(hero => {
            if (hero.hpCur > 0) {
                const roll = Math.floor(Math.random() * 20) + 1;
                if (roll >= monster.ac) {
                    const dmg = this.rollDice("1d6+2");
                    totalDmg += dmg;
                    log.push(`${hero.name} hits for ${dmg} DMG.`);
                }
            }
        });

        const goldGained = this.rollDice("2d10+10");
        this.gameState.gold += goldGained;
        log.push(`Defeated ${monster.name}! Earned +${monster.xpReward} XP & +${goldGained} Gold.`);
        return log.join(" ");
    }

    singBardSong() {
        const bard = this.gameState.party.find(p => p.className === 'Bard');
        if (!bard || bard.spCur < 3) return "Bard doesn't have enough SP!";
        if (this.gameState.activeSong) return "Falkentyne's Fury is already active!";
        
        bard.spCur -= 3;
        this.gameState.activeSong = true;
        if (window.soundEngine) window.soundEngine.playBardSong();
        return "Bard plays Falkentyne's Fury! Party AC +2.";
    }

    castSpell(casterName, spellCode, targetIndex) {
        const caster = this.gameState.party.find(p => p.name === casterName);
        const spell = this.data.spells.find(s => s.code === spellCode);

        if (!caster || !spell) return "Invalid selection.";
        if (caster.spCur < spell.spCost) return `${caster.name} needs ${spell.spCost} SP!`;

        caster.spCur -= spell.spCost;
        if (window.soundEngine) window.soundEngine.playMagicSpell();

        if (spell.effect === "HEAL") {
            const target = this.gameState.party[targetIndex] || caster;
            const healAmt = this.rollDice(spell.valueDice);
            target.hpCur = Math.min(target.hpMax, target.hpCur + healAmt);
            return `[MAGIC] ${caster.name} casts ${spell.name}! Healed ${target.name} for +${healAmt} HP.`;
        } 
        else if (spell.effect === "DAMAGE") {
            const dmgAmt = this.rollDice(spell.valueDice);
            return `[MAGIC] ${caster.name} casts ${spell.name}! Strikes target for ${dmgAmt} fire damage.`;
        }

        return `[MAGIC] ${caster.name} casts ${spell.name}.`;
    }

    saveGame() {
        const saveObj = {
            currentZone: this.currentZone,
            player: this.player,
            gameState: this.gameState,
            maps: this.maps
        };
        localStorage.setItem('bards_tale_save', JSON.stringify(saveObj));
        return "Game state and city maps saved!";
    }

    loadGame() {
        const raw = localStorage.getItem('bards_tale_save');
        if (!raw) return "No saved game found!";
        const saveObj = JSON.parse(raw);
        this.currentZone = saveObj.currentZone;
        this.player = saveObj.player;
        this.gameState = saveObj.gameState;
        this.maps = saveObj.maps;
        return "Game loaded successfully!";
    }
}

window.gameEngine = new GameEngine();
