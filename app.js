document.addEventListener('DOMContentLoaded', () => {
    const engine = window.gameEngine;
    const ui = window.ui;

    window.handleMove = (fw) => { ui.logMsg(engine.move(fw)); ui.updateUI(); };
    window.handleTurn = (right) => { engine.turn(right); ui.logMsg(`Turned ${right ? 'Right' : 'Left'}.`); ui.updateUI(); };
    window.handleSong = () => { ui.logMsg(engine.singBardSong()); ui.updateUI(); };
    window.handleSave = () => { ui.logMsg(engine.saveGame()); };
    window.handleLoad = () => { ui.logMsg(engine.loadGame()); ui.updateUI(); };

    window.openSpellMenu = () => {
        const casterSelect = document.getElementById('spell-caster');
        casterSelect.innerHTML = '';
        engine.gameState.party.forEach(p => {
            if (p.canCast) casterSelect.innerHTML += `<option value="${p.name}">${p.name} (${p.className}) - ${p.spCur}/${p.spMax} SP</option>`;
        });
        if (casterSelect.options.length === 0) return ui.logMsg("No spellcasters alive in party!");
        document.getElementById('spell-modal').style.display = 'flex';
        window.updateSpellOptions();
    };

    window.closeModal = (id) => { document.getElementById(id).style.display = 'none'; };
    window.closeCityLocation = () => { document.getElementById('city-modal').style.display = 'none'; };

    window.updateSpellOptions = () => {
        const spellSelect = document.getElementById('spell-select');
        spellSelect.innerHTML = '';
        window.GAME_DATA.spells.forEach(s => {
            spellSelect.innerHTML += `<option value="${s.code}">[${s.code}] ${s.name} (${s.spCost} SP) - ${s.desc}</option>`;
        });
        window.updateTargetOptions();
    };

    window.updateTargetOptions = () => {
        const spellCode = document.getElementById('spell-select').value;
        const spell = window.GAME_DATA.spells.find(s => s.code === spellCode);
        const targetSelect = document.getElementById('spell-target');
        targetSelect.innerHTML = '';
        if (spell.targetType === "PARTY_MEMBER") {
            engine.gameState.party.forEach((p, idx) => {
                targetSelect.innerHTML += `<option value="${idx}">${p.name} (HP: ${p.hpCur}/${p.hpMax})</option>`;
            });
        } else {
            targetSelect.innerHTML = `<option value="0">Nearest Target</option>`;
        }
    };

    window.executeCast = () => {
        const casterName = document.getElementById('spell-caster').value;
        const spellCode = document.getElementById('spell-select').value;
        const targetIdx = parseInt(document.getElementById('spell-target').value, 10);
        ui.logMsg(engine.castSpell(casterName, spellCode, targetIdx));
        window.closeModal('spell-modal');
        ui.updateUI();
    };

    window.addEventListener('keydown', (e) => {
        const k = e.key.toLowerCase();
        if (k === 'w' || k === 'arrowup') handleMove(true);
        if (k === 's' || k === 'arrowdown') handleMove(false);
        if (k === 'a' || k === 'arrowleft') handleTurn(false);
        if (k === 'd' || k === 'arrowright') handleTurn(true);
        if (k === 'c') openSpellMenu();
        if (k === 'b') handleSong();
    });

    ui.updateUI();
});
