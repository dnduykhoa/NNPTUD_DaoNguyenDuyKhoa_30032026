var express = require('express');
var router = express.Router();
let { checkLogin } = require('../utils/authHandler.js');
let messageModel = require('../schemas/messages');
let { uploadFile } = require('../utils/uploadHandler');
let mongoose = require('mongoose');

// GET /api/v1/messages/ - lấy tin nhắn cuối cùng của mỗi cuộc hội thoại
router.get('/', checkLogin, async function (req, res, next) {
    try {
        let userId = new mongoose.Types.ObjectId(req.userId);
        let result = await messageModel.aggregate([
            {
                $match: {
                    $or: [{ from: userId }, { to: userId }]
                }
            },
            { $sort: { createdAt: -1 } },
            {
                $addFields: {
                    partner: {
                        $cond: [{ $eq: ['$from', userId] }, '$to', '$from']
                    }
                }
            },
            {
                $group: {
                    _id: '$partner',
                    lastMessage: { $first: '$$ROOT' }
                }
            },
            { $replaceRoot: { newRoot: '$lastMessage' } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'from',
                    foreignField: '_id',
                    as: 'from',
                    pipeline: [{ $project: { password: 0, forgotpasswordToken: 0, forgotpasswordTokenExp: 0 } }]
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'to',
                    foreignField: '_id',
                    as: 'to',
                    pipeline: [{ $project: { password: 0, forgotpasswordToken: 0, forgotpasswordTokenExp: 0 } }]
                }
            },
            { $unwind: '$from' },
            { $unwind: '$to' },
            { $sort: { createdAt: -1 } }
        ]);
        res.send(result);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

// GET /api/v1/messages/:userID - lấy toàn bộ tin nhắn giữa user hiện tại và userID
router.get('/:userID', checkLogin, async function (req, res, next) {
    try {
        let userId = req.userId;
        let partnerId = req.params.userID;

        if (!mongoose.Types.ObjectId.isValid(partnerId)) {
            return res.status(400).send({ message: 'userID không hợp lệ' });
        }

        let result = await messageModel
            .find({
                $or: [
                    { from: userId, to: partnerId },
                    { from: partnerId, to: userId }
                ]
            })
            .populate('from', '-password -forgotpasswordToken -forgotpasswordTokenExp')
            .populate('to', '-password -forgotpasswordToken -forgotpasswordTokenExp')
            .sort({ createdAt: 1 });

        res.send(result);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

// POST /api/v1/messages/ - gửi tin nhắn (text hoặc file)
router.post('/', checkLogin, uploadFile.single('file'), async function (req, res, next) {
    try {
        let fromId = req.userId;
        let { to, text } = req.body;

        if (!to || !mongoose.Types.ObjectId.isValid(to)) {
            return res.status(400).send({ message: 'Thiếu hoặc sai định dạng trường to' });
        }

        let messageContent;
        if (req.file) {
            messageContent = {
                type: 'file',
                text: req.file.path
            };
        } else {
            if (!text || text.trim() === '') {
                return res.status(400).send({ message: 'Nội dung tin nhắn không được để trống' });
            }
            messageContent = {
                type: 'text',
                text: text.trim()
            };
        }

        let newMessage = new messageModel({
            from: fromId,
            to: to,
            messageContent: messageContent
        });

        let saved = await newMessage.save();
        let result = await messageModel
            .findById(saved._id)
            .populate('from', '-password -forgotpasswordToken -forgotpasswordTokenExp')
            .populate('to', '-password -forgotpasswordToken -forgotpasswordTokenExp');

        res.send(result);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

module.exports = router;
