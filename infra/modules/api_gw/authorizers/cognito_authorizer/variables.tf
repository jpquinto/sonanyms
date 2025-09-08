variable "label_context" {
  description = "Null label context"
  type        = any
}

variable "rest_api_id" {
  type        = string
  description = "ID of the REST API"
}

variable "cognito_user_pool_arn" {
  type        = string
  description = "ARN of the Cognito User Pool"
}
