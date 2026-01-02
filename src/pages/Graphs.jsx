import { useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { useGraphs } from '../hooks/useGraphs';
import './Graphs.css';

ChartJS.register(ArcElement, Tooltip, Legend);

const TOTAL_DIAMONDS = 3007812;
const GRAPH_NAME = 'diamonds_mined';

function Graphs() {
  const { graphs, loading } = useGraphs();

  const mined = useMemo(() => {
    if (!graphs?.graphs) return 0;
    const graphEntry = graphs.graphs.find(g => g.graph === GRAPH_NAME);
    return graphEntry?.value || 0;
  }, [graphs]);

  const baltopDate = useMemo(() => {
    if (!graphs?.graphs) return null;
    const graphEntry = graphs.graphs.find(g => g.graph === GRAPH_NAME);
    return graphEntry?.baltopDate || null;
  }, [graphs]);

  const formattedDate = useMemo(() => {
    if (!baltopDate) return '-';
    const date = new Date(baltopDate + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [baltopDate]);

  const remaining = TOTAL_DIAMONDS - mined;
  const percentage = ((mined / TOTAL_DIAMONDS) * 100).toFixed(2);

  const chartData = {
    labels: ['Diamonds Mined', 'Diamonds Remaining'],
    datasets: [{
      data: [mined, remaining],
      backgroundColor: ['#4CAF50', 'rgba(255, 255, 255, 0.3)'],
      borderColor: ['#45a049', 'rgba(255, 255, 255, 0.5)'],
      borderWidth: 2,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#fff',
          font: {
            family: 'Minecraftia',
            size: 16,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const pct = ((value / TOTAL_DIAMONDS) * 100).toFixed(2);
            return `${label}: ${value.toLocaleString()} (${pct}%)`;
          },
        },
      },
    },
  };

  if (loading) {
    return <div className="container">Loading graphs...</div>;
  }

  return (
    <div className="container">
      <div className="graph-container">
        <h1>Total Diamonds Mined</h1>
        <div className="chart-wrapper">
          <div className="chart-container">
            <Pie data={chartData} options={chartOptions} />
          </div>
        </div>
        <div className="stats-container">
          <div className="stat-box">
            <h3>Mined</h3>
            <p>{mined.toLocaleString()}</p>
          </div>
          <div className="stat-box">
            <h3>Remaining</h3>
            <p>{remaining.toLocaleString()}</p>
          </div>
          <div className="stat-box">
            <h3>Percentage</h3>
            <p>{percentage}%</p>
          </div>
        </div>
        <div className="disclaimer-container">
          <h3>Disclaimer</h3>
          <p>The total diamonds (3,007,812) are calculated using average Fortune III drop rates.</p>
          <p>
            The "Diamonds Mined" value is taken from baltop as of{' '}
            <span className="date-info">{formattedDate}</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Graphs;
