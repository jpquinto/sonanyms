variable "context" {
    description = "The context for labeling and tagging resources."
    type        = any
}

variable "word_bank_table_name" {
  description = "The name of the DynamoDB table for the word bank."
  type        = string
}

variable "word_bank_table_arn" {
    description = "The ARN of the DynamoDB table for the word bank."
    type        = string
}

variable "id_status_table_name" {
  description = "The name of the DynamoDB table for ID status."
  type        = string
}

variable "id_status_table_arn" {
    description = "The ARN of the DynamoDB table for ID status."
    type        = string
}

variable "user_game_history_table_name" {
  description = "The name of the DynamoDB table for user game history."
  type        = string
}

variable "user_game_history_table_arn" {
    description = "The ARN of the DynamoDB table for user game history."
    type        = string
}

variable "users_table_name" {
  description = "The name of the DynamoDB table for users."
  type        = string
}

variable "users_table_arn" {
    description = "The ARN of the DynamoDB table for users."
    type        = string
}

variable "shared_layer_arn" {
    description = "The ARN of the shared Lambda layer."
    type        = string
}

variable "elo_layer_arn" {
    description = "The ARN of the ELO logic Lambda layer."
    type        = string
}