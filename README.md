# Project
 
### SupplierX
 
## Table of Contents
 
- [Project](#project)
  - [Table of Contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Features](#features)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Usage](#usage)
 
## Introduction
 
SupplierX is a comprehensive platform designed to simplify supplier onboarding processes. It centralizes supplier information (Master Data) and facilitates vendor management. It ensures regulatory compliance (Compliances), integrates with third-party systems (3rd Party API Integrations), maintains transparent activity logs, and employs dynamic approval workflows to streamline the onboarding process efficiently.
 
## Features
 
List the main features of the project.
 
- On boarding Suppliers
- Master datas
- Vendors
- Compliations
- 3rd party api intrigations
- Maintain activity logs
- Dynamic Approvel Process
 
## Installation
 
Guide users through the process of installing the project locally. Include any dependencies that need to be installed and how to do so.
 
```bash
npm install
```
 
## Configuration
 
### Environment Variables
 
Set up environment variables to configure the database connection. These variables should be defined in a `.env` file or exported in your environment.
 
```bash
# Database Configuration
export DB_HOST=your_host
export DB_PORT=your_port
export DB_NAME=your_db_name
export DB_USERNAME=your_user_name
export DB_PASSWORD=your_password
 
# AWS Configuration
export AWS_ACCESS_KEY_ID=your_aws_access_key_id
export AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
export S3_REGION=your_s3_region
export S3_BUCKET=your_s3_bucket_name
export S3_ARCHIVE_BUCKET=your_s3_archive_bucket_name
```
 
## Usage
 
Explain how to use the project. Provide examples if applicable.
 
```bash
npm start
```