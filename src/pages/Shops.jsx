import { useState, useEffect, useMemo } from 'react';
import { useShops } from '../hooks/useShops';
import { filterShops } from '../utils/filters';
import { getDimensionName } from '../constants/dimensions';
import { getActionName } from '../constants/actions';
import { addWaypoint } from '../utils/waypoint';
import './Shops.css';

function Shops() {
  const { shops, loading } = useShops();
  const [searchQuery, setSearchQuery] = useState('');
  const [showBuying, setShowBuying] = useState(false);
  const [showSelling, setShowSelling] = useState(true);
  const [showOutOfStock, setShowOutOfStock] = useState(false);
  const [dimensionFilter, setDimensionFilter] = useState('');
  const [sortColumn, setSortColumn] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');

  const filters = {
    searchQuery,
    showBuying,
    showSelling,
    showOutOfStock,
    dimensionFilter,
  };

  const filteredShops = useMemo(() => {
    let filtered = filterShops(shops, filters);

    // Sorting
    if (sortColumn !== null) {
      filtered.sort((a, b) => {
        let valA, valB;
        switch (sortColumn) {
          case 0: valA = a.Owner; valB = b.Owner; break;
          case 1: valA = a.item; valB = b.item; break;
          case 2: valA = getActionName(a.action); valB = getActionName(b.action); break;
          case 3: valA = parseFloat(a.price) || 0; valB = parseFloat(b.price) || 0; break;
          case 4: valA = parseFloat(a.amount) || 0; valB = parseFloat(b.amount) || 0; break;
          case 5: valA = a.position.join(','); valB = b.position.join(','); break;
          case 6: valA = getDimensionName(a.dimension); valB = getDimensionName(b.dimension); break;
          default: return 0;
        }
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortOrder === 'asc' ? valA - valB : valB - valA;
        }
        return sortOrder === 'asc'
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }

    return filtered;
  }, [shops, filters, sortColumn, sortOrder]);

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortOrder('asc');
    }
  };

  const getSortSymbol = (column) => {
    if (sortColumn !== column) return '';
    return sortOrder === 'asc' ? ' ▲' : ' ▼';
  };

  if (loading) {
    return <div className="container">Loading shops...</div>;
  }

  return (
    <div className="container">
      <div className="table-container">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search items (use ; to separate multiple items)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="search-container">
          <label>
            <input
              type="checkbox"
              checked={showBuying}
              onChange={(e) => setShowBuying(e.target.checked)}
            />
            Show Buying
          </label>
          <label>
            <input
              type="checkbox"
              checked={showSelling}
              onChange={(e) => setShowSelling(e.target.checked)}
            />
            Show Selling
          </label>
          <label>
            <input
              type="checkbox"
              checked={showOutOfStock}
              onChange={(e) => setShowOutOfStock(e.target.checked)}
            />
            Show Out of Stock
          </label>
          <label>
            Filter by Dimension:
            <select
              value={dimensionFilter}
              onChange={(e) => setDimensionFilter(e.target.value)}
            >
              <option value="">All Dimensions</option>
              <option value="Overworld">Overworld</option>
              <option value="Nether">Nether</option>
              <option value="End">End</option>
            </select>
          </label>
        </div>
        <table>
          <thead>
            <tr>
              <th onClick={() => handleSort(0)}>Owner{getSortSymbol(0)}</th>
              <th onClick={() => handleSort(1)}>Item{getSortSymbol(1)}</th>
              <th onClick={() => handleSort(2)}>Action{getSortSymbol(2)}</th>
              <th onClick={() => handleSort(3)}>Price{getSortSymbol(3)}</th>
              <th onClick={() => handleSort(4)}>Amount{getSortSymbol(4)}</th>
              <th onClick={() => handleSort(5)}>Position{getSortSymbol(5)}</th>
              <th onClick={() => handleSort(6)}>Dimension{getSortSymbol(6)}</th>
              <th>Waypoint</th>
            </tr>
          </thead>
          <tbody>
            {filteredShops.map((item, index) => (
              <tr key={`${item.Owner}-${item.item}-${item.position.join('-')}-${index}`}>
                <td>{item.Owner}</td>
                <td>{item.item}</td>
                <td>{getActionName(item.action)}</td>
                <td>{item.price}</td>
                <td>{item.amount}</td>
                <td>[{item.position.join(', ')}]</td>
                <td>{getDimensionName(item.dimension)}</td>
                <td>
                  <button
                    onClick={() => addWaypoint(
                      `${item.item} ~ ${item.Owner}`,
                      item.position[0],
                      item.position[1],
                      item.position[2],
                      item.dimension
                    )}
                  >
                    Add Waypoint
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Shops;
