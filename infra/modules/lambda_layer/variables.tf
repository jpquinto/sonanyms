###########
# General
###########

variable "context" {
  type        = any
  description = "Null label context."
}

variable "name" {
  type        = string
  description = "Name of the Lambda layer."
}

variable "description" {
  type        = string
  description = "Description of the Lambda layer."
  default     = null
}


###########
# Layer Configuration
###########

variable "runtime" {
  type        = list(string)
  description = "List of runtime environments compatible with this layer."
  default     = []
}

variable "architecture" {
  type        = list(string)
  description = "Architecture types supported by this layer. Valid values: [x86_64, arm64]."
  default     = ["x86_64", "arm64"]

  validation {
    condition     = alltrue([for arch in var.architecture : contains(["x86_64", "arm64"], arch)])
    error_message = "Valid values for `architecture`: [x86_64, arm64]."
  }
}

###########
# Deployment Configuration
###########

variable "deployment_type" {
  type        = string
  description = "Type of deployment to use for the Lambda layer. Valid values: [zip, s3]."

  validation {
    condition     = contains(["zip", "s3"], var.deployment_type)
    error_message = "Valid values for `deployment_type`: [zip, s3]."
  }
}

########### zip ###########
variable "zip_project" {
  type        = bool
  description = "Whether to compress the project into a ZIP file. Only valid when `deployment_type` is `zip` or `s3`."
  default     = false

  validation {
    condition     = !(var.zip_project && !contains(["zip", "s3"], var.deployment_type))
    error_message = "`zip_project` can only be set for `deployment_type` of `zip` or `s3`."
  }
}

variable "filename" {
  type        = string
  description = "Path to the ZIP file to use as Lambda layer sources. Required when `deployment_type` is `zip` and `zip_project` is false."
  default     = null

  validation {
    condition     = !(var.deployment_type == "zip" && !var.zip_project && var.filename == null)
    error_message = "`filename` is required if `deployment_type` is `zip` and `zip_project` is false."
  }
  validation {
    condition     = !(var.zip_project && var.filename != null)
    error_message = "`filename` must be null if `zip_project` is true."
  }
}

variable "source_dir" {
  type        = string
  description = "Directory containing the source code. Required when `zip_project` is true."
  default     = null

  validation {
    condition     = !(var.zip_project && var.source_dir == null)
    error_message = "`source_dir` is required if `zip_project` is true."
  }
}

variable "build_path" {
  type        = string
  description = "Directory where the zipped artifact will be stored. Required when `zip_project` is true."
  default     = null

  validation {
    condition     = !(var.zip_project && var.build_path == null)
    error_message = "`build_path` is required if `zip_project` is true."
  }
}

########### s3 ###########
variable "upload_to_s3" {
  type        = bool
  description = "Whether to upload the ZIP file to the S3 bucket. Requires `zip_project` to be true."
  default     = false

  validation {
    condition     = !(var.upload_to_s3 && !var.zip_project)
    error_message = "`upload_to_s3` requires `zip_project` to be true."
  }
}

variable "s3_bucket" {
  type        = string
  description = "S3 bucket containing the layer's deployment package. Required when `deployment_type` is `s3`."
  default     = null

  validation {
    condition     = !(var.deployment_type == "s3" && var.s3_bucket == null)
    error_message = "`s3_bucket` is required if `deployment_type` is `s3`."
  }
}

variable "s3_key" {
  type        = string
  description = "S3 key of the object containing the layer's deployment package."
  default     = null
}

variable "s3_object_version" {
  type        = string
  description = "Object version of the layer's deployment package. Required when `deployment_type` is `s3` and `upload_to_s3` is false."
  default     = null

  validation {
    condition     = !(var.deployment_type == "s3" && !var.upload_to_s3 && var.s3_object_version == null)
    error_message = "`s3_object_version` is required if `deployment_type` is `s3` and `upload_to_s3` is false."
  }
}
