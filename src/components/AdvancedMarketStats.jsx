import React from 'react';
import millify from 'millify';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { Card, Col, Row, Statistic, Tag, Typography } from 'antd';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);
const { Title, Text } = Typography;
const COLORS = ['#56e0c0', '#ff7085', '#8b7dff'];
const numeric = (value) => value == null || value === '' || !Number.isFinite(Number(value)) ? null : Number(value);
const formatUsd = (value) => {
  const amount = numeric(value);
  return amount == null ? '—' : `$${millify(amount, { precision: 2 })}`;
};
const formatPercent = (value) => {
  const amount = numeric(value);
  return amount == null ? '—' : `${amount > 0 ? '+' : ''}${amount.toFixed(2)}%`;
};

const AdvancedMarketStats = ({ coins = [], stats = {}, isError = false, updatedAt }) => {
  const trackedCoins = coins.filter((coin) => coin && typeof coin === 'object');
  const volumeEntries = trackedCoins
    .map((coin) => ({ coin, volume: numeric(coin['24hVolume'] ?? coin.volume24h) }))
    .filter((entry) => entry.volume != null && entry.volume >= 0)
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 8);
  const changes = trackedCoins.map((coin) => numeric(coin.change)).filter((change) => change != null);
  const up = changes.filter((change) => change > 0).length;
  const down = changes.filter((change) => change < 0).length;
  const unchanged = changes.length - up - down;
  const meanChange = changes.length ? changes.reduce((sum, change) => sum + change, 0) / changes.length : null;
  const assetsWithVolume = trackedCoins.filter((coin) => {
    const volume = numeric(coin['24hVolume'] ?? coin.volume24h);
    return volume != null && volume >= 0;
  }).length;
  const emptyMessage = isError
    ? 'Market data is unavailable. Check the CoinRanking API connection.'
    : 'Live market statistics will appear when the market feed responds.';

  const volumeData = {
    labels: volumeEntries.map(({ coin }) => coin.symbol),
    datasets: [{
      label: '24-hour trading volume (USD)',
      data: volumeEntries.map(({ volume }) => volume),
      backgroundColor: volumeEntries.map((_, index) => index === 0 ? 'rgba(86,224,192,.86)' : 'rgba(86,168,255,.68)'),
      borderRadius: 6,
      borderSkipped: false,
      barThickness: 18,
    }],
  };
  const breadthData = {
    labels: ['Gainers', 'Losers', 'Unchanged'],
    datasets: [{
      data: changes.length ? [up, down, unchanged] : [],
      backgroundColor: COLORS,
      borderColor: '#111924',
      borderWidth: 4,
      hoverOffset: 5,
    }],
  };
  const volumeOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (context) => ` ${formatUsd(context.parsed.x)} · 24h` } },
    },
    scales: {
      x: { beginAtZero: true, grid: { color: 'rgba(148,163,184,.14)' }, ticks: { color: '#a7b4c4', callback: (value) => `$${millify(Number(value))}` }, border: { display: false } },
      y: { grid: { display: false }, ticks: { color: '#d1dce7', font: { weight: 600 } }, border: { display: false } },
    },
  };
  const breadthOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (context) => ` ${context.label}: ${context.raw} asset${context.raw === 1 ? '' : 's'}` } },
    },
  };

  return (
    <section className="dashboard-section advanced-market-section">
      <div className="section-heading advanced-section-heading">
        <div>
          <Text className="panel-kicker">MARKET ANALYTICS</Text>
          <Title level={3}>Trading volume &amp; market trends</Title>
          <Text className="advanced-subtitle">CoinRanking · refreshes every 60 seconds{updatedAt ? ` · last response ${new Date(updatedAt).toLocaleTimeString()}` : ''}</Text>
        </div>
        <Tag className={isError ? 'data-tag data-tag-error' : trackedCoins.length ? 'data-tag data-tag-live' : 'data-tag'}>
          {isError ? 'FEED UNAVAILABLE' : trackedCoins.length ? 'LIVE FEED' : 'WAITING FOR DATA'}
        </Tag>
      </div>

      {!trackedCoins.length ? <div className="chart-empty advanced-empty">{emptyMessage}</div> : <>
        <Row gutter={[14, 14]} className="advanced-stats-grid">
          <Col xs={12} xl={6}><Card className="stat-card advanced-stat-card"><Text className="stat-label">GLOBAL 24H VOLUME</Text><Statistic value={formatUsd(stats.total24hVolume)} /><Text className="stat-foot">Reported by CoinRanking</Text></Card></Col>
          <Col xs={12} xl={6}><Card className="stat-card advanced-stat-card"><Text className="stat-label">AVERAGE 24H CHANGE</Text><Statistic value={formatPercent(meanChange)} /><Text className="stat-foot">Simple average across {changes.length || '—'} assets with reported change</Text></Card></Col>
          <Col xs={12} xl={6}><Card className="stat-card advanced-stat-card"><Text className="stat-label">GAINING ASSETS</Text><Statistic value={changes.length ? up : '—'} /><Text className="stat-foot">Positive 24-hour change · loaded assets</Text></Card></Col>
          <Col xs={12} xl={6}><Card className="stat-card advanced-stat-card"><Text className="stat-label">ASSETS WITH VOLUME</Text><Statistic value={assetsWithVolume || '—'} /><Text className="stat-foot">Of {trackedCoins.length} loaded assets</Text></Card></Col>
        </Row>

        <Row gutter={[14, 14]} className="advanced-charts-row">
          <Col xs={24} xl={15}><Card className="panel-card advanced-panel">
            <div className="panel-heading"><div><Text className="panel-kicker">VOLUME BY ASSET</Text><Title level={4}>Most actively traded</Title></div><Tag className="subtle-tag">24H · USD</Tag></div>
            {volumeEntries.length ? <div className="chart-canvas advanced-volume-chart"><Bar data={volumeData} options={volumeOptions} /></div> : <div className="chart-empty">The feed does not provide per-asset 24-hour volume.</div>}
            <Text className="chart-caption">Per-asset volume reported by the API. Missing values are not treated as zero.</Text>
          </Card></Col>
          <Col xs={24} xl={9}><Card className="panel-card advanced-panel breadth-panel">
            <div className="panel-heading"><div><Text className="panel-kicker">MARKET BREADTH</Text><Title level={4}>Gainers vs losers</Title></div><Tag className="subtle-tag">24H</Tag></div>
            {changes.length ? <div className="breadth-content">
              <div className="chart-canvas breadth-chart"><Doughnut data={breadthData} options={breadthOptions} /><div className="breadth-center"><strong>{changes.length}</strong><span>ASSETS</span></div></div>
              <div className="breadth-legend">
                {[[ 'Gainers', up, COLORS[0]], ['Losers', down, COLORS[1]], ['Unchanged', unchanged, COLORS[2]]].map(([label, value, color]) => <div className="breadth-legend-row" key={label}><span className="legend-dot" style={{ background: color }} /><span>{label}</span><strong>{value}</strong></div>)}
              </div>
            </div> : <div className="chart-empty">24-hour changes are unavailable.</div>}
            <Text className="chart-caption">Count of loaded assets with a positive, negative or unchanged 24-hour price change.</Text>
          </Card></Col>
        </Row>
      </>}
    </section>
  );
};

export default AdvancedMarketStats;
