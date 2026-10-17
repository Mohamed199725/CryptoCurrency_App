import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip } from 'chart.js';
import { Col, Row, Typography } from 'antd';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);
const { Title, Text } = Typography;
const asDate = (raw) => {
  if (raw == null) return null;
  if (typeof raw === 'string' && !/^\d+(\.\d+)?$/.test(raw)) {
    const parsed = Date.parse(raw);
    return Number.isFinite(parsed) ? new Date(parsed) : null;
  }
  const number = Number(raw);
  if (!Number.isFinite(number)) return null;
  return new Date(Math.abs(number) < 1e12 ? number * 1000 : number);
};
const LineChart = ({ coinHistory, currentPrice, coinName, timeperiod }) => {
  const history = coinHistory?.data?.history || [];
  const points = history.map((item) => ({ date: asDate(item.timestamp), price: Number(item.price) })).filter((point) => point.date && Number.isFinite(point.price)).sort((a, b) => a.date - b.date);
  const intraday = ['3h', '24h'].includes(timeperiod);
  const dateFormat = new Intl.DateTimeFormat(undefined, intraday ? { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' } : { year: 'numeric', month: 'short', day: 'numeric' });
  const timestampFormat = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
  const timestamps = points.map(({ date }) => dateFormat.format(date));
  const prices = points.map(({ price }) => price);
  const rawChange = coinHistory?.data?.change;
  const change = rawChange == null || rawChange === '' ? null : Number(rawChange);
  const positive = change == null || !Number.isFinite(change) ? true : change >= 0;
  const color = positive ? '#56e0c0' : '#ff7085';
  const data = { labels: timestamps, datasets: [{
    label: `${coinName} · USD`, data: prices, borderColor: color,
    backgroundColor: (context) => {
      const { chart } = context;
      if (!chart.chartArea) return 'rgba(86,224,192,.1)';
      const gradient = chart.ctx.createLinearGradient(0, chart.chartArea.top, 0, chart.chartArea.bottom);
      gradient.addColorStop(0, positive ? 'rgba(86,224,192,.22)' : 'rgba(255,112,133,.22)');
      gradient.addColorStop(1, 'rgba(17,25,36,0)');
      return gradient;
    }, fill: true, tension: 0.28, pointRadius: 0, pointHitRadius: 14, borderWidth: 2,
  }] };
  const options = {
    responsive: true, maintainAspectRatio: false, interaction: { intersect: false, mode: 'index' },
    plugins: { legend: { display: false }, tooltip: {
      backgroundColor: '#1d2938', titleColor: '#dbe5ef', bodyColor: '#f5f8fc', padding: 12, displayColors: false,
      callbacks: { title: (items) => { const date = points[items[0]?.dataIndex]?.date; return date ? timestampFormat.format(date) : ''; }, label: (ctx) => ` $${Number(ctx.parsed.y).toLocaleString(undefined, { maximumFractionDigits: 8 })}` },
    } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#a7b4c4', maxTicksLimit: 7, maxRotation: 0, autoSkip: true }, border: { display: false } },
      y: { grid: { color: 'rgba(148,163,184,.14)' }, ticks: { color: '#a7b4c4', maxTicksLimit: 5, callback: (value) => `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 8 })}` }, border: { display: false } },
    },
  };
  return <div className="detail-chart-panel">
    <Row className="chart-header"><Col><Text className="panel-kicker">PRICE HISTORY · {timeperiod?.toUpperCase()}</Text><Title level={3} className="chart-title">{coinName} <span>price</span></Title></Col>
      <Col className="price-container"><div><Text className="detail-price-label">CURRENT PRICE</Text><Title level={4} className="current-price">{currentPrice}</Title></div>{Number.isFinite(change) && <div className={`change-pill ${positive ? 'positive' : 'negative'}`}>{positive ? '↗' : '↘'} {change > 0 ? '+' : ''}{change.toFixed(2)}%</div>}</Col>
    </Row>
    {points.length ? <div className="detail-chart-canvas"><Line data={data} options={options} /></div> : <div className="chart-empty">Historical prices are unavailable for this period.</div>}
    {!!points.length && <div className="chart-date-range">Showing {timestampFormat.format(points[0].date)} – {timestampFormat.format(points[points.length - 1].date)}</div>}
  </div>;
};
export default LineChart;
