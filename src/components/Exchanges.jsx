import React from 'react';
import millify from 'millify';
import { Collapse, Row, Col, Typography, Avatar } from 'antd';

import { useGetExchangesQuery } from '../services/cryptoApi';
import Loader from './Loader';

const { Text } = Typography;

const Exchanges = () => {
  const { data, isFetching, isError } = useGetExchangesQuery();

  if (isFetching) return <Loader />;

  if (isError) {
    return (
      <Typography.Title level={3} style={{ padding: 24 }}>
        Could not load exchanges. Check your CoinGecko API key.
      </Typography.Title>
    );
  }

  const exchangesList = data || [];

  const collapseItems = exchangesList.map((exchange) => ({
    key: exchange.id,
    showArrow: false,
    label: (
      <Row className="exchange-row">
        <Col span={6}>
          <Text>
            <strong>{exchange.trust_score_rank}.</strong>
          </Text>
          <Avatar
            className="exchange-image"
            src={exchange.image}
            alt={exchange.name}
          />
          <Text>
            <strong>{exchange.name}</strong>
          </Text>
        </Col>
        <Col span={6}>
          {exchange.trade_volume_24h_btc == null ? '—' : `₿${millify(exchange.trade_volume_24h_btc)}`}
        </Col>
        <Col span={6}>{exchange.country || 'N/A'}</Col>
        <Col span={6}>{exchange.trust_score == null ? '—' : `${exchange.trust_score}/10`}</Col>
      </Row>
    ),
    children: (
      <div>
        <p className="exchange-description">{exchange.description}</p>
        {exchange.url && (
          <a href={exchange.url} target="_blank" rel="noreferrer">
            Visit {exchange.name} →
          </a>
        )}
      </div>
    ),
  }));

  return (
    <>
      <Row className="exchange-header">
        <Col span={6}>Exchanges</Col>
        <Col span={6}>24h Trade Volume (BTC)</Col>
        <Col span={6}>Country</Col>
        <Col span={6}>Trust Score</Col>
      </Row>

      <Collapse ghost items={collapseItems} />
    </>
  );
};

export default Exchanges;