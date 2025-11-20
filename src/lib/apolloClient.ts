// src/lib/apolloClient.ts
import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';

const httpLink = new HttpLink({
  uri: 'https://graphql-pokeapi.vercel.app/api/graphql', // endpoint public
});

export const apolloClient = new ApolloClient({
  link: new HttpLink({ uri: 'https://graphql-pokeapi.vercel.app/api/graphql' }),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // si on utilise limit/offset, on peut définir une policy pour concaténer pages
          pokemons: {
            keyArgs: false, // ignore args for caching -> we implement merge
            merge(existing, incoming) {
              const existingResults = existing?.results ?? [];
              const incomingResults = incoming?.results ?? [];
              return {
                ...incoming,
                results: [...existingResults, ...incomingResults],
              };
            },
          },
        },
      },
    },
  }),
});
