variable "label_context" {
  description = "Null label context"
  type        = any
}

variable "aws_region" {
  description = "Target region, usage: us-east-1"
  type        = string
}

variable "api_name" {
  description = "Name of the api"
  type        = string
}

variable "stage_name" {
  description = "Name of the stage"
  type        = string
}

variable "http_routes" {
  description = "List of HTTP methods and paths"
  type = list(object({
    http_method           = string
    path                  = string
    integration_type      = string
    dynamodb_table_name   = optional(string)
    execution_role_arn    = optional(string)
    lambda_invoke_arn     = optional(string)
    lambda_function_name  = optional(string)
    use_authorizer        = optional(bool)
    enable_cors_all       = optional(bool)
    cognito_user_pool_arn = optional(string)
  }))
}

variable "api_type" {
  description = "Private subnets for VPC Endpoint"
  type        = list(string)

  validation {
    condition     = alltrue([for v in var.api_type : v == "PRIVATE" || v == "REGIONAL"])
    error_message = "The api_type variable must contain only 'PRIVATE' or 'REGIONAL'."
  }
}

variable "lambda_authorizer" {
  description = "Lambda authorizer configuration"
  type = object({
    name       = string
    invoke_arn = string
    role_arn   = string
    arn        = string
  })
  default = null
}
# API KEY

variable "enable_api_key" {
  type    = bool
  default = false
}

variable "api_key_rate_limit" {
  type    = number
  default = 10
}

variable "api_key_burst_limit" {
  type    = number
  default = 20
}

variable "authorizer_type" {
  description = "Type of authorizer to use. Valid values are: NONE, CUSTOM (for Lambda), AWS_IAM, COGNITO_USER_POOLS"
  type        = string
  validation {
    condition     = contains(["NONE", "CUSTOM", "AWS_IAM", "COGNITO_USER_POOLS"], var.authorizer_type)
    error_message = "authorizer_type must be one of: NONE, CUSTOM, AWS_IAM, COGNITO_USER_POOLS"
  }
}
