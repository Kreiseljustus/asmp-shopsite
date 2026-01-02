const WAYPOINT_API_URL = 'http://localhost:52629/waypoint';

export const addWaypoint = async (name, x, y, z, dimension) => {
  try {
    const response = await fetch(WAYPOINT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, x, y, z, dimension }),
    });

    if (response.ok) {
      alert('Waypoint sent to Minecraft!');
      return true;
    } else {
      alert('Failed to send waypoint. Make sure Xaero\'s Minimap is installed and enabled and ASMP ShopGet is updated');
      return false;
    }
  } catch (error) {
    alert('Failed to send waypoint. Make sure Xaero\'s Minimap is installed and enabled and ASMP ShopGet is updated');
    return false;
  }
};

