const { Accounts } = require('../../../Database/Models/Accounts.js');
const { Collections } = require('../../../Database/Models/Collections.js');
const { Lists } = require('../../../Database/Models/Lists.js');
const { Todos } = require('../../../Database/Models/Todos.js');
const handleServerErrors = require('../../../Helpers/others/handleServerError.js');

// Recover a soft-deleted account and all its associated data
const recoverAccount = async (req, res) => {
    try {
        const userId = req.userId;
        const accountId = req.params.accountId;

        // Check if account exists and belongs to user (including soft-deleted ones)
        const account = await Accounts.findOne({
            _id: accountId,
            userId,
            is_deleted: true
        });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Soft-deleted account not found'
            });
        }

        // Recover the account
        await Accounts.findByIdAndUpdate(accountId, {
            is_deleted: false,
            deleted_at: null
        });

        // Cascade: Recover all collections for this account
        await Collections.updateMany(
            { accountId, is_deleted: true },
            { 
                is_deleted: false, 
                deleted_at: null 
            }
        );

        // Cascade: Recover all lists for this account
        await Lists.updateMany(
            { accountId, is_deleted: true },
            { 
                is_deleted: false, 
                deleted_at: null 
            }
        );

        // Cascade: Recover all todos for this account
        await Todos.updateMany(
            { accountId, is_deleted: true },
            { 
                is_deleted: false, 
                deleted_at: null 
            }
        );

        res.status(200).json({
            success: true,
            message: 'Account and all associated data recovered successfully'
        });
    } catch (error) {
        handleServerErrors(res, error, 'controllers/recovery.js(recoverAccount)');
    }
};

// Get all soft-deleted accounts for the authenticated user
const getAllSoftDeletedAccounts = async (req, res) => {
    try {
        const userId = req.userId;
        
        const softDeletedAccounts = await Accounts.find({
            userId,
            is_deleted: true
        }).select('-__v').sort({ deleted_at: -1 });

        res.status(200).json({
            success: true,
            softDeletedAccounts,
            count: softDeletedAccounts.length
        });
    } catch (error) {
        handleServerErrors(res, error, 'controllers/recovery.js(getAllSoftDeletedAccounts)');
    }
};

// Recover a soft-deleted collection and all its associated data
const recoverCollection = async (req, res) => {
    try {
        const userId = req.userId;
        const accountId = req.params.accountId;
        const collectionId = req.params.collectionId;

        // Verify account exists and belongs to user
        const account = await Accounts.findOne({
            _id: accountId,
            userId,
            is_deleted: false
        });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Account not found'
            });
        }

        // Check if collection exists and belongs to account (including soft-deleted ones)
        const collection = await Collections.findOne({
            _id: collectionId,
            accountId,
            is_deleted: true
        });

        if (!collection) {
            return res.status(404).json({
                success: false,
                message: 'Soft-deleted collection not found'
            });
        }

        // Recover the collection
        await Collections.findByIdAndUpdate(collectionId, {
            is_deleted: false,
            deleted_at: null
        });

        // Cascade: Recover all lists for this collection
        await Lists.updateMany(
            { collectionId, is_deleted: true },
            { 
                is_deleted: false, 
                deleted_at: null 
            }
        );

        // Cascade: Recover all todos for this collection
        await Todos.updateMany(
            { listId: { $in: await Lists.find({ collectionId }, { _id: 1 }).distinct('_id') }, is_deleted: true },
            { 
                is_deleted: false, 
                deleted_at: null 
            }
        );

        res.status(200).json({
            success: true,
            message: 'Collection and all associated data recovered successfully'
        });
    } catch (error) {
        handleServerErrors(res, error, 'controllers/recovery.js(recoverCollection)');
    }
};

// Get all soft-deleted collections for an account
const getAllSoftDeletedCollections = async (req, res) => {
    try {
        const userId = req.userId;
        const accountId = req.params.accountId;

        // Verify account exists and belongs to user
        const account = await Accounts.findOne({
            _id: accountId,
            userId,
            is_deleted: false
        });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Account not found'
            });
        }

        const softDeletedCollections = await Collections.find({
            accountId,
            is_deleted: true
        }).select('-__v').sort({ deleted_at: -1 });

        res.status(200).json({
            success: true,
            softDeletedCollections,
            count: softDeletedCollections.length
        });
    } catch (error) {
        handleServerErrors(res, error, 'controllers/recovery.js(getAllSoftDeletedCollections)');
    }
};

// Recover a soft-deleted list and all its associated data
const recoverList = async (req, res) => {
    try {
        const userId = req.userId;
        const accountId = req.params.accountId;
        const collectionId = req.params.collectionId;
        const listId = req.params.listId;

        // Verify account exists and belongs to user
        const account = await Accounts.findOne({
            _id: accountId,
            userId,
            is_deleted: false
        });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Account not found'
            });
        }

        // Verify collection exists and belongs to account
        const collection = await Collections.findOne({
            _id: collectionId,
            accountId,
            is_deleted: false
        });

        if (!collection) {
            return res.status(404).json({
                success: false,
                message: 'Collection not found'
            });
        }

        // Check if list exists and belongs to collection (including soft-deleted ones)
        const list = await Lists.findOne({
            _id: listId,
            collectionId,
            is_deleted: true
        });

        if (!list) {
            return res.status(404).json({
                success: false,
                message: 'Soft-deleted list not found'
            });
        }

        // Recover the list
        await Lists.findByIdAndUpdate(listId, {
            is_deleted: false,
            deleted_at: null
        });

        // Cascade: Recover all todos for this list
        await Todos.updateMany(
            { listId, is_deleted: true },
            { 
                is_deleted: false, 
                deleted_at: null 
            }
        );

        res.status(200).json({
            success: true,
            message: 'List and all associated todos recovered successfully'
        });
    } catch (error) {
        handleServerErrors(res, error, 'controllers/recovery.js(recoverList)');
    }
};

// Get all soft-deleted lists for a collection
const getAllSoftDeletedLists = async (req, res) => {
    try {
        const userId = req.userId;
        const accountId = req.params.accountId;
        const collectionId = req.params.collectionId;

        // Verify account exists and belongs to user
        const account = await Accounts.findOne({
            _id: accountId,
            userId,
            is_deleted: false
        });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Account not found'
            });
        }

        // Verify collection exists and belongs to account
        const collection = await Collections.findOne({
            _id: collectionId,
            accountId,
            is_deleted: false
        });

        if (!collection) {
            return res.status(404).json({
                success: false,
                message: 'Collection not found'
            });
        }

        const softDeletedLists = await Lists.find({
            collectionId,
            is_deleted: true
        }).select('-__v').sort({ deleted_at: -1 });

        res.status(200).json({
            success: true,
            softDeletedLists,
            count: softDeletedLists.length
        });
    } catch (error) {
        handleServerErrors(res, error, 'controllers/recovery.js(getAllSoftDeletedLists)');
    }
};

// Recover a soft-deleted todo
const recoverTodo = async (req, res) => {
    try {
        const userId = req.userId;
        const accountId = req.params.accountId;
        const collectionId = req.params.collectionId;
        const listId = req.params.listId;
        const todoId = req.params.todoId;

        // Verify account exists and belongs to user
        const account = await Accounts.findOne({
            _id: accountId,
            userId,
            is_deleted: false
        });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Account not found'
            });
        }

        // Verify collection exists and belongs to account
        const collection = await Collections.findOne({
            _id: collectionId,
            accountId,
            is_deleted: false
        });

        if (!collection) {
            return res.status(404).json({
                success: false,
                message: 'Collection not found'
            });
        }

        // Verify list exists and belongs to collection
        const list = await Lists.findOne({
            _id: listId,
            collectionId,
            is_deleted: false
        });

        if (!list) {
            return res.status(404).json({
                success: false,
                message: 'List not found'
            });
        }

        // Check if todo exists and belongs to list (including soft-deleted ones)
        const todo = await Todos.findOne({
            _id: todoId,
            listId,
            is_deleted: true
        });

        if (!todo) {
            return res.status(404).json({
                success: false,
                message: 'Soft-deleted todo not found'
            });
        }

        // Recover the todo
        await Todos.findByIdAndUpdate(todoId, {
            is_deleted: false,
            deleted_at: null
        });

        res.status(200).json({
            success: true,
            message: 'Todo recovered successfully'
        });
    } catch (error) {
        handleServerErrors(res, error, 'controllers/recovery.js(recoverTodo)');
    }
};

// Get all soft-deleted todos for a list
const getAllSoftDeletedTodos = async (req, res) => {
    try {
        const userId = req.userId;
        const accountId = req.params.accountId;
        const collectionId = req.params.collectionId;
        const listId = req.params.listId;

        // Verify account exists and belongs to user
        const account = await Accounts.findOne({
            _id: accountId,
            userId,
            is_deleted: false
        });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Account not found'
            });
        }

        // Verify collection exists and belongs to account
        const collection = await Collections.findOne({
            _id: collectionId,
            accountId,
            is_deleted: false
        });

        if (!collection) {
            return res.status(404).json({
                success: false,
                message: 'Collection not found'
            });
        }

        // Verify list exists and belongs to collection
        const list = await Lists.findOne({
            _id: listId,
            collectionId,
            is_deleted: false
        });

        if (!list) {
            return res.status(404).json({
                success: false,
                message: 'List not found'
            });
        }

        const softDeletedTodos = await Todos.find({
            listId,
            is_deleted: true
        }).select('-__v').sort({ deleted_at: -1 });

        res.status(200).json({
            success: true,
            softDeletedTodos,
            count: softDeletedTodos.length
        });
    } catch (error) {
        handleServerErrors(res, error, 'controllers/recovery.js(getAllSoftDeletedTodos)');
    }
};

module.exports = {
    recoverAccount,
    getAllSoftDeletedAccounts,
    recoverCollection,
    getAllSoftDeletedCollections,
    recoverList,
    getAllSoftDeletedLists,
    recoverTodo,
    getAllSoftDeletedTodos
};
