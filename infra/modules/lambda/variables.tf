###########
# General
###########

variable "context" {
  type        = any
  description = "Null label context."
}

variable "name" {
  type        = string
  description = "The name of the Lambda function."
}

variable "description" {
  type        = string
  description = "Description of the Lambda function."
  default     = null
}


###########
# Function Configuration
###########

variable "runtime" {
  type        = string
  description = "Runtime environment of the Lambda function. Also affects how the build process works."
}

variable "handler" {
  type        = string
  description = "The handler of the Lambda function."
}

variable "memory" {
  type        = number
  description = "Memory in MB to allocate to the function."
  default     = 256
}

variable "time_limit" {
  type        = number
  description = "The maximum time in seconds that the function can run."
  default     = 15
}

variable "platform" {
  type        = string
  description = "Platform architecture of the function. Valid values: [x86_64, arm64]."
  default     = "x86_64"

  validation {
    condition     = contains(["x86_64", "arm64"], var.platform)
    error_message = "Valid values for `platform`: [x86_64, arm64]."
  }
}

variable "layers" {
  type        = list(string)
  description = "List of Lambda layer ARNs to attach to the function."
  default     = []
}

variable "publish" {
  type        = bool
  description = "Whether to publish creation/change as new Lambda Function Version."
  default     = false
}

###########
# Deployment Configuration
###########

variable "deployment_type" {
  type        = string
  description = "Type of deployment to use for the Lambda function. Valid values: [zip, s3, image]."

  validation {
    condition     = contains(["zip", "s3", "image"], var.deployment_type)
    error_message = "Valid values for `deployment_type`: [zip, s3, image]."
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
  description = "The path to the ZIP file to use as Lambda sources. Required when `deployment_type` is `zip` and `zip_project` is false."
  default     = null

  validation {
    condition     = !(var.deployment_type == "zip" && !var.zip_project && var.filename == null)
    error_message = "`filename` is required if `deployment_type` is `zip` and `zip_project` is false"
  }
  validation {
    condition     = !(var.zip_project && var.filename != null)
    error_message = "`filename` must be null if `zip_project` is true"
  }
}

variable "source_dir" {
  type        = string
  description = "Directory containing the source code. Required when `zip_project` or `build_image` is true."
  default     = null

  validation {
    condition     = !((var.zip_project || var.build_image) && var.source_dir == null)
    error_message = "`source_dir` is required if `zip_project` or `build_image` is true"
  }
}

variable "build_path" {
  type        = string
  description = "Directory where the zipped artifact will be stored. Required when `zip_project` is true."
  default     = null

  validation {
    condition     = !(var.zip_project && var.build_path == null)
    error_message = "`build_path` is required if `zip_project` is true"
  }

  validation {
    condition     = var.zip_project ? endswith(var.build_path, ".zip") : true
    error_message = "`build_path` must end with .zip"
  }
}

########### s3 ###########
variable "upload_to_s3" {
  type        = bool
  description = "Whether to upload the ZIP code to the S3 bucket. Requires `zip_project` to be true."
  default     = false

  validation {
    condition     = !(var.upload_to_s3 && !var.zip_project)
    error_message = "`upload_to_s3` requires `zip_project` to be true."
  }
}

variable "s3_bucket" {
  type        = string
  description = "S3 bucket containing the function's deployment package. Required when `deployment_type` is `s3`."
  default     = null

  validation {
    condition     = !(var.deployment_type == "s3" && var.s3_bucket == null)
    error_message = "`s3_bucket` is required if `deployment_type` is `s3`"
  }
}

variable "s3_key" {
  type        = string
  description = "S3 key of the object containing the function's deployment package."
  default     = null
}

variable "s3_object_version" {
  type        = string
  description = "Object version of the function's deployment package. Required when `deployment_type` is `s3` and `upload_to_s3` is false."
  default     = null

  validation {
    condition     = !(var.deployment_type == "s3" && !var.upload_to_s3 && var.s3_object_version == null)
    error_message = "`s3_object_version` is required if `deployment_type` is `s3` and `upload_to_s3` is false"
  }
}

########### image ###########
variable "build_image" {
  type        = bool
  description = "Whether to build a Docker image. Only valid when `deployment_type` is `image`."
  default     = false

  validation {
    condition     = !(var.build_image && var.deployment_type != "image")
    error_message = "`build_image` requires `deployment_type` to be `image`."
  }
}

# variable "image_uri" {
#   type        = string
#   description = "ECR image URI containing the function's deployment package. Required when `deployment_type` is `image` and `build_image` is false."
#   default     = null

#   validation {
#     condition     = !(var.deployment_type == "image" && !var.build_image && var.image_uri == null)
#     error_message = "`image_uri` is required if `deployment_type` is `image` and `build_image` is false"
#   }

#   validation {
#     condition     = !(var.build_image && var.image_uri != null)
#     error_message = "`image_uri` must be null if `build_image` is true"
#   }
# }

# variable "dockerfile_path" {
#   type        = string
#   description = "Path to the Dockerfile to use for building the image. Required when `build_image` is true."
#   default     = null

#   validation {
#     condition     = !(var.build_image && var.dockerfile_path == null)
#     error_message = "`dockerfile_path` is required if `build_image` is true"
#   }
# }

# variable "create_ecr_repository" {
#   type        = bool
#   description = "Whether to create an ECR repository for the image. Requires `build_image` to be true."
#   default     = false

#   validation {
#     condition     = !(!var.build_image && var.create_ecr_repository)
#     error_message = "`create_ecr_repository` requires `build_image` to be true."
#   }
# }

# variable "registry_address" {
#   type        = string
#   description = "Registry address to use when `create_ecr_repository` is false."
#   default     = null

#   validation {
#     condition     = !(var.deployment_type == "image" && !var.create_ecr_repository && var.registry_address == null)
#     error_message = "`registry_address` is required if `deployment_type` is `image` and `create_ecr_repository` is false"
#   }
# }

# variable "repository_name" {
#   type        = string
#   description = "Repository name for the Docker image. Defaults to `name` when `create_ecr_repository` is true."
#   default     = null
# }

# variable "use_image_tag" {
#   type        = bool
#   description = "Whether to use image tag in ECR repository URI. Disable to deploy latest image using ID (sha256:...)."
#   default     = true
# }

# variable "image_tag" {
#   type        = string
#   description = "Image tag to use. Defaults to current timestamp in format 'YYYYMMDDhhmmss'. This can lead to unnecessary rebuilds."
#   default     = null
# }

###########
# Environment
###########

variable "environment_variables" {
  type        = map(string)
  description = "Environment variables to attach to the Lambda function."
  default     = {}
}

###########
# Logging
###########

variable "log_retention_days" {
  type        = number
  description = "Number of days to retain log events. Valid values: [0, 1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1096, 1827, 2192, 2557, 2922, 3288, 3653]."
  default     = 7

  validation {
    condition     = contains([0, 1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1096, 1827, 2192, 2557, 2922, 3288, 3653], var.log_retention_days)
    error_message = "Valid values for `log_retention_days`: [0, 1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1096, 1827, 2192, 2557, 2922, 3288, 3653]."
  }
}

###########
# Networking
###########

variable "enable_vpc_access" {
  type        = bool
  description = "Whether to enable VPC access for the Lambda function."
  default     = false
}

variable "subnet_ids" {
  type        = list(string)
  description = "List of subnet IDs for VPC access. Required when `enable_vpc_access` is true."
  default     = null

  validation {
    condition     = !(var.enable_vpc_access && length(coalesce(var.subnet_ids, [])) == 0)
    error_message = "`subnet_ids` is required if `enable_vpc_access` is true"
  }
}

variable "create_sg" {
  type        = bool
  description = "Whether to create a security group for VPC access. Requires `enable_vpc_access` to be true."
  default     = false

  validation {
    condition     = !(!var.enable_vpc_access && var.create_sg)
    error_message = "`create_sg` requires `enable_vpc_access` to be true"
  }
}

variable "security_group_ids" {
  type        = list(string)
  description = "List of security group IDs for VPC access. Required when `enable_vpc_access` is true and `create_sg` is false."
  default     = []

  validation {
    condition     = !(var.enable_vpc_access && !var.create_sg && length(coalesce(var.security_group_ids, [])) == 0)
    error_message = "`security_group_ids` is required if `enable_vpc_access` is true and `create_sg` is false"
  }
}

variable "ipv6_allowed_for_dual_stack" {
  type        = bool
  description = "Whether to allow IPv6 for dual-stack VPC configuration."
  default     = true
}
