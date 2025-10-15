# modules/websocket_api_gateway/variables.tf
variable "context" {
  description = "Null label context"
  type        = any
}

variable "api_name" {
  description = "Name of the WebSocket API"
  type        = string
}

variable "stage_name" {
  description = "Name of the stage"
  type        = string
  default     = "prod"
}

variable "routes" {
  description = "A list of WebSocket routes to create for the API Gateway."
  type = list(object({
    route_key            = string # e.g., "$connect", "$disconnect", "$default", or custom action
    lambda_invoke_arn    = string
    lambda_function_name = string
    authorization_type   = optional(string, "NONE") # NONE, AWS_IAM, CUSTOM
    authorizer_id        = optional(string)
  }))
}

variable "throttling_burst_limit" {
  description = "Throttling burst limit for the stage"
  type        = number
  default     = 5000
}

variable "throttling_rate_limit" {
  description = "Throttling rate limit for the stage"
  type        = number
  default     = 10000
}