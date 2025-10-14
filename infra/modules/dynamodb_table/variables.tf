###########
# General
###########

variable "context" {
  type        = any
  description = "Null label context."
}

variable "name" {
  type        = string
  description = "The name of the DynamoDB table."
}

###########
# Table Configuration
###########

variable "billing_mode" {
  type        = string
  description = "Controls how you are charged for read and write throughput. Valid values: PROVISIONED or PAY_PER_REQUEST."
  default     = "PAY_PER_REQUEST"

  validation {
    condition     = contains(["PROVISIONED", "PAY_PER_REQUEST"], var.billing_mode)
    error_message = "Valid values for billing_mode are PROVISIONED or PAY_PER_REQUEST."
  }
}

variable "read_capacity" {
  type        = number
  description = "Number of read units for the table."
  default     = null

  validation {
    condition     = var.billing_mode == "PROVISIONED" ? var.read_capacity != null : true
    error_message = "When billing_mode is PROVISIONED, read_capacity must be set."
  }
}

variable "write_capacity" {
  type        = number
  description = "Number of write units for the table."
  default     = null

  validation {
    condition     = var.billing_mode == "PROVISIONED" ? var.write_capacity != null : true
    error_message = "When billing_mode is PROVISIONED, write_capacity must be set."
  }
}

variable "hash_key" {
  type        = string
  description = "The attribute to use as the hash (partition) key."
}

variable "range_key" {
  type        = string
  description = "The attribute to use as the range (sort) key."
  default     = null
}

variable "attributes" {
  type = list(object({
    name = string
    type = string
  }))
  description = "List of attribute definitions. Only required for hash_key and range_key attributes."
}

variable "deletion_protection" {
  type        = bool
  description = "Enables deletion protection for table."
  default     = false
}

###########
# Options
###########

variable "ttl_enabled" {
  type        = bool
  description = "Whether TTL is enabled."
  default     = false
}

variable "ttl_attribute" {
  type        = string
  description = "The name of the TTL attribute."
  default     = "TTL"
}

variable "stream_enabled" {
  type        = bool
  description = "Whether DynamoDB Streams is enabled."
  default     = false
}

variable "stream_view_type" {
  type        = string
  description = "When a stream is enabled, controls what information is written to the stream. Valid values: KEYS_ONLY, NEW_IMAGE, OLD_IMAGE, NEW_AND_OLD_IMAGES."
  default     = null

  validation {
    condition     = var.stream_view_type == null ? true : contains(["KEYS_ONLY", "NEW_IMAGE", "OLD_IMAGE", "NEW_AND_OLD_IMAGES"], var.stream_view_type)
    error_message = "Valid values for stream_view_type are KEYS_ONLY, NEW_IMAGE, OLD_IMAGE, NEW_AND_OLD_IMAGES."
  }
}

variable "point_in_time_recovery_enabled" {
  type        = bool
  description = "Whether point-in-time recovery is enabled."
  default     = false
}

###########
# Secondary Indexes
###########

variable "global_secondary_indexes" {
  type = list(object({
    name               = string
    hash_key           = string
    range_key          = string
    projection_type    = string
    non_key_attributes = optional(list(string))
    read_capacity      = optional(number)
    write_capacity     = optional(number)
  }))
  description = "Describe a GSI for the table."
  default     = []
}

variable "local_secondary_indexes" {
  type = list(object({
    name               = string
    range_key          = string
    projection_type    = string
    non_key_attributes = optional(list(string))
  }))
  description = "Describe an LSI on the table."
  default     = []
}
