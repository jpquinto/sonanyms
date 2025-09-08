###########
# General
###########

variable "context" {
  type        = any
  description = "Null label context."
}

variable "name" {
  type        = string
  description = "Name of the S3 bucket to create."
}

variable "force_destroy" {
  type        = bool
  description = "Whether to allow the bucket to be forcefully destroyed, even if it contains objects."
  default     = false
}

###########
# Bucket Policy
###########

variable "bucket_policy" {
  type        = string
  description = "The bucket policy to apply to the S3 bucket. Use {SELF_NAME} and {SELF_ARN} to reference the bucket name and ARN respectively."
  default     = ""
}

###########
# Bucket Versioning
###########

variable "enable_bucket_versioning" {
  type        = bool
  description = "Whether to enable versioning on the bucket."
  default     = false
}

###########
# Server Side Encryption
###########

variable "enable_server_side_encryption" {
  type        = bool
  description = "Whether to enable server-side encryption on the bucket."
  default     = false
}

variable "sse_algorithm" {
  type        = string
  description = "The server-side encryption algorithm to use."
  default     = "AES256"
}

variable "kms_key_id" {
  type        = string
  description = "The KMS key ID to use for server-side encryption."
  default     = ""
}

variable "encryption_bucket_key_enabled" {
  type        = bool
  description = "Whether to use bucket key for server-side encryption."
  default     = false
}

###########
# Public Access Block
###########

variable "block_public_acls" {
  type        = bool
  description = "Whether to block public ACLs on the bucket."
  default     = true
}

variable "block_public_policy" {
  type        = bool
  description = "Whether to block public policies on the bucket."
  default     = true
}

variable "ignore_public_acls" {
  type        = bool
  description = "Whether to ignore public ACLs on the bucket."
  default     = true
}

variable "restrict_public_buckets" {
  type        = bool
  description = "Whether to restrict public buckets."
  default     = true
}

###########
# Website Configuration
###########

variable "enable_website_configuration" {
  type        = bool
  description = "Whether to enable website configuration on the bucket."
  default     = false
}

variable "website_index_document" {
  type        = string
  description = "The index document for the website configuration."
  default     = "index.html"
}

variable "website_error_document" {
  type        = string
  description = "The error document for the website configuration."
  default     = "error.html"
}

variable "routing_rule" {
  type = list(object({
    condition = optional(object({
      key_prefix_equals = optional(string)
    }))
    redirect = object({
      host_name               = optional(string)
      http_redirect_code      = optional(string)
      protocol                = optional(string)
      replace_key_prefix_with = optional(string)
      replace_key_with        = optional(string)
    })
  }))
  description = "Routing rules for the website configuration."
  default     = []
}
