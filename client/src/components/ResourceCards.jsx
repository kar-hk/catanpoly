import './ResourceCards.css';

const RESOURCES = [
  { key: 'brick', name: 'Brick', icon: '🧱', color: '#c45a2c' },
  { key: 'lumber', name: 'Lumber', icon: '🪵', color: '#2d5a27' },
  { key: 'wool', name: 'Wool', icon: '🐑', color: '#90c26a' },
  { key: 'grain', name: 'Grain', icon: '🌾', color: '#d4a942' },
  { key: 'ore', name: 'Ore', icon: '⛏️', color: '#6b6b6b' }
];

function ResourceCards({ resources, compact = false, selectable = false, selected = {}, onSelect, onRightClick }) {
  if (typeof resources === 'number') {
    return (
      <div className="resource-cards compact">
        <div className="total-cards">
          <span className="card-icon">🃏</span>
          <span className="count">{resources} cards</span>
        </div>
      </div>
    );
  }

  const handleContextMenu = (e, resourceKey) => {
    // If selectable mode and there are selected items, use deselect behavior
    if (selectable && (selected[resourceKey] || 0) > 0) {
      e.preventDefault();
      onSelect?.(resourceKey, -1);
    } 
    // Otherwise show info popup if handler is provided
    else if (onRightClick) {
      onRightClick(e, resourceKey);
    }
  };

  return (
    <div className={`resource-cards ${compact ? 'compact' : ''}`}>
      {RESOURCES.map(resource => {
        const count = resources[resource.key] || 0;
        const selectedCount = selected[resource.key] || 0;
        
        return (
          <div 
            key={resource.key}
            className={`resource-card ${count === 0 ? 'empty' : ''} ${selectable ? 'selectable' : ''} ${onRightClick ? 'has-info' : ''}`}
            style={{ '--resource-color': resource.color }}
            onClick={selectable && count > selectedCount ? () => onSelect?.(resource.key, 1) : undefined}
            onContextMenu={(e) => handleContextMenu(e, resource.key)}
            title={onRightClick && !selectable ? "Right-click for info" : undefined}
          >
            <div className="card-top">
              <span className="resource-icon">{resource.icon}</span>
            </div>
            <div className="card-bottom">
              <span className="resource-name">{resource.name}</span>
              <span className="resource-count">{count}</span>
              {selectable && selectedCount > 0 && (
                <span className="selected-indicator">-{selectedCount}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ResourceCards;
