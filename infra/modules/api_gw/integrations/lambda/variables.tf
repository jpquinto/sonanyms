variable "rest_api_id" {
  type = string
}

variable "resource_id" {
  type = string
}

variable "http_method" {
  type = string
}

variable "lambda_invoke_arn" {
  type = string
}

variable "lambda_function_name" {
  type = string
}

variable "authorizer_id" {
  type    = string
  default = null
}

variable "request_parameters" {
  type    = map(bool)
  default = {}
}

variable "api_execution_arn" {
  type    = string
  default = null
}

# CORS

variable "enable_cors_all" {
  type    = bool
  default = false
}

variable "cors_allow_headers" {
  type    = string
  default = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With'"
}

variable "cors_allow_methods" {
  type    = string
  default = "'OPTIONS,POST'"
}

variable "cors_allow_origin" {
  type    = string
  default = "'*'"
}

variable "enable_api_key" {
  type    = bool
  default = false
}

variable "authorizer_type" {
  description = "Type of authorizer to use. Valid values are: NONE, CUSTOM (for Lambda), AWS_IAM, COGNITO_USER_POOLS"
  type        = string
  validation {
    condition     = contains(["NONE", "CUSTOM", "AWS_IAM", "COGNITO_USER_POOLS"], var.authorizer_type)
    error_message = "authorizer_type must be one of: NONE, CUSTOM, AWS_IAM, COGNITO_USER_POOLS"
  }
}

variable "cache_key_parameters" {
  type    = list(string)
  default = []
}
