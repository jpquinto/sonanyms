variable "label_context" {
  description = "Null label context"
  type        = any
}

variable "aws_region" {
  description = "Target region, usage: us-east-1"
  type        = string
}

variable "rest_api_id" {
  type = string
}

variable "authorizer_name" {
  type = string
}

variable "authorizer_invoke_arn" {
  type = string
}

variable "authorizer_role_arn" {
  type = string
}

variable "api_gw_execution_arn" {
  type = string
}

variable "authorizer_arn" {
  type = string
}

variable "authorizer_result_ttl_in_seconds" {
  type    = number
  default = 300
}
