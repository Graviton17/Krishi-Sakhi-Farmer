import { BUSINESS_RULES, TABLE_NAMES } from "../config";
import { EnhancedBaseService } from "../database";
import { logger } from "../logger";
import { MessagesRepository } from "../repositories/MessagesRepository";
import { Message, ServiceErrorCode, ServiceResponse } from "../types";
import { MessagesValidator } from "../validators/MessagesValidator";

interface CreateMessageData {
  sender_id: string;
  receiver_id: string;
  content: string;
  order_id?: string;
  attachment_urls?: string[];
  status?: string;
}

interface UpdateMessageData {
  content?: string;
  status?: string;
  attachment_urls?: string[];
}

export class MessagesService extends EnhancedBaseService<Message> {
  private messagesValidator: MessagesValidator;

  constructor() {
    super(new MessagesRepository(), "Message");
    this.messagesValidator = new MessagesValidator();
  }

  protected getTableName(): string {
    return TABLE_NAMES.MESSAGES;
  }

  /**
   * Send a new message
   */
  async sendMessage(data: CreateMessageData): Promise<ServiceResponse<any>> {
    try {
      this.logBusinessEvent("sendMessage", {
        senderId: data.sender_id,
        receiverId: data.receiver_id,
        hasOrder: !!data.order_id,
      });

      // Validate input data
      const validation = this.messagesValidator.validateCreate(data);
      if (!validation.isValid) {
        const serviceError = this.createError(
          ServiceErrorCode.VALIDATION_ERROR,
          "Invalid message data",
          validation.errors,
          "sendMessage"
        );
        return this.createResponse(null, serviceError);
      }

      // Check spam protection
      const repository = this.repository as MessagesRepository;
      const recentMessage = await repository.checkRecentMessages(
        data.sender_id,
        data.receiver_id,
        BUSINESS_RULES.MESSAGE.SPAM_COOLDOWN_MINUTES
      );

      if (recentMessage) {
        const serviceError = this.createError(
          ServiceErrorCode.VALIDATION_ERROR,
          `Please wait ${BUSINESS_RULES.MESSAGE.SPAM_COOLDOWN_MINUTES} minute(s) before sending another message`,
          [],
          "sendMessage"
        );
        return this.createResponse(null, serviceError);
      }

      // Set default status if not provided
      const messageData = {
        ...data,
        status: data.status || "sent",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const result = await repository.create(messageData);

      if (result.error) {
        const serviceError = this.handleRepositoryError(
          result.error,
          "sendMessage"
        );
        return this.createResponse(null, serviceError);
      }

      logger.info(`Message sent from ${data.sender_id} to ${data.receiver_id}`);
      return this.createResponse(result.data, null);
    } catch (error) {
      logger.error("Error sending message:", error as Error);
      const serviceError = this.handleRepositoryError(
        error as Error,
        "sendMessage"
      );
      return this.createResponse(null, serviceError);
    }
  }

  /**
   * Get conversation between two users
   */
  async getConversation(
    userId1: string,
    userId2: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ServiceResponse<any[]>> {
    try {
      this.logBusinessEvent("getConversation", {
        userId1,
        userId2,
        limit,
        offset,
      });

      // Validate parameters
      const validation = this.messagesValidator.validateConversation({
        userId1,
        userId2,
        limit,
        offset,
      });
      if (!validation.isValid) {
        const serviceError = this.createError(
          ServiceErrorCode.VALIDATION_ERROR,
          "Invalid conversation parameters",
          validation.errors,
          "getConversation"
        );
        return this.createResponse<any[]>([], serviceError);
      }

      const repository = this.repository as MessagesRepository;
      const messages = await repository.findConversation(
        userId1,
        userId2,
        limit,
        offset
      );

      return this.createResponse(messages, null);
    } catch (error) {
      logger.error(
        `Error getting conversation between ${userId1} and ${userId2}:`,
        error as Error
      );
      const serviceError = this.handleRepositoryError(
        error as Error,
        "getConversation"
      );
      return this.createResponse<any[]>([], serviceError);
    }
  }

  /**
   * Get all conversations for a user
   */
  async getUserConversations(userId: string): Promise<ServiceResponse<any[]>> {
    try {
      this.logBusinessEvent("getUserConversations", { userId });

      const repository = this.repository as MessagesRepository;
      const conversations = await repository.findUserConversations(userId);

      return this.createResponse(conversations, null);
    } catch (error) {
      logger.error(
        `Error getting conversations for user ${userId}:`,
        error as Error
      );
      const serviceError = this.handleRepositoryError(
        error as Error,
        "getUserConversations"
      );
      return this.createResponse<any[]>([], serviceError);
    }
  }

  /**
   * Get unread messages for a user
   */
  async getUnreadMessages(userId: string): Promise<ServiceResponse<any[]>> {
    try {
      this.logBusinessEvent("getUnreadMessages", { userId });

      const repository = this.repository as MessagesRepository;
      const unreadMessages = await repository.findUnreadMessages(userId);

      return this.createResponse(unreadMessages, null);
    } catch (error) {
      logger.error(
        `Error getting unread messages for user ${userId}:`,
        error as Error
      );
      const serviceError = this.handleRepositoryError(
        error as Error,
        "getUnreadMessages"
      );
      return this.createResponse<any[]>([], serviceError);
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(
    messageIds: string[],
    userId: string
  ): Promise<ServiceResponse<any>> {
    try {
      this.logBusinessEvent("markMessagesAsRead", {
        messageIds: messageIds.length,
        userId,
      });

      // Validate bulk operation
      const validation = this.messagesValidator.validateBulkOperation({
        messageIds,
        operation: "read",
      });
      if (!validation.isValid) {
        const serviceError = this.createError(
          ServiceErrorCode.VALIDATION_ERROR,
          "Invalid bulk operation data",
          validation.errors,
          "markMessagesAsRead"
        );
        return this.createResponse(null, serviceError);
      }

      const repository = this.repository as MessagesRepository;
      const result = await repository.markAsRead(messageIds, userId);

      logger.info(
        `Marked ${messageIds.length} messages as read for user ${userId}`
      );
      return this.createResponse(result, null);
    } catch (error) {
      logger.error(`Error marking messages as read:`, error as Error);
      const serviceError = this.handleRepositoryError(
        error as Error,
        "markMessagesAsRead"
      );
      return this.createResponse(null, serviceError);
    }
  }

  /**
   * Update a message
   */
  async updateMessage(
    id: string,
    data: UpdateMessageData,
    userId: string
  ): Promise<ServiceResponse<any>> {
    try {
      this.logBusinessEvent("updateMessage", { id, userId });

      // Validate update data
      const validation = this.messagesValidator.validateUpdate(data);
      if (!validation.isValid) {
        const serviceError = this.createError(
          ServiceErrorCode.VALIDATION_ERROR,
          "Invalid update data",
          validation.errors,
          "updateMessage"
        );
        return this.createResponse(null, serviceError);
      }

      // Check if message exists and user has permission
      const existingResult = await this.repository.findById(id);
      if (existingResult.error || !existingResult.data) {
        const serviceError = this.createError(
          ServiceErrorCode.NOT_FOUND,
          "Message not found",
          [],
          "updateMessage"
        );
        return this.createResponse(null, serviceError);
      }

      // Check if user is the sender (only sender can update message content)
      if (existingResult.data.sender_id !== userId) {
        const serviceError = this.createError(
          ServiceErrorCode.PERMISSION_DENIED,
          "You can only update your own messages",
          [],
          "updateMessage"
        );
        return this.createResponse(null, serviceError);
      }

      // Update message
      const updateData = {
        ...data,
        updated_at: new Date().toISOString(),
      };

      const result = await this.repository.update(id, updateData);

      if (result.error) {
        const serviceError = this.handleRepositoryError(
          result.error,
          "updateMessage"
        );
        return this.createResponse(null, serviceError);
      }

      logger.info(`Message ${id} updated by user ${userId}`);
      return this.createResponse(result.data, null);
    } catch (error) {
      logger.error(`Error updating message ${id}:`, error as Error);
      const serviceError = this.handleRepositoryError(
        error as Error,
        "updateMessage"
      );
      return this.createResponse(null, serviceError);
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(
    id: string,
    userId: string
  ): Promise<ServiceResponse<boolean>> {
    try {
      this.logBusinessEvent("deleteMessage", { id, userId });

      // Check if message exists and user has permission
      const existingResult = await this.repository.findById(id);
      if (existingResult.error || !existingResult.data) {
        const serviceError = this.createError(
          ServiceErrorCode.NOT_FOUND,
          "Message not found",
          [],
          "deleteMessage"
        );
        return this.createResponse<boolean>(false, serviceError);
      }

      // Check if user is the sender (only sender can delete message)
      if (existingResult.data.sender_id !== userId) {
        const serviceError = this.createError(
          ServiceErrorCode.PERMISSION_DENIED,
          "You can only delete your own messages",
          [],
          "deleteMessage"
        );
        return this.createResponse<boolean>(false, serviceError);
      }

      const result = await this.repository.delete(id);

      if (result.error) {
        const serviceError = this.handleRepositoryError(
          result.error,
          "deleteMessage"
        );
        return this.createResponse<boolean>(false, serviceError);
      }

      logger.info(`Message ${id} deleted by user ${userId}`);
      return this.createResponse<boolean>(true, null);
    } catch (error) {
      logger.error(`Error deleting message ${id}:`, error as Error);
      const serviceError = this.handleRepositoryError(
        error as Error,
        "deleteMessage"
      );
      return this.createResponse<boolean>(false, serviceError);
    }
  }

  /**
   * Search messages for a user
   */
  async searchMessages(
    userId: string,
    query: string,
    limit: number = 20
  ): Promise<ServiceResponse<any[]>> {
    try {
      this.logBusinessEvent("searchMessages", {
        userId,
        query: query.length,
        limit,
      });

      // Validate search parameters
      const validation = this.messagesValidator.validateSearch({
        query,
        limit,
      });
      if (!validation.isValid) {
        const serviceError = this.createError(
          ServiceErrorCode.VALIDATION_ERROR,
          "Invalid search parameters",
          validation.errors,
          "searchMessages"
        );
        return this.createResponse<any[]>([], serviceError);
      }

      const repository = this.repository as MessagesRepository;
      const messages = await repository.searchMessages(userId, query, limit);

      return this.createResponse(messages, null);
    } catch (error) {
      logger.error(
        `Error searching messages for user ${userId}:`,
        error as Error
      );
      const serviceError = this.handleRepositoryError(
        error as Error,
        "searchMessages"
      );
      return this.createResponse<any[]>([], serviceError);
    }
  }

  /**
   * Get messages for a specific order
   */
  async getOrderMessages(orderId: string): Promise<ServiceResponse<any[]>> {
    try {
      this.logBusinessEvent("getOrderMessages", { orderId });

      const repository = this.repository as MessagesRepository;
      const messages = await repository.findByOrder(orderId);

      return this.createResponse(messages, null);
    } catch (error) {
      logger.error(
        `Error getting messages for order ${orderId}:`,
        error as Error
      );
      const serviceError = this.handleRepositoryError(
        error as Error,
        "getOrderMessages"
      );
      return this.createResponse<any[]>([], serviceError);
    }
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(
    userId: string
  ): Promise<ServiceResponse<{ count: number }>> {
    try {
      this.logBusinessEvent("getUnreadCount", { userId });

      const repository = this.repository as MessagesRepository;
      const count = await repository.getUnreadCount(userId);

      return this.createResponse({ count }, null);
    } catch (error) {
      logger.error(
        `Error getting unread count for user ${userId}:`,
        error as Error
      );
      const serviceError = this.handleRepositoryError(
        error as Error,
        "getUnreadCount"
      );
      return this.createResponse<{ count: number }>({ count: 0 }, serviceError);
    }
  }
}
