const mongoose = require('mongoose')

const RoomSchema = new mongoose.Schema({
  name:         { type: String, required: true, unique: true, trim: true },
  language:     { type: String, default: 'javascript' },
  fileCount:    { type: Number, default: 1 },
  isPublic:     { type: Boolean, default: true },
  // Admin
  createdBy:    { type: String, default: '' },      // username of room creator
  adminToken:   { type: String, default: '' },      // hashed token — never sent to client plain
  // Password protection
  passwordHash: { type: String, default: '' },      // empty = no password
  hasPassword:  { type: Boolean, default: false },
  // Timestamps
  lastActive:   { type: Date, default: Date.now },
  createdAt:    { type: Date, default: Date.now },
})

RoomSchema.index({ lastActive: -1 })

module.exports = mongoose.model('Room', RoomSchema)
