import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const coinrankingHeaders = {
  'X-RapidAPI-Key': process.env.REACT_APP_RAPIDAPI_KEY,
  'X-RapidAPI-Host': 'coinranking1.p.rapidapi.com',
};

const COINRANKING = 'https://coinranking1.p.rapidapi.com';
const COINGECKO = 'https://api.coingecko.com/api/v3';

export const cryptoApi = createApi({
  reducerPath: 'cryptoApi',
  baseQuery: fetchBaseQuery({ baseUrl: '' }), // empty — endpoints give full URLs
  endpoints: (builder) => ({
    getCryptos: builder.query({
      query: (count) => ({
        url: `${COINRANKING}/coins?limit=${count}`,
        headers: coinrankingHeaders,
      }),
    }),
    getGlobalMarketData: builder.query({
      query: () => {
        const key = process.env.REACT_APP_COINGECKO_API_KEY;
        return {
          url: `${COINGECKO}/global${key ? `?x_cg_demo_api_key=${encodeURIComponent(key)}` : ''}`,
        };
      },
    }),
    getCryptoDetails: builder.query({
      query: (coinId) => ({
        url: `${COINRANKING}/coin/${coinId}`,
        headers: coinrankingHeaders,
      }),
    }),
    getCryptoHistory: builder.query({
      query: ({ coinId, timeperiod }) => ({
        url: `${COINRANKING}/coin/${coinId}/history?timePeriod=${timeperiod}`,
        headers: coinrankingHeaders,
      }),
    }),
    getExchanges: builder.query({
      query: () => {
        const key = process.env.REACT_APP_COINGECKO_API_KEY;
        return {
          url: `${COINGECKO}/exchanges?x_cg_demo_api_key=${key}`,
        };
      },
    }),
  }),
});

export const {
  useGetCryptosQuery,
  useGetGlobalMarketDataQuery,
  useGetCryptoDetailsQuery,
  useGetCryptoHistoryQuery,
  useGetExchangesQuery,
} = cryptoApi;