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
  const totalVolume = numeric(stats.total24hVolume);
  const totalMarketCap = numeric(stats.totalMarketCap);
  const turnover = totalVolume != null && totalMarketCap != null && totalMarketCap > 0
    ? (totalVolume / totalMarketCap) * 100
    : null;
  const topVolumeShare = totalVolume != null && totalVolume > 0 && volumeEntries.length
    ? (volumeEntries.reduce((sum, entry) => sum + entry.volume, 0) / totalVolume) * 100
    : null;
  const emptyMessage = isError
    ? 'Le flux de marché est indisponible. Vérifiez la clé CoinRanking.'
    : 'Les statistiques réelles apparaîtront lorsque le flux de marché répondra.';

  const volumeData = {
    labels: volumeEntries.map(({ coin }) => coin.symbol),
    datasets: [{
      label: 'Volume échangé sur 24 h (USD)',
      data: volumeEntries.map(({ volume }) => volume),
      backgroundColor: volumeEntries.map((_, index) => index === 0 ? 'rgba(86,224,192,.86)' : 'rgba(86,168,255,.68)'),
      borderRadius: 6,
      borderSkipped: false,
      barThickness: 18,
    }],
  };
  const breadthData = {
    labels: ['En hausse', 'En baisse', 'Stable'],
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
      tooltip: { callbacks: { label: (context) => ` ${formatUsd(context.parsed.x)} · 24 h` } },
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
      tooltip: { callbacks: { label: (context) => ` ${context.label}: ${context.raw} actif${context.raw === 1 ? '' : 's'}` } },
    },
  };

  return (
    <section className="dashboard-section advanced-market-section">
      <div className="section-heading advanced-section-heading">
        <div>
          <Text className="panel-kicker">ANALYSE DU MARCHÉ</Text>
          <Title level={3}>Volumes &amp; tendances en temps réel</Title>
          <Text className="advanced-subtitle">CoinRanking · actualisation automatique toutes les 60 secondes{updatedAt ? ` · dernière réponse ${new Date(updatedAt).toLocaleTimeString()}` : ''}</Text>
        </div>
        <Tag className={isError ? 'data-tag data-tag-error' : trackedCoins.length ? 'data-tag data-tag-live' : 'data-tag'}>
          {isError ? 'FLUX INDISPONIBLE' : trackedCoins.length ? 'FLUX ACTIF' : 'EN ATTENTE DU FLUX'}
        </Tag>
      </div>

      {!trackedCoins.length ? <div className="chart-empty advanced-empty">{emptyMessage}</div> : <>
        <Row gutter={[14, 14]} className="advanced-stats-grid">
          <Col xs={12} xl={6}><Card className="stat-card advanced-stat-card"><Text className="stat-label">VOLUME TOTAL · 24 H</Text><Statistic value={formatUsd(stats.total24hVolume)} /><Text className="stat-foot">Marché global, valeur API</Text></Card></Col>
          <Col xs={12} xl={6}><Card className="stat-card advanced-stat-card"><Text className="stat-label">VOLUME / CAPITALISATION</Text><Statistic value={turnover == null ? '—' : `${turnover.toFixed(2)}%`} /><Text className="stat-foot">Calculé avec les totaux globaux API</Text></Card></Col>
          <Col xs={12} xl={6}><Card className="stat-card advanced-stat-card"><Text className="stat-label">VARIATION MOYENNE · 24 H</Text><Statistic value={formatPercent(meanChange)} /><Text className="stat-foot">Moyenne simple sur {changes.length || '—'} actifs chargés</Text></Card></Col>
          <Col xs={12} xl={6}><Card className="stat-card advanced-stat-card"><Text className="stat-label">VOLUME DES 8 PRINCIPAUX</Text><Statistic value={topVolumeShare == null ? '—' : `${topVolumeShare.toFixed(2)}%`} /><Text className="stat-foot">Part du volume global déclarée</Text></Card></Col>
        </Row>

        <Row gutter={[14, 14]} className="advanced-charts-row">
          <Col xs={24} xl={15}><Card className="panel-card advanced-panel">
            <div className="panel-heading"><div><Text className="panel-kicker">VOLUME PAR ACTIF</Text><Title level={4}>Les actifs les plus échangés</Title></div><Tag className="subtle-tag">24 H · USD</Tag></div>
            {volumeEntries.length ? <div className="chart-canvas advanced-volume-chart"><Bar data={volumeData} options={volumeOptions} /></div> : <div className="chart-empty">Le flux ne fournit pas de volume 24 h par actif.</div>}
            <Text className="chart-caption">Volume déclaré par l’API pour chaque actif ; les données absentes ne sont pas remplacées par zéro.</Text>
          </Card></Col>
          <Col xs={24} xl={9}><Card className="panel-card advanced-panel breadth-panel">
            <div className="panel-heading"><div><Text className="panel-kicker">LARGEUR DU MARCHÉ</Text><Title level={4}>Hausse vs baisse</Title></div><Tag className="subtle-tag">24 H</Tag></div>
            {changes.length ? <div className="breadth-content">
              <div className="chart-canvas breadth-chart"><Doughnut data={breadthData} options={breadthOptions} /><div className="breadth-center"><strong>{changes.length}</strong><span>ACTIFS</span></div></div>
              <div className="breadth-legend">
                {[['En hausse', up, COLORS[0]], ['En baisse', down, COLORS[1]], ['Stable', unchanged, COLORS[2]]].map(([label, value, color]) => <div className="breadth-legend-row" key={label}><span className="legend-dot" style={{ background: color }} /><span>{label}</span><strong>{value}</strong></div>)}
              </div>
            </div> : <div className="chart-empty">Variations 24 h indisponibles.</div>}
            <Text className="chart-caption">Nombre d’actifs chargés dont la variation 24 h est positive, négative ou nulle.</Text>
          </Card></Col>
        </Row>
      </>}
    </section>
  );
};

export default AdvancedMarketStats;
