import { useState } from 'react';
import './DiscardModal.css';

const RESOURCES = ['brick', 'lumber', 'wool', 'grain', 'ore'];
const RESOURCE_ICONS = {
  brick: '🧱',
  lumber: '🪵',
  wool: '🐑',
  grain: '🌾',
  ore: '⛏️'
};

function DiscardModal({ socket, player, cardsToDiscard, addNotification }) {
  const [selected, setSelected] = useState({ brick: 0, lumber: 0, wool: 0, grain: 0, ore: 0 });

  const totalSelected = Object.values(selected).reduce((a, b) => a + b, 0);
  const remaining = cardsToDiscard - totalSelected;

  const updateSelected = (resource, delta) => {
    const newAmount = Math.max(0, Math.min(player.resources[resource], selected[resource] + delta));
    if (delta > 0 && totalSelected >= cardsToDiscard) return;
    setSelected({ ...selected, [resource]: newAmount });
  };

  const handleDiscard = () => {
    if (totalSelected !== cardsToDiscard) {
      addNotification(`Must discard exactly ${cardsToDiscard} cards`);
      return;
    }

    socket.emit('discardCards', { resources: selected }, (response) => {
      if (!response.success) {
        addNotification(response.error);
      }
    });
  };

  return (
    <div className="modal-overlay">
      <div className="discard-modal">
        <h2>🎲 Seven Rolled!</h2>
        <p className="discard-info">
          You have more than 7 cards. Discard <strong>{cardsToDiscard}</strong> cards.
        </p>
        
        <div className="discard-progress">
          <div 
            className="progress-bar"
            style={{ width: `${(totalSelected / cardsToDiscard) * 100}%` }}
          />
          <span className="progress-text">
            {totalSelected} / {cardsToDiscard}
          </span>
        </div>

        <div className="resource-discard-list">
          {RESOURCES.map(r => {
            const available = player.resources[r];
            if (available === 0) return null;
            
            return (
              <div key={r} className="resource-discard-row">
                <span className="resource-icon">{RESOURCE_ICONS[r]}</span>
                <span className="resource-name">{r}</span>
                <span className="resource-available">({available})</span>
                <div className="discard-controls">
                  <button 
                    onClick={() => updateSelected(r, -1)}
                    disabled={selected[r] === 0}
                  >
                    −
                  </button>
                  <span className="discard-amount">{selected[r]}</span>
                  <button 
                    onClick={() => updateSelected(r, 1)}
                    disabled={selected[r] >= available || totalSelected >= cardsToDiscard}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button 
          className="confirm-discard"
          onClick={handleDiscard}
          disabled={totalSelected !== cardsToDiscard}
        >
          Discard {totalSelected} Cards
        </button>
      </div>
    </div>
  );
}

export default DiscardModal;

