#!/bin/sh
# LocalStack runs every script in /etc/localstack/init/ready.d/ once it's
# fully started. This creates the SQS queue and S3 bucket that Crowdwatch
# needs, so you never have to run AWS CLI commands manually for local dev.

echo "Setting up local AWS resources in LocalStack..."

awslocal sqs create-queue --queue-name crowdwatch-reports
awslocal s3 mb s3://crowdwatch-media

echo "LocalStack setup complete: SQS queue 'crowdwatch-reports' and S3 bucket 'crowdwatch-media' ready."
