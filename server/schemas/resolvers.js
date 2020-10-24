const {AuthenticationError} = require("apollo-server-express");

const {Thought, User} = require("../models");
const {signToken} = require("../utils/auth");

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            if(context.user) {
                const userData = await User.findOne({})
                    .select("-__v -password")
                    .populate("thoughts")
                    .populate("friends");

                return userData;
            }

            throw new AuthenticationError("Not logged in");
        },
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
    }, 
    
    Mutation: {
        addUser: async (parent, args) => {
            const user = await User.create(args);
            const token = signToken(user);
            return {token, user};
        },
        login: async (parent, {email, password}) => {
            const user = await User.findOne({email});

            if(!user) {
                throw new AuthenticationError("Incorrect credentials");
            }

            const correctPw = await user.isCorrectPassword(password);

            if(!correctPw) {
                throw new AuthenticationError("Incorrect credentials");
            }

            const token = signToken(user);
            return {token, user};
        },
        
        addThought: async (parent, args, context) => {
            if(context.user) {
                const thought = await Thought.create({...args, username: context.user.username});

                await User.findByIdAndUpdate(
                    {_id: context.user._id},
                    {$push: {thoughts: thought._id}},
                    {new: true}
                );

                return thought;
            }

            throw new AuthenticationError("You need to be logged in!");
        },
        
        addReaction: async (parent, {thoughtId, reactionBody}, context) => {
            if(context.user) {
                const updatedThought = await Thought.findOneAndUpdate(
                    {_id: thoughtId},
                    {$push: {reactions: {reactionBody, username: context.user.username}}},
                    {new: true, runValidators: true}
                );

                return updatedThought;
            }

            throw new AuthenticationError("You need to be logged in!");
        },

        addFriend: async (parent, {friendId}, context) => {
            if(context.user) {
                const updatedUser = await User.findOneAndUpdate(
                    {username: context.user.username},
                    {$addToSet: {friends: friendId}},
                    {new: true}
                ).populate("friends");

                // While we'll return the updated user, we also want to ensure the friend's profile is also updated
                const updatedFriend = await User.findOneAndUpdate(
                    {_id: friendId},
                    {$addToSet: {friends: context.user._id}},
                    {new: true}
                ).populate("friends");

                return updatedUser;
            }

            throw new AuthenticationError("You need to be logged in!");
        }
    }
};

module.exports = resolvers;