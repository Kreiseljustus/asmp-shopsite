import { useState, useMemo } from 'react';
import { useWaystones } from '../hooks/useWaystones';
import { filterWaystones, sortWaystonesByDistance } from '../utils/filters';
import { getDimensionName } from '../constants/dimensions';
import { addWaypoint } from '../utils/waypoint';
import './Waytones.css';

function Waytones() {
  const { waystones, loading } = useWaystones();
  const [searchQuery, setSearchQuery] = useState('');
  const [dimensionFilter, setDimensionFilter] = useState('');
  const [positionX, setPositionX] = useState('');
  const [positionY, setPositionY] = useState('');
  const [positionZ, setPositionZ] = useState('');

  const filters = {
    searchQuery,
    dimensionFilter,
  };

  const filteredWaystones = useMemo(() => {
    let filtered = filterWaystones(waystones, filters);

    // Position sorting
    const x = parseFloat(positionX);
    const y = parseFloat(positionY);
    const z = parseFloat(positionZ);

    if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
      filtered = sortWaystonesByDistance(filtered, x, y, z);
    }

    return filtered;
  }, [waystones, filters, positionX, positionY, positionZ]);

  if (loading) {
    return <div className="container">Loading waystones...</div>;
  }

  return (
    <div className="container">
      <div className="table-container">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search waystones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="search-container">
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
        <div className="search-container position-container">
          Sort by closest to:
          <input
            type="text"
            placeholder="X"
            value={positionX}
            onChange={(e) => setPositionX(e.target.value)}
          />
          <input
            type="text"
            placeholder="Y"
            value={positionY}
            onChange={(e) => setPositionY(e.target.value)}
          />
          <input
            type="text"
            placeholder="Z"
            value={positionZ}
            onChange={(e) => setPositionZ(e.target.value)}
          />
        </div>
        <table>
          <thead>
            <tr>
              <th>Owner</th>
              <th>Name</th>
              <th>Position</th>
              <th>Dimension</th>
              <th>Waypoint</th>
            </tr>
          </thead>
          <tbody>
            {filteredWaystones.map((ws, index) => (
              <tr key={`${ws.Owner}-${ws.Name}-${ws.position.join('-')}-${index}`}>
                <td>{ws.Owner?.replace(/^Owner: /, '') || ws.Owner}</td>
                <td>{ws.Name}</td>
                <td>[{ws.position.join(', ')}]</td>
                <td>{getDimensionName(ws.dimension)}</td>
                <td>
                  <button
                    onClick={() => addWaypoint(
                      ws.Name,
                      ws.position[0],
                      ws.position[1],
                      ws.position[2],
                      ws.dimension
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

export default Waytones;
