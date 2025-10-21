variable "context" {
  type        = any
  description = "Null label context."
}

variable "users_table_arn" {
    description = "The ARN of the users DynamoDB table"
    type        = string
}

variable "users_table_name" {
    description = "The name of the users DynamoDB table"
    type        = string
}

variable "user_game_history_table_arn" {
    description = "The ARN of the user_game_history DynamoDB table"
    type        = string
}

variable "user_game_history_table_name" {
    description = "The name of the user_game_history DynamoDB table"
    type        = string
}

variable "clerk_add_user_webhook_secret" {
    description = "The audience for the Clerk JWT authorizer"
    type        = string
}

variable "clerk_delete_user_webhook_secret" {
    description = "The audience for the Clerk JWT authorizer"
    type        = string
}

variable "shared_layer_arn" {
    description = "The ARN of the shared Lambda layer"
    type        = string
}