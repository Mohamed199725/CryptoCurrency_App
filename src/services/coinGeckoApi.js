import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseUrl = 'https://api.coingecko.com/api/v3';

// Replace with your actual API key from the CoinGecko dashboard
const API_KEY = process.env.REACT_APP_COINGECKO_API_KEY; 

const createRequest = (url) => `${url}${url.includes('?') ? '&' : '?'}x_cg_demo_api_key=${API_KEY}`;

export const coinGeckoApi = createApi({
  reducerPath: 'coinGeckoApi',
  baseQuery: fetchBaseQuery({ baseUrl }),
  endpoints: (builder) => ({
    // Fetches a list of all exchanges
    getExchanges: builder.query({
      query: () => createRequest('/exchanges'),
    }),
  }),
});

export const { useGetExchangesQuery } = coinGeckoApi;