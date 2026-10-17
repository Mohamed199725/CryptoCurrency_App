import React from 'react';
import millify from 'millify';
import { Typography, Row, Col, Statistic, Card, Tag } from 'antd';
import { Link } from 'react-router-dom';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { useGetCryptosQuery, useGetGlobalMarketDataQuery } from '../services/cryptoApi';
import Cryptocurrencies from './Cryptocurrencies';
import News from './News';
import AdvancedMarketStats from './AdvancedMarketStats';
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);
const { Title, Text } = Typography;
const PALETTE = ['#56e0c0', '#8b7dff', '#ffbd59', '#ff7085', '#56a8ff', '#b49aff', '#4cc9f0', '#f4a261', '#e76f51', '#90be6d'];
const numeric = (value) => value == null || value === '' || !Number.isFinite(Number(value)) ? null : Number(value);
const compactMoney = (value) => { const amount = numeric(value); return amount == null ? '—' : `$${millify(amount, { precision: 2 })}`; };
const compactCount = (value) => { const amount = numeric(value); return amount == null ? '—' : millify(amount); };
const Homepage = () => {
  const { data, isFetching, isError, fulfilledTimeStamp } = useGetCryptosQuery(100, { pollingInterval: 60000 });
  const { data: globalMarketData, isFetching: globalMarketFetching, isError: globalMarketError } = useGetGlobalMarketDataQuery(undefined, { pollingInterval: 60000 });
  const globalStats = data?.data?.stats || {};
  const totalMarketCap = numeric(globalMarketData?.data?.total_market_cap?.usd);
  const coins = data?.data?.coins || [];
  const dataUnavailable = isError || !data?.data?.stats;
  const changedCoins = coins
    .map((coin) => ({ coin, change: numeric(coin.change) }))
    .filter((entry) => entry.change != null);
  const gainers = changedCoins.filter((entry) => entry.change > 0).sort((a, b) => b.change - a.change).slice(0, 10);
  const losers = changedCoins.filter((entry) => entry.change < 0).sort((a, b) => a.change - b.change).slice(0, 10);
  const chartCoins = [...gainers, ...losers];
  const capCoins = coins.slice(0, 5).filter((coin) => numeric(coin.marketCap) > 0);
  const barData = { labels: chartCoins.map(({ coin }) => coin.symbol), datasets: [{
    label: '24h change', data: chartCoins.map(({ change }) => change),
    backgroundColor: chartCoins.map(({ change }) => change >= 0 ? 'rgba(86,224,192,.82)' : 'rgba(255,112,133,.82)'),
    borderRadius: 6, borderSkipped: false, barThickness: 20,
  }] };
  const marketCapData = { labels: capCoins.map((coin) => coin.symbol), datasets: [{
    data: capCoins.map((coin) => numeric(coin.marketCap)), backgroundColor: PALETTE,
    borderColor: '#111924', borderWidth: 4, hoverOffset: 5,
  }] };
  const axisColor = '#a7b4c4';
  const barOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => ` ${ctx.parsed.x > 0 ? '+' : ''}${ctx.parsed.x.toFixed(2)}% over 24 hours` } } },
    scales: {
      x: { grid: { color: (context) => Number(context.tick.value) === 0 ? 'rgba(220,232,242,.7)' : 'rgba(148,163,184,.15)', lineWidth: (context) => Number(context.tick.value) === 0 ? 2 : 1 }, ticks: { color: axisColor, font: { family: 'Inter, sans-serif', weight: 600 }, callback: (value) => `${Number(value) > 0 ? '+' : ''}${Number(value).toFixed(0)}%` }, border: { display: false } },
      y: { grid: { display: false }, ticks: { color: axisColor, font: { family: 'Inter, sans-serif', weight: 600 } }, border: { display: false } },
    },
  };
  const doughnutOptions = { responsive: true, maintainAspectRatio: false, cutout: '72%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: $${millify(ctx.raw, { precision: 2 })}` } } } };
  return <div className="dashboard-page">
    <header className="dashboard-header"><div>
      <Text className="eyebrow">MARKET OVERVIEW {dataUnavailable ? <span className="data-status">{isFetching ? 'CONNECTING TO MARKET DATA' : 'DATA CONNECTION REQUIRED'}</span> : <><span className="live-indicator" /> LIVE DATA · REFRESH 60 S</>}</Text>
      <Title level={1}>Your market, <span>in focus.</span></Title>
      <Text className="header-subtitle">A clear view of the crypto market, updated from live market data.</Text>
      {dataUnavailable && <Text className="api-notice">{isFetching ? 'Live data is loading. Values stay blank until the API returns them.' : 'Live prices are unavailable. Configure the CoinRanking RapidAPI key to display verified figures.'}</Text>}
    </div><div className="header-date">GLOBAL MARKETS <span>USD · 24H</span></div></header>
    <Row gutter={[14, 14]} className="stats-grid">
      <Col xs={12} xl={6}><Card className="stat-card"><Text className="stat-label">TOTAL MARKET CAP</Text><Statistic value={compactMoney(totalMarketCap)} /><Text className="stat-foot">{totalMarketCap != null ? 'Global crypto market capitalization' : globalMarketFetching ? 'Loading global market data' : globalMarketError ? 'Global market data request failed' : 'Global market cap unavailable'}</Text></Card></Col>
      <Col xs={12} xl={6}><Card className="stat-card"><Text className="stat-label">24H TRADING VOLUME</Text><Statistic value={compactMoney(globalStats.total24hVolume)} /><Text className="stat-foot">Global reported volume</Text></Card></Col>
      <Col xs={12} xl={6}><Card className="stat-card"><Text className="stat-label">CRYPTOCURRENCIES</Text><Statistic value={compactCount(globalStats.total)} /><Text className="stat-foot">Assets tracked</Text></Card></Col>
      <Col xs={12} xl={6}><Card className="stat-card"><Text className="stat-label">ACTIVE EXCHANGES</Text><Statistic value={compactCount(globalStats.totalExchanges)} /><Text className="stat-foot">Markets worldwide</Text></Card></Col>
    </Row>
    <Row gutter={[14, 14]} className="market-charts">
      <Col xs={24} xl={16}><Card className="panel-card performance-panel"><div className="panel-heading"><div><Text className="panel-kicker">MARKET MOMENTUM</Text><Title level={4}>24-hour price performance</Title></div><Tag className="subtle-tag">TOP 10 GAINERS + LOSERS · USD</Tag></div>
        <div className="chart-canvas performance-chart" style={{ height: Math.max(220, chartCoins.length * 22) }}>{chartCoins.length ? <Bar data={barData} options={{ ...barOptions, indexAxis: 'y' }} /> : <div className="chart-empty">Verified 24-hour changes will appear when the market feed is connected.</div>}</div><Text className="chart-caption">Best 10 positive and worst 10 negative reported changes among the 100 loaded assets. Green bars are gains; red bars are losses · source: CoinRanking</Text>
      </Card></Col>
      <Col xs={24} xl={8}><Card className="panel-card allocation-panel"><div className="panel-heading"><div><Text className="panel-kicker">MARKET COMPOSITION</Text><Title level={4}>Top 5 by market cap</Title></div></div>
        <div className="allocation-content"><div className="chart-canvas donut-chart">{capCoins.length ? <><Doughnut data={marketCapData} options={doughnutOptions} /><div className="donut-center"><span>TOP 5</span><strong>CAP</strong></div></> : <div className="chart-empty">Market-cap data unavailable</div>}</div>
          <div className="legend-list">{capCoins.map((coin, index) => <div className="legend-row" key={coin.uuid}><span className="legend-dot" style={{ background: PALETTE[index] }} /><span>{coin.symbol}</span><strong>{compactMoney(coin.marketCap)}</strong></div>)}</div></div><Text className="chart-caption">Share of the combined market cap of the five listed assets</Text>
      </Card></Col>
    </Row>
    <AdvancedMarketStats coins={coins} stats={globalStats} isError={isError} updatedAt={fulfilledTimeStamp} />
    <section className="dashboard-section"><div className="section-heading"><div><Text className="panel-kicker">MARKET WATCH</Text><Title level={3}>Leading cryptocurrencies</Title></div><Link className="text-link" to="/cryptocurrencies">Explore all assets <span>↗</span></Link></div><Cryptocurrencies simplified /></section>
    <section className="dashboard-section news-section"><div className="section-heading"><div><Text className="panel-kicker">THE LATEST</Text><Title level={3}>Market headlines</Title></div><Link className="text-link" to="/news">All headlines <span>↗</span></Link></div><News simplified /></section>
  </div>;
};
export default Homepage;
