from kafka import KafkaProducer, KafkaConsumer
import json
import logging
from typing import Dict, Any, Optional
from threading import Thread
import time

logger = logging.getLogger(__name__)

class KafkaService:
    def __init__(self, bootstrap_servers: str = "localhost:9092"):
        self.bootstrap_servers = bootstrap_servers
        self.producer = None
        self.consumer = None
        self.running = False
        
    def connect_producer(self):
        """Initialize Kafka producer"""
        try:
            self.producer = KafkaProducer(
                bootstrap_servers=self.bootstrap_servers,
                value_serializer=lambda v: json.dumps(v).encode('utf-8'),
                api_version=(0, 10, 1)
            )
            logger.info("Kafka producer connected successfully")
        except Exception as e:
            logger.error(f"Failed to connect Kafka producer: {e}")
            raise

    def connect_consumer(self, topic: str, group_id: str = "todo_group"):
        """Initialize Kafka consumer"""
        try:
            self.consumer = KafkaConsumer(
                topic,
                bootstrap_servers=self.bootstrap_servers,
                group_id=group_id,
                value_deserializer=lambda m: json.loads(m.decode('utf-8')),
                auto_offset_reset='earliest',
                api_version=(0, 10, 1)
            )
            logger.info(f"Kafka consumer connected successfully for topic: {topic}")
        except Exception as e:
            logger.error(f"Failed to connect Kafka consumer: {e}")
            raise

    def send_message(self, topic: str, message: Dict[str, Any]):
        """Send a message to a Kafka topic"""
        if not self.producer:
            raise Exception("Kafka producer not initialized")
        
        try:
            future = self.producer.send(topic, value=message)
            self.producer.flush()  # Wait for the message to be sent
            logger.info(f"Message sent to topic {topic}: {message}")
            return future.get(timeout=10)
        except Exception as e:
            logger.error(f"Failed to send message to topic {topic}: {e}")
            raise

    def consume_messages(self, topic: str, callback_func):
        """Consume messages from a Kafka topic"""
        if not self.consumer:
            self.connect_consumer(topic)
        
        self.running = True
        for message in self.consumer:
            if not self.running:
                break
            try:
                callback_func(message.value)
            except Exception as e:
                logger.error(f"Error processing message: {e}")
    
    def start_consumer_thread(self, topic: str, callback_func):
        """Start consumer in a separate thread"""
        consumer_thread = Thread(target=self.consume_messages, args=(topic, callback_func))
        consumer_thread.daemon = True
        consumer_thread.start()
        return consumer_thread

    def close(self):
        """Close Kafka connections"""
        if self.producer:
            self.producer.close()
        if self.consumer:
            self.consumer.close()
        self.running = False