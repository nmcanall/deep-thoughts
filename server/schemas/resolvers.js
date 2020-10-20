const {Thought, User} = require("../models")

const resolvers = {
    Query: {
        users: async () => {
            return User.find()
                .select("-__v -password")
                .populate("friends")
                .populate("thoughts")
                .sort({username: 1});
        },
        user: async (parent, {username}) => {
            return User.findOne({username})
                .select("-__v -password")
                .populate("friends")
                .populate("thoughts");
        },
        thoughts: async (parent, {username}) => {
            // If username exists, set params and search for that.
            // Otherwise, params is empty and search for all thoughts
            const params = username ? {username} : {};
            return Thought.find(params).sort({createdAt: -1});
        },
        thought: async (parent, {_id}) => {
            return Thought.findOne({_id});
        }
    }
};

module.exports = resolvers;