# E-commerce Application - Orchestration-based saga

## Overview

This repository contains an implementation of an e-commerce application using a Orchestration-based saga pattern. The main workflow involves creating an order, where the Order Service and the Customer Service interact through events to reserve credit and finalize the order.

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Prerequisites](#prerequisites)
3. [Running the Application](#running-the-application)
4. [Testing the Workflow](#testing-the-workflow)
5. [Additional Notes](#additional-notes)

## System Architecture

- **Customer Service**: This service handles the POST / request, during which it initiates the creation of a customer.

- **Order Service**: This service handles the POST /orders request, during which it initiates the creation of an order, setting its state to PENDING. Following this, it emits an "Order Created" event to signify the successful initiation of the order process.

- **Saga Orchestrator**: Upon detecting the "Order Created" event, the saga orchestrator formalizes the creation of the order in the PENDING state and triggers the next step in the saga by sending a Reserve Credit command to the Customer Service.

- **Customer Service**: This service is on standby for the Reserve Credit command. When received, it attempts to reserve the necessary credit for the order. Regardless of the outcome (success or failure), it emits an event to convey the result of the credit reservation attempt back to the Saga Orchestrator.

- **Saga Orchestrator**: With the outcome of the credit reservation attempt received, the saga orchestrator makes a final decision. If the credit reservation was successful, it approves the order; otherwise, it rejects the order, thereby concluding the saga.

## Prerequisites

- Make sure you have Docker and Docker-compose installed.
- Ensure Node.js and NPM/Yarn are installed.
- Kafka running on `kafka:9092` (or adjust the address accordingly).

## Running the Application

- **Start services using Docker**: `docker-compose up --build`

## Testing the Workflow

- **Create a customer**: `curl -X POST -H "Content-Type: application/json" -d '{"customerName": "John Doe", "balance": 1000}' http://localhost:3000/customers`. This will return a customer_uuid which you will use for the order creation.

- **Create an order**: `curl -X POST -H "Content-Type: application/json" -d '{"customer_uuid": "[use-the-customer_uuid]", "amount": 500}' http://localhost:3000/orders`. Monitor the logs for both services to see the flow of events.

- **Check order status**: `curl GET http://localhost:3000/orders/:order_uuid/status`. Replace :order_uuid with the actual order uuid you want to check.


