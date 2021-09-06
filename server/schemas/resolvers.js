const { AuthenticationError } = require('apollo-server-express');
const { User, Message, Server, Channel } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
        //get user from message
        message_user: async (message_id) => {
            return Message.findOne({ _id: message_id }).populate('user');
        },

        // get servers from user
        user_servers: async (user_id) => {
            return User.findOne({ _id: user_id }).populate('servers')
        },

        // get users from server
        server_users: async (server_id) => {
            return Server.findOne({ _id: server_id }).populate('users')
        },

        // get channels from server
        server_channels: async (server_id) => {
            return Server.findOne({ _id: server_id }).populate('channels');
        },

        // get messages from channel
        channel_messages: async (channel_id) => {
            return Channel.findOne({ _id: channel_id }).populate('messages')
        },

        // allows authentication to work properly
        me: async (parent, args, context) => {
            if (context.user) {
                return User.findOne({ _id: context.user._id });
            }
            throw new AuthenticationError('You need to be logged in!');
        },
    },

    Mutation: {
        addUser: async (parent, { username, email, password }) => {
            const server = await Server.findOne({}); //get default server so we can put it in the new user
            const user = await User.create({ username, email, password, servers: server._id });

            //add new user to the default server
            await Server.findOneAndUpdate(
                { _id: server._id },
                { $addToSet: { users: user._id } }
            )

            const token = signToken(user);
            return { token, user };
        },
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });
            if (!user) {
                throw new AuthenticationError('No user found with this email address');
            }

            const correctPw = await user.isCorrectPassword(password);

            if (!correctPw) {
                throw new AuthenticationError('Incorrect credentials');
            }

            const token = signToken(user);
            return { token, user };
        },
        // Send message on server and to one user
        addMessage: async (parent, { message_body }, context) => {
            if (context.username) {
                const message = await Message.create({
                    body: message_body,
                    user_id: context.id
                });

                // ! DO NOT DELETE, AWAITING SERVERS TO BE COMPLETED
                // await Channel.findOneAndUpdate(
                //     { _id: room },
                //     { $addToSet: { messages: message._id } }
                // );

                return message;
            }
            throw new AuthenticationError('You need to be logged in!');
        },
        // Edit a message sent on server or to a user
        // editMessage: async (parent, { message_body }, context) => {
        //     // if (context.user) {
        //         const message = await Message.create({
        //             message_body: message_body,
        //             message_author: context.user.username,
        //         });

        //         await User.findOneAndUpdate(
        //             { _id: context.user._id },
        //             { $addToSet: { messages: message._id } }
        //         );

        //         await Server.findOneAndUpdate(
        //             { _id: context.server._id },
        //             { $addToSet: { messages: message._id } }
        //         );

        //         return message;
        //     // }
        //     throw new AuthenticationError('You need to be logged in!');
        // },

        // Delete a message sent on server or to a user
        deleteMessage: async (parent, { messageId }, context) => {
            if (context.user) {
                const message = await Message.findOneAndDelete({
                    _id: messageId,
                    message_author: context.user.username,
                });

                await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $pull: { messages: message._id } }
                );

                await Server.findOneAndUpdate(
                    { _id: context.server._id },
                    { $pull: { messages: message._id } }
                );

                return message;
            }
            throw new AuthenticationError('You need to be logged in!');
        },

        // Add server
        addServer: async (parent, { server_name }) => {
            const server = await Server.create({ server_name });
            return { server };
        },

        //Add channel
        addChannel: async (parent, { channel_name }) => {
            const channel = await Channel.create({ channel_name })
            return { channel };
        }
    }
};

module.exports = resolvers;
