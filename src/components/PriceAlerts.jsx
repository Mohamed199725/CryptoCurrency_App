import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Card, Empty, InputNumber, Select, Tag, Typography, notification } from 'antd';
import { BellOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';

const STORAGE_KEY = 'cryptoverse-price-alerts-v1';
const { Title, Text } = Typography;
const numeric = (value) => value == null || value === '' || !Number.isFinite(Number(value)) ? null : Number(value);
const readAlerts = () => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const PriceAlerts = ({ coins = [], updatedAt, isError = false }) => {
  const availableCoins = useMemo(() => coins
    .filter((coin) => coin && coin.uuid && numeric(coin.change) != null)
    .map((coin) => ({ uuid: coin.uuid, name: coin.name, symbol: coin.symbol, change: Number(coin.change) })), [coins]);
  const [alerts, setAlerts] = useState(readAlerts);
  const [selectedUuid, setSelectedUuid] = useState('');
  const [direction, setDirection] = useState('above');
  const [threshold, setThreshold] = useState(5);
  const processedUpdate = useRef(null);
  const [api, contextHolder] = notification.useNotification();

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
    } catch {
      // Keep the alert controls usable if local storage is unavailable.
    }
  }, [alerts]);

  useEffect(() => {
    if (!updatedAt || !availableCoins.length || processedUpdate.current === updatedAt) return;
    processedUpdate.current = updatedAt;
    const latestByUuid = new Map(availableCoins.map((coin) => [coin.uuid, coin]));
    const fired = [];
    setAlerts((previous) => previous.map((alert) => {
      const coin = latestByUuid.get(alert.uuid);
      if (!coin) return alert;
      const current = coin.change;
      const prior = numeric(alert.lastObserved);
      const priorAt = numeric(alert.lastObservedAt);
      const sampleIsContinuous = prior != null && priorAt != null && updatedAt > priorAt && updatedAt - priorAt <= 120000;
      const crossed = sampleIsContinuous && (alert.direction === 'above'
        ? prior < alert.threshold && current >= alert.threshold
        : prior > alert.threshold && current <= alert.threshold);
      const next = { ...alert, lastObserved: current, lastObservedAt: updatedAt };
      if (crossed) {
        next.lastTriggeredAt = updatedAt;
        fired.push({ ...alert, name: coin.name, symbol: coin.symbol, current });
      }
      return next;
    }));
    fired.forEach((alert) => {
      const operator = alert.direction === 'above' ? 'reached or crossed above' : 'reached or crossed below';
      api.open({
        message: `${alert.name} (${alert.symbol}) price alert`,
        description: `24h change ${operator} ${alert.threshold > 0 ? '+' : ''}${alert.threshold.toFixed(2)}%. Latest reported value: ${alert.current > 0 ? '+' : ''}${alert.current.toFixed(2)}%.`,
        placement: 'topRight',
        duration: 8,
        className: 'price-alert-notification',
      });
    });
  }, [updatedAt, availableCoins, alerts.length, api]);

  const addAlert = () => {
    const coin = availableCoins.find((item) => item.uuid === selectedUuid);
    const target = numeric(threshold);
    if (!coin || target == null || target < -100 || target > 100) return;
    const now = numeric(updatedAt) || Date.now();
    setAlerts((previous) => [...previous, {
      id: `${coin.uuid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      uuid: coin.uuid,
      name: coin.name,
      symbol: coin.symbol,
      direction,
      threshold: target,
      lastObserved: coin.change,
      lastObservedAt: now,
      lastTriggeredAt: null,
    }]);
  };

  const coinOptions = availableCoins.map((coin) => ({
    value: coin.uuid,
    label: `${coin.name} (${coin.symbol}) · ${coin.change > 0 ? '+' : ''}${coin.change.toFixed(2)}%`,
  }));
  const selectedCoin = availableCoins.find((coin) => coin.uuid === selectedUuid);

  return (
    <section className="dashboard-section price-alerts-section">
      {contextHolder}
      <Card className="panel-card price-alerts-card">
        <div className="price-alerts-heading">
          <div>
            <Text className="panel-kicker">PRICE MONITOR</Text>
            <Title level={3}><BellOutlined /> 24-hour price alerts</Title>
            <Text className="price-alerts-subtitle">Alerts trigger when a newly reported 24h change crosses your threshold. Market data is checked every 60 seconds while this dashboard is open.</Text>
          </div>
          <Tag className={isError ? 'data-tag data-tag-error' : 'data-tag data-tag-live'}>{isError ? 'FEED UNAVAILABLE' : 'LOCAL ALERTS · 60S CHECK'}</Tag>
        </div>

        <div className="price-alert-form">
          <div className="price-alert-field price-alert-coin-field">
            <label htmlFor="alert-coin">Cryptocurrency</label>
            <Select id="alert-coin" showSearch optionFilterProp="label" value={selectedUuid || undefined} onChange={setSelectedUuid} options={coinOptions} placeholder="Select an asset" notFoundContent="No live market data" />
          </div>
          <div className="price-alert-field price-alert-direction-field">
            <label htmlFor="alert-direction">Trigger when 24h change</label>
            <Select id="alert-direction" value={direction} onChange={setDirection} options={[{ value: 'above', label: 'Crosses above' }, { value: 'below', label: 'Crosses below' }]} />
          </div>
          <div className="price-alert-field price-alert-threshold-field">
            <label htmlFor="alert-threshold">Threshold (%)</label>
            <InputNumber id="alert-threshold" min={-100} max={100} step={0.1} precision={2} value={threshold} onChange={setThreshold} addonAfter="%" />
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={addAlert} disabled={!selectedCoin || numeric(threshold) == null} className="price-alert-add">Create alert</Button>
        </div>

        {selectedCoin && <Text className="price-alert-baseline">Current {selectedCoin.symbol} 24h change: <strong className={selectedCoin.change >= 0 ? 'positive-text' : 'negative-text'}>{selectedCoin.change > 0 ? '+' : ''}{selectedCoin.change.toFixed(2)}%</strong>. New alerts use this as their starting point and notify only after a later threshold crossing.</Text>}

        <div className="price-alert-list-heading"><Text className="panel-kicker">YOUR ALERTS</Text><Tag className="subtle-tag">{alerts.length} {alerts.length === 1 ? 'RULE' : 'RULES'}</Tag></div>
        {!alerts.length ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No price alerts yet. Create one above." /> : (
          <div className="price-alert-list">
            {alerts.map((alert) => {
              const liveCoin = availableCoins.find((coin) => coin.uuid === alert.uuid);
              const latest = liveCoin?.change ?? alert.lastObserved;
              return <div className="price-alert-item" key={alert.id}>
                <div className="price-alert-item-main">
                  <span className="price-alert-icon"><BellOutlined /></span>
                  <div className="price-alert-item-copy">
                    <strong>{alert.name} <small>{alert.symbol}</small></strong>
                    <span>24h change crosses {alert.direction} {alert.threshold > 0 ? '+' : ''}{Number(alert.threshold).toFixed(2)}%</span>
                  </div>
                </div>
                <div className="price-alert-item-current">
                  <span>Latest reported change</span>
                  <strong className={latest >= 0 ? 'positive-text' : 'negative-text'}>{latest > 0 ? '+' : ''}{Number(latest).toFixed(2)}%</strong>
                </div>
                <div className="price-alert-item-status">
                  <Tag className="data-tag data-tag-live">ARMED</Tag>
                  {alert.lastTriggeredAt && <span>Last triggered {new Date(alert.lastTriggeredAt).toLocaleTimeString()}</span>}
                </div>
                <Button aria-label={`Delete ${alert.name} alert`} type="text" danger icon={<DeleteOutlined />} onClick={() => setAlerts((previous) => previous.filter((item) => item.id !== alert.id))} />
              </div>;
            })}
          </div>
        )}
        <Alert className="price-alert-note" type="info" showIcon message="Alerts are stored in this browser and require the dashboard to remain open. Notifications reflect the latest CoinRanking 24h change received; they are not exchange trading or push alerts." />
      </Card>
    </section>
  );
};

export default PriceAlerts;
