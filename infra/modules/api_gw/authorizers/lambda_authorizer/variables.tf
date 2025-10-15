variable "context" {
  description = "Null label context"
  type        = any
}

variable "rest_api_id" {
  type        = string
  description = "The ID of the REST API"
}

variable "authorizer_name" {
  type        = string
  description = "Name of the authorizer"
}

variable "authorizer_invoke_arn" {
  type        = string
  description = "The Lambda function invoke ARN for the authorizer"
}

variable "authorizer_arn" {
  type        = string
  description = "The Lambda function ARN for the authorizer"
}

variable "authorizer_result_ttl_in_seconds" {
  type        = number
  default     = 300
  description = "TTL for cached authorizer results"
}