output "id" {
  description = "The name of the DynamoDB table"
  value       = aws_dynamodb_table.table.id
}

output "arn" {
  description = "The ARN of the DynamoDB table"
  value       = aws_dynamodb_table.table.arn
}

output "name" {
  description = "The name of the DynamoDB table"
  value       = aws_dynamodb_table.table.name
}

output "hash_key" {
  description = "The hash key of the DynamoDB table"
  value       = aws_dynamodb_table.table.hash_key
}

output "range_key" {
  description = "The range key of the DynamoDB table"
  value       = aws_dynamodb_table.table.range_key
}

output "global_secondary_index_names" {
  description = "List of global secondary index names for the DynamoDB table"
  value       = [for gsi in var.global_secondary_indexes : gsi.name]
}

output "local_secondary_index_names" {
  description = "List of local secondary index names for the DynamoDB table"
  value       = [for lsi in var.local_secondary_indexes : lsi.name]
}
