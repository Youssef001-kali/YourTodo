const { Lists, ValidateListCreation, ValidateListUpdate } = require('../../../Database/Models/Lists.js');
const { Collections } = require('../../../Database/Models/Collections.js');
const { Accounts } = require('../../../Database/Models/Accounts.js');
const handleServerErrors = require('../../../Helpers/others/handleServerError.js');

// Create a new list for a collection
const createList = async (req, res) => {
    try {
        const userId = req.userId;
        const accountId = req.params.accountId;
        const collectionId = req.params.collectionId;
        const { error, list } = ValidateListCreation(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Bad request, invalid list data',
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

        // Check if list name already exists for this collection
        const existingList = await Lists.findOne({
            collectionId,
            name: list.name,
            is_deleted: false
        });

        if (existingList) {
            return res.status(400).json({
                success: false,
                message: 'Bad request, list name already exists for this collection'
            });
        }

        const newList = new Lists({
            accountId,
            collectionId,
            name: list.name,
            description: list.description || null,
            created_at: new Date()
        });

        await newList.save();

        res.status(201).json({
            success: true,
            message: 'List created successfully',
            list: {
                id: newList._id,
                name: newList.name,
                description: newList.description,
                created_at: newList.created_at
            }
        });
    } catch (error) {
        handleServerErrors(res, error, 'controllers/lists.js(createList)');
    }
};

// Get all lists for a collection
const getAllLists = async (req, res) => {
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

        const lists = await Lists.find({
            collectionId,
            is_deleted: false
        }).select('-__v').sort({ created_at: -1 });

        res.status(200).json({
            success: true,
            lists,
            count: lists.length
        });
    } catch (error) {
        handleServerErrors(res, error, 'controllers/lists.js(getAllLists)');
    }
};

// Get a specific list by ID
const getListById = async (req, res) => {
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

        const list = await Lists.findOne({
            _id: listId,
            collectionId,
            is_deleted: false
        }).select('-__v');

        if (!list) {
            return res.status(404).json({
                success: false,
                message: 'List not found'
            });
        }

        res.status(200).json({
            success: true,
            list
        });
    } catch (error) {
        handleServerErrors(res, error, 'controllers/lists.js(getListById)');
    }
};

// Update a list
const updateList = async (req, res) => {
    try {
        const userId = req.userId;
        const accountId = req.params.accountId;
        const collectionId = req.params.collectionId;
        const listId = req.params.listId;
        const { error, list } = ValidateListUpdate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Bad request, invalid list data',
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

        // Check if list exists and belongs to collection
        const existingList = await Lists.findOne({
            _id: listId,
            collectionId,
            is_deleted: false
        });

        if (!existingList) {
            return res.status(404).json({
                success: false,
                message: 'List not found'
            });
        }

        // Check if name is already taken by another list in this collection
        if (list.name && list.name !== existingList.name) {
            const nameExists = await Lists.findOne({
                collectionId,
                name: list.name,
                _id: { $ne: listId },
                is_deleted: false
            });

            if (nameExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Bad request, list name already exists for this collection'
                });
            }
        }

        const updateData = {
            name: list.name || existingList.name,
            description: list.description !== undefined ? list.description : existingList.description
        };

        const updatedList = await Lists.findByIdAndUpdate(
            listId,
            updateData,
            { new: true }
        ).select('-__v');

        res.status(200).json({
            success: true,
            message: 'List updated successfully',
            list: updatedList
        });
    } catch (error) {
        handleServerErrors(res, error, 'controllers/lists.js(updateList)');
    }
};

// Delete a list (soft delete)
const deleteList = async (req, res) => {
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

        // Soft delete the list
        await Lists.findByIdAndUpdate(listId, {
            is_deleted: true,
            deleted_at: new Date()
        });

        // Cascade: Soft delete all todos for this list
        const { Todos } = require('../../../Database/Models/Todos.js');
        await Todos.updateMany(
            { listId, is_deleted: false },
            { 
                is_deleted: true, 
                deleted_at: new Date() 
            }
        );

        res.status(200).json({
            success: true,
            message: 'List and all associated todos deleted successfully'
        });
    } catch (error) {
        handleServerErrors(res, error, 'controllers/lists.js(deleteList)');
    }
};

// Delete all lists for a collection
const deleteAllLists = async (req, res) => {
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

        // Get all list IDs that will be deleted
        const listsToDelete = await Lists.find(
            { collectionId, is_deleted: false },
            { _id: 1 }
        );
        const listIds = listsToDelete.map(list => list._id);

        // Soft delete all lists
        const result = await Lists.updateMany(
            { collectionId, is_deleted: false },
            { 
                is_deleted: true, 
                deleted_at: new Date() 
            }
        );

        if (listIds.length > 0) {
            // Cascade: Soft delete all todos for these lists
            const { Todos } = require('../../../Database/Models/Todos.js');
            await Todos.updateMany(
                { listId: { $in: listIds }, is_deleted: false },
                { 
                    is_deleted: true, 
                    deleted_at: new Date() 
                }
            );
        }

        res.status(200).json({
            success: true,
            message: `Successfully deleted ${result.modifiedCount} lists and all associated todos`
        });
    } catch (error) {
        handleServerErrors(res, error, 'controllers/lists.js(deleteAllLists)');
    }
};

module.exports = {
    createList,
    getAllLists,
    getListById,
    updateList,
    deleteList,
    deleteAllLists
};