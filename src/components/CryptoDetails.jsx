import React, { useState } from 'react';
import HTMLReactParser from 'html-react-parser';
import { useParams } from 'react-router-dom';
import millify from 'millify';
import { Typography, Select } from 'antd';
import { MoneyCollectOutlined, DollarCircleOutlined, FundOutlined, ExclamationCircleOutlined, StopOutlined, TrophyOutlined, CheckOutlined, NumberOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useGetCryptoDetailsQuery, useGetCryptoHistoryQuery } from '../services/cryptoApi';
import Loader from './Loader';
import LineChart from './LineChart';
const { Title, Text } = Typography;
const formatNumber = (value) => value == null || value === '' || !Number.isFinite(Number(value)) ? '—' : millify(Number(value), { precision: 2 });
const formatUsd = (value) => {
  if (value == null || value === '' || !Number.isFinite(Number(value))) return '—';
  return `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: Number(value) < 1 ? 8 : 2 })}`;
};
const timeOptions = [
  { value: '3h', label: 'Last 3 hours' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '3m', label: 'Last 3 months' },
  { value: '1y', label: 'Last year' },
  { value: '3y', label: 'Last 3 years' },
  { value: '5y', label: 'Last 5 years' },
];
const CryptoDetails = () => {
  const { coinId } = useParams();
  const [timeperiod, setTimeperiod] = useState('7d');
  const { data, isFetching, isError } = useGetCryptoDetailsQuery(coinId, { pollingInterval: 60000 });
  const { currentData: coinHistory, isFetching: historyFetching } = useGetCryptoHistoryQuery({ coinId, timeperiod }, { skip: !coinId, pollingInterval: 60000 });
  const cryptoDetails = data?.data?.coin;
  if (isFetching && !cryptoDetails) return <Loader />;
  if (isError || !cryptoDetails) return <div className="inline-status">This cryptocurrency’s details could not be loaded. Check the market data connection.</div>;

  const volume24h = cryptoDetails['24hVolume'] ?? cryptoDetails.volume24h;
  const stats = [
    { title: 'Price to USD', value: formatUsd(cryptoDetails.price), icon: <DollarCircleOutlined /> },
    { title: 'Rank', value: cryptoDetails.rank ?? '—', icon: <NumberOutlined /> },
    { title: '24h Volume', value: formatUsd(volume24h), icon: <ThunderboltOutlined /> },
    { title: 'Market Cap', value: formatUsd(cryptoDetails.marketCap), icon: <DollarCircleOutlined /> },
    { title: 'All-time high', value: formatUsd(cryptoDetails.allTimeHigh?.price), icon: <TrophyOutlined /> },
  ];
  const genericStats = [
    { title: 'Number of markets', value: formatNumber(cryptoDetails.numberOfMarkets), icon: <FundOutlined /> },
    { title: 'Number of exchanges', value: formatNumber(cryptoDetails.numberOfExchanges), icon: <MoneyCollectOutlined /> },
    { title: 'Supply verified', value: cryptoDetails.supply?.confirmed == null ? '—' : cryptoDetails.supply.confirmed ? <CheckOutlined /> : <StopOutlined />, icon: <ExclamationCircleOutlined /> },
    { title: 'Total supply', value: formatNumber(cryptoDetails.supply?.total), icon: <ExclamationCircleOutlined /> },
    { title: 'Circulating supply', value: formatNumber(cryptoDetails.supply?.circulating), icon: <ExclamationCircleOutlined /> },
  ];
  const description = cryptoDetails.description ? HTMLReactParser(cryptoDetails.description) : <p>Description not available.</p>;
  return (
    <div className="coin-detail-container">
      <div className="coin-heading-container">
        <Title level={2} className="coin-name">{cryptoDetails.name} ({cryptoDetails.symbol}) <span>price</span></Title>
        <p>{cryptoDetails.name} live price in US dollars. View historical prices, market cap, volume and supply.</p>
      </div>
      <div className="period-filter"><label htmlFor="history-period">Chart period</label><Select id="history-period" value={timeperiod} options={timeOptions} className="select-timeperiod" onChange={setTimeperiod} /></div>
      {historyFetching && !coinHistory ? <div className="inline-status">Loading {timeOptions.find((option) => option.value === timeperiod)?.label.toLowerCase()} price history…</div> : <LineChart coinHistory={coinHistory} currentPrice={formatUsd(cryptoDetails.price)} coinName={cryptoDetails.name} timeperiod={timeperiod} />}
      <div className="stats-container">
        <div className="coin-value-statistics"><div className="coin-value-statistics-heading"><Title level={3} className="coin-details-heading">{cryptoDetails.name} value statistics</Title><p>Market data reported by the connected price feed. USD figures and token supply are clearly distinguished.</p></div>
          {stats.map(({ icon, title, value }) => <div className="coin-stats" key={title}><div className="coin-stats-name"><Text>{icon}</Text><Text>{title}</Text></div><Text className="stats">{value}</Text></div>)}
        </div>
        <div className="other-stats-info"><div className="coin-value-statistics-heading"><Title level={3} className="coin-details-heading">Supply &amp; market stats</Title><p>Network coverage and supply data as reported by the API.</p></div>
          {genericStats.map(({ icon, title, value }) => <div className="coin-stats" key={title}><div className="coin-stats-name"><Text>{icon}</Text><Text>{title}</Text></div><Text className="stats">{value}</Text></div>)}
        </div>
      </div>
      <div className="coin-desc-link"><section className="coin-desc"><Title level={3} className="coin-details-heading">What is {cryptoDetails.name}?</Title><div>{description}</div></section>
        <section className="coin-links"><Title level={3} className="coin-details-heading">{cryptoDetails.name} links</Title>{cryptoDetails.links?.length ? cryptoDetails.links.map((link) => <div className="coin-link" key={`${link.type}-${link.url}`}><Title level={5} className="link-name">{link.type}</Title><a href={link.url} target="_blank" rel="noreferrer">{link.name}</a></div>) : <Text className="body-copy">No official links are available.</Text>}</section>
      </div>
    </div>
  );
};
export default CryptoDetails;
