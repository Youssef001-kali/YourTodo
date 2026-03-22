const { Todos, ValidateTodoCreation, ValidateTodoUpdate } = require('../../../Database/Models/Todos.js');
const { Lists } = require('../../../Database/Models/Lists.js');
const { Collections } = require('../../../Database/Models/Collections.js');
const { Accounts } = require('../../../Database/Models/Accounts.js');
const handleServerErrors = require('../../../Helpers/others/handleServerError.js');

// Create a new todo for a list
const createTodo = async (req, res) => {
    try {
        const userId = req.userId;
        const accountId = req.params.accountId;
        const collectionId = req.params.collectionId;
        const listId = req.params.listId;
        const { error, todo } = ValidateTodoCreation(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Bad request, invalid todo data',
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

        const newTodo = new Todos({
            accountId,
            listId,
            task: todo.task
        });

        await newTodo.save();

        res.status(201).json({
            success: true,
            message: 'Todo created successfully',
            todo: {
                id: newTodo._id,
                task: newTodo.task,
                listId: newTodo.listId
            }
        });
    } catch (error) {
        handleServerErrors(res, error, 'controllers/todos.js(createTodo)');
    }
};

// Get all todos for a list
const getAllTodos = async (req, res) => {
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

        const todos = await Todos.find({
            listId,
            is_deleted: false
        }).select('-__v').sort({ _id: -1 });

        res.status(200).json({
            success: true,
            todos,
            count: todos.length
        });
    } catch (error) {
        handleServerErrors(res, error, 'controllers/todos.js(getAllTodos)');
    }
};

// Get a specific todo by ID
const getTodoById = async (req, res) => {
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

        const todo = await Todos.findOne({
            _id: todoId,
            listId,
            is_deleted: false
        }).select('-__v');

        if (!todo) {
            return res.status(404).json({
                success: false,
                message: 'Todo not found'
            });
        }

        res.status(200).json({
            success: true,
            todo
        });
    } catch (error) {
        handleServerErrors(res, error, 'controllers/todos.js(getTodoById)');
    }
};

// Update a todo
const updateTodo = async (req, res) => {
    try {
        const userId = req.userId;
        const accountId = req.params.accountId;
        const collectionId = req.params.collectionId;
        const listId = req.params.listId;
        const todoId = req.params.todoId;
        const { error, todo } = ValidateTodoUpdate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Bad request, invalid todo data',
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

        // Check if todo exists and belongs to list
        const existingTodo = await Todos.findOne({
            _id: todoId,
            listId,
            is_deleted: false
        });

        if (!existingTodo) {
            return res.status(404).json({
                success: false,
                message: 'Todo not found'
            });
        }

        const updateData = {
            task: todo.task || existingTodo.task
        };

        const updatedTodo = await Todos.findByIdAndUpdate(
            todoId,
            updateData,
            { new: true }
        ).select('-__v');

        res.status(200).json({
            success: true,
            message: 'Todo updated successfully',
            todo: updatedTodo
        });
    } catch (error) {
        handleServerErrors(res, error, 'controllers/todos.js(updateTodo)');
    }
};

// Delete a todo (soft delete)
const deleteTodo = async (req, res) => {
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

        const todo = await Todos.findOne({
            _id: todoId,
            listId,
            is_deleted: false
        });

        if (!todo) {
            return res.status(404).json({
                success: false,
                message: 'Todo not found'
            });
        }

        await Todos.findByIdAndUpdate(todoId, {
            is_deleted: true,
            deleted_at: new Date()
        });

        res.status(200).json({
            success: true,
            message: 'Todo deleted successfully'
        });
    } catch (error) {
        handleServerErrors(res, error, 'controllers/todos.js(deleteTodo)');
    }
};

// Delete all todos for a list
const deleteAllTodos = async (req, res) => {
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

        const result = await Todos.updateMany(
            { listId, is_deleted: false },
            { 
                is_deleted: true, 
                deleted_at: new Date() 
            }
        );

        res.status(200).json({
            success: true,
            message: `Successfully deleted ${result.modifiedCount} todos`
        });
    } catch (error) {
        handleServerErrors(res, error, 'controllers/todos.js(deleteAllTodos)');
    }
};

module.exports = {
    createTodo,
    getAllTodos,
    getTodoById,
    updateTodo,
    deleteTodo,
    deleteAllTodos
};