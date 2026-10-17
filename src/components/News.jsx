import React, { useMemo, useState } from 'react';
import { Select, Typography, Row, Col, Avatar, Card, Empty } from 'antd';
import moment from 'moment';
import { useGetCryptosQuery } from '../services/cryptoApi';
import { useGetCryptoNewsQuery } from '../services/cryptoNewsApi';
import Loader from './Loader';

const demoImage = 'https://www.bing.com/th?id=OVFT.mpzuVZnv8dwIMRfQGPbOPC&pid=News';
const { Text, Title } = Typography;
const POPULAR = [
  { value: 'BTC', label: 'Bitcoin (BTC)' }, { value: 'ETH', label: 'Ethereum (ETH)' },
  { value: 'SOL', label: 'Solana (SOL)' }, { value: 'XRP', label: 'XRP' },
  { value: 'BNB', label: 'BNB' }, { value: 'ADA', label: 'Cardano (ADA)' },
  { value: 'DOGE', label: 'Dogecoin (DOGE)' }, { value: 'DOT', label: 'Polkadot (DOT)' },
];
const News = ({ simplified = false }) => {
  const [newsCategory, setNewsCategory] = useState('BTC');
  const { data: coinResponse } = useGetCryptosQuery(100);
  const hasNewsApiKey = Boolean(process.env.REACT_APP_CRYPTOCOMPARE_API_KEY);
  const { data: newsResponse, isFetching, isError } = useGetCryptoNewsQuery({ newsCategory, count: simplified ? 6 : 12 }, { skip: !hasNewsApiKey });
  const newsList = newsResponse?.Data || [];
  const options = useMemo(() => {
    const seen = new Set();
    const availableCoins = [...POPULAR, ...(coinResponse?.data?.coins || []).map((coin) => ({ value: coin.symbol, label: `${coin.name} (${coin.symbol})` }))];
    return availableCoins.filter((coin) => {
      const symbol = String(coin.value || '').toUpperCase();
      if (!symbol || seen.has(symbol)) return false;
      seen.add(symbol);
      return true;
    }).map((coin) => ({ value: String(coin.value).toUpperCase(), label: coin.label }));
  }, [coinResponse]);
  const errorMessage = newsResponse?.Err?.message || newsResponse?.Message;
  return (
    <Row gutter={[16, 16]} className="news-grid">
      {!simplified && <Col span={24}>
        <div className="news-filter-row"><label htmlFor="news-crypto-select">Filter headlines by crypto</label><Select id="news-crypto-select" showSearch value={newsCategory} options={options} className="select-news" placeholder="Search a cryptocurrency" optionFilterProp="label" filterOption={(input, option) => option.label.toLowerCase().includes(input.toLowerCase())} onChange={setNewsCategory} notFoundContent="No matching crypto" /></div>
      </Col>}
      {isFetching && !newsList.length && <Col span={24}><Loader /></Col>}
      {newsList.map((news, index) => <Col xs={24} sm={12} lg={8} key={news.id || news.url || index}>
        <Card hoverable className="news-card"><a href={news.url} target="_blank" rel="noreferrer">
          <div className="news-image-container"><Title className="news-title" level={4}>{news.title}</Title><img src={news.imageurl || demoImage} alt="" /></div>
          <p>{news.body && news.body.length > 150 ? `${news.body.substring(0, 150)}…` : news.body}</p>
          <div className="provider-container"><div><Avatar src={news.source_info?.img || demoImage} alt="" /><Text className="provider-name">{news.source_info?.name || news.source || 'News source'}</Text></div><Text>{news.published_on ? moment.unix(news.published_on).fromNow() : ''}</Text></div>
        </a></Card>
      </Col>)}
      {!isFetching && !newsList.length && <Col span={24}>
        {!hasNewsApiKey ? <div className="inline-status news-status">CryptoCompare requires an API key to provide headlines. Configure REACT_APP_CRYPTOCOMPARE_API_KEY to enable news for {newsCategory}.</div> : isError || errorMessage ? <div className="inline-status news-status">{errorMessage || `Headlines for ${newsCategory} could not be loaded.`}</div> : <Empty description={`No headlines found for ${newsCategory}`} />}
      </Col>}
    </Row>
  );
};
export default News;
