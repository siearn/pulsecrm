# PulseCRM Admin Setup Guide

This guide will walk you through setting up the admin account and configuring the necessary services for PulseCRM.

## 1. Database Setup

First, ensure your PostgreSQL database is set up and running:

```bash
# Push the schema to your database
npm run db:push

# Seed the database with initial data
npm run seed

