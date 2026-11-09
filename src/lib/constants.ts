/** Shared limits used across API routes — keep these here instead of re-declaring per file. */

/** Max upload size for admin media and knowledge-base uploads. */
export const MAX_UPLOAD_SIZE_BYTES = 15 * 1024 * 1024;

/** Admin session cookie lifetime. */
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

/** Max length of a contact-form message. */
export const MAX_CONTACT_MESSAGE_LENGTH = 10000;

/** Max chat history length and per-message length for POST /api/chat. */
export const MAX_CHAT_HISTORY_MESSAGES = 10;
export const MAX_CHAT_MESSAGE_LENGTH = 4000;

/** Max length of an assistant reply stored on POST /api/chat/feedback. */
export const MAX_CHAT_REPLY_LENGTH = 8000;
