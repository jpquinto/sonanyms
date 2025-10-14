variable "context" {
  description = "Null label context"
  type        = any
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
  description = "A list of HTTP routes to create for the API Gateway."
  type = list(object({
    http_method          = string
    path                 = string
    parent_path          = optional(string)
    integration_type     = string
    lambda_invoke_arn    = string
    lambda_function_name = string
    dynamodb_table_name  = optional(string)
    execution_role_arn   = optional(string)
    enable_cors_all      = bool
    use_authorizer       = bool
    cache_key_parameters = optional(list(string), [])
    request_parameters   = optional(map(bool))
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

variable "vpc_endpoint_ids" {
  description = "Private API GW related VPC endpoints ids"
  type        = list(string)
  default     = null
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

variable "cognito_authorizer" {
  description = "Cognito authorizer configuration"
  type = object({
    user_pool_arn = string
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
