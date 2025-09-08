terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.73.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# data "aws_ecr_authorization_token" "token" {}
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
