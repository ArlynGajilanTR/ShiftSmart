import { createClient } from '@/lib/supabase/server';

export type NotificationType =
  | 'new_assignment'
  | 'schedule_change'
  | 'preference_confirmed'
  | 'shift_cancelled';

/**
 * Create a notification for a user
 * Email sending is stubbed - logs to console for future implementation
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      type,
      title,
      message,
    });

    if (error) {
      console.error('Failed to create notification:', error);
      return { success: false, error: error.message };
    }

    // TODO: Email implementation (stubbed)
    // When implementing, check user's notification preferences first
    console.log(`[NOTIFICATION STUB] Would send email to user ${userId}:`);
    console.log(`  Type: ${type}`);
    console.log(`  Title: ${title}`);
    console.log(`  Message: ${message}`);

    return { success: true };
  } catch (error) {
    console.error('Notification service error:', error);
    return { success: false, error: 'Internal error' };
  }
}

/**
 * Mark notifications as read
 */
export async function markNotificationsRead(
  userId: string,
  notificationIds?: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    let query = supabase.from('notifications').update({ read: true }).eq('user_id', userId);

    if (notificationIds && notificationIds.length > 0) {
      query = query.in('id', notificationIds);
    }

    const { error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Internal error' };
  }
}
