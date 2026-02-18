import asyncio
import json
import logging
from typing import Dict, Any, Callable
from .kafka_service import KafkaService
from .events import Event, EventType
from .database import SessionLocal
from . import models

logger = logging.getLogger(__name__)

class EventConsumer:
    def __init__(self, kafka_service: KafkaService):
        self.kafka_service = kafka_service
        self.event_handlers = {
            EventType.TASK_CREATED: self.handle_task_created,
            EventType.TASK_UPDATED: self.handle_task_updated,
            EventType.TASK_DELETED: self.handle_task_deleted,
            EventType.USER_CREATED: self.handle_user_created,
            EventType.USER_LOGIN: self.handle_user_login,
        }

    async def start_consumer(self):
        """Start the Kafka consumer to process events"""
        logger.info("Starting event consumer...")
        
        def process_message(message_value):
            try:
                # Parse the event
                event_data = message_value
                event = Event(**event_data)
                
                # Handle the event based on its type
                handler = self.event_handlers.get(event.event_type)
                if handler:
                    handler(event)
                else:
                    logger.warning(f"No handler found for event type: {event.event_type}")
            except Exception as e:
                logger.error(f"Error processing event: {e}")
        
        # Start consuming from task_events topic
        self.kafka_service.start_consumer_thread("task_events", process_message)
        
        # Start consuming from user_events topic
        self.kafka_service.start_consumer_thread("user_events", process_message)
        
        logger.info("Event consumer started successfully")

    def handle_task_created(self, event: Event):
        """Handle task created event"""
        logger.info(f"Handling task created event for user {event.user_id}, task {event.entity_id}")
        # In a real implementation, you might want to trigger notifications or analytics
        # For now, just log the event
        pass

    def handle_task_updated(self, event: Event):
        """Handle task updated event"""
        logger.info(f"Handling task updated event for user {event.user_id}, task {event.entity_id}")
        # In a real implementation, you might want to trigger notifications or analytics
        # For now, just log the event
        pass

    def handle_task_deleted(self, event: Event):
        """Handle task deleted event"""
        logger.info(f"Handling task deleted event for user {event.user_id}, task {event.entity_id}")
        # In a real implementation, you might want to trigger notifications or analytics
        # For now, just log the event
        pass

    def handle_user_created(self, event: Event):
        """Handle user created event"""
        logger.info(f"Handling user created event for user {event.user_id}")
        # In a real implementation, you might want to send welcome emails or setup user preferences
        # For now, just log the event
        pass

    def handle_user_login(self, event: Event):
        """Handle user login event"""
        logger.info(f"Handling user login event for user {event.user_id}")
        # In a real implementation, you might want to update last login time or trigger security checks
        # For now, just log the event
        pass