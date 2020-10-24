const express = require('express');
const {ApolloServer} = require("apollo-server-express");
const {typeDefs, resolvers} = require("./schemas");
const db = require('./config/connection');
const {authMiddleware} = require("./utils/auth");

const PORT = process.env.PORT || 3001;
const app = express();

// Create a new Apollo server and pass in our schema data
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: authMiddleware
});

// Integrate Apollo server with Express application and middleware
server.applyMiddleware({app});

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

db.once('open', () => {
  app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}!`);
    console.log(`Use GraphQL at http://localhost:${PORT}${server.graphqlPath}`);
  });
});
