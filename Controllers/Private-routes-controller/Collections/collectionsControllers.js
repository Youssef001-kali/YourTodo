const { Collections, ValidateCollectionCreation, ValidateCollectionUpdate } = require('../../../Database/Models/Collections.js');
const { Accounts } = require('../../../Database/Models/Accounts.js');
const handleServerErrors = require('../../../Helpers/others/handleServerError.js');

// Create a new collection for an account
const createCollection = async (req, res) => {
    try {
        const userId = req.userId;
        const accountId = req.params.accountId;
        const { error, collection } = ValidateCollectionCreation(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Bad request, invalid collection data',
                errors: error.details.map(detail => detail.message)
            });
        }

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

        // Check if collection name already exists for this account
        const existingCollection = await Collections.findOne({
            accountId,
            name: collection.name,
            is_deleted: false
        });

        if (existingCollection) {
            return res.status(400).json({
                success: false,
                message: 'Bad request, collection name already exists for this account'
            });
        }

        const newCollection = new Collections({
            accountId,
            name: collection.name,
            icon: collection.icon || '📁', // Default icon if not provided
            created_at: new Date()
        });

        await newCollection.save();

        res.status(201).json({
            success: true,
            message: 'Collection created successfully',
            collection: {
                id: newCollection._id,
                name: newCollection.name,
                icon: newCollection.icon,
                created_at: newCollection.created_at
            }
        });
    } catch (error) {
        handleServerErrors(res, error, 'controllers/collections.js(createCollection)');
    }
};

// Get all collections for an account
const getAllCollections = async (req, res) => {
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

        const collections = await Collections.find({
            accountId,
            is_deleted: false
        }).select('-__v').sort({ created_at: -1 });

        res.status(200).json({
            success: true,
            collections,
            count: collections.length
        });
    } catch (error) {
        handleServerErrors(res, error, 'controllers/collections.js(getAllCollections)');
    }
};

// Get a specific collection by ID
const getCollectionById = async (req, res) => {
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

        const collection = await Collections.findOne({
            _id: collectionId,
            accountId,
            is_deleted: false
        }).select('-__v');

        if (!collection) {
            return res.status(404).json({
                success: false,
                message: 'Collection not found'
            });
        }

        res.status(200).json({
            success: true,
            collection
        });
    } catch (error) {
        handleServerErrors(res, error, 'controllers/collections.js(getCollectionById)');
    }
};

// Update a collection
const updateCollection = async (req, res) => {
    try {
        const userId = req.userId;
        const accountId = req.params.accountId;
        const collectionId = req.params.collectionId;
        const { error, collection } = ValidateCollectionUpdate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Bad request, invalid collection data',
                errors: error.details.map(detail => detail.message)
            });
        }

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

        // Check if collection exists and belongs to account
        const existingCollection = await Collections.findOne({
            _id: collectionId,
            accountId,
            is_deleted: false
        });

        if (!existingCollection) {
            return res.status(404).json({
                success: false,
                message: 'Collection not found'
            });
        }

        // Check if name is already taken by another collection in this account
        if (collection.name && collection.name !== existingCollection.name) {
            const nameExists = await Collections.findOne({
                accountId,
                name: collection.name,
                _id: { $ne: collectionId },
                is_deleted: false
            });

            if (nameExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Bad request, collection name already exists for this account'
                });
            }
        }

        const updateData = {
            name: collection.name || existingCollection.name,
            icon: collection.icon || existingCollection.icon
        };

        const updatedCollection = await Collections.findByIdAndUpdate(
            collectionId,
            updateData,
            { new: true }
        ).select('-__v');

        res.status(200).json({
            success: true,
            message: 'Collection updated successfully',
            collection: updatedCollection
        });
    } catch (error) {
        handleServerErrors(res, error, 'controllers/collections.js(updateCollection)');
    }
};

// Delete a collection (soft delete)
const deleteCollection = async (req, res) => {
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

        // Soft delete the collection
        await Collections.findByIdAndUpdate(collectionId, {
            is_deleted: true,
            deleted_at: new Date()
        });

        // Cascade: Soft delete all lists for this collection
        const { Lists } = require('../../../Database/Models/Lists.js');
        await Lists.updateMany(
            { collectionId, is_deleted: false },
            { 
                is_deleted: true, 
                deleted_at: new Date() 
            }
        );

        // Cascade: Soft delete all todos for this collection
        const { Todos } = require('../../../Database/Models/Todos.js');
        await Todos.updateMany(
            { listId: { $in: await Lists.find({ collectionId }, { _id: 1 }).distinct('_id') }, is_deleted: false },
            { 
                is_deleted: true, 
                deleted_at: new Date() 
            }
        );

        res.status(200).json({
            success: true,
            message: 'Collection and all associated data deleted successfully'
        });
    } catch (error) {
        handleServerErrors(res, error, 'controllers/collections.js(deleteCollection)');
    }
};

// Delete all collections for an account
const deleteAllCollections = async (req, res) => {
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

        // Get all collection IDs that will be deleted
        const collectionsToDelete = await Collections.find(
            { accountId, is_deleted: false },
            { _id: 1 }
        );
        const collectionIds = collectionsToDelete.map(collection => collection._id);

        // Soft delete all collections
        const result = await Collections.updateMany(
            { accountId, is_deleted: false },
            { 
                is_deleted: true, 
                deleted_at: new Date() 
            }
        );

        if (collectionIds.length > 0) {
            // Cascade: Soft delete all lists for these collections
            const { Lists } = require('../../../Database/Models/Lists.js');
            await Lists.updateMany(
                { collectionId: { $in: collectionIds }, is_deleted: false },
                { 
                    is_deleted: true, 
                    deleted_at: new Date() 
                }
            );

            // Cascade: Soft delete all todos for these collections
            const { Todos } = require('../../../Database/Models/Todos.js');
            await Todos.updateMany(
                { listId: { $in: await Lists.find({ collectionId: { $in: collectionIds } }, { _id: 1 }).distinct('_id') }, is_deleted: false },
                { 
                    is_deleted: true, 
                    deleted_at: new Date() 
                }
            );
        }

        res.status(200).json({
            success: true,
            message: `Successfully deleted ${result.modifiedCount} collections and all associated data`
        });
    } catch (error) {
        handleServerErrors(res, error, 'controllers/collections.js(deleteAllCollections)');
    }
};

module.exports = {
    createCollection,
    getAllCollections,
    getCollectionById,
    updateCollection,
    deleteCollection,
    deleteAllCollections
};