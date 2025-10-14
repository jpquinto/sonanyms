terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.73.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.6.0"
    }
  }
}
