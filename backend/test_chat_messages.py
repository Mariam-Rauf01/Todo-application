"""
Test script to verify chat messages are being saved to database
"""
from app.database import get_db
from app import models

def check_messages():
    db = next(get_db())
    
    # Count total messages
    total = db.query(models.ChatMessage).count()
    print(f"\n=== CHAT MESSAGES IN DATABASE ===")
    print(f"Total messages: {total}")
    
    # Get last 10 messages
    messages = db.query(models.ChatMessage).order_by(
        models.ChatMessage.created_at.desc()
    ).limit(10).all()
    
    if messages:
        print(f"\nLast 10 messages:")
        print("-" * 80)
        for msg in messages:
            # Remove emojis for Windows console compatibility
            clean_msg = msg.message.encode('ascii', errors='replace')[:50].decode('ascii', errors='replace')
            print(f"ID: {msg.id} | User: {msg.user_id} | Sender: {msg.sender:4} | Message: {clean_msg}")
    else:
        print("\nNo messages found in database!")
    
    print("=" * 80)
    
    # Count by sender
    user_msgs = db.query(models.ChatMessage).filter(models.ChatMessage.sender == 'user').count()
    bot_msgs = db.query(models.ChatMessage).filter(models.ChatMessage.sender == 'bot').count()
    
    print(f"\nBreakdown:")
    print(f"  User messages: {user_msgs}")
    print(f"  Bot messages:  {bot_msgs}")
    print(f"  Total:         {user_msgs + bot_msgs}")
    print()

if __name__ == "__main__":
    check_messages()
