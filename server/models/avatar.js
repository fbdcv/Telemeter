const mongoose = require("mongoose");

const AvatarSchema = mongoose.Schema(
  {
    filename: String,
    base64: String,
    type: String,
    ispublic: Boolean,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Avatar", AvatarSchema);
