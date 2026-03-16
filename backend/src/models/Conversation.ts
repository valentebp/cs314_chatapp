import mongoose, { Schema, Document } from 'mongoose';

export interface IConversation extends Document {
  type: 'dm' | 'group';
  name?: string;
  creatorId: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[];
  leftUsers: mongoose.Types.ObjectId[];
  mutedUsers: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const ConversationSchema: Schema = new Schema({
  type: { type: String, enum: ['dm', 'group'], required: true },
  name: { type: String },
  creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  leftUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  mutedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IConversation>('Conversation', ConversationSchema);
