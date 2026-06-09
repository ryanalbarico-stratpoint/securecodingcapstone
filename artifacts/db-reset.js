#!/usr/bin/env node

"use strict";

// Modernized db-reset using async/await and the newer mongodb driver API.
// Run with: NODE_ENV=test node artifacts/db-reset.js

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const { db } = require('../config/config');

const USERS_TO_INSERT = [
    {
        _id: 1,
        userName: 'admin',
        firstName: 'Node Goat',
        lastName: 'Admin',
        password: 'Admin_123',
        isAdmin: true
    },
    {
        _id: 2,
        userName: 'user1',
        firstName: 'John',
        lastName: 'Doe',
        benefitStartDate: '2030-01-10',
        password: 'User1_123'
    },
    {
        _id: 3,
        userName: 'user2',
        firstName: 'Will',
        lastName: 'Smith',
        benefitStartDate: '2025-11-30',
        password: 'User2_123'
    }
];

function getDbNameFromUri(uri) {
    try {
        const path = uri.split('/').pop();
        return (path || 'nodegoat').split('?')[0] || 'nodegoat';
    } catch (e) {
        return 'nodegoat';
    }
}

async function run() {
    const dbName = getDbNameFromUri(db);
    let client = null;
    let database = null;

    try {
        const conn = await MongoClient.connect(db, { useUnifiedTopology: true });
        // conn may be a MongoClient (new drivers) or a Db (older drivers)
        if (conn && typeof conn.db === 'function') {
            client = conn;
            database = conn.db(dbName);
        } else {
            // older driver returns a `Db` instance directly
            database = conn;
        }
        console.log('Connected to the database');

        const collectionNames = ['users', 'allocations', 'contributions', 'memos', 'counters'];
        console.log('Dropping existing collections');
        for (const name of collectionNames) {
            try {
                await database.collection(name).drop();
                console.log(`Dropped collection: ${name}`);
            } catch (err) {
                // ignore if collection doesn't exist
            }
        }

        // reset unique id counter
        await database.collection('counters').insertOne({ _id: 'userId', seq: 3 });
        console.log('Inserted counters');

        // insert admin and test users
        console.log('Users to insert:');
        USERS_TO_INSERT.forEach((user) => console.log(JSON.stringify(user)));

        const usersToInsert = USERS_TO_INSERT.map((user) => ({
            ...user,
            password: bcrypt.hashSync(user.password, bcrypt.genSaltSync(10))
        }));

        const usersResult = await database.collection('users').insertMany(usersToInsert);
        console.log('users.insertMany', JSON.stringify({ insertedCount: usersResult.insertedCount }));

        const insertedUsers = await database.collection('users').find().toArray();
        const finalAllocations = insertedUsers.map((user) => {
            const stocks = Math.floor(Math.random() * 40) + 1;
            const funds = Math.floor(Math.random() * 40) + 1;
            return { userId: user._id, stocks, funds, bonds: 100 - (stocks + funds) };
        });

        console.log('Allocations to insert:');
        finalAllocations.forEach((allocation) => console.log(JSON.stringify(allocation)));

        const allocResult = await database.collection('allocations').insertMany(finalAllocations);
        console.log('allocations.insertMany', JSON.stringify({ insertedCount: allocResult.insertedCount }));

        console.log('Database reset performed successfully');
        await client.close();
        process.exit(0);
    } catch (err) {
        console.error('ERROR:', err && err.message ? err.message : err);
        try {
            await client.close();
        } catch (e) {}
        process.exit(1);
    }
}

run();
