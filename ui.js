class UIManager {
    constructor() {
        this.engine = window.gameEngine;
        this.renderer = window.renderer;
    }

    logMsg(msg) {
        document.getElementById('log').innerText = msg;
    }

    updateUI() {
        document.getElementById('zone-name').innerText = this.engine.maps[this.engine.currentZone].name;
        document.getElementById('pos').innerText = `(${Math.floor(this.engine.player.x)}, ${Math.floor(this.engine.player.y)})`;
        document.getElementById('gold').innerText = this.engine.gameState.gold;
        document.getElementById('song').innerText = this.engine.gameState.activeSong ? 'ACTIVE (+2 AC)' : 'OFF';

        const partyList = document.getElementById('party-list');
        partyList.innerHTML = '';
        this.engine.gameState.party.forEach(p => {
            const acBonus = this.engine.gameState.activeSong ? 2 : 0;
            partyList.innerHTML += `
                <div class="party-member">
                    <strong>${p.name}</strong> (${p.className}) | HP: ${p.hpCur}/${p.hpMax} | SP: ${p.spCur}/${p.spMax} | AC: ${p.baseAc - acBonus}
                </div>
            `;
        });

        this.renderer.render(this.engine);
        this.checkCityLocationTrigger();
    }

    checkCityLocationTrigger() {
        const px = Math.floor(this.engine.player.x);
        const py = Math.floor(this.engine.player.y);
        const tile = this.engine.activeMap[py][px];

        if (tile === 6) this.openTavern();
        else if (tile === 7) this.openGuild();
        else if (tile === 8) this.openShop();
    }

    openTavern() {
        document.getElementById('city-title').innerText = "THE SCARLET BARD TAVERN";
        document.getElementById('city-content').innerHTML = `
            <p>Warm firelight fills the room as a local Bard tunes his pipes.</p>
            <button onclick="ui.buyTavernDrink()">Buy Ale & Rations (+10 HP all) - 15 Gold</button>
            <button onclick="ui.listenBard()">Listen to Bard Song (Restores 10 SP) - 20 Gold</button>
        `;
        document.getElementById('city-modal').style.display = 'flex';
    }

    buyTavernDrink() {
        if (this.engine.gameState.gold < 15) return this.logMsg("Not enough gold for drinks!");
        this.engine.gameState.gold -= 15;
        this.engine.gameState.party.forEach(p => p.hpCur = Math.min(p.hpMax, p.hpCur + 10));
        this.logMsg("The party eats, drinks, and restores +10 HP!");
        this.updateUI();
    }

    listenBard() {
        if (this.engine.gameState.gold < 20) return this.logMsg("Not enough gold for the Bard!");
        this.engine.gameState.gold -= 20;
        this.engine.gameState.party.forEach(p => p.spCur = Math.min(p.spMax, p.spCur + 10));
        if (window.soundEngine) window.soundEngine.playBardSong();
        this.logMsg("The Bard plays a heroic ballad! Party restores +10 SP.");
        this.updateUI();
    }

    openGuild() {
        document.getElementById('city-title').innerText = "THE ADVENTURERS' GUILD";
        document.getElementById('city-content').innerHTML = `
            <p>Guild Master: 'Recruit new heroes or rest your weary party.'</p>
            <button onclick="ui.addGuildHero('Rogue')">Recruit Rogue (50 Gold)</button>
            <button onclick="ui.addGuildHero('Paladin')">Recruit Paladin (60 Gold)</button>
        `;
        document.getElementById('city-modal').style.display = 'flex';
    }

    addGuildHero(className) {
        if (this.engine.gameState.gold < 50) return this.logMsg("Not enough gold to recruit!");
        if (this.engine.gameState.party.length >= 6) return this.logMsg("Party roster is full!");
        this.engine.gameState.gold -= 50;
        const hero = this.engine.createCharacter(`${className}_Hero`, className);
        this.engine.gameState.party.push(hero);
        this.logMsg(`Recruited ${hero.name} to your party!`);
        this.updateUI();
    }

    openShop() {
        document.getElementById('city-title').innerText = "GARTH'S EQUIPMENT SHOP";
        this.renderShopView();
        document.getElementById('city-modal').style.display = 'flex';
    }

    renderShopView() {
        let html = `<p>Garth: "Buy finest steel or equip your heroes!"</p>`;
        
        html += `<strong>--- AVAILABLE FOR SALE ---</strong><br>`;
        window.GAME_DATA.shopItems.forEach(item => {
            html += `<button onclick="ui.buyShopItem('${item.id}')">Buy ${item.name} (${item.cost} Gold) - ${item.desc}</button>`;
        });

        html += `<br><strong style="margin-top:10px; display:block;">--- PARTY INVENTORY & EQUIPMENT ---</strong>`;
        this.engine.gameState.party.forEach(hero => {
            html += `
                <div style="border: 1px solid #005522; padding: 6px; margin-top: 6px; text-align: left;">
                    <strong>${hero.name}</strong> (${hero.className}) | AC: ${hero.baseAc}<br>
                    <small><strong>Equipped:</strong> 
                        Hand: ${hero.equipment.MAIN_HAND ? hero.equipment.MAIN_HAND.name : "Bare"} | 
                        Off: ${hero.equipment.OFF_HAND ? hero.equipment.OFF_HAND.name : "None"} | 
                        Body: ${hero.equipment.BODY ? hero.equipment.BODY.name : "Clothes"}
                    </small><br>
                    <strong>Bag (${hero.inventory.length}/8):</strong> `;
            
            if (hero.inventory.length === 0) {
                html += `<em>Empty</em>`;
            } else {
                hero.inventory.forEach((item, idx) => {
                    html += `<button style="padding:2px 6px; width:auto; font-size:0.75rem; margin:2px;" onclick="ui.equipHeroItem('${hero.id}', ${idx})">Equip ${item.name}</button>`;
                });
            }
            html += `</div>`;
        });

        document.getElementById('city-content').innerHTML = html;
    }

    buyShopItem(itemId) {
        const item = window.GAME_DATA.shopItems.find(i => i.id === itemId);
        if (!item || this.engine.gameState.gold < item.cost) return this.logMsg("Cannot afford this item!");

        const heroNames = this.engine.gameState.party.map(p => p.name).join(", ");
        const chosenName = prompt(`Who receives ${item.name}? (${heroNames})`, this.engine.gameState.party[0].name);
        
        const hero = this.engine.gameState.party.find(p => p.name.toLowerCase() === (chosenName || "").toLowerCase());
        if (!hero) return this.logMsg("Hero not found in party.");

        if (hero.inventory.length >= 8) return this.logMsg(`${hero.name}'s bag is full!`);

        this.engine.gameState.gold -= item.cost;
        hero.inventory.push(item);
        
        this.logMsg(`Purchased ${item.name} for ${hero.name}!`);
        this.renderShopView();
        this.updateUI();
    }

    equipHeroItem(charId, invIndex) {
        const msg = this.engine.equipItem(charId, invIndex);
        this.logMsg(msg);
        this.renderShopView();
        this.updateUI();
    }
}

window.ui = new UIManager();
