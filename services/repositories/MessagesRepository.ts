import { supabase } from "../../lib/supabase/client";
import { TABLE_NAMES } from "../config";
import { logger } from "../logger";
import { Message } from "../types";
import { BaseRepository } from "./BaseRepository";

export class MessagesRepository extends BaseRepository<Message> {
  constructor() {
    super(TABLE_NAMES.MESSAGES);
  }

  /**
   * Find messages in a conversation between two users
   */
  async findConversation(
    userId1: string,
    userId2: string,
    limit: number = 50,
    offset: number = 0
  ) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(
          `
          *,
          sender:profiles!messages_sender_id_fkey(
            id,
            full_name,
            avatar_url
          ),
          receiver:profiles!messages_receiver_id_fkey(
            id,
            full_name,
            avatar_url
          )
        `
        )
        .or(
          `and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`
        )
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error(
        `Error finding conversation between ${userId1} and ${userId2}:`,
        error as Error
      );
      throw error;
    }
  }

  /**
   * Find all conversations for a user
   */
  async findUserConversations(userId: string) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(
          `
          *,
          sender:profiles!messages_sender_id_fkey(
            id,
            full_name,
            avatar_url
          ),
          receiver:profiles!messages_receiver_id_fkey(
            id,
            full_name,
            avatar_url
          )
        `
        )
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Group by conversation partner and get latest message
      const conversations = new Map();
      (data || []).forEach((message: any) => {
        const partnerId =
          message.sender_id === userId
            ? message.receiver_id
            : message.sender_id;
        const partnerInfo =
          message.sender_id === userId ? message.receiver : message.sender;

        if (
          !conversations.has(partnerId) ||
          conversations.get(partnerId).created_at < message.created_at
        ) {
          conversations.set(partnerId, {
            ...message,
            partner: partnerInfo,
            unread_count: 0, // Will be calculated separately if needed
          });
        }
      });

      return Array.from(conversations.values());
    } catch (error) {
      logger.error(
        `Error finding conversations for user ${userId}:`,
        error as Error
      );
      throw error;
    }
  }

  /**
   * Find unread messages for a user
   */
  async findUnreadMessages(userId: string) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(
          `
          *,
          sender:profiles!messages_sender_id_fkey(
            id,
            full_name,
            avatar_url
          )
        `
        )
        .eq("receiver_id", userId)
        .eq("status", "delivered")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error(
        `Error finding unread messages for user ${userId}:`,
        error as Error
      );
      throw error;
    }
  }

  /**
   * Mark messages as read
   */
  async markAsRead(messageIds: string[], userId: string) {
    try {
      // Update multiple messages at once using a raw query approach
      const updateData = {
        status: "read",
        read_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from(this.tableName)
        .update(updateData as never)
        .in("id", messageIds)
        .eq("receiver_id", userId);

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error(`Error marking messages as read:`, error as Error);
      throw error;
    }
  }

  /**
   * Find messages by order (for order-related conversations)
   */
  async findByOrder(orderId: string) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(
          `
          *,
          sender:profiles!messages_sender_id_fkey(
            id,
            full_name,
            avatar_url
          ),
          receiver:profiles!messages_receiver_id_fkey(
            id,
            full_name,
            avatar_url
          )
        `
        )
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error(
        `Error finding messages for order ${orderId}:`,
        error as Error
      );
      throw error;
    }
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from(this.tableName)
        .select("id", { count: "exact", head: true })
        .eq("receiver_id", userId)
        .eq("status", "delivered");

      if (error) throw error;
      return count || 0;
    } catch (error) {
      logger.error(
        `Error getting unread count for user ${userId}:`,
        error as Error
      );
      throw error;
    }
  }

  /**
   * Search messages by content
   */
  async searchMessages(userId: string, query: string, limit: number = 20) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(
          `
          *,
          sender:profiles!messages_sender_id_fkey(
            id,
            full_name,
            avatar_url
          ),
          receiver:profiles!messages_receiver_id_fkey(
            id,
            full_name,
            avatar_url
          )
        `
        )
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .ilike("content", `%${query}%`)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error(`Error searching messages:`, error as Error);
      throw error;
    }
  }

  /**
   * Check if user has sent message recently (spam protection)
   */
  async checkRecentMessages(
    senderId: string,
    receiverId: string,
    minutes: number = 1
  ): Promise<boolean> {
    try {
      const since = new Date(Date.now() - minutes * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from(this.tableName)
        .select("id")
        .eq("sender_id", senderId)
        .eq("receiver_id", receiverId)
        .gte("created_at", since)
        .limit(1);

      if (error) throw error;
      return (data || []).length > 0;
    } catch (error) {
      logger.error(`Error checking recent messages:`, error as Error);
      throw error;
    }
  }
}
