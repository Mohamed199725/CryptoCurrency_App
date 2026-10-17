import React, { useMemo, useState } from 'react';
import millify from 'millify';
import { Link } from 'react-router-dom';
import { Card, Row, Col, Input, Empty, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useGetCryptosQuery } from '../services/cryptoApi';
import Loader from './Loader';

const { Text } = Typography;
const EMPTY_COINS = [];
const formatPrice = (value) => {
  if (value == null || value === '') return '—';
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  return `$${number.toLocaleString(undefined, { maximumFractionDigits: number < 1 ? 8 : 2 })}`;
};
const Cryptocurrencies = ({ simplified = false }) => {
  const count = simplified ? 10 : 100;
  const { data: response, isFetching, isError } = useGetCryptosQuery(count, { pollingInterval: 60000 });
  const coins = response?.data?.coins || EMPTY_COINS;
  const [searchTerm, setSearchTerm] = useState('');
  const filteredCoins = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return coins;
    return coins.filter((coin) => `${coin.name} ${coin.symbol}`.toLowerCase().includes(query));
  }, [coins, searchTerm]);

  if (isFetching && !coins.length) return <Loader />;
  if (isError && !coins.length) return <div className="inline-status">Crypto prices are unavailable. Check the market data connection and API key.</div>;
  return (
    <>
      {!simplified && <div className="crypto-search-wrap">
        <Input allowClear prefix={<SearchOutlined />} value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search by name or symbol (e.g. Ethereum, ETH)" className="crypto-search" />
        <Text className="search-count">{filteredCoins.length} {filteredCoins.length === 1 ? 'asset' : 'assets'}</Text>
      </div>}
      {filteredCoins.length ? <Row gutter={[16, 16]} className="crypto-card-container">
        {filteredCoins.map((currency) => {
          const change = currency.change == null || currency.change === '' ? null : Number(currency.change);
          const cap = currency.marketCap == null || currency.marketCap === '' ? null : Number(currency.marketCap);
          const volume = currency['24hVolume'] ?? currency.volume24h;
          return <Col xs={24} sm={12} lg={8} xl={6} className="crypto-card" key={currency.uuid}>
            <Link to={`/crypto/${currency.uuid}`} className="crypto-card-link">
              <Card title={<span className="crypto-card-name"><span className="crypto-rank">#{currency.rank}</span>{currency.name}<small>{currency.symbol}</small></span>} extra={<img className="crypto-image" src={currency.iconUrl} alt={`${currency.name} logo`} />} hoverable>
                <div className="crypto-card-metrics"><span>Price</span><strong>{formatPrice(currency.price)}</strong></div>
                <div className="crypto-card-metrics"><span>Market cap</span><strong>{Number.isFinite(cap) ? `$${millify(cap)}` : '—'}</strong></div>
                <div className="crypto-card-metrics"><span>24h volume</span><strong>{volume == null || volume === '' || !Number.isFinite(Number(volume)) ? '—' : `$${millify(Number(volume), { precision: 2 })}`}</strong></div>
                <div className="crypto-card-metrics"><span>24h change</span><strong className={Number.isFinite(change) ? (change >= 0 ? 'positive-text' : 'negative-text') : ''}>{Number.isFinite(change) ? `${change > 0 ? '+' : ''}${change.toFixed(2)}%` : '—'}</strong></div>
              </Card>
            </Link>
          </Col>;
        })}
      </Row> : <Empty className="crypto-empty" description={searchTerm ? `No assets found for “${searchTerm}”` : 'No market data available'} />}
    </>
  );
};
export default Cryptocurrencies;
