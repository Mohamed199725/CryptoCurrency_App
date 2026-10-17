import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const cryptoNewsApi = createApi({
  reducerPath: 'cryptoNewsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/cryptocompare' }),
  endpoints: (builder) => ({
    getCryptoNews: builder.query({
      query: ({ newsCategory, count }) => {
        const params = new URLSearchParams({ lang: 'EN', categories: newsCategory, limit: String(count) });
        const apiKey = process.env.REACT_APP_CRYPTOCOMPARE_API_KEY;
        if (apiKey) params.set('api_key', apiKey);
        return { url: `/data/v2/news/?${params.toString()}` };
      },
    }),
  }),
});
export const { useGetCryptoNewsQuery } = cryptoNewsApi;
